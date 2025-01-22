import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@db/schema";
import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

if (!process.env.SUPABASE_DB_URL) {
  throw new Error('SUPABASE_DB_URL must be set. Did you forget to provision a database?');
}

// Supabase設定の検証
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Supabase環境変数が設定されていません。');
}

// Supabaseクライアントの初期化
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    fetch: fetch as any
  }
});

// PostgreSQL接続プールの設定
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  max: 20
});

// 接続イベントのログ
pool.on('connect', () => {
  console.log('データベース接続が確立されました');
});

pool.on('error', (err: Error) => {
  console.error('プール接続エラーの詳細:', {
    message: err.message,
    code: (err as any).code,
    stack: err.stack
  });
  // エラー発生時に再接続を試みる
  setTimeout(() => {
    console.log('接続の再試行を開始します...');
    pool.connect().catch((retryError) => {
      console.error('再接続エラー:', retryError);
    });
  }, 5000);
});

// Drizzle ORMの初期化
export const db = drizzle(pool, { schema });

// 接続テスト関数
async function testConnection() {
  try {
    console.log('データベース接続を試みています...');
    const client = await pool.connect();
    console.log('接続テスト成功');

    const result = await client.query('SELECT current_database()');
    console.log('現在のデータベース:', result.rows[0]);

    client.release();
  } catch (error: any) {
    console.error('データベース接続エラーの詳細:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    throw error;
  }
}

// 初期接続テストを実行
testConnection().catch(console.error);