import { useGameOfLife } from "../lib/stores/useGameOfLife";
import { patterns } from "../lib/patterns";
import { Target } from "lucide-react";

export function PatternSelector() {
  const {
    selectPatternForStamping, cancelPatternSelection,
    pendingPattern,
    patternCooldowns,
    speed,
    pauseTime,
  } = useGameOfLife();

  const getCooldownDuration = (patternKey: string) => {
    const cooldowns: { [key: string]: number } = {
      glider: 50,
      block: 30,
      blinker: 30,
      beacon: 100,
      toad: 100,
      rpentomino: 150,
      lightweight: 200,
      pulsar: 300,
      gliderGun: 600,
    };
    const baseSeconds = cooldowns[patternKey] || 50;
    const currentSpeed = Math.max(0.1, speed || 1);
    const speedMultiplier = 1 / currentSpeed;
    return Math.floor(baseSeconds * 1000 * speedMultiplier);
  };

  const handlePatternStamp = (patternKey: string) => {
    const cooldown = patternCooldowns[patternKey];
    const effectiveNow = pauseTime || Date.now();
    if (cooldown && cooldown > effectiveNow) {
      return;
    }

    const pattern = patterns[patternKey];
    if (pattern) {
      selectPatternForStamping({ key: patternKey, pattern: pattern.pattern });
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        {pendingPattern ? (
          <span className="pattern-ready-message">
            <Target size={12} className="icon-target" />
            {patterns[pendingPattern.key]?.name.toUpperCase()} READY - CLICK GRID TO PLACE
          </span>
        ) : (
          "Pattern Library"
        )}
      </div>
      <div className="panel-content">
        <div className="pattern-grid">
          {Object.entries(patterns).map(([key, pattern]) => {
            const cooldownUntil = patternCooldowns[key];
            const effectiveNow = pauseTime || Date.now();
            const isCoolingDown = cooldownUntil && cooldownUntil > effectiveNow;
            const isSelected = pendingPattern?.key === key;

            return (
              <div
                key={key}
                className={`pattern-item ${isSelected ? 'selected' : ''} ${isCoolingDown ? 'cooldown' : ''}`}
                onClick={() => handlePatternStamp(key)}
              >
                {isCoolingDown ? (
                  <div className="cooldown-info">
                    <div className="pattern-name-cooldown">{pattern.name}</div>
                    <div className="cooldown-visual">
                      <div className="cooldown-progress-bar-inline">
                        <div
                          className="cooldown-progress-fill-inline"
                          style={{
                            width: `${Math.max(0, Math.min(100, ((getCooldownDuration(key) - (cooldownUntil - effectiveNow)) / getCooldownDuration(key)) * 100))}%`
                          }}
                        />
                      </div>
                      <div className="cooldown-timer-inline">
                        {Math.ceil((cooldownUntil - effectiveNow) / 1000)}s
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pattern-name">{pattern.name}</div>
                )}
              </div>
            );
          })}
        </div>
        
        {pendingPattern && (
          <div style={{ marginTop: '16px' }}>
            <button
              className="button-primary"
              onClick={cancelPatternSelection}
              style={{ width: '100%' }}
              data-icon="✕"
            >
              CANCEL PATTERN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
