import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URL must be set. Did you forget to set up the Supabase database URL?",
  );
}

export const db = drizzle({
  connection: process.env.SUPABASE_DB_URL,
  schema,
  ws: ws,
});