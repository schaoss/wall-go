import type { Player, Pos, Cell } from '../lib/types';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface TerritoryMap {
  readonly [key:string]: Player | null;
}

const PLAYER_LIST: readonly Player[] = ['R', 'B'] as const;

/**
 * Checks if there is a wall between a cell and its neighbor in a given direction.
 * The board edge is NOT considered a wall here; this only checks for placed wall pieces.
 */
function hasWall(board: readonly (readonly Cell[])[], size: number, x: number, y: number, dx: number, dy: number): boolean {
    if (dx === 1) { // Moving right to (x+1, y)
        return x + 1 < size && board[y][x + 1].wallLeft !== null;
    }
    if (dx === -1) { // Moving left to (x-1, y)
        return board[y][x].wallLeft !== null;
    }
    if (dy === 1) { // Moving down to (x, y+1)
        return y + 1 < size && board[y + 1][x].wallTop !== null;
    }
    if (dy === -1) { // Moving up to (x, y-1)
        return board[y][x].wallTop !== null;
    }
    return false;
}

/**
 * Flood-fill to find a region of contiguous cells not separated by walls.
 * The board edges are treated as natural boundaries.
 */
function findRegion(
  board: readonly (readonly Cell[])[],
  start: Position,
  size: number,
  visited: boolean[][],
): { regionCells: Position[]; owner: Player | null } {
  if (visited[start.y][start.x]) {
    return { regionCells: [], owner: null };
  }

  const queue: Position[] = [start];
  const regionCells: Position[] = [];
  const stonesInRegion = new Set<Player>();

  // Mark the starting cell as visited for this region's traversal.
  visited[start.y][start.x] = true;

  let head = 0;
  while(head < queue.length) {
    const { x, y } = queue[head++];
    regionCells.push({ x, y });

    const cellStone = board[y][x].stone;
    if (cellStone) {
      stonesInRegion.add(cellStone);
    }

    const directions = [
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // Check if the neighbor is off the board.
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) {
        continue; // Board edge acts as a boundary.
      }

      // Check if there is a wall piece blocking the way.
      if (hasWall(board, size, x, y, dx, dy)) {
        continue;
      }

      // If the neighbor is on the board, not walled off, and not visited yet, add to queue.
      if (!visited[ny][nx]) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  const owners = Array.from(stonesInRegion);
  if (owners.length === 1) {
    // If exactly one player has stones in this region, they own it.
    return { regionCells, owner: owners[0] };
  }

  // Otherwise, the region is neutral.
  return { regionCells, owner: null };
}


/**
 * Update territory map based on current board state.
 */
export function updateTerritoryMap(
  boardState: readonly (readonly Cell[])[],
  size: number,
): readonly (readonly (Player | null)[])[] {
  const newTerritoryMap: (Player | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  const visited: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // If we haven't processed this cell yet, find its entire region.
      if (!visited[y][x]) {
        const { regionCells, owner } = findRegion(
          boardState,
          { x, y },
          size,
          visited,
        );

        // If the region has a single owner, mark all its cells on the map.
        if (owner) {
          regionCells.forEach((cell) => {
            newTerritoryMap[cell.y][cell.x] = owner;
          });
        }
      }
    }
  }

  return newTerritoryMap;
}


/**
 * Check if a position is in pure territory (owned by another player).
 */
export function isInPureTerritory(
  pos: Pos,
  territoryMap: readonly (readonly (Player | null)[])[],
  player: Player,
): boolean {
  const owner = territoryMap[pos.y]?.[pos.x] ?? null;
  return owner !== null && owner !== player;
}

/**
 * Count territory for each player
 */
export function countTerritory(
  territoryMap: readonly (readonly (Player | null)[])[],
): Readonly<Record<Player, number>> {
  const counts: Record<Player, number> = PLAYER_LIST.reduce(
    (acc, player) => ({ ...acc, [player]: 0 }),
    {} as Record<Player, number>,
  );

  territoryMap.forEach((row) => {
    row.forEach((owner) => {
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
  newTerritoryMap: readonly (readonly (Player | null)[])[],
): boolean {
  if (!previousTerritoryMap || previousTerritoryMap.length !== newTerritoryMap.length) return true;

  for (let y = 0; y < previousTerritoryMap.length; y++) {
    if (previousTerritoryMap[y].length !== newTerritoryMap.length) return true;

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
export function getTerritoryMap(
  boardState: readonly (readonly Cell[])[],
): readonly (readonly (Player | null)[])[] {
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
  const captured = hasTerritoryChanged(previousTerritoryMap ?? [], newTerritoryMap);

  return {
    captured,
    territoryMap: newTerritoryMap,
  };
}
