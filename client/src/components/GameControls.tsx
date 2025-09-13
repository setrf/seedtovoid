import { useState } from "react";
import { useGameOfLife } from "../lib/stores/useGameOfLife";
import { DifficultySelector } from "./DifficultySelector";
import { AllLeaderboardsModal } from "./AllLeaderboardsModal";
import { Trophy } from "lucide-react";

export function GameControls() {
  const {
    isRunning,
    generation,
    speed,
    livingCells,
    start,
    stop,
    reset,
    setSpeed,
    startNewSurvivalRun,
    pauseGame,
    resumeGame,
  } = useGameOfLife();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleLeaderboardToggle = () => {
    if (isRunning) {
      pauseGame();
    }
    setShowLeaderboard(true);
  };

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
    if (isRunning) {
      resumeGame();
    }
  };

  return (
    <>
      <DifficultySelector />
      <div className="panel">
        <div className="panel-header">Simulation Controls</div>
        <div className="panel-content">
          <div className="control-group">
            <div className="control-row">
              <span className="control-label" data-short="STATE">State</span>
              <button
                className={`button-primary ${isRunning ? 'PAUSE' : 'PLAY'}`}
                onClick={isRunning ? stop : start}
                data-icon={isRunning ? "⏸" : "▶"}
              >
                {isRunning ? "PAUSE" : "PLAY"}
              </button>
            </div>
            
            {/* Speed Control */}
            <div className="control-row">
              <span className="control-label" data-short="SPEED">Speed</span>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="slider"
                />
              <span className="status-display">
                {speed}x
              </span>
            </div>

            <div className="control-row">
              <span className="control-label" data-short="RESET">Reset</span>
              <button className="button-secondary" onClick={startNewSurvivalRun} data-icon="🔄">
                RESET
              </button>
            </div>
            
            <div className="control-row">
              <span className="control-label" data-short="SCORES">Scores</span>
              <button className="button-secondary" onClick={handleLeaderboardToggle} data-icon="🏆">
                <Trophy size={12} style={{ marginRight: '6px' }} />
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
      <AllLeaderboardsModal 
        isOpen={showLeaderboard}
        onClose={handleCloseLeaderboard}
      />
    </>
  );
}
