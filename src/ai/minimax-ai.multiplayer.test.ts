import { describe, it, expect, beforeEach } from 'vitest'
import { MinimaxAI } from './minimax-ai'
import type { GameSnapshot, Cell } from '@/lib/types'
import { BOARD_SIZE } from '@/lib/types'

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      stone: null,
      wallTop: null,
      wallLeft: null,
    })),
  )
}

function createSnapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    board: createEmptyBoard(),
    turn: 'R',
    legal: new Set(),
    stepsTaken: 0,
    phase: 'playing',
    players: ['R', 'B'],
    stonesLimit: 4,
    stonesPlaced: { R: 4, B: 4, Y: 0, G: 0 },
    ...overrides,
  }
}

describe('MinimaxAI Multiplayer Support', () => {
  let ai: MinimaxAI

  beforeEach(() => {
    ai = new MinimaxAI(1)
  })

  describe('evaluate() with multiple players', () => {
    it('should evaluate 2-player game correctly', () => {
      const board = createEmptyBoard()
      board[0][0].stone = 'R'
      board[6][6].stone = 'B'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B'],
      })

      const score = ai.evaluate(state)
      expect(typeof score).toBe('number')
      expect(isFinite(score)).toBe(true)
    })

    it('should evaluate 3-player game correctly', () => {
      const board = createEmptyBoard()
      board[0][0].stone = 'R'
      board[0][6].stone = 'B'
      board[6][3].stone = 'Y'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B', 'Y'],
        stonesLimit: 2,
        stonesPlaced: { R: 2, B: 2, Y: 2, G: 0 },
      })

      const score = ai.evaluate(state)
      expect(typeof score).toBe('number')
      expect(isFinite(score)).toBe(true)
    })

    it('should evaluate 4-player game correctly', () => {
      const board = createEmptyBoard()
      board[0][0].stone = 'R'
      board[0][6].stone = 'B'
      board[6][0].stone = 'Y'
      board[6][6].stone = 'G'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B', 'Y', 'G'],
        stonesLimit: 2,
        stonesPlaced: { R: 2, B: 2, Y: 2, G: 2 },
      })

      const score = ai.evaluate(state)
      expect(typeof score).toBe('number')
      expect(isFinite(score)).toBe(true)
    })

    it('should return higher score when current player has advantage', () => {
      const board = createEmptyBoard()
      board[0][3].stone = 'R'
      board[3][3].stone = 'R'
      board[6][3].stone = 'R'
      for (let y = 0; y < BOARD_SIZE; y++) {
        board[y][3].wallLeft = 'R'
      }
      board[3][6].stone = 'B'

      const stateR = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B'],
      })

      const stateB = createSnapshot({
        board,
        turn: 'B',
        players: ['R', 'B'],
      })

      const scoreR = ai.evaluate(stateR)
      const scoreB = ai.evaluate(stateB)

      expect(scoreR).toBeGreaterThan(0)
      expect(scoreB).toBeLessThan(0)
    })
  })

  describe('actionHeuristic() with multiple players', () => {
    it('should consider all opponents in 3-player game', () => {
      const board = createEmptyBoard()
      board[3][3].stone = 'R'
      board[0][0].stone = 'B'
      board[6][6].stone = 'Y'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B', 'Y'],
      })

      const actionTowardsB = {
        type: 'move' as const,
        pos: { x: 2, y: 2 },
        from: { x: 3, y: 3 },
      }

      const actionTowardsY = {
        type: 'move' as const,
        pos: { x: 4, y: 4 },
        from: { x: 3, y: 3 },
      }

      type ActionHeuristicFn = (action: typeof actionTowardsB, state: GameSnapshot) => number
      const heuristicB = (ai as unknown as { actionHeuristic: ActionHeuristicFn }).actionHeuristic(
        actionTowardsB,
        state,
      )
      const heuristicY = (ai as unknown as { actionHeuristic: ActionHeuristicFn }).actionHeuristic(
        actionTowardsY,
        state,
      )

      expect(typeof heuristicB).toBe('number')
      expect(typeof heuristicY).toBe('number')
    })
  })

  describe('getBestMove() with multiple players', () => {
    it('should return valid action in 3-player game', () => {
      const board = createEmptyBoard()
      board[3][3].stone = 'R'
      board[0][0].stone = 'B'
      board[6][6].stone = 'Y'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B', 'Y'],
        phase: 'playing',
      })

      const action = ai.getBestMove(state)
      expect(action).toBeDefined()
      expect(['move', 'wall']).toContain(action.type)
      expect(action.pos).toBeDefined()
    })

    it('should return valid action in 4-player game', () => {
      const board = createEmptyBoard()
      board[0][0].stone = 'R'
      board[0][6].stone = 'B'
      board[6][0].stone = 'Y'
      board[6][6].stone = 'G'

      const state = createSnapshot({
        board,
        turn: 'R',
        players: ['R', 'B', 'Y', 'G'],
        phase: 'playing',
      })

      const action = ai.getBestMove(state)
      expect(action).toBeDefined()
      expect(['move', 'wall']).toContain(action.type)
    })
  })

  describe('encodeCell() for all players', () => {
    it('should encode Y and G stones correctly', () => {
      const board = createEmptyBoard()
      board[0][0].stone = 'Y'
      board[1][1].stone = 'G'

      const state = createSnapshot({
        board,
        turn: 'Y',
        players: ['R', 'B', 'Y', 'G'],
      })

      const score = ai.evaluate(state)
      expect(typeof score).toBe('number')
      expect(isFinite(score)).toBe(true)
    })
  })
})
