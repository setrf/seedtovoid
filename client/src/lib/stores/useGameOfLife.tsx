import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { computeNextGeneration } from "../gameLogic";
import { patterns } from "../patterns";
import { useAudio } from "./useAudio";
import { apiRequest } from "../queryClient";

// Grid size options
export const GRID_SIZES = {
  small: { width: 25, height: 25, name: "25×25" },
  medium: { width: 50, height: 50, name: "50×50" },
  large: { width: 100, height: 100, name: "100×100" }
} as const;

export type GridSizeKey = keyof typeof GRID_SIZES;
export type DifficultyMode = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_SETTINGS = {
  easy: {
    spawnRateMultiplier: 10.0,
    maxSimultaneousThreats: 50,
    escalationRate: 0.08,
  },
  normal: {
    spawnRateMultiplier: 20.0,
    maxSimultaneousThreats: 100,
    escalationRate: 0.12,
  },
  hard: {
    spawnRateMultiplier: 30.0,
    maxSimultaneousThreats: 150,
    escalationRate: 0.20,
  }
};

export const DEFAULT_GRID_SIZE: GridSizeKey = 'medium';
export const GRID_WIDTH = GRID_SIZES[DEFAULT_GRID_SIZE].width;
export const GRID_HEIGHT = GRID_SIZES[DEFAULT_GRID_SIZE].height;

type Grid = number[][];

// Survival mode types
export type GameState = 'playing' | 'paused' | 'game-over' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export interface Threat {
  id: string;
  type: 'glider' | 'lwss' | 'hostile-pattern';
  position: Position;
  direction: Position;
  pattern: number[][];
  strength: number;
  createdAt: number;
}


export interface SurvivalStats {
  score: number;
  timeSurvived: number;
  threatsDefeated: number;
  colonyHealth: number;
  cellsPlaced: number;
  energyUsed: number;
  collisionPoints: number;
  collisionCount: number;
}

export interface HighScore {
  score: number;
  timeSurvived: number;
  threatsDefeated: number;
  cellsPlaced: number;
  date: string;
  timestamp: number;
  username: string;
  difficulty: DifficultyMode;
}

export interface ScoreNotification {
  id: string;
  type: 'survival' | 'threat-eliminated' | 'threat-collision' | 'high-score';
  points: number;
  message: string;
  timestamp: number;
}

interface GameOfLifeState {
  // Existing Conway's Game of Life state
  grid: Grid;
  isRunning: boolean;
  generation: number;
  speed: number;
  livingCells: number;
  gridSize: GridSizeKey;
  GRID_WIDTH: number;
  GRID_HEIGHT: number;
  pauseTime: number | null;
  
  // Difficulty Mode
  difficultyMode: DifficultyMode;
  
  // Survival Mode State
  survivalMode: boolean;
  gameState: GameState;
  
  // removed energy system
  
  // Threat Management
  activeThreats: Threat[];
  threatSpawnRate: number;
  threatCells: Set<string>; // Track which cells are threats (using "x,y" string format)
  
  // Enemy Controls
  enemyControls: {
    spawnRateMultiplier: number; // Multiplier for base spawn rate (0.5x to 3x)
    maxSimultaneousThreats: number; // Max threats that can exist at once (1-10)
    scalingEnabled: boolean; // Whether difficulty scaling over time is enabled
  };
  difficultyLevel?: number; // Current difficulty escalation level
  
  // Scoring System
  survivalStats: SurvivalStats;
  gameStartTime: number;
  
  // High Score System
  highScores: HighScore[];
  currentHighScore: number;
  isNewHighScore: boolean;
  username: string;
  runId: number;
  
  // Progress Toast Milestones
  progressToastMilestones: {
    time: number;
    score: number;
    generation: number;
  };
  
  // Pattern Cooldowns
  patternCooldowns: { [key: string]: number };
  
  progression: {
    resources: number;
    unlockedPatterns: Set<string>;
  };
  
  // Score Notifications
  scoreNotifications: ScoreNotification[];
  
  // Pattern Stamping System
  pendingPattern: { key: string; pattern: number[][] } | null;
  placementMode: 'stamp' | 'replace';
  cursorPosition: Position | null;
  
  // Actions - Existing
  start: () => void;
  stop: () => void;
  reset: () => void;
  clear: () => void;
  step: () => void;
  toggleCell: (x: number, y: number) => void;
  setSpeed: (speed: number) => void;
  setGridSize: (size: GridSizeKey) => void;
  setDynamicGridSize: (width: number, height: number) => void;
  loadPattern: (patternKey: string) => void;
  loadCustomPattern: (pattern: number[][]) => void;
  
  // Actions - Pattern Stamping
  selectPatternForStamping: (patternData: { key: string; pattern: number[][] }) => void;
  cancelPatternSelection: () => void;
  stampPatternAt: (x: number, y: number) => boolean;
  setPlacementMode: (mode: 'stamp' | 'replace') => void;
  setCursorPosition: (position: Position | null) => void;
  
  // Actions - Difficulty
  setDifficultyMode: (mode: DifficultyMode) => void;
  
  // Actions - Survival Mode
  toggleSurvivalMode: () => void;
  initializeSurvivalGame: () => void;
  placeCellWithEnergy: (x: number, y: number) => boolean;
  spawnThreat: (type: Threat['type']) => void;
  updateThreats: () => void;
  destroyThreat: (threatId: string) => void;
  updateSurvivalStats: () => void;
  escalateDifficulty: () => void;
  endGame: (reason: 'defeat') => void;
  pauseGame: () => void;
  resumeGame: () => void;
  // Convenience: start a fresh survival run immediately
  startNewSurvivalRun: () => void;
  setUsername: (username: string) => void;
  
  // Actions - High Score System
  loadHighScores: () => void;
  saveHighScore: (stats: SurvivalStats) => void;
  checkForNewHighScore: (score: number) => boolean;
  
  // Actions - Score Notifications
  addScoreNotification: (type: ScoreNotification['type'], points: number, message?: string) => void;
  removeScoreNotification: (id: string) => void;
  clearScoreNotifications: () => void;
  
  // Actions - Enemy Controls
  updateEnemyControls: (controls: GameOfLifeState['enemyControls']) => void;

  gainResources: (amount: number) => void;
  unlockPattern: (patternKey: string) => boolean; // Returns true if successful
  getPatternUnlockCost: (patternKey: string) => number;
  isPatternUnlocked: (patternKey: string) => boolean;
  // Actions - Cooldowns
  setPatternCooldown: (patternKey: string) => void;
}

// Create empty grid with specific dimensions
const createEmptyGrid = (width: number = GRID_WIDTH, height: number = GRID_HEIGHT): Grid => {
  return Array(width).fill(null).map(() => Array(height).fill(0));
};

