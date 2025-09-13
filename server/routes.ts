import express from "express";
import { storage } from "./storage";
import { insertHighScoreSchema } from "@shared/schema";
import type { DifficultyMode } from "client/src/lib/stores/useGameOfLife";

export const routes = express.Router();

routes.get("/api/high-scores", async (req, res) => {
  const difficulty = (req.query.difficulty || 'normal') as DifficultyMode;
  const scores = await storage.getHighScores(difficulty);
  res.json(scores);
});

routes.post("/api/high-scores", async (req, res) => {
  try {
    const score = insertHighScoreSchema.parse(req.body);
    const newScore = await storage.createHighScore(score);
    res.json(newScore);
  } catch (error) {
    res.status(400).json({ error });
  }
});
