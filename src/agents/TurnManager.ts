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
  // incrementing id to identify the current request; used to ignore late replies
  private currentRequestId = 0

  constructor(params: {
    agents: Record<Player, PlayerAgent>
    getGameState: () => GameSnapshot
    applyAction: (action: PlayerAction) => Promise<void> | void
    isGameOver: (state: GameSnapshot) => boolean
    onTurnStart?: (state: GameSnapshot) => void
    turnTimeLimit?: number
  }) {
    this.agents = params.agents
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
      // bump request id for this turn so late responses can be ignored
      const requestId = ++this.currentRequestId

      // Prepare timeout promise which will cancel agent and resolve with an auto action
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      const timeoutPromise = new Promise<PlayerAction>((resolve) => {
        timeoutId = setTimeout(() => {
          // Signal agent to cancel any in-flight work; agent implementations should
          // terminate/cleanup their workers on cancel to avoid late onmessage handlers.
          try {
            agent.cancel?.()
          } catch (_err) {
            // ignore cancellation errors
          }
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

      // Ask agent for action; if it resolves after we've moved on (requestId mismatch)
      // we must ignore it. Use try/catch to handle agent promise rejection.
      let action: PlayerAction | undefined
      try {
        const result = await Promise.race([agent.getAction(this.getGameState()), timeoutPromise])
        // If requestId has changed, ignore result (late reply)
        if (requestId !== this.currentRequestId) {
          // A later request started; ignore this result
          continue
        }
        action = result as PlayerAction
      } catch (_err) {
        // On agent failure, pick auto action. Attempt to cancel agent if possible.
        try {
          agent.cancel?.()
        } catch (_cancelErr) {
          // ignore
        }
        action =
          getRandomWallActionForPlayer(state, state.turn) ??
          ({
            type: 'wall',
            from: { x: 0, y: 0 },
            pos: { x: 0, y: 0 },
            dir: 'top',
          } as PlayerAction)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }

      // If no action resolved (shouldn't happen), continue the loop
      if (!action) continue

      // Only execute action if this requestId is still current
      if (requestId === this.currentRequestId) {
        await this.executeAction(action as PlayerAction)
      }
    }
  }
}
