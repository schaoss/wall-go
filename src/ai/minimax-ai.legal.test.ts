import { test, expect, vi } from 'vitest'
import { MinimaxAI } from './minimax-ai'
import * as aiUtils from '@/utils/ai'
import { createEmptyBoard } from '@/store/gameState'
import type { GameSnapshot, PlayerAction } from '@/lib/types'

test('MinimaxAI.getBestMove returns action from getLegalActions', () => {
  const ai = new MinimaxAI(0)
  const actions: PlayerAction[] = [
    { type: 'move', from: { x: 0, y: 0 }, pos: { x: 1, y: 0 } } as PlayerAction,
    { type: 'wall', from: { x: 0, y: 0 }, pos: { x: 2, y: 0 }, dir: 'top' } as PlayerAction,
  ]

  const spy = vi.spyOn(aiUtils, 'getLegalActions').mockImplementation(() => actions)
  const spyRand = vi.spyOn(aiUtils, 'getRandomAction').mockImplementation(() => actions[0])

  const state = { phase: 'playing', board: createEmptyBoard(), turn: 'R', players: ['R', 'B', 'Y', 'G'] } as unknown as GameSnapshot

  const chosen = ai.getBestMove(state)
  expect(actions).toContainEqual(chosen)

  spy.mockRestore()
  spyRand.mockRestore()
})

test('MinimaxAI.getBestMove filters claimed positions', () => {
  const ai = new MinimaxAI(0)
  const moveAction: PlayerAction = { type: 'move', from: { x: 1, y: 1 }, pos: { x: 2, y: 2 } } as PlayerAction
  const anotherAction: PlayerAction = { type: 'move', from: { x: 0, y: 0 }, pos: { x: 1, y: 0 } } as PlayerAction
  const actions: PlayerAction[] = [moveAction, anotherAction]

  // Mock getLegalActions
  const spy = vi.spyOn(aiUtils, 'getLegalActions').mockImplementation(() => actions)
  const spyRand = vi.spyOn(aiUtils, 'getRandomAction').mockImplementation(() => moveAction)

  // Mock getClaimedTerritoryPositions to claim the position of anotherAction.from, forcing filter
  const spyClaim = vi.spyOn<any, any>(ai as any, 'getClaimedTerritoryPositions' as any).mockImplementation(() => new Set(['0,0']))

  const state = { phase: 'playing', board: createEmptyBoard(), turn: 'R', players: ['R', 'B', 'Y', 'G'] } as unknown as GameSnapshot

  const chosen = ai.getBestMove(state)
  // Because anotherAction.from (0,0) is claimed, chosen should not be that action
  expect(chosen).not.toEqual(anotherAction)
  expect([moveAction, anotherAction]).toContainEqual(chosen)

  spy.mockRestore()
  spyRand.mockRestore()
  spyClaim.mockRestore()
})
