import { BOARD_SIZE, type Pos, type Cell } from '../lib/types'

export function isLegalMove(from: Pos, to: Pos, board: Cell[][], maxSteps = 2) {
  const q: [Pos, number][] = [[from, 0]]
  const seen = new Set<string>([`${from.x},${from.y}`])
  while (q.length) {
    const [{ x, y }, d] = q.shift()!
    if (d > maxSteps) continue
    // can't count staying in place
    if (x === to.x && y === to.y) {
      if (d === 0) {
        // ignore the origin
      } else {
        return true
      }
    }
    if (d === maxSteps) continue
    ;[
      [1, 0, 'left' as const],
      [-1, 0, 'left' as const],
      [0, 1, 'top' as const],
      [0, -1, 'top' as const],
    ].forEach(([dx, dy, dir]) => {
      const nx = x + (dx as number),
        ny = y + (dy as number)
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return
      // 牆判斷
      const blocked =
        dir === 'left'
          ? dx === 1
            ? board[y][x + 1].wallLeft
            : board[y][x].wallLeft
          : dy === 1
          ? board[y + 1][x].wallTop
          : board[y][x].wallTop
      if (blocked) return
      if (board[ny][nx].stone) return
      const key = `${nx},${ny}`
      if (seen.has(key)) return
      seen.add(key)
      q.push([{ x: nx, y: ny }, d + 1])
    })
  }
  return false
}
