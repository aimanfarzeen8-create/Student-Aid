import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const termsTable = pgTable("terms", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  pronunciation: text("pronunciation"),
  definition: text("definition").notNull(),
  example: text("example"),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  isLearned: boolean("is_learned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTermSchema = createInsertSchema(termsTable).omit({ id: true, createdAt: true });
export const updateTermSchema = insertTermSchema.partial();

export type InsertTerm = z.infer<typeof insertTermSchema>;
export type UpdateTerm = z.infer<typeof updateTermSchema>;
export type Term = typeof termsTable.$inferSelect;
