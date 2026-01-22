import type { GameSnapshot } from '@/lib/types'
import type { PlayerAction } from '@/lib/types'

export interface PlayerAgent {
  // requestId is optional; TurnManager may pass it for defense-in-depth
  getAction(gameState: GameSnapshot, requestId?: number): Promise<PlayerAction>
  cancel?(): void
}
