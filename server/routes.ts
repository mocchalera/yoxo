import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { db } from "@db";
import { responses, users } from "@db/schema";
import { eq } from "drizzle-orm";
import MemoryStore from "memorystore";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// サーバーサイドでは VITE_ プレフィックスなしの環境変数を使用
const DIFY_API_KEY = process.env.DIFY_API_KEY || process.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || process.env.VITE_DIFY_API_URL;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase環境変数が設定されていません。認証機能は無効化されます。');
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const MemoryStoreSession = MemoryStore(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24時間でメモリをクリア
      }),
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24時間
      }
    })
  );

  // アンケート結果の送信エンドポイント
  app.post('/api/submit-survey', async (req, res) => {
    try {
      console.log('Received survey submission:', req.body);

      const yoxoId = `YX${new Date().toISOString().slice(2,8)}${Math.random().toString().slice(2,6)}`;
      const section1 = req.body.responses.slice(0, 6);
      const section2 = req.body.responses.slice(6, 12);
      const section3 = req.body.responses.slice(12, 16);

      console.log('Parsed sections:', { section1, section2, section3 });

      // スコアの計算
      const calculateScore = (responses: number[]) => {
        const sum = responses.reduce((a, b) => a + b, 0);
        return sum === 0 ? 0 : ((sum / responses.length) - 1) * 25;
      };

      const fatigueSource = calculateScore(section1);
      const mentalFatigue = calculateScore(section3);
      const brainFatigue = Math.max(0, Math.min(100, (mentalFatigue - 50) * 50/30 + 50));
      const resilience = fatigueSource === 0 ? 0 : 
        100 * (2 * fatigueSource)/(2 * fatigueSource + mentalFatigue + brainFatigue);

      // 疲労タイプの判定
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

      // データベースに保存
      const [response] = await db.insert(responses).values({
        yoxo_id: yoxoId,
        user_id: req.session.userId || null,
        section1_responses: section1,
        section2_responses: section2,
        section3_responses: section3,
        calculated_scores: calculatedScores
      }).returning();

      console.log('Database insert response:', response);

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
      const result = await db.query.responses.findFirst({
        where: eq(responses.yoxo_id, req.params.yoxoId)
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

  // 認証状態の確認エンドポイント
  app.get('/api/auth/me', async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supabaseのユーザー情報をDBと同期するエンドポイント
  app.post('/api/auth/sync', async (req, res) => {
    try {
      const { supabase_id } = req.body;
      if (!supabase_id) {
        return res.status(400).json({ message: "Supabase ID is required" });
      }

      let user = await db.query.users.findFirst({
        where: eq(users.supabase_id, supabase_id)
      });

      if (!user) {
        const [newUser] = await db.insert(users).values({
          supabase_id,
          created_at: new Date()
        }).returning();
        user = newUser;
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}