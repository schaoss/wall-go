import type { GameSnapshot } from '../store/gameState'
import type { PlayerAction } from '../lib/types'

export interface PlayerAgent {
  getAction(gameState: GameSnapshot): Promise<PlayerAction>
}
