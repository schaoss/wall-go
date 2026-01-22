import { describe, it, expect } from 'vitest'

interface Cell {
  stone: 'R' | 'B' | 'Y' | 'G' | null
  wallTop: 'R' | 'B' | 'Y' | 'G' | null
  wallLeft: 'R' | 'B' | 'Y' | 'G' | null
}

type Player = 'R' | 'B' | 'Y' | 'G'
type WallDir = 'top' | 'left' | 'right' | 'bottom'

interface Pos {
  x: number
  y: number
}

interface PlayerAction {
  type: 'place' | 'move' | 'wall'
  from?: Pos
  pos: Pos
  dir?: WallDir
  followUp?: PlayerAction
}

interface GameSnapshot {
  board: Cell[][]
  turn: Player
  players: Player[]
  phase: 'placing' | 'playing' | 'finished'
}

function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 7 }, () => ({
      stone: null,
      wallTop: null,
      wallLeft: null,
    })),
  )
}

function cloneGameState(state: GameSnapshot): GameSnapshot {
  return JSON.parse(JSON.stringify(state))
}

function getNextPlayer(current: Player, players: Player[]): Player {
  const idx = players.indexOf(current)
  return players[(idx + 1) % players.length]
}

function applyAction(state: GameSnapshot, action: PlayerAction): GameSnapshot {
  const newState = cloneGameState(state)
  const { board, turn, players } = newState

  if (action.type === 'place') {
    board[action.pos.y][action.pos.x].stone = turn
  } else if (action.type === 'move' && action.from) {
    board[action.from.y][action.from.x].stone = null
    board[action.pos.y][action.pos.x].stone = turn
    if (action.followUp) {
      return applyAction(newState, action.followUp)
    }
  } else if (action.type === 'wall' && action.dir) {
    if (action.dir === 'top') board[action.pos.y][action.pos.x].wallTop = turn
    if (action.dir === 'left') board[action.pos.y][action.pos.x].wallLeft = turn
    if (action.dir === 'right') board[action.pos.y][action.pos.x + 1].wallLeft = turn
    if (action.dir === 'bottom') board[action.pos.y + 1][action.pos.x].wallTop = turn
  }

  newState.turn = getNextPlayer(turn, players)
  return newState
}

describe('applyAction multiplayer turn switching', () => {
  describe('2-player mode (existing behavior)', () => {
    it('should switch from R to B', () => {
      const state: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'R',
        players: ['R', 'B'],
        phase: 'placing',
      }

      const newState = applyAction(state, { type: 'place', pos: { x: 3, y: 3 } })

      expect(newState.turn).toBe('B')
    })

    it('should switch from B to R', () => {
      const state: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'B',
        players: ['R', 'B'],
        phase: 'placing',
      }

      const newState = applyAction(state, { type: 'place', pos: { x: 3, y: 3 } })

      expect(newState.turn).toBe('R')
    })
  })

  describe('3-player mode', () => {
    it('should cycle R -> B -> Y -> R', () => {
      const baseState: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'R',
        players: ['R', 'B', 'Y'],
        phase: 'placing',
      }

      const afterR = applyAction(baseState, { type: 'place', pos: { x: 0, y: 0 } })
      expect(afterR.turn).toBe('B')

      const afterB = applyAction(afterR, { type: 'place', pos: { x: 1, y: 0 } })
      expect(afterB.turn).toBe('Y')

      const afterY = applyAction(afterB, { type: 'place', pos: { x: 2, y: 0 } })
      expect(afterY.turn).toBe('R')
    })

    it('should handle starting from non-R player', () => {
      const state: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'Y',
        players: ['R', 'B', 'Y'],
        phase: 'placing',
      }

      const newState = applyAction(state, { type: 'place', pos: { x: 3, y: 3 } })

      expect(newState.turn).toBe('R')
    })
  })

  describe('4-player mode', () => {
    it('should cycle R -> B -> Y -> G -> R', () => {
      const baseState: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'R',
        players: ['R', 'B', 'Y', 'G'],
        phase: 'placing',
      }

      const afterR = applyAction(baseState, { type: 'place', pos: { x: 0, y: 0 } })
      expect(afterR.turn).toBe('B')

      const afterB = applyAction(afterR, { type: 'place', pos: { x: 1, y: 0 } })
      expect(afterB.turn).toBe('Y')

      const afterY = applyAction(afterB, { type: 'place', pos: { x: 2, y: 0 } })
      expect(afterY.turn).toBe('G')

      const afterG = applyAction(afterY, { type: 'place', pos: { x: 3, y: 0 } })
      expect(afterG.turn).toBe('R')
    })

    it('should handle starting from G player', () => {
      const state: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'G',
        players: ['R', 'B', 'Y', 'G'],
        phase: 'placing',
      }

      const newState = applyAction(state, { type: 'place', pos: { x: 3, y: 3 } })

      expect(newState.turn).toBe('R')
    })
  })

  describe('action effects should be preserved', () => {
    it('should still place stones correctly', () => {
      const state: GameSnapshot = {
        board: makeEmptyBoard(),
        turn: 'R',
        players: ['R', 'B', 'Y'],
        phase: 'placing',
      }

      const newState = applyAction(state, { type: 'place', pos: { x: 3, y: 3 } })

      expect(newState.board[3][3].stone).toBe('R')
    })

    it('should still build walls correctly', () => {
      const board = makeEmptyBoard()
      board[3][3].stone = 'R'

      const state: GameSnapshot = {
        board,
        turn: 'R',
        players: ['R', 'B', 'Y', 'G'],
        phase: 'playing',
      }

      const newState = applyAction(state, { type: 'wall', pos: { x: 3, y: 3 }, dir: 'top' })

      expect(newState.board[3][3].wallTop).toBe('R')
      expect(newState.turn).toBe('B')
    })
  })
})
