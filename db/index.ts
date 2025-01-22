import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.SUPABASE_DB_URL) {
  throw new Error(
    "SUPABASE_DB_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.SUPABASE_DB_URL;

// WebSocketのフォールバックオプションを設定
const wsOptions = {
  webSocket: ws,
  connectionOptions: {
    keepAlive: true,
    keepAliveInitialDelay: 10000,
    maxPayload: 100 * 1024 * 1024,
  },
};

export const db = drizzle(connectionString, {
  schema,
  logger: true,
  ...wsOptions,
});