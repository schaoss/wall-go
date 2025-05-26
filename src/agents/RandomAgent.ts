// 隨機 AI 玩家代理
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot } from '../lib/types'
import { getLegalActions, getRandomAction } from '../utils/ai'
import type { PlayerAction } from '../lib/types'

export class RandomAgent implements PlayerAgent {
  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    // 增加隨機延遲，避免 JS 卡死
    await new Promise(res => setTimeout(res, 400 + Math.floor(Math.random() * 50)))
    const legalActions = getLegalActions(gameState)
    if (legalActions.length === 0) throw new Error('No legal action')
    return getRandomAction({ legalActions })!
  }
}
