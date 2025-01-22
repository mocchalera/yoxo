const LINE_API_URL = import.meta.env.VITE_LINE_API_URL

export async function generateLineQR(yoxoId: string): Promise<string> {
  const response = await fetch(`${LINE_API_URL}/qr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ yoxo_id: yoxoId }),
  })

  const data = await response.json()
  return data.qr_url
}

export async function sendLineMessage(lineId: string, message: string) {
  await fetch(`${LINE_API_URL}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      line_id: lineId,
      message: message,
    }),
  })
}