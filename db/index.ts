import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@db/schema";
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// PostgreSQL接続プールの設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// 接続イベントのログ
pool.on('connect', () => {
  console.log('データベース接続が確立されました');
});

pool.on('error', (err) => {
  console.error('データベース接続エラー:', err.message);
});

// Drizzle ORMの初期化
export const db = drizzle(pool, { schema });

// 初期接続テスト
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('データベース接続テスト成功');
    client.release();
  } catch (error) {
    console.error('データベース接続エラー:', error);
    throw error;
  }
}

// アプリケーション起動時に接続テストを実行
testConnection().catch(console.error);