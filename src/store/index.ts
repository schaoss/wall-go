// Zustand store for Wall Go with robust undo/redo and deep copy history pattern
import { create } from 'zustand'
import { type Pos, type WallDir, type State } from '@/lib/types'
import { makeInitialState, snapshotFromState, restoreSnapshot } from './gameState'
import { createHistoryHandlers } from './history'
import { placingTurnIndex, advanceTurn } from './actions'
import { isLegalMove } from '@/utils/move'
import { checkGameEnd } from '@/utils/game'
import { isHumanTurn } from '@/utils/player'

// This store uses a functional set pattern for all mutating actions.
// Each mutation pushes a deep copy of the current state to history BEFORE mutation.
// All mutations operate on a deep copy, and the new state is returned with updated _history/_future.
export const useGame = create<State>((_set, get) => {
  // Patch set to always update canUndo/canRedo
  const set: typeof _set = (partial, replace) => {
    if (replace === true) {
      _set(partial as State, true)
    } else {
      _set((state) => {
        const next = typeof partial === 'function' ? partial(state) : partial
        const _history =
          typeof next === 'object' &&
          next &&
          '_history' in next &&
          Array.isArray((next as Partial<State>)._history)
            ? (next as Partial<State>)._history!
            : state._history
        const _future =
          typeof next === 'object' &&
          next &&
          '_future' in next &&
          Array.isArray((next as Partial<State>)._future)
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
  createHistoryHandlers(
    get,
    set,
    (state) => {
      // snapshot 只存遊戲狀態，不存 _history/_future/undo/redo/canUndo/canRedo

      const {
        _history: _,
        _future: __,
        undo: ___,
        redo: ____,
        canUndo: _____,
        canRedo: ______,
        ...rest
      } = state
      return snapshotFromState(rest)
    },
    restoreSnapshot,
  )
  // 初始化時 _history 應包含初始狀態
  const initial = makeInitialState()
  return {
    ...initial,
    _history: [snapshotFromState(initial)],
    _future: [],
    canUndo: false,
    canRedo: false,
    humanSide: null,
    undo() {
      // 快轉直到回到 human 玩家
      const { _future, _history, humanSide } = get()
      if (_history.length <= 1) return
      let idx = _history.length - 2
      while (idx > 0 && !isHumanTurn(_history[idx], humanSide)) idx--
      const prev = _history[idx]
      set({
        ...restoreSnapshot(prev),
        _history: _history.slice(0, idx + 1),
        _future: [..._history.slice(idx + 1), ..._future],
      })
    },
    redo() {
      // 快轉直到回到 human 玩家
      const { _future, _history, humanSide } = get()
      if (_future.length === 0) return
      let idx = 0
      while (idx < _future.length - 1 && !isHumanTurn(_future[idx], humanSide)) idx++
      const next = _future[idx]
      set({
        ...restoreSnapshot(next),
        _history: [..._history, ..._future.slice(0, idx + 1)],
        _future: _future.slice(idx + 1),
      })
    },
    setHumanSide(side) {
      set({ humanSide: side })
    },
    placeStone(pos: Pos) {
      set((state) => {
        const { board, players, stonesPlaced, stonesLimit, phase } = state
        if (phase !== 'placing') return state
        const totalPlaced = Object.values(stonesPlaced).reduce((a, b) => a + b, 0)
        const currentIdx = placingTurnIndex(totalPlaced, state.players.length)
        const currentPlayer = players[currentIdx]
        if (board[pos.y][pos.x].stone) return state
        // Mutate a deep copy of state
        const next = snapshotFromState(state)
        next.board[pos.y][pos.x].stone = currentPlayer
        next.stonesPlaced[currentPlayer]++
        const newTotal = totalPlaced + 1
        const nextIdx = placingTurnIndex(newTotal, players.length)
        const nextPlayer = players[nextIdx]
        const allDone = players.every((player) => next.stonesPlaced[player] === stonesLimit)
        next.turn = nextPlayer
        next.phase = (allDone ? 'playing' : 'placing') as import('@/lib/types').Phase
        next.selected = undefined
        next.legal = new Set<string>()
        next.stepsTaken = 0
        next.skipReason = undefined
        next.result = undefined
        // Push the new state (after mutation) to history
        const newHistory = [...state._history, snapshotFromState(next)]
        return {
          ...next,
          _history: newHistory,
          _future: [],
        }
      })
    },
    selectStone(pos: Pos) {
      set((state) => {
        const { board, turn, stepsTaken, phase } = state
        if (phase !== 'playing') return state
        if (stepsTaken > 0) return state
        if (board[pos.y][pos.x].stone !== turn) return state
        const legal = new Set<string>()
        for (let yy = 0; yy < board.length; yy++) {
          for (let xx = 0; xx < board.length; xx++) {
            if (isLegalMove(pos, { x: xx, y: yy }, board)) {
              legal.add(`${xx},${yy}`)
            }
          }
        }
        return {
          ...state,
          selected: pos,
          legal,
          stepsTaken: 0,
          skipReason: undefined,
        }
      })
    },
    moveTo(to: Pos) {
      set((state) => {
        const { selected, board, legal, stepsTaken, phase } = state
        if (phase !== 'playing') return state
        if (!selected) return state
        if (!legal.has(`${to.x},${to.y}`)) return state
        const piece = board[selected.y][selected.x].stone
        if (!piece) return state
        // Mutate a deep copy of state
        const next = snapshotFromState(state)
        next.board[selected.y][selected.x].stone = null
        next.board[to.y][to.x].stone = piece
        const dist = Math.abs(to.x - selected.x) + Math.abs(to.y - selected.y)
        const newSteps = stepsTaken + dist
        const nextLegal = new Set<string>()
        if (newSteps < 2) {
          for (let yy = 0; yy < next.board.length; yy++) {
            for (let xx = 0; xx < next.board.length; xx++) {
              if (isLegalMove(to, { x: xx, y: yy }, next.board, 2 - newSteps)) {
                nextLegal.add(`${xx},${yy}`)
              }
            }
          }
        }
        next.selected = to
        next.legal = nextLegal
        next.stepsTaken = newSteps
        next.skipReason = undefined
        // Push the new state (after mutation) to history
        const newHistory = [...state._history, snapshotFromState(next)]
        return {
          ...next,
          _history: newHistory,
          _future: [],
        }
      })
    },
    buildWall(pos: Pos, dir: WallDir) {
      set((state) => {
        const { board, turn, selected, phase } = state
        if (phase !== 'playing') return state
        if (!selected || selected.x !== pos.x || selected.y !== pos.y) return state
        // Check if wall can be built before mutating
        if (dir === 'top') {
          if (pos.y === 0 || board[pos.y][pos.x].wallTop !== null) return state
        } else if (dir === 'left') {
          if (pos.x === 0 || board[pos.y][pos.x].wallLeft !== null) return state
        } else if (dir === 'right') {
          if (pos.x + 1 >= board.length || board[pos.y][pos.x + 1].wallLeft !== null) return state
        } else if (dir === 'bottom') {
          if (pos.y + 1 >= board.length || board[pos.y + 1][pos.x].wallTop !== null) return state
        } else {
          return state
        }
        // Mutate a deep copy of state
        const next = snapshotFromState(state)
        const cell = next.board[pos.y][pos.x]
        if (dir === 'top') {
          cell.wallTop = turn
        } else if (dir === 'left') {
          cell.wallLeft = turn
        } else if (dir === 'right') {
          next.board[pos.y][pos.x + 1].wallLeft = turn
        } else if (dir === 'bottom') {
          next.board[pos.y + 1][pos.x].wallTop = turn
        }
        const end = checkGameEnd(next.board, next.players)
        if (end.finished) {
          next.phase = 'finished' as import('@/lib/types').Phase
          next.result = end
          next.selected = undefined
          next.legal = new Set<string>()
          next.stepsTaken = 0
          // Push the new state (after mutation) to history
          const newHistory = [...state._history, snapshotFromState(next)]
          return {
            ...next,
            _history: newHistory,
            _future: [],
          }
        }
        const { turn: nextTurn, skipReason } = advanceTurn(next.board, turn, next.players)
        if (skipReason === 'allBlocked') {
          const endB = checkGameEnd(next.board, next.players)
          if (!endB.finished) {
            endB.finished = true
            endB.tie = true
          }
          next.phase = 'finished' as import('@/lib/types').Phase
          next.result = endB
          next.selected = undefined
          next.legal = new Set<string>()
          next.stepsTaken = 0
          next.skipReason = undefined
          // Push the new state (after mutation) to history
          const newHistory = [...state._history, snapshotFromState(next)]
          return {
            ...next,
            _history: newHistory,
            _future: [],
          }
        }
        next.selected = undefined
        next.turn = nextTurn
        next.legal = new Set<string>()
        next.stepsTaken = 0
        next.skipReason = skipReason
        // Push the new state (after mutation) to history
        const newHistory = [...state._history, snapshotFromState(next)]
        return {
          ...next,
          _history: newHistory,
          _future: [],
        }
      })
    },
    resetGame() {
      set((state) => {
        // Use current players instead of default ones
        const initial = makeInitialState(state.players)
        return {
          ...initial,
          phase: 'placing',
          _history: [snapshotFromState({ ...initial, phase: 'placing' })],
          _future: [],
        }
      })
    },
    setPhase(phase) {
      set({ phase })
    },
    setPlayers(players: import('@/lib/types').Player[]) {
      set((state) => ({
        ...state,
        players,
        turn: players[0],
        phase: state.phase === 'selecting' ? 'placing' : state.phase, // 只有在 selecting 時才自動進入 placing
        stepsTaken: 0,
        selected: undefined,
        legal: new Set(),
        result: undefined,
        skipReason: undefined,
        stonesPlaced: Object.fromEntries(players.map((p) => [p, 0])) as Record<string, number>,
      }))
    },
  }
})
