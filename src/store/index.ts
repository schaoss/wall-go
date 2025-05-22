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
      pushHistory()
      const { board, players, stonesPlaced, stonesLimit } = get()
      const totalPlaced = Object.values(stonesPlaced).reduce((a, b) => a + b, 0)
      const currentIdx = placingTurnIndex(totalPlaced, players.length)
      const currentPlayer = players[currentIdx]
      if (board[pos.y][pos.x].stone) return
      board[pos.y][pos.x].stone = currentPlayer
      stonesPlaced[currentPlayer]++
      const newTotal = totalPlaced + 1
      const nextIdx = placingTurnIndex(newTotal, players.length)
      const nextPlayer = players[nextIdx]
      const allDone = Object.values(stonesPlaced).every(c => c === stonesLimit)
      set({
        board: [...board],
        turn: nextPlayer,
        phase: allDone ? 'playing' : 'placing',
        stonesPlaced: { ...stonesPlaced },
        selected: undefined,
        legal: new Set(),
        stepsTaken: 0,
        skipReason: undefined,
        result: undefined,
      })
    },
    selectStone(pos: Pos) {
      const { board, turn, stepsTaken } = get()
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
      pushHistory()
      const { selected, board, legal, stepsTaken } = get()
      if (!selected) return
      if (!legal.has(`${to.x},${to.y}`)) return
      const dist = Math.abs(to.x - selected.x) + Math.abs(to.y - selected.y)
      const newSteps = stepsTaken + dist
      const piece = board[selected.y][selected.x].stone
      board[selected.y][selected.x].stone = null
      board[to.y][to.x].stone = piece
      const nextLegal = new Set<string>()
      if (newSteps < 2) {
        for (let yy = 0; yy < board.length; yy++) {
          for (let xx = 0; xx < board.length; xx++) {
            if (isLegalMove(to, { x: xx, y: yy }, board, 2 - newSteps)) {
              nextLegal.add(`${xx},${yy}`)
            }
          }
        }
      }
      set({
        board: [...board],
        selected: to,
        legal: nextLegal,
        stepsTaken: newSteps,
        skipReason: undefined,
      })
    },
    buildWall(pos: Pos, dir: WallDir) {
      pushHistory()
      const { board, turn, selected } = get()
      if (!selected || selected.x !== pos.x || selected.y !== pos.y) return
      let built = false
      const cell = board[pos.y][pos.x]
      if (dir === 'top') {
        if (pos.y === 0) return
        if (cell.wallTop === null) {
          cell.wallTop = turn
          built = true
        }
      } else if (dir === 'left') {
        if (pos.x === 0) return
        if (cell.wallLeft === null) {
          cell.wallLeft = turn
          built = true
        }
      } else if (dir === 'right') {
        if (pos.x + 1 < board.length && board[pos.y][pos.x + 1].wallLeft === null) {
          board[pos.y][pos.x + 1].wallLeft = turn
          built = true
        }
      } else if (dir === 'bottom') {
        if (pos.y + 1 < board.length && board[pos.y + 1][pos.x].wallTop === null) {
          board[pos.y + 1][pos.x].wallTop = turn
          built = true
        }
      }
      if (!built) return
      const end = checkGameEnd(board, PLAYERS)
      if (end.finished) {
        set({
          board: [...board],
          phase: 'finished',
          result: end,
          selected: undefined,
          legal: new Set(),
          stepsTaken: 0,
        })
        return
      }
      const { turn: nextTurn, skipReason } = advanceTurn(board, turn, PLAYERS)
      if (skipReason === 'allBlocked') {
        const endB = checkGameEnd(board, PLAYERS)
        if (!endB.finished) {
          endB.finished = true
          endB.tie = true
        }
        set({
          board: [...board],
          phase: 'finished',
          result: endB,
          selected: undefined,
          legal: new Set(),
          stepsTaken: 0,
          skipReason: undefined,
        })
        return
      }
      set({
        board: [...board],
        selected: undefined,
        turn: nextTurn,
        legal: new Set(),
        stepsTaken: 0,
        skipReason,
      })
    },
    resetGame() {
      pushHistory()
      const initial = makeInitialState()
      set({
        ...initial,
        _history: get()._history,
        _future: get()._future,
      })
    },
    setPhase(phase) { set({ phase }) },
  }
})
