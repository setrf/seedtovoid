import { useGameOfLife } from "../lib/stores/useGameOfLife";
import { patterns } from "../lib/patterns";

export function MobilePatternDock() {
  const {
    selectPatternForStamping,
    pendingPattern,
    patternCooldowns,
    speed,
    pauseTime,
    isRunning,
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

  const handleSelect = (key: string) => {
    const cooldownUntil = patternCooldowns[key];
    const effectiveNow = pauseTime || Date.now();
    if (cooldownUntil && cooldownUntil > effectiveNow) return;
    const p = patterns[key];
    if (!p) return;
    selectPatternForStamping({ key, pattern: p.pattern });
  };

  return (
    <div className="mobile-pattern-dock" role="tablist" aria-label="Patterns">
      {Object.entries(patterns).map(([key, p]) => {
        const cooldownUntil = patternCooldowns[key];
        // Freeze cooldown progress when game is not running
        const effectiveNow = isRunning ? Date.now() : (pauseTime || Date.now());
        const duration = getCooldownDuration(key);
        const remainingMs = Math.max(0, (cooldownUntil || 0) - effectiveNow);
        const isCoolingDown = remainingMs > 0;
        const progress = isCoolingDown ? Math.min(100, ((duration - remainingMs) / duration) * 100) : 100;
        const isSelected = pendingPattern?.key === key;
        const short = p.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
        return (
          <button
            key={key}
            className={`pattern-chip ${isSelected ? 'selected' : ''} ${isCoolingDown ? 'cooldown' : ''}`}
            onClick={() => handleSelect(key)}
            aria-pressed={isSelected}
            aria-label={p.name + (isCoolingDown ? ` (${Math.ceil(remainingMs / 1000)}s)` : '')}
            data-short={short}
          >
            <span className="chip-label">{p.name}</span>
            {isCoolingDown && (
              <span className="chip-timer">{Math.ceil(remainingMs / 1000)}s</span>
            )}
            <span className="chip-progress" style={{ width: `${progress}%` }} />
          </button>
        );
      })}
    </div>
  );
}
