// TurnManager: controls the main game loop, sequentially waits for each player agent's action
import type { GameSnapshot } from '@/lib/types'
import type { Player } from '@/lib/types'
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction } from '@/lib/types'
import { getRandomWallActionForPlayer } from '@/utils/ai'

export class TurnManager {
  private agents: Record<Player, PlayerAgent>
  private getGameState: () => GameSnapshot
  private applyAction: (action: PlayerAction) => Promise<void> | void
  private isGameOver: (state: GameSnapshot) => boolean
  private onTurnStart?: (state: GameSnapshot) => void
  private turnTimeLimit: number

  constructor(params: {
    agents: Record<Player, PlayerAgent>
    getGameState: () => GameSnapshot
    applyAction: (action: PlayerAction) => Promise<void> | void
    isGameOver: (state: GameSnapshot) => boolean
    onTurnStart?: (state: GameSnapshot) => void
    onMessage?: (message: any) => void
    turnTimeLimit?: number
  }) {
    this.agents = params.agents
    Object.values(this.agents).forEach((agent) => {
      if (agent.onMessage) {
        agent.onMessage = params.onMessage
      }
    })
    this.getGameState = params.getGameState
    this.applyAction = params.applyAction
    this.isGameOver = params.isGameOver
    this.onTurnStart = params.onTurnStart
    this.turnTimeLimit = params.turnTimeLimit ?? 90_000
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
      if (this.onTurnStart) this.onTurnStart(state)
      const agent = this.agents[state.turn]
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<PlayerAction>((resolve) => {
        timeoutId = setTimeout(() => {
          agent.cancel?.()
          const auto =
            getRandomWallActionForPlayer(state, state.turn) ??
            ({
              type: 'wall',
              from: { x: 0, y: 0 },
              pos: { x: 0, y: 0 },
              dir: 'top',
            } as PlayerAction)
          resolve(auto)
        }, this.turnTimeLimit)
      })

      const action = await Promise.race([agent.getAction(state), timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)
      await this.executeAction(action as PlayerAction)
    }
  }
}
