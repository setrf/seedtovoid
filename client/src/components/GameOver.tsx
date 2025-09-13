import { useState } from "react";
import { useGameOfLife } from "../lib/stores/useGameOfLife";
import { LeaderboardModal } from "./LeaderboardModal";
import { Trophy } from "lucide-react";

export function GameOver() {
  const { survivalStats, startNewSurvivalRun, difficultyMode, loadHighScores } = useGameOfLife();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleShowLeaderboard = async () => {
    await loadHighScores();
    setShowLeaderboard(true);
  };

  return (
    <>
      {!showLeaderboard && (
      <div className="game-over-overlay">
        <div className="game-over-content">
          <h1 className="game-over-title">DEFEAT</h1>
          <div className="final-score-display">
            <div className="score-label">Final Score</div>
            <div className="final-score-value">
              {survivalStats.score.toLocaleString()}
            </div>
          </div>
          <div className="game-over-actions">
            <button
              className="button-secondary"
              onClick={handleShowLeaderboard}
            >
              <Trophy size={14} style={{ marginRight: '8px' }} />
              Leaderboard
            </button>
            <button 
              className="button-primary try-again-button"
              onClick={startNewSurvivalRun}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
      )}
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        difficulty={difficultyMode}
      />
    </>
  );
}
