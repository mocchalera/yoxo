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

      try {
        // Guest user submission
        const [newResponse] = await db.insert(survey_responses).values({
          yoxo_id: yoxoId,
          user_id: req.body.supabaseId || 'guest',
          section1_responses: section1,
          section2_responses: section2,
          section3_responses: section3,
          calculated_scores: calculatedScores
        }).returning();

        res.json({
          yoxoId,
          scores: calculatedScores
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({
          message: "データベースエラー",
          error: dbError instanceof Error ? dbError.message : "不明なエラー"
        });
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      res.status(500).json({
        message: "アンケート送信中にエラーが発生しました",
        error: error instanceof Error ? error.message : "不明なエラー"
      });
    }
  });

  app.get('/api/results/:yoxoId', async (req, res) => {
    try {
      const result = await db.query.survey_responses.findFirst({
        where: eq(survey_responses.yoxo_id, req.params.yoxoId)
      });

      if (!result) {
        return res.status(404).json({ message: "結果が見つかりませんでした" });
      }

      res.json(result.calculated_scores);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ 
        message: "結果の取得中にエラーが発生しました",
        error: error instanceof Error ? error.message : "不明なエラー"
      });
    }
  });

  return httpServer;
}