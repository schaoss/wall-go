// src/utils/wall.ts
import type { Cell, WallDir, PlayerAction } from '../lib/types'

/**
 * 產生所有合法建牆行動
 */
export function getLegalWallActions(board: Cell[][], x: number, y: number): PlayerAction[] {
  const actions: PlayerAction[] = []
  const size = board.length
  const dirs: WallDir[] = ['top', 'left', 'right', 'bottom']
  for (const dir of dirs) {
    let canBuild = false
    if (dir === 'top' && y > 0 && !board[y][x].wallTop) canBuild = true
    if (dir === 'left' && x > 0 && !board[y][x].wallLeft) canBuild = true
    if (dir === 'right' && x < size - 1 && !board[y][x + 1].wallLeft) canBuild = true
    if (dir === 'bottom' && y < size - 1 && !board[y + 1][x].wallTop) canBuild = true
    if (canBuild) {
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
