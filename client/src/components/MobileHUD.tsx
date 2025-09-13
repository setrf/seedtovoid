import { useState } from "react";
import { AllLeaderboardsModal } from "./AllLeaderboardsModal";
import { MobileControlsModal } from "./MobileControlsModal";
import { useGameOfLife } from "../lib/stores/useGameOfLife";

export function MobileHUD() {
  const {
    isRunning,
    start,
    stop,
    startNewSurvivalRun,
    pendingPattern,
    cancelPatternSelection,
    pauseGame,
    resumeGame,
  } = useGameOfLife();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleToggleRun = () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  const handleReset = () => {
    startNewSurvivalRun();
  };

  const openLeaderboard = () => {
    if (isRunning) pauseGame();
    setShowLeaderboard(true);
  };

  const closeLeaderboard = () => {
    setShowLeaderboard(false);
    if (isRunning) resumeGame();
  };

  const openControls = () => {
    if (isRunning) pauseGame();
    setShowControls(true);
  };

  const closeControls = () => {
    setShowControls(false);
    if (isRunning) resumeGame();
  };

  return (
    <>
      <div className="mobile-hud" role="toolbar" aria-label="Mobile controls">
        <button
          className={`hud-button primary`}
          onClick={handleToggleRun}
          aria-label={isRunning ? "Pause" : "Play"}
        >
          {isRunning ? "⏸ Pause" : "▶ Play"}
        </button>

        {pendingPattern ? (
          <button
            className="hud-button"
            onClick={cancelPatternSelection}
            aria-label="Cancel pattern"
          >
            ✕ Cancel
          </button>
        ) : (
          <>
            <button
              className="hud-button"
              onClick={openControls}
              aria-label="Open controls"
            >
              🎛 Controls
            </button>
            <button
              className="hud-button"
              onClick={handleReset}
              aria-label="Reset run"
            >
              🔄 Reset
            </button>
          </>
        )}

        <button
          className="hud-button icon"
          onClick={openLeaderboard}
          aria-label="Open leaderboard"
        >
          🏆
        </button>
      </div>

      <AllLeaderboardsModal isOpen={showLeaderboard} onClose={closeLeaderboard} />
      <MobileControlsModal open={showControls} onClose={closeControls} />
    </>
  );
}
