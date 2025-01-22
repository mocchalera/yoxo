const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_API_URL = import.meta.env.VITE_DIFY_API_URL;

if (!DIFY_API_KEY || !DIFY_API_URL) {
  console.warn('Dify環境変数が設定されていません。アドバイス機能は無効化されます。');
}

export interface FatigueScores {
  fatigue_type: string;
  brain_fatigue: number;
  mental_fatigue: number;
  fatigue_source: number;
  resilience: number;
}

export async function generateAdvice(scores: FatigueScores): Promise<string> {
  if (!DIFY_API_KEY || !DIFY_API_URL) {
    return "申し訳ありません。現在アドバイス機能は利用できません。";
  }

  try {
    const apiUrl = DIFY_API_URL.endsWith('/') ? DIFY_API_URL : `${DIFY_API_URL}/`;
    const response = await fetch(`${apiUrl}completion-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `以下の測定結果に基づいて、具体的で実践的なアドバイスを提供してください：

疲労タイプ: ${scores.fatigue_type}
脳疲労指数: ${scores.brain_fatigue}
心疲労指数: ${scores.mental_fatigue}
疲労源指数: ${scores.fatigue_source}
レジリエンス: ${scores.resilience}`
        }],
        response_mode: 'blocking',
      }),
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.status}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error generating advice:', error);
    return "申し訳ありません。アドバイスの生成中にエラーが発生しました。";
  }
}