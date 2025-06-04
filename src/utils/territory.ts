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
    const numPlayers = (bc['R'] > 0 ? 1 : 0) + (bc['B'] > 0 ? 1 : 0)
    if (numPlayers === 1) {
      const owner = bc['R'] > 0 ? 'R' : 'B'
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
