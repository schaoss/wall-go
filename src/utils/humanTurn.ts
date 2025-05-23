// src/utils/humanTurn.ts
import type { Player, GameSnapshot } from '../lib/types'

/**
 * 判斷 snapshot 是否為 human 玩家回合
 */
export function isHumanTurnSnap(snap: GameSnapshot, humanSide: Player | null) {
  if (humanSide) return snap.turn === humanSide
  return true // fallback: always allow
}
