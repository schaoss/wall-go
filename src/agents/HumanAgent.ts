// Human player agent, waits for UI input
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction } from '@/lib/types'

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
  getAction(): Promise<PlayerAction> {
    this.waiting = true
    return new Promise<PlayerAction>((resolve) => {
      this.actionResolver = resolve
    })
  }
}
