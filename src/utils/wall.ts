// src/utils/wall.ts
import type { Cell, PlayerAction, Pos } from '../lib/types'

export const DIRS: [dx: number, dy: number, wallKey: 'left' | 'top'][] = [
  [1, 0, 'left'], // 往右要看右格的 left 牆
  [-1, 0, 'left'], // 往左看自身 left 牆
  [0, 1, 'top'], // 往下看下格 top 牆
  [0, -1, 'top'], // 往上看自身 top 牆
]
const DIRS_NAME = ['right', 'left', 'bottom', 'top'] as const
/**
 * Helper method to check if there is a wall between two adjacent positions.
 * @param board - The game board.
 * @param from - The starting position.
 * @param to - The neighboring position.
 * @returns True if there is a wall between from and to, false otherwise.
 */
export function isWallBetween(board: Cell[][], from: Pos, to: Pos): boolean {
  const dx = to.x - from.x
  const dy = to.y - from.y

  for (const [dxEntry, dyEntry, wallKey] of DIRS) {
    if (dx === dxEntry && dy === dyEntry) {
      const cellToCheck = dxEntry === 1 || dyEntry === 1 ? board[to.y][to.x] : board[from.y][from.x]
      return cellToCheck[wallKey === 'left' ? 'wallLeft' : 'wallTop'] !== null
    }
  }

  return false
}
/**
 * 產生所有合法建牆行動
 */
export function getLegalWallActions(board: Cell[][], x: number, y: number): PlayerAction[] {
  const actions: PlayerAction[] = []
  const size = board.length

  for (let i = 0; i < DIRS.length; i++) {
    const [dx, dy, wallKey] = DIRS[i]
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue

    const cellToCheck = dx === 1 || dy === 1 ? board[ny][nx] : board[y][x]
    if (!cellToCheck[wallKey === 'left' ? 'wallLeft' : 'wallTop']) {
      const dir = DIRS_NAME[i]
      actions.push({
        type: 'wall',
        from: { x, y },
        pos: { x, y },
        dir,
      })
    }
  }
  return actions
}
