import { beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'

beforeAll(() => {
  if (typeof window === 'undefined') {
    const dom = new JSDOM('<!doctype html><html><body></body></html>')
    globalThis.window = dom.window as DOMWindow & typeof globalThis
    globalThis.document = dom.window.document
    globalThis.navigator = dom.window.navigator
  }
})

import { act, renderHook } from '@testing-library/react'
import { useGame } from './index'
import { BOARD_SIZE, PLAYER_LIST, STONES_PER_PLAYER, type Pos } from '@/lib/types'
import { describe, it, expect } from 'vitest'
import type { DOMWindow } from 'jsdom'

describe('Game Store', () => {
  it('placeStone: 正確擺子與換手', () => {
    const { result } = renderHook(() => useGame())
    const pos: Pos = { x: 0, y: 0 }
    act(() => {
      result.current.placeStone(pos)
    })
    expect(result.current.board[0][0].stone).toBe(PLAYER_LIST[0])
    expect(result.current.turn).toBe(PLAYER_LIST[1])
    expect(result.current.phase).toBe('placing')
  })

  it('placeStone: 擺滿進入 playing', () => {
    const { result } = renderHook(() => useGame())
    for (let i = 0; i < PLAYER_LIST.length * STONES_PER_PLAYER; i++) {
      const pos: Pos = { x: Math.floor(i / BOARD_SIZE), y: i % BOARD_SIZE }
      act(() => {
        result.current.placeStone(pos)
      })
    }
    expect(result.current.phase).toBe('playing')
  })

  it('moveTo: 棋子移動與步數', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    for (let i = 2; i < PLAYER_LIST.length * STONES_PER_PLAYER; i++) {
      act(() => {
        result.current.placeStone({
          x: i % BOARD_SIZE,
          y: Math.floor(i / BOARD_SIZE),
        })
      })
    }
    act(() => {
      result.current.selectStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.moveTo({ x: 0, y: 1 })
    })
    expect(result.current.board[0][0].stone).toBe(null)
    expect(result.current.board[1][0].stone).toBe(PLAYER_LIST[0])
  })

  it('buildWall: 能建牆', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    for (let i = 2; i < PLAYER_LIST.length * STONES_PER_PLAYER; i++) {
      act(() => {
        result.current.placeStone({
          x: i % BOARD_SIZE,
          y: Math.floor(i / BOARD_SIZE),
        })
      })
    }
    act(() => {
      result.current.selectStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.buildWall({ x: 0, y: 0 }, 'top')
    })
    expect(result.current.board[0][0].wallTop).toBe(PLAYER_LIST[0])
  })

  it('undo/redo: 歷史紀錄正確', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    expect(result.current.canUndo).toBe(true)
    act(() => {
      result.current.undo()
    })
    expect(result.current.board[0][1].stone).toBe(null)
    act(() => {
      result.current.redo()
    })
    expect(result.current.board[0][1].stone).toBe(PLAYER_LIST[1])
  })

  it('resetGame: 可 undo 回到前局', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.resetGame()
    })
    expect(result.current.board[0][0].stone).toBe(null)
    act(() => {
      result.current.undo()
    })
    expect(result.current.board[0][0].stone).toBe(PLAYER_LIST[0])
  })

  it('多步 undo/redo', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 2, y: 0 })
    })
    act(() => {
      result.current.undo()
    })
    act(() => {
      result.current.undo()
    })
    expect(result.current.board[0][0].stone).toBe(PLAYER_LIST[0])
    expect(result.current.board[0][1].stone).toBe(null)
    act(() => {
      result.current.redo()
    })
    expect(result.current.board[0][1].stone).toBe(PLAYER_LIST[1])
  })

  it('placeStone: 不可重複下子', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    expect(result.current.board[0][0].stone).toBe(PLAYER_LIST[0])
  })

  it('moveTo: 非法移動不會改變狀態', () => {
    const { result } = renderHook(() => useGame())
    for (let i = 0; i < PLAYER_LIST.length * STONES_PER_PLAYER; i++) {
      act(() => {
        result.current.placeStone({
          x: i % BOARD_SIZE,
          y: Math.floor(i / BOARD_SIZE),
        })
      })
    }
    act(() => {
      result.current.selectStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.moveTo({ x: 6, y: 6 })
    })
    expect(result.current.board[0][0].stone).toBe(PLAYER_LIST[0])
    expect(result.current.board[6][6].stone).toBe(null)
  })

  it('buildWall: 非法建牆不會改變狀態', () => {
    const { result } = renderHook(() => useGame())
    for (let i = 0; i < PLAYER_LIST.length * STONES_PER_PLAYER; i++) {
      act(() => {
        result.current.placeStone({
          x: i % BOARD_SIZE,
          y: Math.floor(i / BOARD_SIZE),
        })
      })
    }
    act(() => {
      result.current.selectStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.buildWall({ x: 0, y: 0 }, 'top')
    })
    act(() => {
      result.current.buildWall({ x: 0, y: 0 }, 'top')
    })
    expect(result.current.board[0][0].wallTop).toBe(PLAYER_LIST[0])
  })

  it('遊戲結束後操作無效', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.setPhase('finished')
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    expect(result.current.board[0][1].stone).toBe(null)
  })

  it('undo/redo 邊界不可再操作', () => {
    const { result } = renderHook(() => useGame())
    expect(result.current.canUndo).toBe(false)
    act(() => {
      result.current.undo()
    })
    expect(result.current.canUndo).toBe(false)
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.undo()
    })
    expect(result.current.canUndo).toBe(false)
    act(() => {
      result.current.redo()
    })
    expect(result.current.canRedo).toBe(false)
  })

  it('undo 時應跳過 AI 回合', () => {
    const { result } = renderHook(() => useGame())
    act(() => {
      result.current.setHumanSide('R')
    })
    act(() => {
      result.current.placeStone({ x: 0, y: 0 })
    })
    act(() => {
      result.current.placeStone({ x: 1, y: 0 })
    })
    act(() => {
      result.current.undo()
    })
    expect(result.current.turn).toBe('R')
  })
})
