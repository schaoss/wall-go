// src/agents/KillerAgent.ts
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction } from '../lib/types'
import { toSerializableSnapshot } from './serialize'
import { sleep } from '../utils/sleep'

export class KillerAgent implements PlayerAgent {
  private worker: Worker

  constructor() {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), {
      type: 'module',
    })
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await sleep(300 + Math.floor(Math.random() * 200)) // 模擬思考延遲 250~450ms
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
          let errMsg = 'Worker error (KillerAgent): ' + event.data.error
          if (event.data.stack) errMsg += '\nStack: ' + event.data.stack
          reject(new Error(errMsg))
        } else if (event.data.action) {
          resolve(event.data.action)
        } else {
          reject(
            new Error(
              'Unknown or missing action from AIWorker for KillerAgent. Info: ' + event.data.info,
            ),
          )
        }
      }

      this.worker.onerror = (error: ErrorEvent) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(`AIWorker onerror (KillerAgent): ${error.message}`))
      }

      this.worker.postMessage({
        aiType: 'killer',
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
