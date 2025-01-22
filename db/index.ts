import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@db/schema";
import pkg from 'pg';
const { Pool } = pkg;
import { createClient } from '@supabase/supabase-js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// PostgreSQL接続プールの設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000, // タイムアウトを20秒に延長
  idleTimeoutMillis: 30000,
  max: 20,
  retryDelay: 1000, // 再試行の間隔を1秒に設定
  connectionRetryLimit: 3 // 接続の再試行回数を3回に設定
});

// 接続イベントのログ
pool.on('connect', () => {
  console.log('データベース接続が確立されました');
  console.log('接続URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
});

pool.on('error', (err: Error) => {
  console.error('プール接続エラーの詳細:', {
    message: err.message,
    code: err.code,
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

// DNSの解決を試みる
import dns from 'dns';
async function checkDNS() {
  try {
    const url = new URL(process.env.DATABASE_URL || '');
    console.log('DNSの解決を試みています:', url.hostname);
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve(url.hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('DNS解決結果:', addresses);
  } catch (error) {
    console.error('DNS解決エラー:', error);
  }
}

// 接続テスト関数
async function testConnection() {
  try {
    await checkDNS();
    console.log('接続を試みています...');

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