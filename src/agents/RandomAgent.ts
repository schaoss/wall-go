// src/agents/RandomAgent.ts
import type { PlayerAgent } from './PlayerAgent';
import type { GameSnapshot, PlayerAction } from '../lib/types';
import { toSerializableSnapshot } from './serialize';

export class RandomAgent implements PlayerAgent {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), { type: 'module' });
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (event: MessageEvent<{ action?: PlayerAction | null; error?: string; stack?: string; info?: string }>) => {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        if (event.data.error) {
          let errMsg = 'Worker error (RandomAgent): ' + event.data.error;
          if (event.data.stack) errMsg += '\nStack: ' + event.data.stack;
          reject(new Error(errMsg));
        } else if (event.data.action) {
          resolve(event.data.action);
        }
        else {
          // Fallback or error if action is unexpectedly null/undefined for non-finished states
          reject(new Error('Unknown or missing action from AIWorker for RandomAgent. Info: ' + event.data.info));
        }
      };

      this.worker.onerror = (error: ErrorEvent) => {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        reject(new Error(`AIWorker onerror (RandomAgent): ${error.message}`));
      };

      this.worker.postMessage({ aiType: 'random', gameState: toSerializableSnapshot(gameState) });
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
