import { type Player, type Cell } from '@/lib/types'
import { getTerritoryMap } from './territory'

export interface GameResult {
  finished: boolean
  winner?: Player
  tie?: boolean
  score?: Record<Player, number>
}

export function checkGameEnd(board: Cell[][], players: Player[]): GameResult {
  const totals = Object.fromEntries(players.map((p) => [p, 0])) as Record<Player, number>

  const remainingStones = new Set<string>()
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.stone) remainingStones.add(`${x},${y}`)
    }),
  )
  if (remainingStones.size === 0) {
    return {
      finished: false,
      score: totals,
    }
  }

  const territory = getTerritoryMap(board)

  // Remove all pure territory cells from remainingStones based on the territory result
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      const owner = territory[y][x]
      if (owner) {
        totals[owner]++
        remainingStones.delete(`${x},${y}`)
      }
    }
  }
  // Condition A: All stones are in pure territory
  if (remainingStones.size === 0) {
    // Determine the winner
    const [p1, p2] = players
    if (totals[p1] > totals[p2]) return { finished: true, winner: p1, score: totals }
    if (totals[p2] > totals[p1]) return { finished: true, winner: p2, score: totals }
    // If scores are tied, explicitly set tie: true
    return { finished: true, tie: true, score: totals }
  }
  return { finished: false, score: totals }
}
