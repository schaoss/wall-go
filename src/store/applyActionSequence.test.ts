import { describe, it, expect, beforeEach } from 'vitest'
import { useGame } from '@/store/index'

// helper removed: unused (was causing tsc no-unused error)

describe('applyActionSequence (store)', () => {
  beforeEach(() => {
    useGame.getState().resetGame()
  })

  it('applies move + followUp atomically and advances turn', () => {
    const state = useGame.getState()
    // set players to 2 and a simple board
    state.setPlayers(['R', 'B'])
    state.setPhase('playing')

    // place a stone for R at 2,2
    state.placeStone({ x: 2, y: 2 })
    // ensure turn advanced to B after placeStone
    // now manually set back to R for testing move
    state.setPlayers(['R', 'B'])
    // make sure R has a stone
    state.resetGame()
    state.setPlayers(['R', 'B'])
    // place initial stones
    state.placeStone({ x: 2, y: 2 })
    state.placeStone({ x: 0, y: 0 })

    // set to playing and ensure it's R's turn
    state.setPhase('playing')
    // find a cell with R stone (no local variable needed)
    // create action: move from 2,2 to 3,2 with followUp wall top
    const action = {
      type: 'move' as const,
      from: { x: 2, y: 2 },
      pos: { x: 3, y: 2 },
      followUp: { type: 'wall' as const, pos: { x: 3, y: 2 }, dir: 'top' as const },
    }

    // call applyActionSequence
    // applyActionSequence is optional on State typing; cast to unknown->Function to avoid eslint no-explicit-any
    ;(useGame.getState().applyActionSequence as unknown as (a?: unknown) => void)(action)

    const after = useGame.getState()
    // moved piece should be at target
    expect(after.board[2][3].stone).toBe('R')
    // wallTop should be set at pos
    expect(after.board[2][3].wallTop).toBe('R')
    // turn should have advanced to next player
    expect(after.turn).toBe('B')
  })
})
