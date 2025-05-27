import type { GameSnapshot, PlayerAction } from '../lib/types'
import { applyAction, getLegalActions } from '../utils/ai'
import { checkGameEnd, type GameResult } from '../utils/game'

export abstract class BaseAI {
  constructor(name = 'BaseAI') {
    this.name = name
  }

  name: string

  abstract evaluate(state: GameSnapshot): number

  abstract getBestPlace(state: GameSnapshot): PlayerAction

  abstract getBestMove(state: GameSnapshot): PlayerAction

  getLegalActions(state: GameSnapshot): PlayerAction[] {
    return getLegalActions(state)
  }

  applyMove(state: GameSnapshot, move: PlayerAction): GameSnapshot {
    return applyAction(state, move)
  }

  checkGameResult(state: GameSnapshot): GameResult {
    const result = checkGameEnd(state.board, state.players)
    return result
  }

  async decidePlace(state: GameSnapshot): Promise<PlayerAction> {
    const place = await this.getBestPlace(state)
    return place
  }

  async decideMove(state: GameSnapshot): Promise<PlayerAction> {
    const move = await this.getBestMove(state)
    return move
  }
}
