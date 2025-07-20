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

export function isInPureTerritory(
  gameState: GameSnapshot,
  pos: { x: number; y: number },
  player: string,
  territoryMap = getTerritoryMap(gameState.board),
): boolean {
  if (territoryMap[pos.y][pos.x] !== player) return false

  return true
}
