import pkg from 'pg';
const { Pool } = pkg;
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
    },
    connectionTimeoutMillis: 10000, // タイムアウトを10秒に設定
  });

  try {
    console.log('データベースへの接続を試みます...');
    const client = await pool.connect();
    console.log('接続テスト成功');

    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('データベース情報:', result.rows[0]);

    const tableList = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('利用可能なテーブル:', tableList.rows.map(row => row.table_name));

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