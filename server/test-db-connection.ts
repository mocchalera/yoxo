import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@db/schema';

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL環境変数が設定されていません。');
    process.exit(1);
  }

  console.log('接続文字列の確認:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // タイムアウトを10秒に設定
  });

  try {
    console.log('データベースへの接続を試みます...');
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
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();