// src/agents/RandomAgent.ts
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction } from '@/lib/types'
import { toSerializableSnapshot } from './serialize'
import { sleep } from '@/utils/sleep'

export class RandomAgent implements PlayerAgent {
  private worker: Worker
  onMessage?: (message: any) => void

  constructor() {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), {
      type: 'module',
    })
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await sleep(200 + Math.floor(Math.random() * 200)) // Simulate thinking delay 200~400ms
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (
        event: MessageEvent<{
          type?: string
          action?: PlayerAction | null
          error?: string
          stack?: string
          info?: string
        }>,
      ) => {
        if (event.data.type === 'start-thinking' || event.data.type === 'stop-thinking') {
          this.onMessage?.(event.data)
          return
        }

        this.worker.onmessage = null
        this.worker.onerror = null
        if (event.data.error) {
          let errMsg = 'Worker error (RandomAgent): ' + event.data.error
          if (event.data.stack) errMsg += '\nStack: ' + event.data.stack
          reject(new Error(errMsg))
        } else if (event.data.action) {
          resolve(event.data.action)
        } else {
          // Fallback or error if action is unexpectedly null/undefined for non-finished states
          reject(
            new Error(
              'Unknown or missing action from AIWorker for RandomAgent. Info: ' + event.data.info,
            ),
          )
        }
      }

      this.worker.onerror = (error: ErrorEvent) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(`AIWorker onerror (RandomAgent): ${error.message}`))
      }

      this.worker.postMessage({
        aiType: 'random',
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
