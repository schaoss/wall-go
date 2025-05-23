import type { PlayerAction } from '../lib/types'

// 已廢棄：請改用代理架構（PlayerAgent, RandomAiAgent, HumanAgent, TurnManager）統一處理 AI/真人行動。
// 保留檔案僅供相容性提示。

// 隨機 AI：從合法行動中隨機選一個
export function getRandomAiAction({
  legalActions
}: {
  legalActions: PlayerAction[]
}): PlayerAction | null {
  if (legalActions.length === 0) return null
  return legalActions[Math.floor(Math.random() * legalActions.length)]
}
