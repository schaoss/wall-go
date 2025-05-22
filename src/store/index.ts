import { create } from 'zustand'
import { PLAYER_LIST, type Pos, type WallDir } from '../lib/types'
import { makeInitialState, snapshotFromState, restoreSnapshot, type State } from './gameState'
import { createHistoryHandlers } from './history'
import { placingTurnIndex, advanceTurn } from './actions'
import { isLegalMove } from '../utils/isLegalMove'
import { checkGameEnd } from '../utils/checkGameEnd'

export const useGame = create<State>((_set, get) => {
  // 包一層 set，讓每次 set 都自動同步 canUndo/canRedo
  const set: typeof _set = (partial, replace) => {
    if (replace === true) {
      // 直接覆蓋
      _set(partial as State, true)
    } else {
      _set((state) => {
        const next = typeof partial === 'function' ? partial(state) : partial
        // 類型安全取得 _history/_future
        const _history = (typeof next === 'object' && next && '_history' in next && Array.isArray((next as Partial<State>)._history))
          ? (next as Partial<State>)._history!
          : state._history
        const _future = (typeof next === 'object' && next && '_future' in next && Array.isArray((next as Partial<State>)._future))
          ? (next as Partial<State>)._future!
          : state._future
        return {
          ...state,
          ...next,
          canUndo: _history.length > 1,
          canRedo: _future.length > 0,
        }
      })
    }
  }
  // --- history ---
  const { pushHistory, popHistory, popFuture } = createHistoryHandlers(
    get,
    set,
    (state) => {
      // snapshot 只存遊戲狀態，不存 _history/_future/undo/redo/canUndo/canRedo
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _history: _, _future: __, undo: ___, redo: ____, canUndo: _____, canRedo: ______, ...rest } = state
      return snapshotFromState(rest)
    },
    restoreSnapshot
  )
  const PLAYERS = [...PLAYER_LIST]

  // 初始化時 _history 應包含初始狀態
  const initial = makeInitialState()
  return {
    ...initial,
    _history: [snapshotFromState(initial)],
    _future: [],
    canUndo: false,
    canRedo: false,
    undo() { popHistory() },
    redo() { popFuture() },
    placeStone(pos: Pos) {
      const { board, players, stonesPlaced, stonesLimit, phase } = get()
      if (phase === 'finished') return
      const totalPlaced = Object.values(stonesPlaced).reduce((a, b) => a + b, 0)
      const currentIdx = placingTurnIndex(totalPlaced, players.length)
      const currentPlayer = players[currentIdx]
      if (board[pos.y][pos.x].stone) return
      // Deep copy for history snapshot
      pushHistory(undefined)
      // Deep copy for mutation
      const next = deepCopyStateData(get())
      next.board![pos.y][pos.x].stone = currentPlayer
      next.stonesPlaced![currentPlayer]++
      const newTotal = totalPlaced + 1
      const nextIdx = placingTurnIndex(newTotal, players.length)
      const nextPlayer = players[nextIdx]
      const allDone = Object.values(next.stonesPlaced!).every(c => c === stonesLimit)
      next.turn = nextPlayer
      next.phase = (allDone ? 'playing' : 'placing') as import('../lib/types').Phase
      next.selected = undefined
      next.legal = new Set<string>()
      next.stepsTaken = 0
      next.skipReason = undefined
      next.result = undefined
      set(next)
    },
    selectStone(pos: Pos) {
      const { board, turn, stepsTaken, phase } = get()
      if (phase !== 'playing') return
      if (stepsTaken > 0) return
      if (board[pos.y][pos.x].stone !== turn) return
      const legal = new Set<string>()
      for (let yy = 0; yy < board.length; yy++) {
        for (let xx = 0; xx < board.length; xx++) {
          if (isLegalMove(pos, { x: xx, y: yy }, board)) {
            legal.add(`${xx},${yy}`)
          }
        }
      }
      set({ selected: pos, legal, stepsTaken: 0, skipReason: undefined })
    },
    moveTo(to: Pos) {
      const { selected, board, legal, stepsTaken, phase } = get()
      if (phase !== 'playing') return
      if (!selected) return
      if (!legal.has(`${to.x},${to.y}`)) return
      const piece = board[selected.y][selected.x].stone
      if (!piece) return
      // Deep copy for history snapshot
      pushHistory(undefined)
      // Deep copy for mutation
      const next = deepCopyStateData(get())
      next.board![selected.y][selected.x].stone = null
      next.board![to.y][to.x].stone = piece
      const dist = Math.abs(to.x - selected.x) + Math.abs(to.y - selected.y)
      const newSteps = stepsTaken + dist
      const nextLegal = new Set<string>()
      if (newSteps < 2) {
        for (let yy = 0; yy < next.board!.length; yy++) {
          for (let xx = 0; xx < next.board!.length; xx++) {
            if (isLegalMove(to, { x: xx, y: yy }, next.board!, 2 - newSteps)) {
              nextLegal.add(`${xx},${yy}`)
            }
          }
        }
      }
      next.selected = to
      next.legal = nextLegal
      next.stepsTaken = newSteps
      next.skipReason = undefined
      set(next)
    },
    buildWall(pos: Pos, dir: WallDir) {
      const { board, turn, selected, phase } = get()
      if (phase !== 'playing') return
      if (!selected || selected.x !== pos.x || selected.y !== pos.y) return
      // Check if wall can be built before mutating
      if (dir === 'top') {
        if (pos.y === 0 || board[pos.y][pos.x].wallTop !== null) return
      } else if (dir === 'left') {
        if (pos.x === 0 || board[pos.y][pos.x].wallLeft !== null) return
      } else if (dir === 'right') {
        if (pos.x + 1 >= board.length || board[pos.y][pos.x + 1].wallLeft !== null) return
      } else if (dir === 'bottom') {
        if (pos.y + 1 >= board.length || board[pos.y + 1][pos.x].wallTop !== null) return
      } else {
        return
      }
      // Deep copy for history snapshot
      pushHistory(undefined)
      // Deep copy for mutation
      const next = deepCopyStateData(get())
      const cell = next.board![pos.y][pos.x]
      if (dir === 'top') {
        cell.wallTop = turn
      } else if (dir === 'left') {
        cell.wallLeft = turn
      } else if (dir === 'right') {
        next.board![pos.y][pos.x + 1].wallLeft = turn
      } else if (dir === 'bottom') {
        next.board![pos.y + 1][pos.x].wallTop = turn
      }
      const end = checkGameEnd(next.board!, PLAYERS)
      if (end.finished) {
        next.phase = 'finished' as import('../lib/types').Phase
        next.result = end
        next.selected = undefined
        next.legal = new Set<string>()
        next.stepsTaken = 0
        set(next)
        return
      }
      const { turn: nextTurn, skipReason } = advanceTurn(next.board!, turn, PLAYERS)
      if (skipReason === 'allBlocked') {
        const endB = checkGameEnd(next.board!, PLAYERS)
        if (!endB.finished) {
          endB.finished = true
          endB.tie = true
        }
        next.phase = 'finished' as import('../lib/types').Phase
        next.result = endB
        next.selected = undefined
        next.legal = new Set<string>()
        next.stepsTaken = 0
        next.skipReason = undefined
        set(next)
        return
      }
      next.selected = undefined
      next.turn = nextTurn
      next.legal = new Set<string>()
      next.stepsTaken = 0
      next.skipReason = skipReason
      set(next)
    },
    resetGame() {
      const initial = makeInitialState()
      // Deep copy for history snapshot
      pushHistory(undefined)
      set({
        ...initial,
        _history: [snapshotFromState(initial)],
        _future: [],
      })
    },
    setPhase(phase) { set({ phase }) },
  }
})

// Utility to deep copy only the data fields of State (not methods)
function deepCopyStateData(state: State): Partial<State> {
  return {
    board: state.board.map(row => row.map(cell => ({ ...cell }))),
    stonesPlaced: { ...state.stonesPlaced },
    players: [...state.players],
    selected: state.selected ? { ...state.selected } : undefined,
    legal: new Set(state.legal),
    result: state.result ? JSON.parse(JSON.stringify(state.result)) : undefined,
    turn: state.turn,
    stepsTaken: state.stepsTaken,
    phase: state.phase,
    stonesLimit: state.stonesLimit,
    skipReason: state.skipReason,
    // _history and _future are not copied here
  }
}
