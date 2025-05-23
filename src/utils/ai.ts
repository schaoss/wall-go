import type { Pos, WallDir } from '../lib/types'

export interface AiAction {
  type: 'place' | 'move' | 'wall'
  from?: Pos // 僅 playing 階段需要
  pos: Pos   // 目標座標（move: to, wall: 牆座標, place: 落子）
  dir?: WallDir
}

// 隨機 AI：從合法行動中隨機選一個
export function getRandomAiAction({
  legalActions
}: {
  legalActions: AiAction[]
}): AiAction | null {
  if (legalActions.length === 0) return null
  return legalActions[Math.floor(Math.random() * legalActions.length)]
}
