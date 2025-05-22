import { describe, it, expect } from 'vitest'
import { isLegalMove } from './isLegalMove'
import { BOARD_SIZE, type Cell, type Pos } from '../lib/types'

function makeBoardWithStone(from: Pos, to?: Pos): Cell[][] {
  const board: Cell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ stone: null, wallTop: null, wallLeft: null }))
  )
  board[from.y][from.x].stone = 'R'
  if (to) board[to.y][to.x].stone = 'B'
  return board
}

describe('isLegalMove', () => {
  it('allows adjacent move', () => {
    const board = makeBoardWithStone({ x: 3, y: 3 })
    expect(isLegalMove({ x: 3, y: 3 }, { x: 3, y: 4 }, board)).toBe(true)
    expect(isLegalMove({ x: 3, y: 3 }, { x: 4, y: 3 }, board)).toBe(true)
  })

  it('blocks move by wall', () => {
    const board = makeBoardWithStone({ x: 2, y: 2 })
    board[2][2].wallTop = 'R'
    expect(isLegalMove({ x: 2, y: 2 }, { x: 2, y: 1 }, board)).toBe(false)
  })

  it('blocks move by stone', () => {
    const board = makeBoardWithStone({ x: 1, y: 1 }, { x: 1, y: 2 })
    expect(isLegalMove({ x: 1, y: 1 }, { x: 1, y: 2 }, board)).toBe(false)
  })

  it('disallows move beyond maxSteps', () => {
    const board = makeBoardWithStone({ x: 0, y: 0 })
    expect(isLegalMove({ x: 0, y: 0 }, { x: 0, y: 3 }, board, 2)).toBe(false)
  })
})
