// Minimax AI 玩家代理
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot } from '../lib/types'
import type { PlayerAction } from '../lib/types'
import { getLegalActions, getRandomAction, applyAction, isSuicideMove } from '../utils/ai'
import { selectBestPlacingAction, minimax } from '../utils/minimaxHelpers'

export class MinimaxAgent implements PlayerAgent {
  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await new Promise(res => setTimeout(res, 300 + Math.floor(Math.random() * 50)))
    const actions = getLegalActions(gameState)
    if (actions.length === 0) throw new Error('No legal action')
    if (gameState.phase === 'placing') {
      return selectBestPlacingAction(gameState, actions)
    } else if (gameState.phase === 'playing') {
      const depth = 2
      // 過濾自殺步
      const safeActions = actions.filter(a => !isSuicideMove(gameState, a, gameState.turn))
      const candidateActions = safeActions.length > 0 ? safeActions : actions
      let bestScore = -Infinity
      let bestActions: PlayerAction[] = []
      for (const action of candidateActions) {
        const score = minimax(applyAction(gameState, action), depth - 1, false, gameState.turn)
        if (score > bestScore) {
          bestScore = score
          bestActions = [action]
        } else if (score === bestScore) {
          bestActions.push(action)
        }
      }
      return getRandomAction({ legalActions: bestActions })!
    }
    return getRandomAction({ legalActions: actions })!
  }
}
