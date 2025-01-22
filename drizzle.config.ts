import { defineConfig } from "drizzle-kit";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL環境変数が設定されていません。データベースが正しくプロビジョニングされているか確認してください。");
}

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL,
  },
});