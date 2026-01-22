import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction } from '@/lib/types'
import { toSerializableSnapshot } from './serialize'
import { sleep } from '@/utils/sleep'

export class MinimaxAgent implements PlayerAgent {
  private worker: Worker
  private depth: number
  private startTime: number = 0
  private timeLimit: number = 5000
  private _canceled = false

  constructor(depth: number = 2) {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), {
      type: 'module',
    })
    this.depth = depth
  }

  async getAction(gameState: GameSnapshot, _requestId?: number): Promise<PlayerAction> {
    if (gameState.phase === 'placing') await sleep(300 + Math.floor(Math.random() * 50)) // Simulate thinking delay 300~500ms

    this.startTime = performance.now()
    this.timeLimit = 3000

    this._canceled = false
    return new Promise((resolve, reject) => {
      const onmessage = (
        event: MessageEvent<{
          action?: PlayerAction | null
          error?: string
          stack?: string
          info?: string
        }>,
      ) => {
        // Ignore late messages if canceled
        if (this._canceled) return
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
      this.worker.onmessage = onmessage

      this.worker.onerror = (error: ErrorEvent) => {
        if (this._canceled) return
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(`AIWorker onerror (MinimaxAgent): ${error.message}`))
      }

      this.worker.postMessage({
        aiType: 'minimax',
        gameState: toSerializableSnapshot(gameState),
        config: { depth: this.depth, startTime: this.startTime, timeLimit: this.timeLimit },
        requestId: _requestId,
      })
    })
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
    }
  }

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
