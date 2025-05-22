// src/utils/territory.ts
import type { Player, Cell, WallDir, Pos } from '../lib/types'

// 回傳每格領地歸屬（純淨區域才標記，否則為 null）
export function getTerritoryMap(board: Cell[][]): (Player | null)[][] {
  const BOARD_SIZE = board.length
  const visited = Array.from({ length: BOARD_SIZE }, () => Array<boolean>(BOARD_SIZE).fill(false))
  const territory = Array.from({ length: BOARD_SIZE }, () => Array<Player | null>(BOARD_SIZE).fill(null))
  const dirs: [number, number, WallDir][] = [
    [1, 0, 'left'],
    [-1, 0, 'left'],
    [0, 1, 'top'],
    [0, -1, 'top'],
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
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return
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
    // 純淨領地才標記（包含有棋子的格子）
    if (playersInArea.size === 1) {
      const owner = playersInArea.values().next().value as Player
      cells.forEach(({ x, y }) => { territory[y][x] = owner })
    }
  }
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!visited[y][x]) bfs(x, y)
    }
  }
  return territory
}
