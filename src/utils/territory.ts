import type { Player, Pos, Cell } from '../lib/types';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface TerritoryMap {
  readonly [key: string]: Player | null;
}

export interface Region {
  readonly cells: readonly Position[];
  readonly borderingCounts: Readonly<Record<Player, number>>;
  readonly owner: Player | null;
}

const PLAYER_LIST: readonly Player[] = ['R', 'B'] as const;

/**
 * Convert Cell[][] to Player[][] for territory calculation
 */
function extractPlayerBoard(board: readonly (readonly Cell[])[]): readonly (readonly (Player | null)[])[] {
  return board.map(row => 
    row.map(cell => cell?.stone ?? null)
  );
}

/**
 * Calculate territory ownership based on bordering pieces
 */
export function calculateTerritoryOwnership(
  region: Region
): Player | null {
  const { borderingCounts } = region;
  
  const players = PLAYER_LIST.filter(
    player => borderingCounts[player] > 0
  );
  
  if (players.length === 1) {
    return players[0];
  }
  
  return null;
}

/**
 * Update territory map based on current board state
 */
export function updateTerritoryMap(
  boardState: readonly (readonly Cell[])[],
  size: number
): readonly (readonly (Player | null)[])[] {
  const playerBoard = extractPlayerBoard(boardState);
  const newTerritoryMap: (Player | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  // Initialize bordering counts for each region
  const regions = initializeRegions(playerBoard, size);
  
  // Calculate territory ownership for each region
  regions.forEach(region => {
    const owner = calculateTerritoryOwnership(region);
    region.cells.forEach(({ x, y }) => {
      newTerritoryMap[y][x] = owner;
    });
  });

  return newTerritoryMap;
}

/**
 * Initialize regions based on board state
 */
function initializeRegions(
  boardState: readonly (readonly (Player | null)[])[],
  size: number
): readonly Region[] {
  const regions: Region[] = [];
  const visited: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!visited[y][x] && boardState[y][x] === null) {
        const region = floodFillRegion(boardState, visited, { x, y }, size);
        if (region.cells.length > 0) {
          regions.push(region);
        }
      }
    }
  }

  return regions;
}

/**
 * Flood fill algorithm to find connected empty cells
 */
function floodFillRegion(
  boardState: readonly (readonly (Player | null)[])[],
  visited: boolean[][],
  start: Position,
  size: number
): Region {
  const cells: Position[] = [];
  const queue: Position[] = [start];
  const borderingCounts: Record<Player, number> = PLAYER_LIST.reduce(
    (acc, player) => ({ ...acc, [player]: 0 }),
    {} as Record<Player, number>
  );

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    
    if (x < 0 || x >= size || y < 0 || y >= size) continue;
    if (visited[y][x]) continue;
    
    visited[y][x] = true;
    
    if (boardState[y][x] === null) {
      cells.push({ x, y });
      
      // Check bordering pieces
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      ];
      
      neighbors.forEach(({ x: nx, y: ny }) => {
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const player = boardState[ny][nx];
          if (player !== null) {
            borderingCounts[player] = (borderingCounts[player] || 0) + 1;
          }
        }
      });
      
      // Add neighbors to queue
      queue.push(...neighbors);
    }
  }

  return {
    cells,
    borderingCounts,
    owner: null
  };
}

/**
 * Check if a position is in pure territory (only one player's pieces border it)
 */
export function isInPureTerritory(
  pos: Pos,
  territoryMap: readonly (readonly (Player | null)[])[],
  player: Player
): boolean {
  const owner = territoryMap[pos.y]?.[pos.x] ?? null;
  return owner === player;
}

/**
 * Count territory for each player
 */
export function countTerritory(
  territoryMap: readonly (readonly (Player | null)[])[]
): Readonly<Record<Player, number>> {
  const counts: Record<Player, number> = PLAYER_LIST.reduce(
    (acc, player) => ({ ...acc, [player]: 0 }),
    {} as Record<Player, number>
  );

  territoryMap.forEach(row => {
    row.forEach(owner => {
      if (owner !== null) {
        counts[owner] = (counts[owner] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Check if territory has changed
 */
export function hasTerritoryChanged(
  previousTerritoryMap: readonly (readonly (Player | null)[])[],
  newTerritoryMap: readonly (readonly (Player | null)[])[]
): boolean {
  if (previousTerritoryMap.length !== newTerritoryMap.length) return true;

  for (let y = 0; y < previousTerritoryMap.length; y++) {
    if (previousTerritoryMap[y].length !== newTerritoryMap[y].length) return true;
    
    for (let x = 0; x < previousTerritoryMap[y].length; x++) {
      if (previousTerritoryMap[y][x] !== newTerritoryMap[y][x]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get territory map for the current board state
 */
export function getTerritoryMap(boardState: readonly (readonly Cell[])[]): readonly (readonly (Player | null)[])[] {
  const size = boardState.length;
  return updateTerritoryMap(boardState, size);
}

/**
 * Detect territory capture events
 */
export function detectTerritoryCapture(gameState: {
  readonly board: readonly (readonly Cell[])[];
  readonly territoryMap?: readonly (readonly (Player | null)[])[];
}): {
  readonly captured: boolean;
  readonly territoryMap: readonly (readonly (Player | null)[])[];
} {
  const { board, territoryMap: previousTerritoryMap } = gameState;
  const newTerritoryMap = getTerritoryMap(board);
  const captured = previousTerritoryMap ? hasTerritoryChanged(previousTerritoryMap, newTerritoryMap) : false;
  
  return {
    captured,
    territoryMap: newTerritoryMap
  };
}
