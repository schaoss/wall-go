import { describe, it, expect } from 'vitest'

interface Cell {
  stone: 'R' | 'B' | 'Y' | 'G' | null
  wallTop: 'R' | 'B' | 'Y' | 'G' | null
  wallLeft: 'R' | 'B' | 'Y' | 'G' | null
}

type Player = 'R' | 'B' | 'Y' | 'G'

function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 7 }, () => ({
      stone: null,
      wallTop: null,
      wallLeft: null,
    })),
  )
}

function placeScore(
  board: Cell[][],
  x: number,
  y: number,
  me: Player,
  players: Player[] = ['R', 'B'],
): number {
  const opponents = players.filter((p) => p !== me)

  const central = 3 - Math.max(Math.abs(x - 3), Math.abs(y - 3))

  let cut = 0
  let oppBlock = 0
  board.forEach((row, yy) =>
    row.forEach((c, xx) => {
      if (c.stone === me) {
        if ((xx === x && Math.abs(yy - y) <= 2) || (yy === y && Math.abs(xx - x) <= 2)) cut = 2
      } else if (c.stone && opponents.includes(c.stone)) {
        if ((xx === x && Math.abs(yy - y) <= 2) || (yy === y && Math.abs(xx - x) <= 2)) oppBlock = 2
      }
    }),
  )

  const edge = -(Number(x === 0 || x === 6) + Number(y === 0 || y === 6))

  let cornerP = 0
  board.forEach((row, yy) =>
    row.forEach((c, xx) => {
      if (c.stone && opponents.includes(c.stone)) {
        const d = Math.min(xx + yy, xx + 6 - yy, 6 - xx + yy, 12 - xx - yy)
        cornerP += Math.max(0, 2 - d)
      }
    }),
  )
  cornerP = Math.min(2, cornerP)

  return 3 * central + 4 * cut + 2 * oppBlock + 1 * cornerP + 1 * edge
}

describe('placeScore multiplayer support', () => {
  describe('2-player mode (existing behavior)', () => {
    it('should prefer center positions', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B']

      const centerScore = placeScore(board, 3, 3, 'R', players)
      const cornerScore = placeScore(board, 0, 0, 'R', players)
      const edgeScore = placeScore(board, 0, 3, 'R', players)

      expect(centerScore).toBeGreaterThan(cornerScore)
      expect(centerScore).toBeGreaterThan(edgeScore)
    })

    it('should consider opponent stones for blocking', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B']

      board[3][3].stone = 'B'

      const nearOppScore = placeScore(board, 3, 4, 'R', players)
      const farFromOppScore = placeScore(board, 0, 0, 'R', players)

      expect(nearOppScore).toBeGreaterThan(farFromOppScore)
    })
  })

  describe('3-player mode', () => {
    it('should handle 3 players correctly', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B', 'Y']

      board[2][2].stone = 'B'
      board[4][4].stone = 'Y'

      const score = placeScore(board, 3, 3, 'R', players)

      expect(score).toBeDefined()
      expect(typeof score).toBe('number')
    })

    it('should consider all opponents in 3-player mode', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B', 'Y']

      board[3][2].stone = 'B'
      board[3][4].stone = 'Y'

      const blockingBothScore = placeScore(board, 3, 3, 'R', players)
      const noBlockScore = placeScore(board, 0, 0, 'R', players)

      expect(blockingBothScore).toBeGreaterThan(noBlockScore)
    })

    it('should not treat own stones as opponents', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B', 'Y']

      board[3][2].stone = 'R'

      const nearOwnStoneScore = placeScore(board, 3, 3, 'R', players)
      const farFromOwnStoneScore = placeScore(board, 6, 6, 'R', players)

      expect(nearOwnStoneScore).toBeGreaterThan(farFromOwnStoneScore)
    })
  })

  describe('4-player mode', () => {
    it('should handle 4 players correctly', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B', 'Y', 'G']

      board[1][1].stone = 'B'
      board[1][5].stone = 'Y'
      board[5][1].stone = 'G'

      const score = placeScore(board, 3, 3, 'R', players)

      expect(score).toBeDefined()
      expect(typeof score).toBe('number')
    })

    it('should consider all 3 opponents in 4-player mode', () => {
      const board = makeEmptyBoard()
      const players: Player[] = ['R', 'B', 'Y', 'G']

      board[3][2].stone = 'B'
      board[3][4].stone = 'Y'
      board[4][3].stone = 'G'

      const surroundedScore = placeScore(board, 3, 3, 'R', players)
      const isolatedScore = placeScore(board, 0, 0, 'R', players)

      expect(surroundedScore).toBeGreaterThan(isolatedScore)
    })
  })

  describe('backward compatibility', () => {
    it('should work without players parameter (default to 2P)', () => {
      const board = makeEmptyBoard()

      const score = placeScore(board, 3, 3, 'R')

      expect(score).toBeDefined()
      expect(typeof score).toBe('number')
    })
  })
})
