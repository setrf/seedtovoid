import { useRef, useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import { useGameOfLife } from "../lib/stores/useGameOfLife";

export function Grid2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    grid, toggleCell, threatCells, setDynamicGridSize,
    pendingPattern, stampPatternAt, cancelPatternSelection,
  } = useGameOfLife();
  
  // Auto-sizing state
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [gridDimensions, setGridDimensions] = useState({ width: 50, height: 50 });
  const [cellSize, setCellSize] = useState(8);
  
  // Grid line width
  const GRID_LINE_WIDTH = 1;

  // Colors from CSS variables - minimal industrial mono palette
  const COLORS = {
    background: '#000000',
    gridLines: '#333333',
    deadCell: '#111111',
    liveCell: '#00ff00', // Accent color for live cells
    threatCell: '#ff3333', // Red color for threat cells
    cellBorder: '#222222',
    ghostPattern: 'rgba(0, 255, 0, 0.6)', // Semi-transparent green for ghost preview
    ghostInvalid: 'rgba(255, 51, 51, 0.6)' // Semi-transparent red for invalid placement
  };

  // Pattern placement state
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [hoveredGridPos, setHoveredGridPos] = useState<{x: number, y: number} | null>(null);
  const [ghostPulse, setGhostPulse] = useState(0);

  // Enhanced auto-sizing logic with viewport awareness
  const calculateOptimalGridSize = useCallback((containerWidth: number, containerHeight: number) => {
    // Calculate safe margins based on viewport and device
    const isDesktop = containerWidth >= 1024;
    const safeMarginX = 24; // Reduced margins for better space utilization
    const safeMarginY = 24;
    
    // Account for UI chrome and ensure content fits comfortably
    const availableWidth = Math.max(200, containerWidth - (safeMarginX * 2));
    const availableHeight = Math.max(200, containerHeight - (safeMarginY * 2));
    
    // Adaptive cell size based on available space and device capabilities
    let targetCellSize;
    if (Math.min(availableWidth, availableHeight) > 500) {
      targetCellSize = 14; // Larger cells for comfortable touch
    } else if (Math.min(availableWidth, availableHeight) > 300) {
      targetCellSize = 12;
    } else {
      targetCellSize = 10; // Very small screens
    }
    
    // Calculate maximum possible grid dimensions
    const maxGridWidth = Math.floor((availableWidth - GRID_LINE_WIDTH) / (targetCellSize + GRID_LINE_WIDTH));
    const maxGridHeight = Math.floor((availableHeight - GRID_LINE_WIDTH) / (targetCellSize + GRID_LINE_WIDTH));
    
    // Apply constraints with device-appropriate limits
    const minGridSize = 15;
    const maxGridSize = 120;
    
    const constrainedGridWidth = Math.max(minGridSize, Math.min(maxGridSize, maxGridWidth));
    const constrainedGridHeight = Math.max(minGridSize, Math.min(maxGridSize, maxGridHeight));
    
    // Recalculate cell size to perfectly fit the available space
    const perfectCellSizeX = (availableWidth - (constrainedGridWidth + 1) * GRID_LINE_WIDTH) / constrainedGridWidth;
    const perfectCellSizeY = (availableHeight - (constrainedGridHeight + 1) * GRID_LINE_WIDTH) / constrainedGridHeight;
    const perfectCellSize = Math.floor(Math.min(perfectCellSizeX, perfectCellSizeY));
    
    // Ensure minimum viable cell size
    const finalCellSize = Math.max(6, perfectCellSize);
    
    console.log(`[Grid2D] Auto-sizing: ${constrainedGridWidth}x${constrainedGridHeight} @ ${finalCellSize}px (container: ${containerWidth}x${containerHeight})`);
    
    return {
      gridWidth: constrainedGridWidth,
      gridHeight: constrainedGridHeight,
      cellSize: finalCellSize
    };
  }, []);

  // Enhanced container size observer with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Throttle resize calculations to avoid excessive recalculations
    let resizeTimeout: NodeJS.Timeout | null = null;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Only process if dimensions have meaningfully changed
        const widthDiff = Math.abs(width - containerSize.width);
        const heightDiff = Math.abs(height - containerSize.height);
        
        if (widthDiff < 5 && heightDiff < 5) {
          continue; // Skip minor changes to prevent jitter
        }
        
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
          console.log(`[Grid2D] Container resize detected: ${width}x${height}`);
          setContainerSize({ width, height });
          
          const optimal = calculateOptimalGridSize(width, height);
          
          // Only update if grid dimensions actually changed
          if (optimal.gridWidth !== gridDimensions.width || 
              optimal.gridHeight !== gridDimensions.height || 
              optimal.cellSize !== cellSize) {
            
            setGridDimensions({ width: optimal.gridWidth, height: optimal.gridHeight });
            setCellSize(optimal.cellSize);
            
            // Update the game store with new grid dimensions
            if (setDynamicGridSize) {
              setDynamicGridSize(optimal.gridWidth, optimal.gridHeight);
            }
          }
        }, 100); // Throttle to 100ms
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [calculateOptimalGridSize, setDynamicGridSize, containerSize, gridDimensions, cellSize]);

  // Calculate canvas dimensions based on current grid size
  const CANVAS_WIDTH = gridDimensions.width * cellSize + (gridDimensions.width + 1) * GRID_LINE_WIDTH;
  const CANVAS_HEIGHT = gridDimensions.height * cellSize + (gridDimensions.height + 1) * GRID_LINE_WIDTH;

  // Keyboard handler for canceling pattern selection
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pendingPattern) {
        console.log('[Pattern Stamping] Cancelled via Escape key');
        cancelPatternSelection();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pendingPattern, cancelPatternSelection]);

  // Helper function to check if pattern placement is valid
  const isValidPlacement = useCallback((gridX: number, gridY: number, pattern: number[][]) => {
    if (!pattern || pattern.length === 0) return false;

    // Check if pattern fits within grid bounds
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        const finalX = gridX + px;
        const finalY = gridY + py;

        if (finalX >= gridDimensions.width || finalY >= gridDimensions.height) {
          return false; // Pattern extends beyond grid
        }
      }
    }
    return true;
  }, [gridDimensions]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cells
    for (let x = 0; x < gridDimensions.width; x++) {
      for (let y = 0; y < gridDimensions.height; y++) {
        // Check if this cell exists in the current grid data
        const isAlive = grid[x] && grid[x][y] === 1;
        const isThreat = threatCells.has(`${x},${y}`);
        
        const cellX = x * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
        const cellY = y * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
        
        // Fill cell with appropriate color
        let cellColor = COLORS.deadCell;
        if (isAlive) {
          cellColor = isThreat ? COLORS.threatCell : COLORS.liveCell;
        }
        
        ctx.fillStyle = cellColor;
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        
        // Draw cell border for better visibility (show borders when cells are reasonably sized)
        if (cellSize >= 6) {
          ctx.strokeStyle = COLORS.cellBorder;
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }

    // Draw grid lines when cells are large enough
    if (cellSize >= 8) {
      ctx.strokeStyle = COLORS.gridLines;
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= gridDimensions.width; x++) {
        const lineX = x * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH / 2;
        ctx.beginPath();
        ctx.moveTo(lineX, 0);
        ctx.lineTo(lineX, CANVAS_HEIGHT);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= gridDimensions.height; y++) {
        const lineY = y * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH / 2;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(CANVAS_WIDTH, lineY);
        ctx.stroke();
      }
    }

    // Draw ghost pattern preview if pattern is pending and cursor is hovering
    if (pendingPattern && hoveredGridPos) {
      const isValid = isValidPlacement(hoveredGridPos.x, hoveredGridPos.y, pendingPattern);

      const baseOpacity = isValid ? 0.6 : 0.6;
      const pulseOpacity = baseOpacity + (ghostPulse * 0.2);
      const ghostColor = isValid
        ? `rgba(0, 255, 0, ${pulseOpacity})`
        : `rgba(255, 51, 51, ${pulseOpacity})`;

      ctx.fillStyle = ghostColor;
      
      for (let py = 0; py < pendingPattern.length; py++) {
        for (let px = 0; px < pendingPattern[py].length; px++) {
          if (pendingPattern[py][px] === 1) {
            const gridX = hoveredGridPos.x + px;
            const gridY = hoveredGridPos.y + py;
            
            // Only draw ghost cells that are within bounds
            if (gridX >= 0 && gridX < gridDimensions.width && gridY >= 0 && gridY < gridDimensions.height) {
              const cellX = gridX * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
              const cellY = gridY * (cellSize + GRID_LINE_WIDTH) + GRID_LINE_WIDTH;
              
              ctx.fillRect(cellX, cellY, cellSize, cellSize);
              
              // Add border to ghost cells
              if (cellSize >= 6) {
                ctx.strokeStyle = isValid ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 51, 51, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(cellX, cellY, cellSize, cellSize);
              }
            }
          }
        }
      }
    }
  }, [grid, gridDimensions, cellSize, CANVAS_WIDTH, CANVAS_HEIGHT, threatCells, pendingPattern, hoveredGridPos, isValidPlacement, ghostPulse]);

  // Handle canvas clicks for cell toggling
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
    
    // Adjust for leading gridline padding
    const adjustedX = canvasX - GRID_LINE_WIDTH;
    const adjustedY = canvasY - GRID_LINE_WIDTH;
    if (adjustedX < 0 || adjustedY < 0) return;
    // Calculate grid coordinates (simplified without zoom/pan transforms)
    const gridX = Math.floor(adjustedX / (cellSize + GRID_LINE_WIDTH));
    const gridY = Math.floor(adjustedY / (cellSize + GRID_LINE_WIDTH));
    
    // Validate coordinates and handle cell placement or pattern stamping
    if (gridX >= 0 && gridX < gridDimensions.width && gridY >= 0 && gridY < gridDimensions.height) {
      // Check if we're stamping a pattern
      if (pendingPattern) {
        const success = stampPatternAt(gridX, gridY);
        if (success) {
          console.log(`[Pattern Stamping] Successfully stamped pattern at (${gridX}, ${gridY})`);
        } else {
          toast.error('Cannot place pattern here - insufficient space or invalid position');
        }
        return; // Don't do regular cell placement when stamping patterns
      }
      
      // Regular cell placement logic
      toggleCell(gridX, gridY);
    }
  }, [toggleCell, gridDimensions, cellSize, pendingPattern, stampPatternAt]);

  // Handle mouse move for hover tracking and ghost preview
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pendingPattern) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    // Adjust for leading gridline padding
    const adjustedX = canvasX - GRID_LINE_WIDTH;
    const adjustedY = canvasY - GRID_LINE_WIDTH;
    if (adjustedX < 0 || adjustedY < 0) {
      if (hoveredGridPos) setHoveredGridPos(null);
      return;
    }
    // Calculate grid coordinates
    const gridX = Math.floor(adjustedX / (cellSize + GRID_LINE_WIDTH));
    const gridY = Math.floor(adjustedY / (cellSize + GRID_LINE_WIDTH));

    // Update hovered position if it's different
    if (gridX >= 0 && gridX < gridDimensions.width && gridY >= 0 && gridY < gridDimensions.height) {
      if (!hoveredGridPos || hoveredGridPos.x !== gridX || hoveredGridPos.y !== gridY) {
        setHoveredGridPos({ x: gridX, y: gridY });
      }
    } else {
      // Mouse is outside grid bounds
      if (hoveredGridPos) {
        setHoveredGridPos(null);
      }
    }
  }, [pendingPattern, gridDimensions, cellSize, hoveredGridPos]);

  // Handle mouse leave to clear hover state
  const handleMouseLeave = useCallback(() => {
    if (hoveredGridPos) {
      setHoveredGridPos(null);
    }
  }, [hoveredGridPos]);

  // Simple touch handler for mobile - just handle clicks
  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    // Convert touch to mouse-like click event
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const canvasX = (touch.clientX - rect.left) * scaleX;
      const canvasY = (touch.clientY - rect.top) * scaleY;
      
      // Adjust for leading gridline padding
      const adjustedX = canvasX - GRID_LINE_WIDTH;
      const adjustedY = canvasY - GRID_LINE_WIDTH;
      if (adjustedX < 0 || adjustedY < 0) return;
      // Calculate grid coordinates
      const gridX = Math.floor(adjustedX / (cellSize + GRID_LINE_WIDTH));
      const gridY = Math.floor(adjustedY / (cellSize + GRID_LINE_WIDTH));
      
      // Validate coordinates and handle cell placement or pattern stamping
      if (gridX >= 0 && gridX < gridDimensions.width && gridY >= 0 && gridY < gridDimensions.height) {
        // Check if we're stamping a pattern
        if (pendingPattern) {
          const success = stampPatternAt(gridX, gridY);
          if (success) {
            console.log(`[Pattern Stamping] Successfully stamped pattern at (${gridX}, ${gridY}) via touch`);
          } else {
            toast.error('Cannot place pattern here - insufficient space or invalid position');
          }
          return; // Don't do regular cell placement when stamping patterns
        }
        
        // Regular cell placement logic
        toggleCell(gridX, gridY);
      }
    }
  }, [toggleCell, gridDimensions, cellSize, pendingPattern, stampPatternAt]);

  // Pulse animation for ghost preview
  useEffect(() => {
    if (pendingPattern && hoveredGridPos) {
      const interval = setInterval(() => {
        setGhostPulse(prev => (prev + 0.1) % 1);
      }, 50);
      return () => clearInterval(interval);
    } else {
      setGhostPulse(0);
    }
  }, [pendingPattern, hoveredGridPos]);

  // Redraw grid when it changes
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // Initial draw
  useEffect(() => {
    drawGrid();
  }, []);

  return (
    <div className="canvas-container-2d" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: pendingPattern ? 'crosshair' : 'pointer',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          touchAction: 'manipulation',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Enhanced grid info display */}
      <div 
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'var(--color-text-secondary)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div>{gridDimensions.width}×{gridDimensions.height}</div>
        <div style={{ opacity: 0.7 }}>{cellSize}px</div>
      </div>
    </div>
  );
}