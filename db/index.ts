import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGPASSWORD) {
  throw new Error(
    "Database environment variables are not set properly. Please check your configuration.",
  );
}

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

export const db = drizzle({
  connection: connectionString,
  schema,
  ws: ws,
});