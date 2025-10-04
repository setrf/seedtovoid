import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { highScores, type HighScore } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import type { DifficultyMode } from "client/src/lib/stores/useGameOfLife";
import { promises as fs } from "fs";
import path from "path";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getHighScores(difficulty: DifficultyMode): Promise<HighScore[]>;
  createHighScore(score: Omit<HighScore, "id" | "timestamp">): Promise<HighScore>;
}

export class MemStorage implements IStorage {
  private highScores: HighScore[] = [];
  private currentId = 1;

  async getHighScores(difficulty: DifficultyMode): Promise<HighScore[]> {
    return this.highScores
      .filter(s => s.difficulty === difficulty)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  async createHighScore(score: Omit<HighScore, "id" | "timestamp">): Promise<HighScore> {
    const newScore: HighScore = { 
      ...score, 
      id: this.currentId++,
      timestamp: new Date(),
    };
    this.highScores.push(newScore);
    return newScore;
  }
}

export class DBStorage implements IStorage {
  db: NodePgDatabase<typeof import("@shared/schema")>;
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(pool, { schema: import("@shared/schema") });
  }

  async getHighScores(difficulty: DifficultyMode): Promise<HighScore[]> {
    return await this.db.select()
      .from(highScores)
      .where(eq(highScores.difficulty, difficulty))
      .orderBy(desc(highScores.score))
      .limit(10);
  }

  async createHighScore(score: Omit<HighScore, "id" | "timestamp">): Promise<HighScore> {
    const result = await this.db.insert(highScores).values(score).returning();
    return result[0];
  }
}

export class FileStorage implements IStorage {
  private dataPath: string;
  private data: { [key in DifficultyMode]: HighScore[] } = {
    easy: [],
    normal: [],
    hard: []
  };
  private currentId = 1;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.resolve(process.cwd(), "data", "high-scores.json");
    this.loadData();
  }

  private async loadData() {
    try {
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      const content = await fs.readFile(this.dataPath, "utf-8");
      this.data = JSON.parse(content);

      // Find highest ID to continue sequence
      const allScores = [...this.data.easy, ...this.data.normal, ...this.data.hard];
      if (allScores.length > 0) {
        this.currentId = Math.max(...allScores.map(s => s.id)) + 1;
      }
    } catch (error) {
      // File doesn't exist or invalid JSON, start fresh
      await this.saveData();
    }
  }

  private async saveData() {
    await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  async getHighScores(difficulty: DifficultyMode): Promise<HighScore[]> {
    return this.data[difficulty]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async createHighScore(score: Omit<HighScore, "id" | "timestamp">): Promise<HighScore> {
    const newScore: HighScore = {
      ...score,
      id: this.currentId++,
      timestamp: new Date(),
    };

    this.data[score.difficulty].push(newScore);
    await this.saveData();

    return newScore;
  }
}

// export const storage = new DBStorage();
// export const storage = new MemStorage();
export const storage = new FileStorage();
