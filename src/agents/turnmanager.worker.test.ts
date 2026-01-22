import { test, expect, vi } from 'vitest'
import { TurnManager } from './TurnManager'
import type { PlayerAction, GameSnapshot, Player } from '@/lib/types'
import * as aiUtils from '@/utils/ai'

const FALLBACK_ACTION: PlayerAction = {
  type: 'wall',
  from: { x: 0, y: 0 },
  pos: { x: 0, y: 0 },
  dir: 'top',
}

class FakeWorker {
  public onmessage: ((e: MessageEvent) => void) | null = null
  public onerror: ((e: ErrorEvent) => void) | null = null
  public terminated = false

  postMessage(_msg: unknown) {
    // noop for test; responses simulated via simulateResponse
  }

  terminate() {
    this.terminated = true
  }

  simulateResponse(delay: number, data: unknown) {
    setTimeout(() => {
      if (this.onmessage) {
        // @ts-ignore - create a MessageEvent-like object
        this.onmessage({ data } as MessageEvent)
      }
    }, delay)
  }
}

class AgentWithWorker {
  public canceled = false
  private worker: FakeWorker
  constructor(worker?: FakeWorker) {
    this.worker = worker ?? new FakeWorker()
  }
  getAction(_state: GameSnapshot): Promise<PlayerAction> {
    return new Promise((resolve, reject) => {
      const onmessage = (event: MessageEvent<{ action?: PlayerAction; error?: string }>) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        if (event.data.error) reject(new Error(event.data.error))
        else if (event.data.action) resolve(event.data.action)
        else reject(new Error('no action'))
      }
      this.worker.onmessage = onmessage
      this.worker.onerror = (err: ErrorEvent) => {
        this.worker.onmessage = null
        this.worker.onerror = null
        reject(new Error(err.message))
      }
      // Simulate sending request to worker; the test will call simulateResponse
      this.worker.postMessage({})
    })
  }
  cancel() {
    this.canceled = true
    this.worker.terminate()
  }
  // expose worker for test control
  getWorker() {
    return this.worker
  }
}

test('TurnManager with worker-based agent: times out and cancels worker', async () => {
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

  const worker = new FakeWorker()
  const agent = new AgentWithWorker(worker)

  const agents = { R: agent as any, B: {} as any, Y: {} as any, G: {} as any }

  const tm = new TurnManager({
    agents,
    getGameState: () => state,
    applyAction,
    isGameOver: (s: GameSnapshot) => s.phase === 'finished',
    turnTimeLimit: 50,
  } as any)

  // Start the loop but do not respond from worker yet; later simulate late response
  const run = tm.startLoop()

  // Simulate a late worker response after 200ms
  worker.simulateResponse(200, { action: { type: 'move', from: { x: 0, y: 0 }, pos: { x: 2, y: 0 } } })

  await run

  expect(applied.length).toBe(1)
  expect(applied[0]).toEqual(FALLBACK_ACTION)
  expect(agent.canceled).toBe(true)
  expect(worker.terminated).toBe(true)

  spyFallback.mockRestore()
})

test('TurnManager with worker-based agent: timely worker response accepted', async () => {
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

  const worker = new FakeWorker()
  const agent = new AgentWithWorker(worker)

  const agents = { R: agent as any, B: {} as any, Y: {} as any, G: {} as any }

  const tm = new TurnManager({
    agents,
    getGameState: () => state,
    applyAction,
    isGameOver: (s: GameSnapshot) => s.phase === 'finished',
    turnTimeLimit: 100,
  } as any)

  const run = tm.startLoop()

  // Simulate timely worker response within 20ms
  worker.simulateResponse(20, { action: { type: 'move', from: { x: 0, y: 0 }, pos: { x: 3, y: 0 } } })

  await run

  expect(applied.length).toBe(1)
  expect(applied[0].type).toBe('move')
  expect(agent.canceled).toBe(false)

  spyFallback.mockRestore()
})
