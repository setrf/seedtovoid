# Game of Life – Survival Edition

A fast, touch‑friendly survival take on Conway’s Game of Life. You command a resilient green colony battling red threats that spawn, move, and escalate over time. Play on desktop or mobile with a canvas‑accelerated grid, bottom HUD, and an always‑visible pattern dock. Scores persist per difficulty, with optional Postgres storage.


## Features at a Glance

- Survival mode with escalating difficulty (“Level”) and threat waves
- Always‑visible Pattern Dock with per‑pattern cooldowns
- Mobile‑first UI: floating HUD (Play/Pause, Controls, Reset, 🏆), mini stats overlay
- Canvas 2D renderer with adaptive grid sizing and crisp cell borders
- Leaderboards per difficulty, plus an all‑time modal across difficulties
- Onboarding splash with dynamic step sizing and quick controls tutorial
- Keyboard shortcuts for power users (Space = Play/Pause, R = Reset)


## Gameplay & Dynamics

- Unit conversion rule: when red and green groups touch, the larger group converts the smaller one. Your colony survives as long as at least one green cell remains.
- Threats: hostile patterns (e.g., gliders, LWSS, curated patterns) spawn near your cells. Spawn probability scales by difficulty and escalates with time.
- Difficulty escalation (“Level”): every 10s of survival during play increases an internal level. Each level ramps:
  - Spawn rate multiplier
  - Max simultaneous threats
  The current Level is visible in Stats and resets on defeat or reset.
- Scoring: survival time and combat events contribute to score. Notifications highlight milestones (time, score, generations).
- Patterns & cooldowns:
  - Select from classic Life patterns (Glider, Block, Blinker, Beacon, Toad, R‑Pentomino, LWSS, Pulsar, Glider Gun).
  - Each applies a cooldown that scales inversely with sim speed (higher speed → shorter real‑time cooldown).
  - Cooldowns freeze while paused (both visually and in enforcement). Resuming shifts timestamps so remaining time is preserved.
- Placement modes: stamping is default. Replace mode exists in the store and can be extended to UI if desired.
- Controls:
  - Play/Pause, Speed slider, Reset, Leaderboard modal.
  - Touch devices: larger hit targets, manipulation‑safe touch events.


## Mobile UX

- Pattern Dock: always visible above the bottom HUD. Wraps into multiple rows; chips show full pattern names and a thin progress bar for cooldown. On ultra‑narrow screens chips condense but retain names.
- HUD: floating bottom bar with Play/Pause, Controls (opens modal), Reset, and 🏆 Leaderboard. When Controls or Leaderboard is open, the game pauses and resumes after closing (only if it was running before).
- Mini Stats: small glass overlay (top‑left) with SCR/GEN/THRT. The game canvas reserves bottom padding so it never sits under HUD/dock.


## Client Architecture

- Stack: React + Vite + Zustand (`subscribeWithSelector`) + Canvas 2D.
- Core components:
  - `Grid2D.tsx`: Canvas renderer. Adaptive sizing uses a `ResizeObserver` with throttling. It computes a grid that fills available space, clamps dimensions, and recomputes a pixel‑perfect `cellSize`. Grid lines and borders draw only when cells are large enough for clarity.
  - `GameOfLife.tsx`: Page layout. Renders control panels (desktop), canvas, Game Over overlay, mobile HUD, pattern dock, and stats overlay.
  - `GameControls.tsx`, `DifficultySelector.tsx`, `PatternSelector.tsx` (desktop), `StatsPanel.tsx`.
  - Mobile‑only: `MobileHUD.tsx`, `MobilePatternDock.tsx`, `MobileControlsModal.tsx`, `MobileStatsOverlay.tsx`.
  - Onboarding: `OnboardingModal.tsx` with dynamically sized steps.
- Store: `client/src/lib/stores/useGameOfLife.tsx`
  - State: grid data, timing, speed, survival stats, difficulty mode, escalation level, threat sets, cooldowns, progression (resources/unlocks primitives remain as scaffolding), notifications, stamping state.
  - Timers: sim loop interval (based on speed), threat spawn interval, optional regeneration hooks.
  - Pause semantics: `stop()` records `pauseTime` and sets `isRunning=false`. Cooldown checks and scaling use an “effective now” of `pauseTime` when paused, so time truly freezes. On `start()`, time spent paused is added to future timestamps to resume fairly.
  - Grid ops: `step()` computes next generation, applies unit conversion and threat ownership diffusion, updates stats, and triggers game over on extinction.
  - Pattern stamping: strict cooldown enforcement at click/touch; cooldown anchors to `pauseTime` when applied in a paused state.


## Server & Storage

- Dev server: `server/vite.ts` runs Vite in middleware mode (development) and serves the SPA. In production it serves static files from `dist/public`.
- API routes: `server/routes.ts`
  - `GET /api/high-scores?difficulty=easy|normal|hard` → top 10 scores for a difficulty
  - `POST /api/high-scores` → create a score. Validated with zod against the shared schema.
