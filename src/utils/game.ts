import { type Player, type Cell } from '@/lib/types'
import { getTerritoryMap } from './territory'
import { type GameResult } from '@/lib/gameResults'

export function checkGameEnd(board: Cell[][], players: Player[]): GameResult {
  const totals = Object.fromEntries(players.map((p) => [p, 0])) as Record<Player, number>
  const territory = getTerritoryMap(board)

  // Calculate territory scores
  territory.forEach((row, _y) => {
    row.forEach((owner, _x) => {
      if (owner) {
        totals[owner]++
      }
    })
  })

  // Check if game is finished: all empty cells are claimed and all stones are placed
  let hasEmptyCells = false
  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.stone === null) hasEmptyCells = true
    })
  })

  // Game is finished when there are no empty cells
  if (!hasEmptyCells) {
    // Determine winner by comparing territory scores
    let maxScore = -1
    let winner: Player | undefined
    let tie = false

    players.forEach((player) => {
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
      score: totals,
    }
  }
  return { finished: false, score: totals }
}
