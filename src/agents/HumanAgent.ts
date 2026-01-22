// Human player agent, waits for UI input
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction, GameSnapshot } from '@/lib/types'

export class HumanAgent implements PlayerAgent {
  private actionResolver: ((action: PlayerAction) => void) | null = null
  private waiting: boolean = false

  // Called by UI to submit player action
  submitAction(action: PlayerAction) {
    if (this.waiting && this.actionResolver) {
      this.actionResolver(action)
      this.actionResolver = null
      this.waiting = false
    }
  }

  // Called by main game loop, waits for player action
  getAction(_gameState?: GameSnapshot, _requestId?: number): Promise<PlayerAction> {
    this.waiting = true
    return new Promise<PlayerAction>((resolve) => {
      this.actionResolver = resolve
    })
  }

  cancel() {
    if (this.waiting) {
      // Resolve with a noop action? For human, we'll just clear resolver so the looping manager
      // can fall back to timeout-driven auto action.
      this.actionResolver = null
      this.waiting = false
    }
  }
}
