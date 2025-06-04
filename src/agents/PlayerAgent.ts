import type { GameSnapshot } from '@/lib/types'
import type { PlayerAction } from '@/lib/types'

export interface PlayerAgent {
  getAction(gameState: GameSnapshot): Promise<PlayerAction>
}
