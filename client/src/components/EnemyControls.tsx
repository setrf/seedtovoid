import { useGameOfLife } from "../lib/stores/useGameOfLife";

export function EnemyControls() {
  const {
    enemyControls,
    activeThreats,
  } = useGameOfLife();

  return (
    <div className="panel">
      <div className="panel-header">
        Enemy Controls
        <span style={{ 
          fontSize: '10px', 
          color: 'var(--color-text-tertiary)', 
          marginLeft: '8px' 
        }}>
          Active: {activeThreats.length}
        </span>
      </div>
      <div className="panel-content">
        <div className="control-group">
          {/* Spawn Rate Multiplier */}
          <div className="control-row">
            <label className="control-label" data-short="RATE">
              Spawn Rate
            </label>
            <div className="status-display">
              <span className="status-value">{enemyControls.spawnRateMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          {/* Max Simultaneous Threats */}
          <div className="control-row">
            <label className="control-label" data-short="MAX">
              Max Threats
            </label>
            <div className="status-display">
              <span className="status-value">{enemyControls.maxSimultaneousThreats}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}