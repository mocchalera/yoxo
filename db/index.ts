import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// 接続プールの設定
const pool = new Pool({
  connectionString: "postgresql://postgres:FYMolZKxAxuE9lLr@db.fbvormffpuunsufgfmjf.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

// データベース接続のログ
pool.on('connect', () => {
  console.log('データベース接続が確立されました');
});

pool.on('error', (err: Error) => {
  console.error('プール接続エラー:', err);
});

// Drizzle ORMの初期化
export const db = drizzle(pool, { schema });

// 接続テスト
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('接続テスト成功');

    const result = await client.query('SELECT current_database()');
    console.log('現在のデータベース:', result.rows[0]);

    client.release();
  } catch (error: any) {
    console.error('データベース接続エラー:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  }
}

testConnection();