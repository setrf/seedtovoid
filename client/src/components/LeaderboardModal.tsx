import React, { useState, useEffect } from "react";
import { useGameOfLife, HighScore, DifficultyMode } from "../lib/stores/useGameOfLife";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: DifficultyMode;
}

export function LeaderboardModal({ isOpen, onClose, difficulty }: LeaderboardModalProps) {
  const { highScores } = useGameOfLife();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="onboarding-modal leaderboards-modal max-w-lg">
        <DialogHeader>
          <DialogTitle className="onboarding-title">
            Leaderboard
            <span className="subtitle" style={{ color: 'var(--color-accent)' }}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            High scores for {difficulty} mode.
          </DialogDescription>
        </DialogHeader>

        <div className="high-scores-list" style={{ padding: '16px 0' }}>
          {highScores.length > 0 ? (
            highScores.map((score, index) => (
              <div key={score.timestamp} className="high-score-entry">
                <span className="rank" style={{ width: '30px' }}>#{index + 1}</span>
                <span className="username">{score.username}</span>
                <span className="score" style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>
                  {score.score.toLocaleString()}
                </span>
                <span className="date" style={{ width: '100px', textAlign: 'right', opacity: 0.7 }}>
                  {new Date(score.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>No scores yet for this difficulty. Be the first!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
