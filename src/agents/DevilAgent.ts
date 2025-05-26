import type { PlayerAgent } from './PlayerAgent';
import type { GameSnapshot, PlayerAction } from '../lib/types';
import { toSerializableSnapshot } from './serialize';
// No longer need utils like reachable, applyAction, getLegalActions, getRandomAction, getBestPlacement, getReachableSet here
// as all that logic is now in DevilWorker.ts

export class DevilAgent implements PlayerAgent {
  private worker: Worker;

  constructor() {
    // Initialize the worker
    // The `new URL(...)` pattern is for Vite to correctly bundle the worker.
    // `{ type: 'module' }` is important for ES module workers.
    this.worker = new Worker(new URL('./AIWorker.ts', import.meta.url), { type: 'module' });
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (event: MessageEvent<{ action?: PlayerAction | null; error?: string; stack?: string; info?: string }>) => {
        // Clean up listeners immediately to prevent them from being called multiple times
        // or holding references that might cause memory leaks.
        this.worker.onmessage = null;
        this.worker.onerror = null;

        if (event.data.error) {
          let errMsg = 'Worker error (DevilAgent via AIWorker): ' + event.data.error;
          if (event.data.stack) {
            errMsg += '\nStack: ' + event.data.stack;
          }
          reject(new Error(errMsg));
        } else if (event.data.action) {
          resolve(event.data.action);
        }
        else {
          // Fallback or error if action is unexpectedly null/undefined for non-finished states
          reject(new Error('Unknown or missing action from AIWorker for DevilAgent. Info: ' + event.data.info));
        }
      };

      this.worker.onerror = (error: ErrorEvent) => {
        // Clean up listeners
        this.worker.onmessage = null;
        this.worker.onerror = null;

        // Reject the promise with a new error, including the original error message
        reject(new Error(`AIWorker onerror (DevilAgent): ${error.message}`));
      };

      // Post the gameState and aiType to the worker to start processing
      this.worker.postMessage({ aiType: 'devil', gameState: toSerializableSnapshot(gameState) });
    });
  }

  // Optional: Method to terminate the worker.
  // This is useful for cleanup when the agent is no longer needed,
  // e.g., when a game ends or the component using this agent is unmounted.
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      // console.log('DevilWorker terminated.'); // For debugging
    }
  }
}
// All the complex logic (Zobrist, TT, eval, search) has been moved to the worker.
