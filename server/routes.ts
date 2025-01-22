import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { db } from "@db";
import { responses, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

const DIFY_API_KEY = process.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = process.env.VITE_DIFY_API_URL;

if (!DIFY_API_KEY || !DIFY_API_URL) {
  console.warn('Dify環境変数が設定されていません。アドバイス機能は無効化されます。');
}

async function generateAdvice(scores: {
  fatigue_type: string;
  brain_fatigue: number;
  mental_fatigue: number;
  fatigue_source: number;
  resilience: number;
}, userId?: number): Promise<string | null> {
  if (!DIFY_API_KEY || !DIFY_API_URL) return null;

  try {
    let historyContext = "";
    if (userId) {
      const previousResults = await db.query.responses.findMany({
        where: eq(responses.user_id, userId),
        orderBy: [desc(responses.created_at)],
        limit: 5,
      });

      if (previousResults.length > 0) {
        const trend = previousResults.map(r => r.calculated_scores.resilience);
        const avgResilience = trend.reduce((a, b) => a + b, 0) / trend.length;
        const improving = trend[0] > avgResilience;

        historyContext = `
        過去の測定結果との比較:
        - レジリエンス傾向: ${improving ? "改善傾向" : "低下傾向"}
        - 平均レジリエンス: ${avgResilience.toFixed(1)}
        `;
      }
    }

    const response = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `
            以下の測定結果に基づいて、具体的で実践的なアドバイスを日本語で提供してください：

            現在の状態:
            - 疲労タイプ: ${scores.fatigue_type}
            - 脳疲労指数: ${scores.brain_fatigue.toFixed(1)}
            - 心疲労指数: ${scores.mental_fatigue.toFixed(1)}
            - 疲労源指数: ${scores.fatigue_source.toFixed(1)}
            - レジリエンス: ${scores.resilience.toFixed(1)}

            ${historyContext}

            アドバイスの要件:
            1. 現在の疲労状態を簡潔に説明
            2. 即実践できる具体的な改善アクション（3つ程度）
            3. 前向きで励みになるメッセージ

            フォーマット:
            • 現状の解説
            • 具体的なアドバイス（箇条書き）
            • 励ましのメッセージ`
        }],
        response_mode: 'blocking',
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Difyからのアドバイス生成に失敗:', error);
    return null;
  }
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // セッション設定を追加
  app.use(
    session({
      secret: 'your-secret-key', // Replace with a strong, randomly generated secret
      resave: false,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === 'production' }
    })
  );

  // Submit survey responses - ゲストユーザーでも送信可能に修正
  app.post('/api/submit-survey', async (req, res) => {
    try {
      console.log('Received survey submission:', req.body); 

      const yoxoId = `YX${new Date().toISOString().slice(2,8)}${Math.random().toString().slice(2,6)}`;
      const section1 = req.body.responses.slice(0, 6);
      const section2 = req.body.responses.slice(6, 12);
      const section3 = req.body.responses.slice(12, 16);

      console.log('Parsed sections:', { section1, section2, section3 }); 

      const calculateScore = (responses: number[]) => {
        const avg = responses.reduce((a, b) => a + b, 0) / responses.length;
        return (avg - 1) * 25;
      };

      const fatigueSource = calculateScore(section1);
      const mentalFatigue = calculateScore(section3);
      const brainFatigue = (mentalFatigue - 50) * 50/30 + 50;
      const resilience = 100 * (2 * fatigueSource)/(2 * fatigueSource + mentalFatigue + brainFatigue);

      console.log('Calculated scores:', { 
        fatigueSource, 
        mentalFatigue, 
        brainFatigue, 
        resilience 
      }); 

      const getFatigueType = (mental: number, brain: number) => {
        const levels = ['低', '中', '高'];
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

        const mentalLevel = getMentalLevel(mental);
        const brainLevel = getBrainLevel(brain);

        const types = [
          ['軽疲労', '鈍感疲労', '盲目疲労'],
          ['敏感疲労', 'バランス疲労', '見過ごし疲労'],
          ['過敏疲労', '拡大疲労', '限界疲労']
        ];

        return types[mentalLevel][brainLevel];
      };

      const fatigueType = getFatigueType(mentalFatigue, brainFatigue);
      const calculatedScores = {
        fatigue_type: fatigueType,
        brain_fatigue: brainFatigue,
        mental_fatigue: mentalFatigue,
        fatigue_source: fatigueSource,
        resilience: resilience
      };

      const userId = req.body.userId || null;
      console.log('User ID for advice:', userId); 
      const advice = await generateAdvice(calculatedScores, userId);

      const response = await db.insert(responses).values({
        yoxo_id: yoxoId,
        user_id: userId,
        section1_responses: section1,
        section2_responses: section2,
        section3_responses: section3,
        calculated_scores: calculatedScores
      });

      console.log('Database insert response:', response); 

      res.json({ 
        yoxoId,
        advice 
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get('/api/results/:yoxoId', async (req, res) => {
    try {
      const result = await db.query.responses.findFirst({
        where: eq(responses.yoxo_id, req.params.yoxoId)
      });

      if (!result) {
        return res.status(404).json({ message: "Results not found" });
      }

      const advice = result.calculated_scores ? 
        await generateAdvice(result.calculated_scores) : null;

      res.json({
        ...result.calculated_scores,
        advice
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.get('/api/dashboard', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const results = await db.query.responses.findMany({
        where: eq(responses.user_id, parseInt(userId)),
        orderBy: [desc(responses.created_at)],
        limit: 30, 
      });

      const stats = {
        total_measurements: results.length,
        avg_resilience: results.reduce((acc, curr) => 
          acc + curr.calculated_scores.resilience, 0) / results.length,
        common_fatigue_type: results
          .map(r => r.calculated_scores.fatigue_type)
          .reduce((acc: { [key: string]: number }, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
          }, {})
      };

      const history = results.map(r => ({
        date: r.created_at,
        ...r.calculated_scores
      }));

      res.json({
        history,
        stats: {
          ...stats,
          common_fatigue_type: Object.entries(stats.common_fatigue_type)
            .sort((a, b) => b[1] - a[1])[0][0]
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}