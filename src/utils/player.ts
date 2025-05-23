// src/utils/player.ts
import type { Cell, Player, Pos } from '../lib/types'
import { BOARD_SIZE } from '../lib/types'
import { isLegalMove } from './isLegalMove'

export function playerHasMove(board: Cell[][], player: Player): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = board[y][x]
      if (cell.stone !== player) continue
      const from: Pos = { x, y }
      for (let yy = 0; yy < BOARD_SIZE; yy++) {
        for (let xx = 0; xx < BOARD_SIZE; xx++) {
          if (xx === x && yy === y) continue
          if (isLegalMove(from, { x: xx, y: yy }, board)) return true
        }
      }
      const canBuild =
        (y > 0 && cell.wallTop === null) ||
        (x > 0 && cell.wallLeft === null) ||
        (x < BOARD_SIZE - 1 && board[y][x + 1].wallLeft === null) ||
        (y < BOARD_SIZE - 1 && board[y + 1][x].wallTop === null)
      if (canBuild) return true
    }
  }
  return false
}
