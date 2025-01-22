import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;
import dns from 'dns';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.DATABASE_URL) {
  console.error('必要な環境変数が設定されていません：');
  console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
  console.log('DATABASE_URL:', !!process.env.DATABASE_URL);
  process.exit(1);
}

console.log('接続テストを開始します...');

// DNS解決のテスト
async function testDNSResolution() {
  console.log('\n1. DNS解決テスト:');
  try {
    const url = new URL(process.env.DATABASE_URL!);
    console.log('ホスト名:', url.hostname);

    const addresses = await new Promise((resolve, reject) => {
      dns.resolve(url.hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });

    console.log('DNS解決結果:', addresses);
  } catch (error: any) {
    console.error('DNS解決エラー:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// データベース接続テスト
async function testDatabaseConnection() {
  console.log('\n2. データベース接続テスト:');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('接続成功');

    const result = await client.query('SELECT version()');
    console.log('PostgreSQLバージョン:', result.rows[0].version);

    client.release();
    await pool.end();
  } catch (error: any) {
    console.error('データベース接続エラー:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  }
}

// Supabase APIテスト
async function testSupabaseAPI() {
  console.log('\n3. Supabase API接続テスト:');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    global: {
      fetch: fetch as any
    }
  });

  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase API接続成功');
  } catch (error: any) {
    console.error('Supabase APIエラー:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
  }
}

// すべてのテストを実行
async function runAllTests() {
  console.log('環境変数:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL!.replace(/:[^:@]+@/, ':***@'));
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

  try {
    await testDNSResolution();
    await testDatabaseConnection();
    await testSupabaseAPI();
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  }
}

runAllTests();