// Resize existing grid to new dimensions
const resizeGrid = (oldGrid: Grid, newWidth: number, newHeight: number): Grid => {
  const newGrid = createEmptyGrid(newWidth, newHeight);
  
  // Copy over existing cells that fit in the new dimensions
  for (let x = 0; x < Math.min(oldGrid.length, newWidth); x++) {
    for (let y = 0; y < Math.min(oldGrid[0]?.length || 0, newHeight); y++) {
      if (oldGrid[x] && oldGrid[x][y] !== undefined) {
        newGrid[x][y] = oldGrid[x][y];
      }
    }
  }
  
  return newGrid;
};

// Count living cells
const countLivingCells = (grid: Grid): number => {
  let count = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
      if (grid[x][y] === 1) count++;
    }
  }
  return count;
};

// Count only player-owned living cells (exclude enemy threat cells)
const countPlayerLivingCells = (grid: Grid, threatCells: Set<string>): number => {
  let count = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < (grid[0]?.length || 0); y++) {
      if (grid[x][y] === 1 && !threatCells.has(`${x},${y}`)) {
        count++;
      }
    }
  }
  return count;
};

// Survival mode helper functions
const createDefaultSurvivalStats = (): SurvivalStats => ({
  score: 0,
  timeSurvived: 0,
  threatsDefeated: 0,
  colonyHealth: 100,
  cellsPlaced: 0,
  energyUsed: 0,
  collisionPoints: 0,
  collisionCount: 0
});

const generateThreatId = (): string => {
  return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Recalculate which cells belong to enemy threats by flood-filling from
// each threat's current pattern footprint across connected live cells.
// This ensures evolving enemy structures remain colored as threats.
const recalculateThreatCellsForGrid = (
  grid: Grid,
  threats: Threat[],
  gridWidth: number,
  gridHeight: number,
): Set<string> => {
  const result = new Set<string>();

  for (const threat of threats) {
    const visited = new Set<string>();
    const queue: Array<{ x: number; y: number }> = [];

    // Seed positions from the threat's nominal pattern footprint
    for (let py = 0; py < threat.pattern.length; py++) {
      for (let px = 0; px < threat.pattern[py].length; px++) {
        if (threat.pattern[py][px] !== 1) continue;
        const sx = threat.position.x + px;
        const sy = threat.position.y + py;
        if (
          sx >= 0 && sx < gridWidth &&
          sy >= 0 && sy < gridHeight &&
          grid[sx] && grid[sx][sy] === 1
        ) {
          const key = `${sx},${sy}`;
          if (!visited.has(key)) {
            visited.add(key);
            result.add(key);
            queue.push({ x: sx, y: sy });
          }
        }
      }
    }

    // If no seeds found (pattern may have evolved away), try seeding from
    // the immediate neighborhood around the threat's position.
    if (queue.length === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const sx = threat.position.x + dx;
          const sy = threat.position.y + dy;
          if (
            sx >= 0 && sx < gridWidth &&
            sy >= 0 && sy < gridHeight &&
            grid[sx] && grid[sx][sy] === 1
          ) {
            const key = `${sx},${sy}`;
            if (!visited.has(key)) {
              visited.add(key);
              result.add(key);
              queue.push({ x: sx, y: sy });
            }
          }
        }
      }
    }

    // Flood fill to capture the entire connected enemy structure
    // Use 8-directional adjacency to keep structures contiguous visually
    const neighborOffsets = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y: 0 },                   { x: 1, y: 0 },
      { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
    ];

    // Safety cap to avoid excessive work on very large connected regions
    const MAX_EXPANSION = Math.max(500, Math.floor((gridWidth * gridHeight) / 4));
    let expanded = 0;

    while (queue.length > 0 && expanded < MAX_EXPANSION) {
      const current = queue.shift()!;
      expanded++;

      for (const off of neighborOffsets) {
        const nx = current.x + off.x;
        const ny = current.y + off.y;
        if (
          nx >= 0 && nx < gridWidth &&
          ny >= 0 && ny < gridHeight &&
          grid[nx] && grid[nx][ny] === 1
        ) {
          const nKey = `${nx},${ny}`;
          if (!visited.has(nKey)) {
            visited.add(nKey);
            result.add(nKey);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  return result;
};

// Apply unit conversion: treat 8-connected same-team cells as a unit. If a unit
// touches any opposing unit larger than itself, it converts to the opponent's team.
const applyUnitConversions = (
  grid: Grid,
  seedThreatCells: Set<string>,
  gainResources: (amount: number) => void,
): Set<string> => {
  const width = grid.length;
  const height = grid[0]?.length || 0;

  const isAlive = (x: number, y: number) => grid[x] && grid[x][y] === 1;
  const isRed = (x: number, y: number) => seedThreatCells.has(`${x},${y}`);

  const neighborOffsets = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 },                   { x: 1, y: 0 },
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
  ];

  const visited = new Set<string>();
  const compIdByKey = new Map<string, number>();
  const compSize: number[] = [];
  const compTeam: ('red' | 'green')[] = [];
  const compCells: string[][] = [];
  let nextCompId = 0;

  // Build components
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!isAlive(x, y)) continue;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      const team: 'red' | 'green' = isRed(x, y) ? 'red' : 'green';
      const queue: Array<{ x: number; y: number }> = [{ x, y }];
      visited.add(key);
      const cells: string[] = [key];
      compIdByKey.set(key, nextCompId);

      while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const off of neighborOffsets) {
          const nx = cur.x + off.x;
          const ny = cur.y + off.y;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (!isAlive(nx, ny)) continue;
          const nKey = `${nx},${ny}`;
          if (visited.has(nKey)) continue;
          if ((isRed(nx, ny) ? 'red' : 'green') !== team) continue;
          visited.add(nKey);
          compIdByKey.set(nKey, nextCompId);
          cells.push(nKey);
          queue.push({ x: nx, y: ny });
        }
      }

      compTeam[nextCompId] = team;
      compSize[nextCompId] = cells.length;
      compCells[nextCompId] = cells;
      nextCompId++;
    }
  }

  // Compute largest opposing neighbor size for each component
  const maxOppSize: number[] = Array(nextCompId).fill(0);
  const hasOppNeighbor: boolean[] = Array(nextCompId).fill(false);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!isAlive(x, y)) continue;
      const key = `${x},${y}`;
      const cid = compIdByKey.get(key);
      if (cid === undefined) continue;

      for (const off of neighborOffsets) {
        const nx = x + off.x;
        const ny = y + off.y;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (!isAlive(nx, ny)) continue;
        const nKey = `${nx},${ny}`;
        const nid = compIdByKey.get(nKey);
        if (nid === undefined || nid === cid) continue;
        if (compTeam[nid] === compTeam[cid]) continue;
        hasOppNeighbor[cid] = true;
        if (compSize[nid] > maxOppSize[cid]) {
          maxOppSize[cid] = compSize[nid];
        }
      }
    }
  }

  // Decide conversions based on sizes
  const resultThreatCells = new Set<string>(seedThreatCells);
  for (let cid = 0; cid < nextCompId; cid++) {
    // Only convert if this unit actually touches an opposing unit
    if (!hasOppNeighbor[cid]) continue;
    if (maxOppSize[cid] > compSize[cid]) {
      if (compTeam[cid] === 'green') {
        // Convert green component to red
        for (const cellKey of compCells[cid]) {
          resultThreatCells.add(cellKey);
        }
      } else {
        // Convert red component to green
        for (const cellKey of compCells[cid]) {
          resultThreatCells.delete(cellKey);
        }
        // Award resources for converting an enemy unit
        gainResources(compSize[cid]);
      }
    }
  }

  // Prune any dead cells from the threat set to keep only alive red cells
  for (const key of Array.from(resultThreatCells)) {
    const [sx, sy] = key.split(',').map(Number);
    if (!(grid[sx] && grid[sx][sy] === 1)) {
      resultThreatCells.delete(key);
    }
  }

  return resultThreatCells;
};

