import { BOARD_SIZE, type Player, type Cell, type Pos } from '../lib/types'

export interface GameResult {
  finished: boolean
  winner?: Player
  tie?: boolean
  score?: Record<Player, number>
}

export function checkGameEnd(board: Cell[][], players: Player[]): GameResult {
  const visited = Array.from({ length: BOARD_SIZE },
    () => Array<boolean>(BOARD_SIZE).fill(false))

  const totals: Record<Player, number> = Object.fromEntries(
    players.map(p => [p, 0])
  ) as Record<Player, number>

  const remainingStones = new Set<string>()

  // collect all stones first
  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell.stone) remainingStones.add(`${x},${y}`)
    })
  )

  const dirs: [number, number, string][] = [
    [1, 0, 'left' as const],
    [-1, 0, 'left' as const],
    [0, 1, 'top' as const],
    [0, -1, 'top' as const],
  ]

  function bfs(x0: number, y0: number) {
    const q: Pos[] = [{ x: x0, y: y0 }]
    const cells: Pos[] = []
    const playersInArea = new Set<Player>()

    visited[y0][x0] = true

    while (q.length) {
      const { x, y } = q.shift()!
      cells.push({ x, y })

      const cell = board[y][x]
      if (cell.stone) playersInArea.add(cell.stone)

      dirs.forEach(([dx, dy, dir]) => {
        const nx = x + dx
        const ny = y + dy

        // 遇到棋盤邊界 —— 外框本身視為牆，故不產生開口
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) {
          return
        }

        // 牆阻擋
        const blocked =
          dir === 'left'
            ? dx === 1
              ? board[y][x + 1].wallLeft
              : cell.wallLeft
            : dy === 1
            ? board[ny][nx].wallTop
            : cell.wallTop
        if (blocked) return

        if (!visited[ny][nx]) {
          visited[ny][nx] = true
          q.push({ x: nx, y: ny })
        }
      })
    }

    return { cells, playersInArea }
  }

  // 掃全圖
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (visited[y][x]) continue
      const { cells, playersInArea } = bfs(x, y)

      if (playersInArea.size === 1) {
        // 純淨領土
        const owner = playersInArea.values().next().value as Player
        totals[owner] += cells.length

        // 從 remainingStones 中扣掉棋子
        cells.forEach(p => remainingStones.delete(`${p.x},${p.y}`))
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
