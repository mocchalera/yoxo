import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";
import postgres from "pg";

const { Pool } = postgres;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL環境変数が設定されていません。');
}

console.log('Supabaseデータベースへの接続を開始します...');

const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.SSL_CERT,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(connectionConfig);

// 接続テスト
pool.on('connect', () => {
  console.log('Supabaseデータベースに接続しました');
});

pool.on('error', (err) => {
  console.error('予期せぬデータベースエラー:', err);
});

// エラーハンドリングを強化
pool.on('acquire', (client) => {
  console.log('新しい接続を確立しました');
});

pool.on('remove', () => {
  console.log('接続プールからクライアントを削除しました');
});

export const db = drizzle(pool, {
  schema,
  logger: true,
});

// 初期接続テスト
pool.connect()
  .then(client => {
    console.log('データベース接続テスト成功');
    client.release();
  })
  .catch(err => {
    console.error('データベース接続エラー:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
  });