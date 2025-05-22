import { describe, it, expect } from 'vitest'
import { checkGameEnd } from './checkGameEnd'
import { BOARD_SIZE, PLAYER_LIST, type Cell } from '../lib/types'

function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ stone: null, wallTop: null, wallLeft: null }))
  )
}

describe('checkGameEnd', () => {
  it('returns unfinished for empty board', () => {
    const board = makeEmptyBoard()
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(false)
    expect(result.score).toBeDefined()
  })

  it('detects win by territory', () => {
    const board = makeEmptyBoard()
    board[0][0].stone = 'R'
    board[BOARD_SIZE-1][BOARD_SIZE-1].stone = 'B'
    // 填滿一方領地
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < Math.floor(BOARD_SIZE/2); x++) {
        board[y][x].stone = 'R'
      }
    }
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.winner).toBe('R')
    expect(result.tie).not.toBe(true)
  })

  it('detects tie', () => {
    const board = makeEmptyBoard()
    // 雙方領地一樣大
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        board[y][x].stone = (x < BOARD_SIZE/2) ? 'R' : 'B'
      }
    }
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.tie).toBe(true)
  })
})
