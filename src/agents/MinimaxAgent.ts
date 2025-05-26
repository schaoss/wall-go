// src/agents/MinimaxAgent.ts
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction } from '../lib/types'
import { toSerializableSnapshot } from './serialize'

// 簡單 sleep function，模擬 AI 思考延遲
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MinimaxAgent implements PlayerAgent {
  private worker: Worker

  constructor() {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), {
      type: 'module',
    })
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await sleep(400 + Math.floor(Math.random() * 200)) // 模擬思考延遲 300~500ms
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (
        event: MessageEvent<{
          action?: PlayerAction | null
          error?: string
          stack?: string
          info?: string
        }>,
      ) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        if (event.data.error) {
          let errMsg = 'Worker error (MinimaxAgent): ' + event.data.error
          if (event.data.stack) errMsg += '\nStack: ' + event.data.stack
          reject(new Error(errMsg))
        } else if (event.data.action) {
          resolve(event.data.action)
        } else {
          reject(
            new Error(
              'Unknown or missing action from AIWorker for MinimaxAgent. Info: ' + event.data.info,
            ),
          )
        }
      }

      this.worker.onerror = (error: ErrorEvent) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(`AIWorker onerror (MinimaxAgent): ${error.message}`))
      }

      this.worker.postMessage({
        aiType: 'minimax',
        gameState: toSerializableSnapshot(gameState),
      })
    })
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
    }
  }
}
