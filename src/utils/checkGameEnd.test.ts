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

  it('detects win by territory with walls', () => {
    const board = makeEmptyBoard()
    // 紅方圍一個 2x2 區域，牆壁完全圍住
    board[0][0].stone = 'R'
    board[0][1].stone = 'R'
    board[1][0].stone = 'R'
    board[1][1].stone = 'R'
    // 上牆
    board[0][0].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[0][1].wallTop = 'R'
    board[1][0].wallLeft = 'R'
    board[1][0].wallTop = 'R'
    board[1][1].wallLeft = 'R'
    // 這樣 (0,0)-(1,1) 會被視為紅方純淨領地
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.winner).toBe('R')
    expect(result.tie).not.toBe(true)
  })

  it('detects tie by territory with walls', () => {
    const board = makeEmptyBoard()
    // 左上 2x2 紅方，右下 2x2 藍方，各自用牆壁圍住
    // 紅方區域
    board[0][0].stone = 'R'
    board[0][1].stone = 'R'
    board[1][0].stone = 'R'
    board[1][1].stone = 'R'
    // 紅方牆壁（上、左）
    board[0][0].wallTop = 'R'
    board[0][1].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[1][0].wallLeft = 'R'
    // 紅方下牆（2,0/2,1 的 wallTop）
    board[2][0].wallTop = 'R'
    board[2][1].wallTop = 'R'
    // 紅方右牆（0,2/1,2 的 wallLeft）
    board[0][2].wallLeft = 'R'
    board[1][2].wallLeft = 'R'
    // 藍方區域
    const N = BOARD_SIZE
    board[N-2][N-2].stone = 'B'
    board[N-2][N-1].stone = 'B'
    board[N-1][N-2].stone = 'B'
    board[N-1][N-1].stone = 'B'
    // 藍方牆壁（上、左）
    board[N-2][N-2].wallTop = 'B'
    board[N-2][N-1].wallTop = 'B'
    board[N-2][N-2].wallLeft = 'B'
    board[N-1][N-2].wallLeft = 'B'
    // 藍方下牆（6,5/6,6 的 wallTop）
    board[N-1][N-2].wallTop = 'B'
    board[N-1][N-1].wallTop = 'B'
    // 藍方右牆（5,6/6,6 的 wallLeft）
    board[N-2][N-1].wallLeft = 'B'
    board[N-1][N-1].wallLeft = 'B'
    const result = checkGameEnd(board, [...PLAYER_LIST])
    expect(result.finished).toBe(true)
    expect(result.tie).toBe(true)
  })

  it('detects tie with one stone each, fully walled', () => {
    // 測試 4x4 棋盤，紅藍各一顆棋子，各自用牆壁圍住
    const N = 4
    const board: Cell[][] = Array.from({ length: N }, () =>
      Array.from({ length: N }, () => ({ stone: null, wallTop: null, wallLeft: null }))
    )
    // 紅方 (0,0)
    board[0][0].stone = 'R'
    board[0][0].wallTop = 'R'
    board[0][0].wallLeft = 'R'
    board[1][0].wallTop = 'R'
    board[0][1].wallLeft = 'R'
    // 藍方 (3,3)
    board[3][3].stone = 'B'
    board[3][3].wallLeft = 'B'
    board[3][3].wallTop = 'B'
    board[2][3].wallLeft = 'B'
    board[3][2].wallTop = 'B'
    // 只測紅藍各一顆棋子，且完全隔開
    const result = checkGameEnd(board, ['R', 'B'])
    expect(result.finished).toBe(true)
    expect(result.tie).toBe(true)
    expect(result.score?.R).toBe(1)
    expect(result.score?.B).toBe(1)
  })
})
