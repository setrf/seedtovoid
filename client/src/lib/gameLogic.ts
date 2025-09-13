type Grid = number[][];

// Count living neighbors for a cell
export function countNeighbors(grid: Grid, x: number, y: number): number {
  let count = 0;
  const GRID_WIDTH = grid.length;
  const GRID_HEIGHT = grid[0].length;
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue; // Skip the cell itself
      
      const nx = x + dx;
      const ny = y + dy;
      
      // Check bounds
      if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
        count += grid[nx][ny];
      }
    }
  }
  
  return count;
}

// Compute the next generation according to Conway's rules
export function computeNextGeneration(currentGrid: Grid): Grid {
  const GRID_WIDTH = currentGrid.length;
  const GRID_HEIGHT = currentGrid[0].length;
  const newGrid: Grid = Array(GRID_WIDTH).fill(null).map(() => Array(GRID_HEIGHT).fill(0));
  
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const neighbors = countNeighbors(currentGrid, x, y);
      const isAlive = currentGrid[x][y] === 1;
      
      // Conway's Game of Life rules:
      // 1. Any live cell with 2-3 live neighbors survives
      // 2. Any dead cell with exactly 3 live neighbors becomes alive
      // 3. All other live cells die, all other dead cells stay dead
      
      if (isAlive) {
        newGrid[x][y] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
      } else {
        newGrid[x][y] = (neighbors === 3) ? 1 : 0;
      }
    }
  }
  
  return newGrid;
}