const getThreatPatterns = (): Record<Threat['type'], number[][]> => ({
  'glider': [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
  ],
  'lwss': [
    [1, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1]
  ],
  'hostile-pattern': [
    [0, 1, 1, 1],
    [1, 1, 1, 0]
  ]
});

const getRandomThreatDirection = (): Position => {
  const directions = [
    { x: 1, y: 0 },   // Right
    { x: -1, y: 0 },  // Left
    { x: 0, y: 1 },   // Down
    { x: 0, y: -1 },  // Up
    { x: 1, y: 1 },   // Diagonal down-right
    { x: -1, y: -1 }, // Diagonal up-left
    { x: 1, y: -1 },  // Diagonal up-right
    { x: -1, y: 1 }   // Diagonal down-left
  ];
  return directions[Math.floor(Math.random() * directions.length)];
};

// High Score helper functions
const HIGH_SCORES_STORAGE_KEY = 'gol-survival-high-scores';
const MAX_HIGH_SCORES = 10;

const loadHighScoresFromStorage = async (): Promise<HighScore[]> => {
  const res = await apiRequest("GET", "/api/high-scores");
  return res.json();
};

const saveHighScoresToStorage = async (score: HighScore): Promise<void> => {
  await apiRequest("POST", "/api/high-scores", score);
};

// Enemy Controls helper functions
const ENEMY_CONTROLS_STORAGE_KEY = 'conway-enemy-controls';

const loadEnemyControlsFromStorage = (): GameOfLifeState['enemyControls'] => {
  // Return defaults if loading fails
  return {
    spawnRateMultiplier: 20.0,
    maxSimultaneousThreats: 100,
    scalingEnabled: false
  };
};

// Progression System helper functions
const createDefaultProgression = (): GameOfLifeState['progression'] => ({
  resources: 0,
  unlockedPatterns: new Set(['glider', 'block', 'blinker']) // Start with basic patterns
});

const getPatternUnlockCosts = (): Record<string, number> => ({
  // Basic patterns (free) - match exact keys from patterns.ts
  glider: 0,
  block: 0,
  blinker: 0,
  
  // Intermediate patterns
  beacon: 25,
  toad: 30,
  
  // Advanced patterns
  rpentomino: 75, // matches patterns.ts key
  lightweight: 100, // matches patterns.ts key
  
  // Complex patterns
  pulsar: 250,
  gliderGun: 500 // matches patterns.ts key
});

const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getScoreNotificationMessage = (type: ScoreNotification['type'], points: number): string => {
  switch (type) {
    case 'survival':
      return `+${points} Survival Bonus`;
    case 'threat-eliminated':
      return `+${points} Threat Eliminated!`;
    case 'threat-collision':
      return `+${points} Colony Defense`;
    case 'high-score':
      return `NEW HIGH SCORE!`;
    default:
      return `+${points} Points`;
  }
};

