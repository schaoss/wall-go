// Minimax AI 玩家代理
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction, GameSnapshot } from '../lib/types'
import { isInPureTerritory, getLegalActions, getLegalDestinations, getRandomAction, getBestPlacement, isSuicideMove, scoreAction } from '../utils/ai'
import { getLegalWallActions } from '../utils/wall'

export class KillerAgent implements PlayerAgent {
  private choosePlacement = (gameState: GameSnapshot): PlayerAction => {
    return getBestPlacement(gameState)
  }

  private getBestMove: (gameState: GameSnapshot, legalActions: PlayerAction[]) => PlayerAction = (gameState, legalActions) => {
    const { turn: me, board } = gameState
    const actions: PlayerAction[] = []
    const myStone = gameState.board.flatMap((row, y) =>
      row.map((cell, x) => cell.stone === me ? { x, y } : null).filter(Boolean)
    )

    for (const p of myStone) {
      if (!p || isInPureTerritory(gameState, p, me)) continue

      getLegalDestinations(gameState, p).forEach(pos => {
        for (const wallAction of getLegalWallActions(board, pos.x, pos.y)) {
          actions.push({
            type: 'move',
            from: p,
            pos: { x: pos.x, y: pos.y },
            followUp: wallAction
          })
        }
      })
    }
    const safeActions = actions.filter(a => !isSuicideMove(gameState, a, gameState.turn))
    const candidateActions = safeActions.length > 0 ? safeActions : actions
    let bestScore = -Infinity
    let bestActions: PlayerAction[] = []
    for (const action of candidateActions) {
      const score = scoreAction(gameState, action, gameState.turn)
      if (score > bestScore) {
        bestScore = score
        bestActions = [action]
      } else if (score === bestScore) {
        bestActions.push(action)
      }
    }
    return bestActions.length ? getRandomAction({ legalActions: bestActions })! : getRandomAction({ legalActions })!
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await new Promise(res => setTimeout(res, 200 + Math.floor(Math.random() * 50)))

    const actions = getLegalActions(gameState)
    if (actions.length === 0) throw new Error('No legal action')

    switch (gameState.phase) {
      case 'placing':
        return this.choosePlacement(gameState)
      case 'playing':
        return this.getBestMove(gameState, actions)
      default:
        return getRandomAction({ legalActions: actions })!
    }
  }
}
