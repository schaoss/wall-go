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
    // Check how many players border this region
    const borderingPlayers = Object.keys(bc).filter((p) => bc[p as Player] > 0)
    if (borderingPlayers.length === 1) {
      const owner = borderingPlayers[0] as Player
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
