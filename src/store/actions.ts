import { playerHasMove } from '../utils/player'
import type { Player, Cell } from '../lib/types'

export function placingTurnIndex(totalPlaced: number, playerCount: number) {
  const round = Math.floor(totalPlaced / playerCount)
  const idx = totalPlaced % playerCount
  return round % 2 === 0 ? idx : playerCount - 1 - idx
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
