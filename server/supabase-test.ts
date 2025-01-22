import axios from 'axios';

// 環境変数の確認
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Supabase環境変数が設定されていません。');
  process.exit(1);
}

console.log('Supabase設定を確認中...');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('接続を開始します...');

async function testConnection() {
  try {
    console.log('Supabaseに直接接続テスト中...');

    const headers = {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
    };

    const response = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/users?select=*&limit=1`, {
      headers: headers
    });

    console.log('接続テスト成功:', response.status);
    console.log('レスポンスデータ:', response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('接続エラー:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    } else {
      console.error('予期せぬエラー:', error);
    }
  }
}

testConnection();