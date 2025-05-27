// src/utils/wall.ts
import type { Cell, WallDir, PlayerAction, Pos } from '../lib/types'

/**
 * Helper method to check if there is a wall between two adjacent positions.
 * @param board - The game board.
 * @param from - The starting position.
 * @param to - The neighboring position.
 * @returns True if there is a wall between from and to, false otherwise.
 */
export function isWallBetween(board: Cell[][], from: Pos, to: Pos): boolean {
  // Positions must be adjacent
  const dx = to.x - from.x
  const dy = to.y - from.y

  if (dx === 1 && dy === 0) {
    // to is right of from
    // Check from's right wall and to's left wall
    // Walls are stored as wallLeft and wallTop, so right wall of from is left wall of to
    // So check to.wallLeft
    return !!board[to.y][to.x].wallLeft
  } else if (dx === -1 && dy === 0) {
    // to is left of from
    // Check from.wallLeft
    return !!board[from.y][from.x].wallLeft
  } else if (dx === 0 && dy === 1) {
    // to is below from
    // Check to.wallTop
    return !!board[to.y][to.x].wallTop
  } else if (dx === 0 && dy === -1) {
    // to is above from
    // Check from.wallTop
    return !!board[from.y][from.x].wallTop
  }

  // Not adjacent
  return true
}
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
