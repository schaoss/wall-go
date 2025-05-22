import { type Player, type Cell } from '../lib/types'
import { getTerritoryMap } from './territory'

export interface GameResult {
  finished: boolean
  winner?: Player
  tie?: boolean
  score?: Record<Player, number>
}

export function checkGameEnd(board: Cell[][], players: Player[]): GameResult {
  const territory = getTerritoryMap(board)
  const totals: Record<Player, number> = Object.fromEntries(
    players.map(p => [p, 0])
  ) as Record<Player, number>
  const remainingStones = new Set<string>()
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.stone) remainingStones.add(`${x},${y}`)
    })
  )
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      const owner = territory[y][x]
      if (owner) {
        totals[owner]++
        // 從 remainingStones 中扣掉棋子
        remainingStones.delete(`${x},${y}`)
      }
    }
  }
  // 條件 A：所有棋子都在純淨區
  if (remainingStones.size === 0) {
    // 判勝負
    const [p1, p2] = players
    if (totals[p1] > totals[p2]) return { finished: true, winner: p1, score: totals }
    if (totals[p2] > totals[p1]) return { finished: true, winner: p2, score: totals }
    return { finished: true, tie: true, score: totals }
  }
  // 條件 B：無合法動作（簡易版可省略）
  // ...
  return { finished: false, score: totals }
}
