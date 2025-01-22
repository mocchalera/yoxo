import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@db/schema';

async function testConnection() {
  if (!process.env.SUPABASE_DB_URL) {
    console.error('SUPABASE_DB_URL環境変数が設定されていません。');
    process.exit(1);
  }

  console.log('接続文字列の確認:', process.env.SUPABASE_DB_URL.replace(/:[^:@]+@/, ':***@'));

  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('データベースへの接続を試みます...');
    const client = await pool.connect();
    console.log('接続成功！');

    console.log('テストクエリを実行します...');
    const result = await client.query('SELECT NOW()');
    console.log('クエリ結果:', result.rows[0]);

    client.release();
    await pool.end();
    console.log('テスト完了');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

testConnection();