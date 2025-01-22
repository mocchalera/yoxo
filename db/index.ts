import postgres from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URLが設定されていません",
  );
}

const { Pool } = postgres;

console.log('データベース接続を開始します...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// 接続テスト
pool.on('connect', () => {
  console.log('PostgreSQLに接続しました');
});

pool.on('error', (err) => {
  console.error('予期せぬデータベースエラー:', err);
});

export const db = drizzle(pool, {
  schema,
  logger: true,
});

// 初期接続テスト
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('データベース接続エラー:', err);
  } else {
    console.log('データベース接続テスト成功:', res.rows[0]);
  }
});