export const useGameOfLife = create<GameOfLifeState>()(
  subscribeWithSelector((set, get) => {
    let intervalId: NodeJS.Timeout | null = null;
    let threatSpawnTimerId: NodeJS.Timeout | null = null;

    const stopSimulation = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startThreatSpawning = () => {
      if (threatSpawnTimerId) {
        clearInterval(threatSpawnTimerId);
      }
      
      threatSpawnTimerId = setInterval(() => {
        const state = get();
        if (state.survivalMode && state.gameState === 'playing') {
          // Calculate spawn probability based on difficulty and enemy controls
          const baseSpawnChance = 0.12; // Base 12% chance (reduced from 15%)
          const spawnChance = baseSpawnChance * state.enemyControls.spawnRateMultiplier;
          
          
          // Check if we're at the max threat limit
          if (state.activeThreats.length >= state.enemyControls.maxSimultaneousThreats) {
            console.log(`[Enemy Controls] Threat spawn blocked: ${state.activeThreats.length}/${state.enemyControls.maxSimultaneousThreats} threats active`);
            return;
          }
          
          if (Math.random() < spawnChance) {
            // Choose threat type based on difficulty
            const threatTypes: Threat['type'][] = ['glider', 'lwss', 'hostile-pattern'];
            
            const randomType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
            get().spawnThreat(randomType);
            
            // Audio feedback for threat spawning - use hit sound to indicate danger
            try {
              const { playHit } = useAudio.getState();
              if (!get().isRunning) return; // Don't play if game is paused
              setTimeout(() => playHit(), 100); // Slight delay to avoid audio overlap
            } catch (e) {
              console.log('[Audio] Threat spawn sound failed:', e);
            }
          }
        }
      }, 2500); // Check every 2.5 seconds (slightly more frequent but lower base chance)
    };

    const stopThreatSpawning = () => {
      if (threatSpawnTimerId) {
        clearInterval(threatSpawnTimerId);
        threatSpawnTimerId = null;
      }
    };

    const startSimulation = () => {
      stopSimulation();
      const { speed, survivalMode } = get();
      const delay = Math.max(50, 1000 / speed);
      
      intervalId = setInterval(() => {
        const state = get();
        if (state.isRunning) {
          get().step();
          
          // Update threats in survival mode
          if (state.survivalMode && state.gameState === 'playing') {
            get().updateThreats();
            get().updateSurvivalStats();
          }
        }
      }, delay);
      
      // Start threat spawning if in survival mode
      if (survivalMode && get().gameState === 'playing') {
        startThreatSpawning();
      }
    };

    // Energy regeneration timer
    const startEnergyRegeneration = () => {};
    const stopEnergyRegeneration = () => {};

    return {
      // Existing Conway's Game of Life state
      grid: createEmptyGrid(),
      isRunning: false,
      generation: 0,
      speed: 10,
      livingCells: 0,
      gridSize: DEFAULT_GRID_SIZE,
      GRID_WIDTH: GRID_SIZES[DEFAULT_GRID_SIZE].width,
      GRID_HEIGHT: GRID_SIZES[DEFAULT_GRID_SIZE].height,
      pauseTime: null,
      
      // Difficulty Mode
      difficultyMode: 'normal',
      difficultyLevel: 0,
      
      // Survival Mode State (always-on simplified mode)
      survivalMode: true,
      gameState: 'paused',
      
      // removed energy system
      
      // Threat Management
      activeThreats: [],
      threatSpawnRate: 0.1,
      threatCells: new Set(),
      
      // Enemy Controls
      enemyControls: loadEnemyControlsFromStorage(),
      
      // Scoring System
      survivalStats: createDefaultSurvivalStats(),
      gameStartTime: 0,
      
      // High Score System
      highScores: [], // Initialize as empty, will be loaded from API
      currentHighScore: 0, // Initialize as 0, will be loaded from API
      isNewHighScore: false, // Initialize as false, will be set by API
      username: "Player",
      runId: 0,
      
      // Progress Toast Milestones
      progressToastMilestones: {
        time: 0,
        score: 0,
        generation: 0,
      },
      
      // Pattern Cooldowns
      patternCooldowns: {},
      
      progression: {
        resources: 0,
        unlockedPatterns: new Set(['glider', 'block', 'blinker']) // Start with basic patterns
      },
      
      // Score Notifications
      scoreNotifications: [],
      
      // Pattern Stamping System
      pendingPattern: null,
      placementMode: 'stamp',
      cursorPosition: null,

      start: () => {
        const state = get();
        // When resuming, adjust cooldowns
        if (state.pauseTime) {
            const pauseDuration = Date.now() - state.pauseTime;
            const newCooldowns = { ...state.patternCooldowns };
            for (const key in newCooldowns) {
                if (newCooldowns[key] > state.pauseTime) {
                    newCooldowns[key] += pauseDuration;
                }
            }
            set({ patternCooldowns: newCooldowns });
        }
        
        set({ isRunning: true, pauseTime: null });
        
        if (state.survivalMode) {
          set({ gameState: 'playing' });
          startEnergyRegeneration();
          startThreatSpawning();
          console.log('[Survival Mode] Started with threats and energy systems');
        }
        
        startSimulation();
      },

      stop: () => {
        const state = get();
        const pausedAt = Date.now();
        set({ isRunning: false, pauseTime: pausedAt });
        
        if (state.survivalMode) {
          set({ gameState: 'paused' });
          stopEnergyRegeneration();
        }
        
        stopSimulation();
        stopThreatSpawning();
      },

      reset: () => {
        stopSimulation();
        stopEnergyRegeneration();
        stopThreatSpawning();
        const { gridSize, survivalMode } = get();
        const { width, height } = GRID_SIZES[gridSize];
        
        const baseResetState = {
          grid: createEmptyGrid(width, height),
          isRunning: false,
          generation: 0,
          livingCells: 0,
          speed: 10, // Reset speed to default
          patternCooldowns: {}, // Reset all cooldowns
          difficultyLevel: 0,
        };

        if (survivalMode) {
          set({
            ...baseResetState,
            gameState: 'paused',
            activeThreats: [],
            threatCells: new Set(),
            survivalStats: createDefaultSurvivalStats(),
            gameStartTime: 0,
            isNewHighScore: false,
            scoreNotifications: [],
            // Reset progression to default as well (level/resources/unlocks)
            progression: createDefaultProgression(),
            progressToastMilestones: { time: 0, score: 0, generation: 0 },
          });
        } else {
          set(baseResetState);
        }
      },

      clear: () => {
        const { gridSize, survivalMode } = get();
        const { width, height } = GRID_SIZES[gridSize];
        const newGrid = createEmptyGrid(width, height);
        
        const baseState = {
          grid: newGrid,
          generation: 0,
          livingCells: 0
        };
        
        if (survivalMode) {
          // Clear survival mode artifacts as well
          set({
            ...baseState,
            activeThreats: [],
            threatCells: new Set()
          });
        } else {
          set(baseState);
        }
      },

      step: () => {
        let shouldEnd = false;
        let nextLivingCells = 0;
        set((state) => {
          const newGrid = computeNextGeneration(state.grid);
          // Start with sticky ownership propagation so moving enemy patterns
          // retain their color from the previous generation
          let baselineThreatCells = state.threatCells;
          if (state.survivalMode) {
            const nextThreatCells = new Set<string>();
            const neighborOffsets = [
              { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
              { x: -1, y: 0 },  { x: 0, y: 0 },  { x: 1, y: 0 },
              { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
            ];

            for (const key of Array.from(state.threatCells)) {
              const [sx, sy] = key.split(',').map(Number);
              for (const off of neighborOffsets) {
                const nx = sx + off.x;
                const ny = sy + off.y;
                if (
                  nx >= 0 && nx < state.GRID_WIDTH &&
                  ny >= 0 && ny < state.GRID_HEIGHT &&
                  newGrid[nx] && newGrid[nx][ny] === 1
                ) {
                  nextThreatCells.add(`${nx},${ny}`);
                }
              }
            }
            baselineThreatCells = nextThreatCells;
          }

          // Then apply unit conversion rule based on relative unit sizes
          const updatedThreatCells = state.survivalMode
            ? applyUnitConversions(newGrid, baselineThreatCells, (size) => get().gainResources(size))
            : baselineThreatCells;
          const livingCells = countPlayerLivingCells(newGrid, updatedThreatCells);
          nextLivingCells = livingCells;
          if (state.survivalMode && state.gameState === 'playing' && livingCells === 0) {
            shouldEnd = true;
          }
          
          return {
            grid: newGrid,
            generation: state.generation + 1,
            livingCells,
            threatCells: updatedThreatCells,
          };
        });
        if (shouldEnd) {
          get().endGame('defeat');
        }
      },

      toggleCell: (x: number, y: number) => {
        set((state) => {
          const { GRID_WIDTH, GRID_HEIGHT } = state;
          // Validate bounds against both stored dimensions AND actual grid dimensions
          const actualGridWidth = state.grid.length;
          const actualGridHeight = state.grid[0]?.length || 0;
          
          if (x < 0 || x >= Math.min(GRID_WIDTH, actualGridWidth) || 
              y < 0 || y >= Math.min(GRID_HEIGHT, actualGridHeight)) {
            return state;
          }
          
          // Double-check that the specific grid cell exists before accessing
          if (!state.grid[x] || state.grid[x][y] === undefined) {
            console.warn(`[toggleCell] Grid cell [${x}][${y}] doesn't exist. Grid dimensions: ${actualGridWidth}x${actualGridHeight}, stored: ${GRID_WIDTH}x${GRID_HEIGHT}`);
            return state;
          }
          
          const newGrid = state.grid.map(row => [...row]);
          newGrid[x][y] = newGrid[x][y] === 1 ? 0 : 1;
          const livingCells = countPlayerLivingCells(newGrid, state.threatCells);
          
          return {
            grid: newGrid,
            livingCells
          };
        });
      },

      setGridSize: (size: GridSizeKey) => {
        stopSimulation();
        stopEnergyRegeneration();
        stopThreatSpawning();
        
        const { survivalMode } = get();
        const { width, height } = GRID_SIZES[size];
        
        const baseState = {
          gridSize: size,
          grid: createEmptyGrid(width, height),
          isRunning: false,
          generation: 0,
          livingCells: 0,
          GRID_WIDTH: width,
          GRID_HEIGHT: height
        };
        
        if (survivalMode) {
          set({
            ...baseState,
            activeThreats: [],
            threatCells: new Set(),
            gameState: 'paused'
          });
        } else {
          set(baseState);
        }
      },

      setDynamicGridSize: (width: number, height: number) => {
        set((state) => {
          // Resize the existing grid to preserve any active patterns
          const newGrid = resizeGrid(state.grid, width, height);
          const livingCells = countPlayerLivingCells(newGrid, state.threatCells);
          
          const baseState = {
            grid: newGrid,
            generation: state.generation, // Keep current generation
            livingCells,
            GRID_WIDTH: width,
            GRID_HEIGHT: height
          };
          
          if (state.survivalMode) {
            return {
              ...baseState,
              // Keep existing threats but filter out any outside new boundaries
              activeThreats: state.activeThreats.filter(threat => 
                threat.position.x < width && threat.position.y < height
              ),
              // Rebuild threat cells set for new dimensions
              threatCells: new Set(
                Array.from(state.threatCells).filter(cellKey => {
                  const [x, y] = cellKey.split(',').map(Number);
                  return x < width && y < height;
                })
              )
            };
          } else {
            return baseState;
          }
        });
      },

      setSpeed: (speed: number) => {
        const prevSpeed = get().speed || 1;
        const newSpeed = Math.max(0.1, speed);
        set((state) => {
          const now = state.isRunning ? Date.now() : (state.pauseTime || Date.now());
          const scaledCooldowns: { [key: string]: number } = {};
          for (const [key, until] of Object.entries(state.patternCooldowns)) {
            if (!until || until <= now) {
              scaledCooldowns[key] = until as number;
              continue;
            }
            const remainingMs = (until as number) - now;
            const scale = prevSpeed / newSpeed;
            const newRemaining = Math.max(0, Math.floor(remainingMs * scale));
            scaledCooldowns[key] = now + newRemaining;
          }
          return { speed: newSpeed, patternCooldowns: scaledCooldowns };
        });
        const { isRunning } = get();
        if (isRunning) {
          startSimulation(); // Restart with new speed
        }
      },

      loadPattern: (patternKey: string) => {
        const pattern = patterns[patternKey];
        if (!pattern) return;

        set((state) => {
          const { GRID_WIDTH, GRID_HEIGHT } = state;
          const newGrid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
          const startX = Math.floor((GRID_WIDTH - pattern.pattern[0].length) / 2);
          const startY = Math.floor((GRID_HEIGHT - pattern.pattern.length) / 2);

          for (let y = 0; y < pattern.pattern.length; y++) {
            for (let x = 0; x < pattern.pattern[y].length; x++) {
              const gridX = startX + x;
              const gridY = startY + y;
              if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                newGrid[gridX][gridY] = pattern.pattern[y][x];
              }
            }
          }

          const livingCells = countPlayerLivingCells(newGrid, state.threatCells);
          
          return {
            grid: newGrid,
            generation: 0,
            livingCells
          };
        });
      },

      loadCustomPattern: (customPattern: number[][]) => {
        if (!customPattern || customPattern.length === 0) return;

        set((state) => {
          const { GRID_WIDTH, GRID_HEIGHT } = state;
          const newGrid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
          const startX = Math.floor((GRID_WIDTH - customPattern[0].length) / 2);
          const startY = Math.floor((GRID_HEIGHT - customPattern.length) / 2);

          for (let y = 0; y < customPattern.length; y++) {
            for (let x = 0; x < customPattern[y].length; x++) {
              const gridX = startX + x;
              const gridY = startY + y;
              if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                newGrid[gridX][gridY] = customPattern[y][x];
              }
            }
          }

          const livingCells = countPlayerLivingCells(newGrid, state.threatCells);
          
          return {
            grid: newGrid,
            generation: 0,
            livingCells
          };
        });
      },

      // Pattern Stamping Actions
      selectPatternForStamping: (patternData: { key: string; pattern: number[][] }) => {
        console.log('[Pattern Stamping] Pattern selected for stamping:', patternData.pattern.length + 'x' + (patternData.pattern[0]?.length || 0));
        set({
          pendingPattern: patternData,
          cursorPosition: null
        });
      },

      cancelPatternSelection: () => {
        console.log('[Pattern Stamping] Pattern selection cancelled');
        set({ 
          pendingPattern: null, 
          cursorPosition: null 
        });
      },

      stampPatternAt: (x: number, y: number) => {
        const state = get();
        if (!state.pendingPattern) {
          console.warn('[Pattern Stamping] No pending pattern to stamp');
          return false;
        }
        const patternKey = state.pendingPattern.key;
        // Strict cooldown enforcement at stamp time
        const cooldownUntil = state.patternCooldowns[patternKey];
        const nowTs = state.isRunning ? Date.now() : (state.pauseTime || Date.now());
        if (cooldownUntil && cooldownUntil > nowTs) {
          console.log(`[Pattern Stamping] Cannot stamp ${patternKey}, cooldown ${Math.ceil((cooldownUntil - nowTs) / 1000)}s remaining`);
          return false;
        }

        console.log(`[Pattern Stamping] Stamping pattern at (${x}, ${y}) in ${state.placementMode} mode`);

        set((currentState) => {
          const { GRID_WIDTH, GRID_HEIGHT } = currentState;
          const { pendingPattern, placementMode } = currentState;
          
          if (!pendingPattern) return currentState;

          // Create new grid based on placement mode
          let newGrid: Grid;
          if (placementMode === 'replace') {
            // Replace mode: start with empty grid
            newGrid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
          } else {
            // Stamp mode: start with existing grid
            newGrid = currentState.grid.map(row => [...row]);
          }

          // Stamp the pattern at the specified position
          for (let py = 0; py < pendingPattern.pattern.length; py++) {
            for (let px = 0; px < pendingPattern.pattern[py].length; px++) {
              const gridX = x + px;
              const gridY = y + py;
              
              // Check bounds
              if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                // For actual grid array bounds safety
                if (newGrid[gridX] && newGrid[gridX][gridY] !== undefined) {
                  // In stamp mode, OR with existing cells; in replace mode, just set
                  if (placementMode === 'stamp') {
                    newGrid[gridX][gridY] = newGrid[gridX][gridY] || pendingPattern.pattern[py][px];
                  } else {
                    newGrid[gridX][gridY] = pendingPattern.pattern[py][px];
                  }
                }
              }
            }
          }

          const livingCells = countPlayerLivingCells(newGrid, currentState.threatCells);
          
          return {
            grid: newGrid,
            livingCells,
            generation: placementMode === 'replace' ? 0 : currentState.generation
          };
        });
        
        // Apply cooldown after stamping
        get().setPatternCooldown(patternKey);

        return true;
      },

      setPlacementMode: (mode: 'stamp' | 'replace') => {
        console.log(`[Pattern Stamping] Placement mode changed to: ${mode}`);
        set({ placementMode: mode });
      },

      setCursorPosition: (position: Position | null) => {
        set({ cursorPosition: position });
      },
      
      // Difficulty Actions
      setDifficultyMode: (mode: DifficultyMode) => {
        set({ difficultyMode: mode });
        // When difficulty changes, reset the game to apply new settings
        get().startNewSurvivalRun();
      },

      // Survival Mode Actions
      toggleSurvivalMode: () => {
        const state = get();
        stopSimulation();
        stopEnergyRegeneration();
        stopThreatSpawning();
        const { width, height } = GRID_SIZES[state.gridSize];
        // Always-on survival mode (no normal mode)
        set({
          survivalMode: true,
          gameState: 'paused',
            isRunning: false,
            grid: createEmptyGrid(width, height),
            generation: 0,
            livingCells: 0,
            activeThreats: [],
            threatCells: new Set(),
            survivalStats: createDefaultSurvivalStats(),
            gameStartTime: 0,
          isNewHighScore: false,
          scoreNotifications: [],
          progression: createDefaultProgression(),
          progressToastMilestones: { time: 0, score: 0, generation: 0 },
          difficultyLevel: 0,
        });
      },

      initializeSurvivalGame: () => {
        const { GRID_WIDTH, GRID_HEIGHT, difficultyMode } = get();
        
        // Set initial enemy controls based on difficulty
        const initialEnemyControls = DIFFICULTY_SETTINGS[difficultyMode];
        set({ enemyControls: { ...get().enemyControls, ...initialEnemyControls } });

        // Create initial colony pattern around home base
        set((state) => {
          const newGrid = createEmptyGrid(GRID_WIDTH, GRID_HEIGHT);
          
          const fortressPattern = [
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
          ];
          
          const startX = Math.floor(GRID_WIDTH / 2) - Math.floor(fortressPattern[0].length / 2);
          const startY = Math.floor(GRID_HEIGHT / 2) - Math.floor(fortressPattern.length / 2);
          
          for (let y = 0; y < fortressPattern.length; y++) {
            for (let x = 0; x < fortressPattern[y].length; x++) {
              const gridX = startX + x;
              const gridY = startY + y;
              if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
                newGrid[gridX][gridY] = fortressPattern[y][x];
              }
            }
          }
          
          return {
            grid: newGrid,
            gameState: 'playing',
            gameStartTime: Date.now(),
            generation: 0,
            livingCells: countPlayerLivingCells(newGrid, state.threatCells),
            activeThreats: [],
            survivalStats: state.survivalStats
          };
        });
        
        startEnergyRegeneration();
        startThreatSpawning();
        
        console.log('[Survival Mode] Game initialized with threats and energy systems');
      },

      placeCellWithEnergy: (x: number, y: number) => {
        const state = get();
        
        if (!state.survivalMode || state.gameState !== 'playing') return false;
        
        set((prevState) => {
          const newGrid = prevState.grid.map(row => [...row]);
          const wasAlive = newGrid[x][y] === 1;
          
          // Toggle the cell
          newGrid[x][y] = wasAlive ? 0 : 1;
          
          // consume none
          
          return {
            grid: newGrid,
            livingCells: countPlayerLivingCells(newGrid, prevState.threatCells),
            survivalStats: {
              ...prevState.survivalStats,
              cellsPlaced: wasAlive ? prevState.survivalStats.cellsPlaced : prevState.survivalStats.cellsPlaced + 1,
              energyUsed: prevState.survivalStats.energyUsed + 0
            }
          };
        });
        
        return true;
      },

      spawnThreat: (type: Threat['type']) => {
        const state = get();
        if (!state.survivalMode) return;
        
        const { GRID_WIDTH, GRID_HEIGHT, grid, threatCells } = state;

        // --- New Spawn Logic ---
        // 1. Find all player-owned ("green") cells
        const playerCells: Position[] = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
          for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[x]?.[y] === 1 && !threatCells.has(`${x},${y}`)) {
              playerCells.push({ x, y });
            }
          }
        }

        // 2. Find all valid spawn locations near player cells
        const potentialSpawns = new Set<string>();
        const spawnRadius = 5; // How close to player cells threats can spawn

        if (playerCells.length > 0) {
          for (const cell of playerCells) {
            for (let dy = -spawnRadius; dy <= spawnRadius; dy++) {
              for (let dx = -spawnRadius; dx <= spawnRadius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = cell.x + dx;
                const ny = cell.y + dy;

                // Check if the location is within bounds and is empty
                if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT && grid[nx]?.[ny] === 0) {
                  potentialSpawns.add(`${nx},${ny}`);
                }
              }
            }
          }
        }

        const validSpawns = Array.from(potentialSpawns);
        // --- End New Spawn Logic ---

        const threatPatterns = getThreatPatterns();
        const pattern = threatPatterns[type];
        
        let spawnPosition: Position;
        let direction: Position;
        
        if (validSpawns.length > 0) {
          // New Behavior: Spawn at a random valid location near a player cell
          const spawnKey = validSpawns[Math.floor(Math.random() * validSpawns.length)];
          const [x, y] = spawnKey.split(',').map(Number);
          spawnPosition = { x, y };
          // Aim towards the center of the grid from the spawn point
          const center = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
          const dx = center.x - spawnPosition.x;
          const dy = center.y - spawnPosition.y;
          const mag = Math.sqrt(dx*dx + dy*dy);
          if (mag > 0) {
            direction = { x: Math.round(dx/mag), y: Math.round(dy/mag) };
          } else {
            direction = getRandomThreatDirection();
          }

        } else {
          // Fallback Behavior: Original logic (spawn from edges)
          console.log("[Threat System] No valid spawn points near player cells. Spawning from edge.");
          const edges = [
            { pos: { x: 0, y: Math.floor(Math.random() * GRID_HEIGHT) }, dir: { x: 1, y: 0 } },
            { pos: { x: GRID_WIDTH - 1, y: Math.floor(Math.random() * GRID_HEIGHT) }, dir: { x: -1, y: 0 } },
            { pos: { x: Math.floor(Math.random() * GRID_WIDTH), y: 0 }, dir: { x: 0, y: 1 } },
            { pos: { x: Math.floor(Math.random() * GRID_WIDTH), y: GRID_HEIGHT - 1 }, dir: { x: 0, y: -1 } }
          ];
          const edge = edges[Math.floor(Math.random() * edges.length)];
          spawnPosition = edge.pos;
          direction = edge.dir;
        }
        
        const newThreat: Threat = {
          id: generateThreatId(),
          type,
          position: spawnPosition,
          direction,
          pattern,
          strength: 1,
          createdAt: Date.now()
        };
        
        set((prevState) => ({
          activeThreats: [...prevState.activeThreats, newThreat]
        }));
        
        // Place initial threat pattern on grid and track threat cells with better visual distinction
        const newGrid = [...state.grid.map(row => [...row])];
        const newThreatCells = new Set(state.threatCells);
        
        for (let py = 0; py < pattern.length; py++) {
          for (let px = 0; px < pattern[py].length; px++) {
            const gridX = spawnPosition.x + px;
            const gridY = spawnPosition.y + py;
            
            if (gridX >= 0 && gridX < GRID_WIDTH &&
                gridY >= 0 && gridY < GRID_HEIGHT &&
                pattern[py][px] === 1) {
              newGrid[gridX][gridY] = 1;
              newThreatCells.add(`${gridX},${gridY}`);
            }
          }
        }
        
        // Enhanced logging for threat mechanics debugging
        console.log(`[Threat Mechanics] Spawned ${type} at (${spawnPosition.x}, ${spawnPosition.y}) with strength ${newThreat.strength}, cells: ${newThreatCells.size}`);
        
        set({ 
          grid: newGrid,
          livingCells: countLivingCells(newGrid),
          threatCells: newThreatCells
        });
        
        console.log(`[Threat System] Spawned ${type} threat at position (${spawnPosition.x}, ${spawnPosition.y})`);
      },

      updateThreats: () => {
        const state = get();
        if (!state.survivalMode || state.gameState !== 'playing') return;
        
        set((prevState) => {
          const updatedThreats: Threat[] = [];
          
          // Update each threat's position based on their movement pattern
          for (const threat of prevState.activeThreats) {
            // For moving patterns like gliders and LWSS, they move according to Conway rules
            // For hostile patterns, we manually update their position
            
            let newPosition: Position;
            
            if (threat.type === 'hostile-pattern') {
              // Hostile patterns move slowly inward (towards center) in simplified mode
              const center = { x: Math.floor(prevState.GRID_WIDTH / 2), y: Math.floor(prevState.GRID_HEIGHT / 2) };
              const dx = center.x - threat.position.x;
              const dy = center.y - threat.position.y;
              const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
              const stepY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
              newPosition = { x: threat.position.x + stepX, y: threat.position.y + stepY };
            } else {
              // Gliders and LWSS move according to their natural Conway patterns
              // They evolve naturally with the grid, so we track their center position
              newPosition = {
                x: threat.position.x + threat.direction.x,
                y: threat.position.y + threat.direction.y
              };
            }
            
            // Check if threat is still within reasonable bounds (with some buffer)
            const buffer = 10;
            if (newPosition.x >= -buffer && newPosition.x < prevState.GRID_WIDTH + buffer &&
                newPosition.y >= -buffer && newPosition.y < prevState.GRID_HEIGHT + buffer) {
              
              const updatedThreat: Threat = {
                ...threat,
                position: newPosition
              };
              
              updatedThreats.push(updatedThreat);
            } else {
              // Threat moved off grid, remove it
              console.log(`[Threat System] Threat ${threat.id} moved off grid and was removed`);
            }
          }
          
          return {
            activeThreats: updatedThreats
          };
        });
        
        // Colony mechanics removed from simplified red vs green mode
      },

      destroyThreat: (threatId: string) => {
        set((state) => ({
          activeThreats: state.activeThreats.filter(threat => threat.id !== threatId),
          survivalStats: {
            ...state.survivalStats,
            threatsDefeated: state.survivalStats.threatsDefeated + 1,
            score: state.survivalStats.score + 100
          }
        }));
        
        // Add score notification for threat elimination
        get().addScoreNotification('threat-eliminated', 100);
        
        // Award experience and resources for threat elimination
        get().gainResources(15); // 15 resources for defeating a threat
        
        // Check if this creates a new high score
        const newScore = get().survivalStats.score;
        get().checkForNewHighScore(newScore);
      },

      updateSurvivalStats: () => {
        const state = get();
        if (!state.survivalMode || state.gameState !== 'playing') return;
        
        const now = Date.now();
        const timeSurvived = Math.floor((now - state.gameStartTime) / 1000);
        
        set((prevState) => ({
          survivalStats: {
            ...prevState.survivalStats,
            timeSurvived,
            score: prevState.survivalStats.score + Math.floor(timeSurvived / 10) // Bonus for survival time
          }
        }));
        
        // Award survival experience (smaller, consistent gains)
        if (timeSurvived > 0 && timeSurvived % 10 === 0) { // Every 10 seconds
        }

        const { survivalStats, generation, progressToastMilestones } = get();

        // Time-based progress toast
        const timeMilestoneInterval = 30; // every 30 seconds
        if (timeSurvived >= progressToastMilestones.time + timeMilestoneInterval) {
          const newTimeMilestone = Math.floor(timeSurvived / timeMilestoneInterval) * timeMilestoneInterval;
          if (newTimeMilestone > progressToastMilestones.time) {
            get().addScoreNotification('survival', 0, `✅ Survived for ${newTimeMilestone} seconds!`);
            set(state => ({ progressToastMilestones: { ...state.progressToastMilestones, time: newTimeMilestone } }));
          }
        }

        // Score-based progress toast
        const scoreMilestoneInterval = 5000;
        if (survivalStats.score >= progressToastMilestones.score + scoreMilestoneInterval) {
          const newScoreMilestone = Math.floor(survivalStats.score / scoreMilestoneInterval) * scoreMilestoneInterval;
          if (newScoreMilestone > progressToastMilestones.score) {
            get().addScoreNotification('survival', 0, `💰 Reached ${newScoreMilestone} points!`);
            set(state => ({ progressToastMilestones: { ...state.progressToastMilestones, score: newScoreMilestone } }));
          }
        }

        // Generation-based progress toast
        const generationMilestoneInterval = 100;
        if (generation >= progressToastMilestones.generation + generationMilestoneInterval) {
           const newGenerationMilestone = Math.floor(generation / generationMilestoneInterval) * generationMilestoneInterval;
           if (newGenerationMilestone > progressToastMilestones.generation) {
            get().addScoreNotification('survival', 0, `🌱 Reached generation ${newGenerationMilestone}!`);
            set(state => ({ progressToastMilestones: { ...state.progressToastMilestones, generation: newGenerationMilestone } }));
           }
        }
        
        // Escalate difficulty periodically
        get().escalateDifficulty();

        // Remove victory auto-end: survival is endless until defeat.
      },

      escalateDifficulty: () => {
        const state = get();
        if (!state.survivalMode || state.gameState !== 'playing') return;

        const now = Date.now();
        const timeSurvived = Math.floor((now - state.gameStartTime) / 1000);

        // Escalate difficulty every 10 seconds (EXTREME ramp up!)
        const escalationInterval = 10;
        const escalationLevel = Math.floor(timeSurvived / escalationInterval);

        // Only escalate if we haven't already reached this level
        if (escalationLevel > 0 && escalationLevel > (state.difficultyLevel || 0)) {
          const difficultySettings = DIFFICULTY_SETTINGS[state.difficultyMode];
          const baseSettings = DIFFICULTY_SETTINGS[state.difficultyMode];

          const newSpawnRate = Math.min(150.0, baseSettings.spawnRateMultiplier * (1 + escalationLevel * difficultySettings.escalationRate));
          const newMaxThreats = Math.min(500, baseSettings.maxSimultaneousThreats + (escalationLevel * 4));

          console.log(`[Difficulty Escalation] Level ${escalationLevel} (${state.difficultyMode}) - Spawn Rate: ${state.enemyControls.spawnRateMultiplier.toFixed(1)}x → ${newSpawnRate.toFixed(1)}x, Max Threats: ${state.enemyControls.maxSimultaneousThreats} → ${newMaxThreats}`);

          set((prevState) => ({
            enemyControls: {
              ...prevState.enemyControls,
              spawnRateMultiplier: newSpawnRate,
              maxSimultaneousThreats: newMaxThreats
            },
            difficultyLevel: escalationLevel
          }));

          // Add notification for difficulty increase
          get().addScoreNotification('high-score', 0, `DIFFICULTY LEVEL ${escalationLevel}!`);
        }
      },

      endGame: (reason: 'defeat') => {
        stopSimulation();
        stopEnergyRegeneration();
        stopThreatSpawning();
        
        console.log(`[Threat System] Game ended: ${reason}`);
        
        try {
          const { playHit } = useAudio.getState();
          setTimeout(() => playHit(), 200);
        } catch (e) {
          console.log('[Audio] Game end sound failed:', e);
        }
        
        set((state) => ({
          gameState: 'game-over',
          isRunning: false,
          difficultyLevel: 0,
        }));
        
        get().updateSurvivalStats();
        
        // Save high score immediately on game over
        const finalStats = get().survivalStats;
        if (finalStats.score > 0) {
          get().saveHighScore(finalStats);
        }
      },

      pauseGame: () => {
        const state = get();
        if (state.survivalMode && state.gameState === 'playing') {
          get().stop();
        }
      },

      resumeGame: () => {
        const state = get();
        if (state.survivalMode && state.gameState === 'paused') {
          get().start();
        }
      },
      
      startNewSurvivalRun: () => {
        // Reset everything and immediately start a fresh survival run
        get().toggleSurvivalMode();
        get().initializeSurvivalGame();
        get().start();
        set((state) => ({ runId: state.runId + 1 }));
      },
      
      setUsername: (username: string) => {
        set({ username: username || "Player" });
      },
      
      // High Score System Actions
      loadHighScores: async () => {
        const difficulty = get().difficultyMode;
        const res = await apiRequest("GET", `/api/high-scores?difficulty=${difficulty}`);
        const scores = await res.json();
        set({
          highScores: scores,
          currentHighScore: scores[0]?.score || 0
        });
      },
      
      saveHighScore: async (stats: SurvivalStats) => {
        const { username, difficultyMode } = get();
        const newScore = {
          score: stats.score,
          timeSurvived: stats.timeSurvived,
          threatsDefeated: stats.threatsDefeated,
          cellsPlaced: stats.cellsPlaced,
          username: username,
          difficulty: difficultyMode,
        };
        
        await apiRequest("POST", "/api/high-scores", newScore);
        
        // After saving, reload the high scores for the current difficulty
        get().loadHighScores();
      },
      
      checkForNewHighScore: (score: number) => {
        const state = get();
        const isNewHighScore = score > state.currentHighScore;
        
        if (isNewHighScore) {
          set({ isNewHighScore: true });
          get().addScoreNotification('high-score', score, `NEW HIGH SCORE: ${score}!`);
        }
        
        return isNewHighScore;
      },
      
      // Score Notification Actions
      addScoreNotification: (type: ScoreNotification['type'], points: number, message?: string) => {
        const notification: ScoreNotification = {
          id: generateNotificationId(),
          type,
          points,
          message: message || getScoreNotificationMessage(type, points),
          timestamp: Date.now()
        };
        
        set((state) => ({
          scoreNotifications: [notification, ...state.scoreNotifications].slice(0, 5) // Keep only latest 5
        }));
        
        // Auto-remove notification after 3 seconds
        setTimeout(() => {
          get().removeScoreNotification(notification.id);
        }, 3000);
      },
      
      removeScoreNotification: (id: string) => {
        set((state) => ({
          scoreNotifications: state.scoreNotifications.filter(n => n.id !== id)
        }));
      },
      
      clearScoreNotifications: () => {
        set({ scoreNotifications: [] });
      },
      
      // Enemy Controls Actions
      updateEnemyControls: (controls: GameOfLifeState['enemyControls']) => {
        // Defensive clamping for safety
        const clampedControls = {
          spawnRateMultiplier: Math.max(0.1, Math.min(40.0, controls.spawnRateMultiplier)),
          maxSimultaneousThreats: Math.max(1, Math.min(200, controls.maxSimultaneousThreats)),
          scalingEnabled: controls.scalingEnabled
        };

        set({ enemyControls: clampedControls });

      },

      gainResources: (amount: number) => {
        const state = get();
        const newProgression = {
          ...state.progression,
          resources: state.progression.resources + amount
        };
        
        set({ progression: newProgression });
        console.log(`[Progression] Gained ${amount} resources, total: ${newProgression.resources}`);
      },

      unlockPattern: (patternKey: string): boolean => {
        const state = get();
        const costs = getPatternUnlockCosts();
        const cost = costs[patternKey];
        
        // Check if player has enough resources
        if (state.progression.resources < cost) {
          console.log(`[Progression] Cannot unlock ${patternKey}: need ${cost} resources, have ${state.progression.resources}`);
          return false;
        }
        
        set((prevState) => ({
          progression: {
            ...prevState.progression,
            resources: prevState.progression.resources - cost,
            unlockedPatterns: new Set([...Array.from(prevState.progression.unlockedPatterns), patternKey])
          }
        }));
        
        console.log(`[Progression] Unlocked pattern: ${patternKey} for ${cost} resources`);
        get().addScoreNotification('high-score', 0, `PATTERN UNLOCKED!`);
        return true;
      },

      getPatternUnlockCost: (patternKey: string): number => {
        const costs = getPatternUnlockCosts();
        return costs[patternKey] || 0;
      },

      isPatternUnlocked: (patternKey: string): boolean => {
        const state = get();
        return state.progression.unlockedPatterns.has(patternKey);
      },

      setPatternCooldown: (patternKey: string) => {
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
        const speed = Math.max(0.1, get().speed || 1);
        // Scale cooldown inversely with speed: higher speed => shorter real-time cooldown
        const speedMultiplier = 1 / speed;
        const scaledMs = Math.floor(baseSeconds * 1000 * speedMultiplier);
        set((state) => ({
          patternCooldowns: {
            ...state.patternCooldowns,
            [patternKey]: (state.isRunning ? Date.now() : (state.pauseTime || Date.now())) + scaledMs,
          },
        }));
      }
    };
  })
);
