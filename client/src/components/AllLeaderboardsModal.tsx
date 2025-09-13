import { useGameOfLife, DifficultyMode, HighScore } from "../lib/stores/useGameOfLife";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

interface AllLeaderboardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllLeaderboardsModal({ isOpen, onClose }: AllLeaderboardsModalProps) {
  const [scores, setScores] = useState<Record<DifficultyMode, HighScore[]>>({
    easy: [],
    normal: [],
    hard: [],
  });
  
  useEffect(() => {
    async function fetchScores() {
      if (isOpen) {
        const difficulties: DifficultyMode[] = ['easy', 'normal', 'hard'];
        const scorePromises = difficulties.map(d => 
          fetch(`/api/high-scores?difficulty=${d}`).then(res => res.json())
        );
        const [easy, normal, hard] = await Promise.all(scorePromises);
        setScores({ easy, normal, hard });
      }
    }
    fetchScores();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="onboarding-modal leaderboards-modal max-w-4xl">
        <DialogHeader>
          <DialogTitle className="onboarding-title">
            <Trophy style={{ display: 'inline', marginRight: '12px' }} />
            All-Time Leaderboards
          </DialogTitle>
        </DialogHeader>
        <div className="all-leaderboards-container">
          {(['easy', 'normal', 'hard'] as DifficultyMode[]).map(difficulty => (
            <div key={difficulty} className="leaderboard-column">
              <h3 className="leaderboard-title">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h3>
              <div className="high-scores-list">
                {scores[difficulty].length > 0 ? (
                  scores[difficulty].map((score, index) => (
                    <div key={score.timestamp} className="high-score-entry">
                      <span className="rank">#{index + 1}</span>
                      <span className="username">{score.username}</span>
                      <span className="score">{score.score.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-scores">No scores yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
