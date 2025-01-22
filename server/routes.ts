import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { db } from "@db";
import { survey_responses, users } from "@db/schema";
import { eq } from "drizzle-orm";
import MemoryStore from "memorystore";
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Supabase環境変数が設定されていません。');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    fetch: fetch as any
  }
});

// 未認証ユーザー用の固定UUID
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

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

  // Supabase認証同期エンドポイント
  app.post('/api/auth/sync', async (req, res) => {
    try {
      const { supabase_id } = req.body;
      if (!supabase_id) {
        return res.status(400).json({ message: "Supabase IDが必要です" });
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(supabase_id);
      if (authError) {
        console.error('Supabase認証エラー:', authError);
        return res.status(401).json({ message: "ユーザー認証に失敗しました" });
      }

      // ユーザーをデータベースに同期
      const [user] = await db.insert(users)
        .values({
          supabase_id: supabase_id,
        })
        .onConflictDoNothing()
        .returning();

      res.json({ user });
    } catch (error) {
      console.error('認証同期エラー:', error);
      res.status(500).json({ message: "サーバーエラーが発生しました" });
    }
  });

  // 既存のルート
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
        const userId = req.body.supabaseId || GUEST_USER_ID;

        console.log('Attempting to save survey response:', {
          yoxo_id: yoxoId,
          user_id: userId,
          section1_responses: section1,
          section2_responses: section2,
          section3_responses: section3
        });

        const [newResponse] = await db.insert(survey_responses).values({
          yoxo_id: yoxoId,
          user_id: userId,
          section1_responses: section1,
          section2_responses: section2,
          section3_responses: section3,
          calculated_scores: calculatedScores
        }).returning();

        console.log('Successfully saved survey response:', newResponse);

        res.json({
          yoxoId,
          scores: calculatedScores
        });
      } catch (dbError) {
        console.error('Database error details:', dbError);
        res.status(500).json({
          message: "データベースエラー",
          error: dbError instanceof Error ? dbError.message : JSON.stringify(dbError)
        });
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      res.status(500).json({
        message: "アンケート送信中にエラーが発生しました",
        error: error instanceof Error ? error.message : JSON.stringify(error)
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