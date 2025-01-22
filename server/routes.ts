import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { db } from "@db";
import { survey_responses, users } from "@db/schema";
import { eq } from "drizzle-orm";
import MemoryStore from "memorystore";
import { createClient } from '@supabase/supabase-js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase環境変数が設定されていません。');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const MemoryStoreSession = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000
      }),
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      }
    })
  );

  app.post('/api/submit-survey', async (req, res) => {
    try {
      const yoxoId = `YX${new Date().toISOString().slice(2,8)}${Math.random().toString().slice(2,6)}`;
      const section1 = req.body.responses.slice(0, 6);
      const section2 = req.body.responses.slice(6, 12);
      const section3 = req.body.responses.slice(12, 16);

      const calculateScore = (responses: number[]) => {
        const sum = responses.reduce((a, b) => a + b, 0);
        return sum === 0 ? 0 : ((sum / responses.length) - 1) * 25;
      };

      const fatigueSource = calculateScore(section1);
      const mentalFatigue = calculateScore(section3);
      const brainFatigue = Math.max(0, Math.min(100, (mentalFatigue - 50) * 50/30 + 50));
      const resilience = fatigueSource === 0 ? 0 : 
        100 * (2 * fatigueSource)/(2 * fatigueSource + mentalFatigue + brainFatigue);

      const getFatigueType = (mental: number, brain: number) => {
        const getMentalLevel = (score: number) => {
          if (score < 33) return 0;
          if (score < 66) return 1;
          return 2;
        };
        const getBrainLevel = (score: number) => {
          if (score < 33) return 0;
          if (score < 66) return 1;
          return 2;
        };

        const types = [
          ['軽疲労', '鈍感疲労', '盲目疲労'],
          ['敏感疲労', 'バランス疲労', '見過ごし疲労'],
          ['過敏疲労', '拡大疲労', '限界疲労']
        ];

        return types[getMentalLevel(mental)][getBrainLevel(brain)];
      };

      const fatigueType = getFatigueType(mentalFatigue, brainFatigue);
      const calculatedScores = {
        fatigue_type: fatigueType,
        brain_fatigue: brainFatigue,
        mental_fatigue: mentalFatigue,
        fatigue_source: fatigueSource,
        resilience: resilience
      };

      let userId = req.session.userId || null;

      // Supabaseユーザー情報があれば、そのユーザーIDを使用
      if (req.body.supabaseId) {
        try {
          const { data: supabaseUser, error } = await supabase.auth.getUser(req.body.supabaseId);
          if (error) throw error;

          // Supabase data store
          const [newResponse] = await db.insert(survey_responses).values({
            yoxo_id: yoxoId,
            user_id: supabaseUser.user.id,
            section1_responses: section1,
            section2_responses: section2,
            section3_responses: section3,
            calculated_scores: calculatedScores
          }).returning();

          // ユーザー情報の取得・作成
          const user = await db.query.users.findFirst({
            where: eq(users.supabase_id, supabaseUser.user.id)
          });

          if (user) {
            userId = user.id.toString();
            req.session.userId = user.id.toString();
          } else {
            const [newUser] = await db.insert(users)
              .values({
                supabase_id: supabaseUser.user.id,
                created_at: new Date()
              })
              .returning();
            userId = newUser.id.toString();
            req.session.userId = newUser.id.toString();
          }
        } catch (error) {
          console.error('Error validating Supabase user:', error);
        }
      } else {
        // Guest user submission
        const [newResponse] = await db.insert(survey_responses).values({
          yoxo_id: yoxoId,
          user_id: 'guest',
          section1_responses: section1,
          section2_responses: section2,
          section3_responses: section3,
          calculated_scores: calculatedScores
        }).returning();
      }

      res.json({
        yoxoId,
        scores: calculatedScores
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 結果の取得エンドポイント
  app.get('/api/results/:yoxoId', async (req, res) => {
    try {
      const result = await db.query.survey_responses.findFirst({
        where: eq(survey_responses.yoxo_id, req.params.yoxoId)
      });

      if (!result) {
        return res.status(404).json({ message: "Results not found" });
      }

      res.json(result.calculated_scores);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}