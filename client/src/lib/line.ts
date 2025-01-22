const LINE_API_URL = import.meta.env.VITE_LINE_API_URL;

if (!LINE_API_URL) {
  console.warn('LINE API URLが設定されていません。LINE連携機能は無効化されます。');
}

export async function generateLineQR(yoxoId: string): Promise<string> {
  if (!LINE_API_URL) {
    throw new Error('LINE API URLが設定されていません');
  }

  try {
    const response = await fetch(`${LINE_API_URL}/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ yoxo_id: yoxoId }),
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status}`);
    }

    const data = await response.json();
    return data.qr_url;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('QRコードの生成に失敗しました');
  }
}

export async function sendLineMessage(lineId: string, message: string): Promise<void> {
  if (!LINE_API_URL) {
    throw new Error('LINE API URLが設定されていません');
  }

  try {
    const response = await fetch(`${LINE_API_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line_id: lineId,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending LINE message:', error);
    throw new Error('LINEメッセージの送信に失敗しました');
  }
}