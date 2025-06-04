// src/utils/player.ts
import type { GameSnapshot, Cell, Player, Pos, Stone } from '@/lib/types'
import { BOARD_SIZE } from '@/lib/types'
import { isLegalMove } from './move'

export function getAllPlayerStones(board: Cell[][]): Stone[] {
  const stones: Stone[] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].stone) continue
      stones.push({
        player: board[y][x].stone as Player,
        position: { x, y },
      })
    }
  }
  return stones
}

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

/**
 * 判斷 snapshot 是否為 human 玩家回合
 */
export function isHumanTurn(state: GameSnapshot, humanSide: Player | null) {
  if (humanSide) return state.turn === humanSide
  return true // fallback: always allow
}
