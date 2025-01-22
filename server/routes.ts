import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { responses } from "@db/schema";
import { eq } from "drizzle-orm";

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
}): Promise<string | null> {
  if (!DIFY_API_KEY || !DIFY_API_URL) return null;

  try {
    const response = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Generate personalized advice in Japanese for: 
            疲労タイプ: ${scores.fatigue_type}
            脳疲労: ${scores.brain_fatigue}
            心疲労: ${scores.mental_fatigue}
            疲労源: ${scores.fatigue_source}
            レジリエンス: ${scores.resilience}`
        }],
        response_mode: 'blocking',
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

  // Submit survey responses
  app.post('/api/submit-survey', async (req, res) => {
    try {
      const yoxoId = `YX${new Date().toISOString().slice(2,8)}${Math.random().toString().slice(2,6)}`;
      const section1 = req.body.responses.slice(0, 6);
      const section2 = req.body.responses.slice(6, 12);
      const section3 = req.body.responses.slice(12, 16);

      // Calculate scores based on questionnaire spec
      const calculateScore = (responses: number[]) => {
        const avg = responses.reduce((a, b) => a + b, 0) / responses.length;
        return (avg - 1) * 25;
      };

      const fatigueSource = calculateScore(section1);
      const mentalFatigue = calculateScore(section3);
      const brainFatigue = (mentalFatigue - 50) * 50/30 + 50;
      const resilience = 100 * (2 * fatigueSource)/(2 * fatigueSource + mentalFatigue + brainFatigue);

      // Determine fatigue type
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

      // Get personalized advice
      const advice = await generateAdvice(calculatedScores);

      await db.insert(responses).values({
        yoxo_id: yoxoId,
        section1_responses: section1,
        section2_responses: section2,
        section3_responses: section3,
        calculated_scores: calculatedScores
      });

      res.json({ 
        yoxoId,
        advice 
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get results by ID
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

  return httpServer;
}