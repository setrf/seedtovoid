import React from 'react';
import { useGameOfLife } from '../lib/stores/useGameOfLife';

export function StatsPanel() {
  const {
    activeThreats,
    survivalStats,
    currentHighScore,
    generation,
    livingCells,
    difficultyLevel,
  } = useGameOfLife();

  return (
    <div className="panel">
      <div className="panel-header">Stats</div>
      <div className="panel-content">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label" data-short="SCR">Score</div>
            <div className="stat-value score">{survivalStats.score.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" data-short="BEST">Best</div>
            <div className="stat-value">{currentHighScore.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" data-short="GEN">Gen</div>
            <div className="stat-value">{generation.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" data-short="CELLS">Cells</div>
            <div className="stat-value">{livingCells}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" data-short="THRT">Threats</div>
            <div className="stat-value">{activeThreats.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" data-short="LVL">Level</div>
            <div className="stat-value">{(difficultyLevel ?? 0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
