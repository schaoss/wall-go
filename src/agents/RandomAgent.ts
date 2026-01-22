// src/agents/RandomAgent.ts
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction } from '@/lib/types'
import { toSerializableSnapshot } from './serialize'
import { sleep } from '@/utils/sleep'

export class RandomAgent implements PlayerAgent {
  private worker: Worker
  private _canceled = false

  constructor() {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), {
      type: 'module',
    })
  }

  async getAction(gameState: GameSnapshot, _requestId?: number): Promise<PlayerAction> {
    await sleep(200 + Math.floor(Math.random() * 200)) // Simulate thinking delay 200~400ms
    this._canceled = false
    return new Promise((resolve, reject) => {
      // Attach listener which will ignore late messages if terminated
      const onmessage = (
        event: MessageEvent<{
          action?: PlayerAction | null
          error?: string
          stack?: string
          info?: string
        }>,
      ) => {
        // If we've been canceled, ignore late messages
        if (this._canceled) return
        // clear handlers to avoid duplicate resolution
        this.worker.onmessage = null
        this.worker.onerror = null
        if (event.data.error) {
          let errMsg = 'Worker error (RandomAgent): ' + event.data.error
          if (event.data.stack) errMsg += '\nStack: ' + event.data.stack
          reject(new Error(errMsg))
        } else if (event.data.action) {
          resolve(event.data.action)
        } else {
          reject(
            new Error(
              'Unknown or missing action from AIWorker for RandomAgent. Info: ' + event.data.info,
            ),
          )
        }
      }
      this.worker.onmessage = onmessage

      this.worker.onerror = (error: ErrorEvent) => {
        if (this._canceled) return
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(`AIWorker onerror (RandomAgent): ${error.message}`))
      }

      this.worker.postMessage({
        aiType: 'random',
        gameState: toSerializableSnapshot(gameState),
        requestId: _requestId,
      })
    })
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
    }
  }

  // Provide cancel() to match PlayerAgent.cancel optional API. Marks canceled and
  // terminates the underlying worker and clears handlers to avoid late messages.
  public cancel(): void {
    this._canceled = true
    try {
      if (this.worker) {
        this.worker.onmessage = null
        this.worker.onerror = null
        this.worker.terminate()
      }
    } catch (e) {
      // ignore
    }
  }
}
