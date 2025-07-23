import { type Player, type Cell } from '@/lib/types'
import { getTerritoryMap } from './territory'
import { type GameResult } from '@/lib/gameResults'

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
    // Determine winner by comparing all players' scores
    let maxScore = -1
    let winner: Player | undefined
    let tie = false

    players.forEach(player => {
      if (totals[player] > maxScore) {
        maxScore = totals[player]
        winner = player
        tie = false
      } else if (totals[player] === maxScore) {
        tie = true
      }
    })

    return {
      finished: true,
      winner: tie ? undefined : winner,
      tie,
      score: totals
    }
  }
  return { finished: false, score: totals }
}
