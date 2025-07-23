// src/agents/AIWorker.ts
import type { GameSnapshot, PlayerAction } from '@/lib/types'
import { getLegalActions, getRandomAction, getBestPlacement } from '@/utils/ai'
import { MinimaxAI } from '@/ai/minimax-ai'

function calculateMinimaxPlayingAction(gameState: GameSnapshot, depth = 2): PlayerAction {
  const ai = new MinimaxAI(depth)
  ai.startTime = performance.now()
  ai.timeLimit = 3000
  return ai.getBestMove(gameState)
}

// --- Worker message handler ---
self.onmessage = (
  event: MessageEvent<{ aiType: string; gameState: GameSnapshot; config: Record<string, unknown> }>,
) => {
  const { aiType, gameState } = event.data
  let action: PlayerAction | null = null

  try {
    self.postMessage({ type: 'start-thinking' })
    const legalActions = getLegalActions(gameState)

    // Handle case where game is finished first
    if (gameState.phase === 'finished') {
      self.postMessage({
        type: 'action',
        action: null,
        info: 'Game finished, no action taken.',
      })
      return
    }

    if (legalActions.length === 0) {
      self.postMessage({
        type: 'error',
        error: 'No legal actions available but game is not finished.',
      })
      return
    }

    if (gameState.phase === 'placing') {
      switch (aiType) {
        case 'minimax':
          action = getBestPlacement(gameState)
          break
        case 'random':
        default:
          action = getRandomAction(legalActions)!
          break
      }
    } else if (gameState.phase === 'playing') {
      switch (aiType) {
        case 'minimax':
          action = calculateMinimaxPlayingAction(
            gameState,
            (event.data.config?.depth as number) ?? 2,
          )
          break
        case 'random':
        default:
          action = getRandomAction(legalActions)!
          break
      }
    } else {
      // Fallback for unexpected phase, though 'finished' is handled above
      self.postMessage({ type: 'error', error: `Unexpected game phase: ${gameState.phase}` })
      return
    }

    if (action) {
      self.postMessage({ type: 'action', action })
    } else {
      // If action is null here, it implies an issue in decision logic for non-finished phases
      // or a specific AI logic failed to return an action.
      // As a robust fallback, if legal actions were available, pick a random one.
      self.postMessage({
        type: 'action',
        action: getRandomAction(legalActions)!,
        info: 'Fell back to random action.',
      })
    }
  } catch (e) {
    self.postMessage({
      type: 'error',
      error: (e as Error).message,
      stack: (e as Error).stack,
    })
  } finally {
    self.postMessage({ type: 'stop-thinking' })
  }
}
