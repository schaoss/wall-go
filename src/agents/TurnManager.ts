// TurnManager: controls the main game loop, sequentially waits for each player agent's action
import type { GameSnapshot } from '@/lib/types'
import type { Player } from '@/lib/types'
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction } from '@/lib/types'

export class TurnManager {
  private agents: Record<Player, PlayerAgent>
  private getGameState: () => GameSnapshot
  private applyAction: (action: PlayerAction) => Promise<void> | void
  private isGameOver: (state: GameSnapshot) => boolean
  private onTurnStart?: (player: Player) => void

  constructor(params: {
    agents: Record<Player, PlayerAgent>
    getGameState: () => GameSnapshot
    applyAction: (action: PlayerAction) => Promise<void> | void
    isGameOver: (state: GameSnapshot) => boolean
    onTurnStart?: (player: Player) => void
  }) {
    this.agents = params.agents
    this.getGameState = params.getGameState
    this.applyAction = params.applyAction
    this.isGameOver = params.isGameOver
    this.onTurnStart = params.onTurnStart
  }

  // Recursively execute action and its followUp
  private async executeAction(action: PlayerAction) {
    if (!action) return
    // Execute corresponding store method based on action.type (must be provided externally)
    await this.applyAction(action)
    if (action.followUp) {
      await this.executeAction(action.followUp)
    }
  }

  async startLoop() {
    while (!this.isGameOver(this.getGameState())) {
      const state = this.getGameState()
      if (this.onTurnStart) this.onTurnStart(state.turn)
      const agent = this.agents[state.turn]
      const action = await agent.getAction(state)
      await this.executeAction(action)
    }
  }
}
