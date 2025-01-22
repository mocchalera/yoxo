import { defineConfig } from "drizzle-kit";

if (!process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE || !process.env.PGUSER || !process.env.PGPASSWORD) {
  throw new Error("Database environment variables are not set properly. Please check your configuration.");
}

const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`;

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});