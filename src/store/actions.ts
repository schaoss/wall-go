import { isLegalMove } from '../utils/isLegalMove'
import { BOARD_SIZE, type Player, type Pos, type Cell } from '../lib/types'

export function placingTurnIndex(totalPlaced: number, playerCount: number) {
  const round = Math.floor(totalPlaced / playerCount)
  const idx = totalPlaced % playerCount
  return round % 2 === 0 ? idx : playerCount - 1 - idx
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

export function advanceTurn(board: Cell[][], current: Player, PLAYERS: Player[]) {
  let idx = PLAYERS.indexOf(current)
  for (let i = 0; i < PLAYERS.length; i++) {
    idx = (idx + 1) % PLAYERS.length
    const p = PLAYERS[idx]
    if (playerHasMove(board, p)) {
      return { turn: p }
    }
  }
  return { turn: current, skipReason: 'allBlocked' as const }
}
