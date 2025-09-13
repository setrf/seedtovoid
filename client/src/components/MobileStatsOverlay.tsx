import { useGameOfLife } from "../lib/stores/useGameOfLife";

export function MobileStatsOverlay() {
  const { survivalStats, generation, activeThreats } = useGameOfLife();
  return (
    <div className="mobile-stats-overlay" aria-hidden>
      <div className="stat">
        <span className="k">SCR</span>
        <span className="v accent">{survivalStats.score.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="k">GEN</span>
        <span className="v">{generation}</span>
      </div>
      <div className="stat">
        <span className="k">THRT</span>
        <span className="v">{activeThreats.length}</span>
      </div>
    </div>
  );
}

