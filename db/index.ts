import postgres from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = postgres;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, {
  schema,
  logger: true,
});