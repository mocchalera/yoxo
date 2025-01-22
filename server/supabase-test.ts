import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// 環境変数の確認
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Supabase環境変数が設定されていません。');
  process.exit(1);
}

console.log('Supabase設定を確認中...');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('接続を開始します...');

// Supabaseクライアントの初期化
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetch as any
  }
});

async function testConnection() {
  try {
    console.log('認証状態を確認中...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('認証エラー:', authError);
      return;
    }

    console.log('認証状態:', authData);

    console.log('データベース接続をテスト中...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('データベースエラー:', error);
      return;
    }

    console.log('接続テスト成功:', data);
  } catch (error) {
    console.error('テスト実行中にエラーが発生:', error);
  }
}

testConnection();