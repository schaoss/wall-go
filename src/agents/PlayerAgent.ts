import type { GameSnapshot, PlayerAction } from '@/lib/types'

export type AgentMessage = {
  type?: string
  action?: PlayerAction | null
  error?: string
  stack?: string
  info?: string
}

export interface PlayerAgent {
  getAction(gameState: GameSnapshot): Promise<PlayerAction>
  cancel?(): void
  onMessage?: (message: AgentMessage) => void
}
