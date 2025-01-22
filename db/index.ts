import postgres from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URLが設定されていません",
  );
}

const { Pool } = postgres;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1
});

export const db = drizzle(pool, {
  schema,
  logger: true,
});