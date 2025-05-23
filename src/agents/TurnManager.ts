// TurnManager: 控制遊戲主循環，依序等待每位玩家代理行動
import type { GameSnapshot } from '../store/gameState'
import type { Player } from '../lib/types'
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction } from '../lib/types'

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

  // 遞迴執行 action 及其 followUp
  private async executeAction(action: PlayerAction) {
    if (!action) return
    // 依 action.type 執行對應 store 方法（需由外部傳入）
    await this.applyAction(action)
    if (action.followUp) {
      await this.executeAction(action.followUp)
    }
  }

  async startLoop() {
    while (!this.isGameOver(this.getGameState())) {
      const state = this.getGameState()
      console.log('Current turn:', state.phase, state.turn, state)
      if (this.onTurnStart) this.onTurnStart(state.turn)
      const agent = this.agents[state.turn]
      const action = await agent.getAction(state)
      console.log('Action:', action)
      await this.executeAction(action)
    }
  }
}
