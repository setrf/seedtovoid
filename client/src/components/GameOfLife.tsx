import { useEffect } from "react";
import { GameControls } from "./GameControls";
import { Grid2D } from "./Grid2D";
import { PatternSelector } from "./PatternSelector";
import { EnemyControls } from "./EnemyControls";
import { useGameOfLife } from "../lib/stores/useGameOfLife";
import { StatsPanel } from './StatsPanel';
import { GameOver } from './GameOver';
import { MobileHUD } from './MobileHUD';
import { MobilePatternDock } from './MobilePatternDock';
import { MobileStatsOverlay } from './MobileStatsOverlay';

export function GameOfLife() {
  const { isRunning, start, stop, reset, gameState, runId } = useGameOfLife();

  useEffect(() => {
    reset();
  }, []);

  // Keyboard shortcuts for expert users
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isRunning) {
            stop();
          } else {
            start();
          }
          break;
        case 'KeyR':
          event.preventDefault();
          reset();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, start, stop, reset]);

  return (
    <div className="game-layout">
      {/* Mobile/Desktop: Control panel (left on desktop) */}
      <div className="control-panel">
        <StatsPanel />
        <div className="panel">
          <div className="panel-header">
            Game Controls
          </div>
          <div className="panel-content">
            <GameControls />
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-header">
            Patterns
          </div>
          <div className="panel-content">
            <PatternSelector />
          </div>
        </div>
        
        <EnemyControls />
      </div>

      {/* Main canvas area - Full viewport utilization */}
      <div className="game-canvas">
        <Grid2D key={runId} />
        {gameState === 'game-over' && <GameOver />}
        {/* Mobile-only floating UI (hide on game over to prevent overlap) */}
        {gameState !== 'game-over' && (
          <>
            <MobileStatsOverlay />
            <MobilePatternDock />
            <MobileHUD />
          </>
        )}
      </div>
    </div>
  );
}
