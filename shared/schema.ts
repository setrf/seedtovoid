import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const highScores = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  score: integer("score").notNull(),
  timeSurvived: integer("time_survived").notNull(),
  threatsDefeated: integer("threats_defeated").notNull(),
  cellsPlaced: integer("cells_placed").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  difficulty: text("difficulty").notNull().default('normal'),
});

export const insertHighScoreSchema = createInsertSchema(highScores);
export type HighScore = typeof highScores.$inferSelect;
