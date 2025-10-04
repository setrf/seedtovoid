# Changelog

All notable changes to SeedToVoid (Game of Life - Survival Edition) will be documented in this file.

## [1.1.0] - 2025-10-04

### Added
- **Persistent File Storage**: Implemented `FileStorage` class for JSON-based high score persistence
  - Scores stored in `data/high-scores.json`
  - Auto-creates directory structure on startup
  - Maintains ID sequence across service restarts
  - No database required for basic persistence
  - Preserves high scores through deployments

- **Google Analytics Integration**: Added Google Analytics tracking (G-740WZ4LG3W)
  - Tracks page views and user sessions
  - Monitors gameplay interactions
  - Analyzes traffic sources and user behavior
  - Integrated in `client/index.html`

### Changed
- **Default Storage**: Changed from `MemStorage` (in-memory) to `FileStorage` (persistent JSON)
  - Previous high scores were preserved during migration
  - Production data location: `/opt/seedtovoid/data/high-scores.json`

### Deployment
- **Hot Deploy Support**: Documented zero-downtime deployment for client-only changes
  - Deploy static files without restarting service
  - No interruption to active gameplay or API

### Documentation
- Updated README.md with:
  - Storage options and configuration
  - Production deployment procedures
  - Hot deploy instructions
  - Service management commands
  - Data backup and restore procedures
  - Analytics documentation

## [1.0.0] - 2025-09-13

### Initial Release
- Full-stack Game of Life survival game
- React + Vite + TypeScript frontend
- Express + Node.js backend
- Canvas 2D rendering with adaptive grid
- Mobile and desktop responsive UI
- Difficulty modes: Easy, Normal, Hard
- Pattern-based gameplay with cooldowns
- Threat spawning and escalation system
- Local leaderboards per difficulty
- In-memory high score storage (MemStorage)