- Storage: `server/storage.ts`
  - **Default is `FileStorage`** (JSON file persistence) - Stores scores in `data/high-scores.json`
  - Alternative: `MemStorage` (in-memory, lost on restart)
  - Alternative: `DBStorage` (PostgreSQL via Drizzle ORM)
  - Toggle by changing the export at the bottom of the file
- Schema: `shared/schema.ts` (Drizzle + zod)
  - Table `high_scores` with fields: `id`, `username`, `score`, `timeSurvived`, `threatsDefeated`, `cellsPlaced`, `timestamp`, `difficulty`.

### Storage Options

**FileStorage (Default - Production)**
- Persists scores to `data/high-scores.json`
- Auto-creates directory structure on startup
- Maintains ID sequence across restarts
- No database required
- Simple backup: copy JSON file

**To enable Postgres (DBStorage)**:
1. Set `DATABASE_URL` in the environment.
2. Switch `export const storage = new FileStorage();` to `export const storage = new DBStorage();` in `server/storage.ts`.
3. Apply the schema to your DB (Drizzle migrations or manual create) and restart the server.


## Commands

- Development: `npm run dev`
  - Starts Express on port 3001 and Vite middleware; client is served via Vite; API proxied at `/api`.
- Build: `npm run build`
  - Builds client to `dist/public` (Vite), bundles server to `dist/index.js` (esbuild).
- Production: `npm start`
  - Runs Node on the bundled server; serves static client and `/api`.

## Production Deployment

The application is deployed to `/opt/seedtovoid/` and runs as a systemd service.

### Deployment Process

```bash
# 1. Build the application
npm run build

# 2. Deploy to production
sudo rsync -av dist/ /opt/seedtovoid/dist/

# 3. Restart the service
sudo systemctl restart seedtovoid.service
```

### Hot Deploy (Client Only - No Downtime)

When only client files change (HTML, CSS, JS), deploy without restarting:

```bash
# Build only
npm run build

# Deploy only static files
sudo rsync -av dist/public/ /opt/seedtovoid/dist/public/

# No restart needed - Express serves updated files immediately
```

### Service Management

```bash
# Check status
systemctl status seedtovoid.service

# View logs
journalctl -u seedtovoid -n 100 -f

# Restart service
sudo systemctl restart seedtovoid.service
```

### Environment Configuration

Located at `/etc/seedtovoid.env`:
```env
NODE_ENV=production
PORT=4006
NODE_PATH=/opt/seedtovoid/node_modules
```

### Data Persistence

- **High Scores**: Stored in `/opt/seedtovoid/data/high-scores.json`
- **Backup**: `sudo cp /opt/seedtovoid/data/high-scores.json ~/backup-scores-$(date +%F).json`
- **Restore**: `sudo cp ~/backup-scores-YYYY-MM-DD.json /opt/seedtovoid/data/high-scores.json`


## Configuration & Tuning

- Difficulty presets: `DIFFICULTY_SETTINGS` in `useGameOfLife.tsx` control spawn rate multipliers, max threats, and escalation rate per mode.
- Pattern cooldowns: defined in the store (and mirrored in UI helpers). Adjust per pattern and the speed scaling rule as needed.
- Grid sizing: see `Grid2D.calculateOptimalGridSize()` for min/max grid dimensions and target cell sizes.
- Mobile layout: most rules live in `client/src/index.css` under mobile media queries. The canvas reserves bottom padding so HUD/dock never overlap the interactive grid.


## Keyboard & Touch

- Keyboard: `Space` toggles Play/Pause, `R` resets; `H` reopens onboarding.
- Touch: simple tap to toggle a cell or stamp the selected pattern. Hit targets are widened; `touchAction: 'manipulation'` avoids scroll interference.


## Analytics

The application includes Google Analytics (G-740WZ4LG3W) for tracking:
- Page views and user sessions
- Gameplay interactions and events
- Traffic sources and user behavior

The tracking code is loaded in `client/index.html` and automatically tracks page views. No additional configuration required.

## Notes & Extensibility

- Replace mode is wired in the store; surfacing it in UI is straightforward (toggle chip in Controls).
- Resources/unlocks scaffolding exists in the store and logs; it's disabled in onboarding and not exposed in UI.
- Cooldown/Level reset behavior:
  - Cooldowns freeze when paused; resume honors the remaining time.
  - Level resets to 0 on defeat and on reset/try‑again. Escalation resumes once playing.


## Folder Structure

- `client/` – React app (Vite). Key paths:
  - `src/components/` – UI: grid, controls, modals, mobile overlays
  - `src/lib/stores/useGameOfLife.tsx` – game state and logic
  - `src/lib/patterns.ts` – classic Life patterns
  - `src/index.css` – design system and responsive styles
- `server/` – Express API + Vite middleware (dev) or static (prod)
- `shared/` – DB schema and zod validator for high scores
- `dist/` – build output (client in `public/`, server bundle in root)


## License

MIT

