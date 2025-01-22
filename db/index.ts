import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.SUPABASE_DB_URL;

export const db = drizzle(connectionString, {
  schema,
  logger: true,
});