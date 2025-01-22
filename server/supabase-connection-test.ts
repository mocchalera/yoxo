import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_DB_URL) {
  console.error('必要な環境変数が設定されていません：');
  console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
  console.log('SUPABASE_DB_URL:', !!process.env.SUPABASE_DB_URL);
  process.exit(1);
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

async function testSupabaseConnection() {
  try {
    console.log('Supabase接続テストを開始します...');
    
    // 認証テスト
    console.log('\n1. 認証接続テスト:');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('認証状態:', session ? '成功' : '未認証');
    if (authError) console.error('認証エラー:', authError);

    // データベーステスト
    console.log('\n2. データベース接続テスト:');
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();
    
    if (dbError) {
      console.log('データベースエラー:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      });
    } else {
      console.log('データベース接続成功');
    }

    // プロジェクト情報
    console.log('\n3. プロジェクト設定:');
    console.log('Supabase URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
    console.log('Database URL exists:', !!process.env.SUPABASE_DB_URL);
    
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
  }
}

testSupabaseConnection();
