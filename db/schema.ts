import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabase_id: text("supabase_id").unique().notNull(),
  line_id: text("line_id").unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  yoxo_id: text("yoxo_id").unique().notNull(),
  user_id: integer("user_id").references(() => users.id),
  section1_responses: jsonb("section1_responses").$type<number[]>().notNull(),
  section2_responses: jsonb("section2_responses").$type<number[]>().notNull(),
  section3_responses: jsonb("section3_responses").$type<number[]>().notNull(),
  calculated_scores: jsonb("calculated_scores").$type<{
    fatigue_type: string;
    brain_fatigue: number;
    mental_fatigue: number;
    fatigue_source: number;
    resilience: number;
  }>().notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  dify_message: text("dify_message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const responseSchema = z.object({
  section1: z.array(z.number().min(1).max(4)).length(6),
  section2: z.array(z.number().min(1).max(4)).length(6),
  section3: z.array(z.number().min(1).max(4)).length(4),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type Message = typeof messages.$inferSelect;
