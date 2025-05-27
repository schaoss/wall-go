import { describe, it, expect } from 'vitest'
import { checkGameEnd } from './game'
import { BOARD_SIZE, PLAYER_LIST, type Cell } from '../lib/types'

function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      stone: null,
      wallTop: null,
      wallLeft: null,
    })),
  )
}

describe('checkGameEnd', () => {
  it('returns unfinished for empty board', () => {
    const board = makeEmptyBoard()
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(false)
    expect(result.score).toBeDefined()
  })

  it('detects win by territory with walls', () => {
    const board = makeEmptyBoard()
    board[0][0].stone = 'R'
    board[0][1].stone = 'R'
    board[1][0].stone = 'R'
    board[1][1].stone = 'R'
    board[0][0].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[0][1].wallTop = 'R'
    board[1][0].wallLeft = 'R'
    board[1][0].wallTop = 'R'
    board[1][1].wallLeft = 'R'
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.winner).toBe('R')
    expect(result.tie).not.toBe(true)
  })

  it('detects tie by territory with walls', () => {
    const board = makeEmptyBoard()
    board[0][0].stone = 'R'
    board[0][1].stone = 'R'
    board[1][0].stone = 'R'
    board[1][1].stone = 'R'
    board[0][0].wallTop = 'R'
    board[0][1].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[1][0].wallLeft = 'R'
    board[2][0].wallTop = 'R'
    board[2][1].wallTop = 'R'
    board[0][2].wallLeft = 'R'
    board[1][2].wallLeft = 'R'
    const N = BOARD_SIZE
    board[N - 2][N - 2].stone = 'B'
    board[N - 2][N - 1].stone = 'B'
    board[N - 1][N - 2].stone = 'B'
    board[N - 1][N - 1].stone = 'B'
    board[N - 2][N - 2].wallTop = 'B'
    board[N - 2][N - 1].wallTop = 'B'
    board[N - 2][N - 2].wallLeft = 'B'
    board[N - 1][N - 2].wallLeft = 'B'
    board[N - 1][N - 2].wallTop = 'B'
    board[N - 1][N - 1].wallTop = 'B'
    board[N - 2][N - 1].wallLeft = 'B'
    board[N - 1][N - 1].wallLeft = 'B'
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.tie).toBe(true)
  })

  it('detects tie with one stone each, fully walled', () => {
    const N = 4
    const board: Cell[][] = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => ({
        stone: null,
        wallTop: null,
        wallLeft: null,
      })),
    )
    board[0][0].stone = 'R'
    board[0][0].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[1][0].wallTop = 'R'
    board[0][1].wallLeft = 'R'
    board[3][3].stone = 'B'
    board[3][3].wallLeft = 'B'
    board[3][3].wallTop = 'B'
    board[2][3].wallLeft = 'B'
    board[3][2].wallTop = 'B'
    const result = checkGameEnd(board, ['R', 'B'])
    expect(result.finished).toBe(true)
    expect(result.tie).toBe(true)
    expect(result.score?.R).toBe(1)
    expect(result.score?.B).toBe(1)
  })
})
