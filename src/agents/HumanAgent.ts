// 真人玩家代理，等待 UI 輸入
import type { PlayerAgent } from './PlayerAgent'
import type { PlayerAction } from '../lib/types'

export class HumanAgent implements PlayerAgent {
  private actionResolver: ((action: PlayerAction) => void) | null = null
  private waiting: boolean = false

  // 由 UI 呼叫此方法，傳入玩家操作
  submitAction(action: PlayerAction) {
    if (this.waiting && this.actionResolver) {
      this.actionResolver(action)
      this.actionResolver = null
      this.waiting = false
    }
  }

  // 遊戲主流程呼叫，等待玩家操作
  getAction(): Promise<PlayerAction> {
    this.waiting = true
    return new Promise<PlayerAction>((resolve) => {
      this.actionResolver = resolve
    })
  }
}
