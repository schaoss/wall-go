// src/utils/territory.ts
import type { GameSnapshot, Player, Cell } from '@/lib/types'
import { floodRegions } from './region'

// 回傳每格領地歸屬（純淨區域才標記，否則為 null）
export function getTerritoryMap(board: Cell[][]): (Player | null)[][] {
  const BOARD_SIZE = board.length
  const territory = Array.from({ length: BOARD_SIZE }, () =>
    Array<Player | null>(BOARD_SIZE).fill(null),
  )
  const regions = floodRegions(board)
  regions.forEach(({ borderingCounts: bc, cells }) => {
    const players = (Object.keys(bc) as Player[]).filter(player => bc[player] > 0)
    console.log(`Region has ${players.length} bordering players: ${players.join(', ')}`);
    if (players.length === 1) {
      const owner = players[0] as Player
      console.log(`Assigning region to player ${owner}`);
      cells.forEach(({ x, y }) => {
        territory[y][x] = owner
      })
    }
  })
  return territory
}

/**
 * Detects if territory has been captured by comparing the current board state with the previous territory map
 * @param gameState Current game state
 * @returns Object containing the new territory map and whether territory was captured
 */
export function detectTerritoryCapture(gameState: GameSnapshot): {
  territoryMap: (Player | null)[][],
  captured: boolean
} {
  const newTerritoryMap = getTerritoryMap(gameState.board);
  const previousTerritoryMap = gameState.territoryMap;
  
  // If there's no previous territory map, just return the new one
  if (!previousTerritoryMap) {
    return { territoryMap: newTerritoryMap, captured: false };
  }
  
  // Check if any territory has changed
  const BOARD_SIZE = gameState.board.length;
  let captured = false;
  
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      // If a cell was not territory before but is now, territory has been captured
      if (previousTerritoryMap[y][x] === null && newTerritoryMap[y][x] !== null) {
        console.log(`Territory captured at ${x},${y}: null -> ${newTerritoryMap[y][x]}`);
        captured = true;
        break;
      }
      // If a cell changed ownership, territory has been captured
      if (previousTerritoryMap[y][x] !== null &&
          newTerritoryMap[y][x] !== null &&
          previousTerritoryMap[y][x] !== newTerritoryMap[y][x]) {
        console.log(`Territory changed ownership at ${x},${y}: ${previousTerritoryMap[y][x]} -> ${newTerritoryMap[y][x]}`);
        captured = true;
        break;
      }
    }
    if (captured) break;
  }
  
  return { territoryMap: newTerritoryMap, captured };
}

/**
 * Checks if a piece is in territory captured by another player
 * @param gameState Current game state
 * @param pos Position to check
 * @param player Player who owns the piece
 * @param territoryMap Optional territory map (will be calculated if not provided)
 * @returns true if the piece is in territory captured by another player
 */
export function isInPureTerritory(
  gameState: GameSnapshot,
  pos: { x: number; y: number },
  player: string,
  territoryMap = gameState.territoryMap || getTerritoryMap(gameState.board),
): boolean {
  // Check if the position is in territory owned by another player
  const owner = territoryMap[pos.y][pos.x];
  const result = owner !== null && owner !== player;
  console.log(`isInPureTerritory: pos=${pos.x},${pos.y}, player=${player}, owner=${owner}, result=${result}`);
  return result;
}
