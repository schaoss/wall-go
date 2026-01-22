import { test, expect, vi } from 'vitest'
import { TurnManager } from './TurnManager'
import type { PlayerAction, GameSnapshot, Player } from '@/lib/types'
import * as aiUtils from '@/utils/ai'

// Deterministic fallback action used in assertions
const FALLBACK_ACTION: PlayerAction = {
  type: 'wall',
  from: { x: 0, y: 0 },
  pos: { x: 0, y: 0 },
  dir: 'top',
}

class DelayedAgent {
  public canceled = false
  private action: PlayerAction
  private delay: number
  constructor(action: PlayerAction, delay = 200) {
    this.action = action
    this.delay = delay
  }
  getAction(_state: GameSnapshot): Promise<PlayerAction> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // If canceled, still resolve (simulates late reply)
        resolve(this.action)
      }, this.delay)
    })
  }
  cancel() {
    this.canceled = true
    // do not resolve early; simulates worker termination
  }
}

test('TurnManager ignores late agent reply and uses fallback auto-action', async () => {
  // Mock getRandomWallActionForPlayer to deterministic fallback
  const spyFallback = vi.spyOn(aiUtils, 'getRandomWallActionForPlayer').mockImplementation(() => FALLBACK_ACTION)

  // Initial mutable game state
  const state: GameSnapshot = {
    phase: 'playing',
    board: [[] as any],
    turn: 'R' as Player,
    players: ['R', 'B', 'Y', 'G'],
  } as unknown as GameSnapshot

  // applyAction spy to record applied actions and mark game finished after first action
  const applied: PlayerAction[] = []
  const applyAction = async (action: PlayerAction) => {
    applied.push(action)
    // End the game so TurnManager loop exits after one action
    state.phase = 'finished'
  }

  // Create delayed agent that will resolve after 200ms
  const lateAction: PlayerAction = { type: 'move', from: { x: 0, y: 0 }, pos: { x: 1, y: 0 } } as PlayerAction
  const delayedAgent = new DelayedAgent(lateAction, 200)

  const agents = {
    R: delayedAgent as any,
    B: {} as any,
    Y: {} as any,
    G: {} as any,
  }

  const tm = new TurnManager({
    agents,
    getGameState: () => state,
    applyAction,
    isGameOver: (s: GameSnapshot) => s.phase === 'finished',
    turnTimeLimit: 50, // 50ms timeout to force fallback
  } as any)

  // Run loop (it should complete quickly because applyAction sets phase to finished)
  await tm.startLoop()

  // Assertions
  expect(applied.length).toBe(1)
  // The applied action must be the deterministic fallback
  expect(applied[0]).toEqual(FALLBACK_ACTION)
  // Agent should have been marked canceled
  expect((delayedAgent as any).canceled).toBe(true)

  spyFallback.mockRestore()
})

test('TurnManager accepts timely agent reply and does not cancel agent', async () => {
  const spyFallback = vi.spyOn(aiUtils, 'getRandomWallActionForPlayer').mockImplementation(() => FALLBACK_ACTION)

  const state: GameSnapshot = {
    phase: 'playing',
    board: [[] as any],
    turn: 'R' as Player,
    players: ['R', 'B', 'Y', 'G'],
  } as unknown as GameSnapshot

  const applied: PlayerAction[] = []
  const applyAction = async (action: PlayerAction) => {
    applied.push(action)
    state.phase = 'finished'
  }

  const timelyAction: PlayerAction = { type: 'move', from: { x: 0, y: 0 }, pos: { x: 2, y: 0 } } as PlayerAction
  const timelyAgent = new DelayedAgent(timelyAction, 20)

  const agents = {
    R: timelyAgent as any,
    B: {} as any,
    Y: {} as any,
    G: {} as any,
  }

  const tm = new TurnManager({
    agents,
    getGameState: () => state,
    applyAction,
    isGameOver: (s: GameSnapshot) => s.phase === 'finished',
    turnTimeLimit: 50, // 50ms timeout
  } as any)

  await tm.startLoop()

  expect(applied.length).toBe(1)
  expect(applied[0]).toEqual(timelyAction)
  expect(timelyAgent.canceled).toBe(false)

  spyFallback.mockRestore()
})
