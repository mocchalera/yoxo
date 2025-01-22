const DIFY_API_KEY = process.env.VITE_DIFY_API_KEY
const DIFY_API_URL = process.env.VITE_DIFY_API_URL

if (!DIFY_API_KEY || !DIFY_API_URL) {
  throw new Error('Missing Dify environment variables')
}

export interface FatigueScores {
  fatigue_type: string;
  brain_fatigue: number;
  mental_fatigue: number;
  fatigue_source: number;
  resilience: number;
}

export async function generateAdvice(scores: FatigueScores): Promise<string> {
  const response = await fetch(DIFY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: `Generate personalized advice for: 
          Fatigue Type: ${scores.fatigue_type}
          Brain Fatigue: ${scores.brain_fatigue}
          Mental Fatigue: ${scores.mental_fatigue}
          Fatigue Source: ${scores.fatigue_source}
          Resilience: ${scores.resilience}`
      }],
      response_mode: 'blocking',
    }),
  })

  const data = await response.json()
  return data.answer
}
