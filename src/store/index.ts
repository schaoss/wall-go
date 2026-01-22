// Zustand store for Wall Go with robust undo/redo and deep copy history pattern
import { create } from 'zustand'
import { PLAYER_LIST, STONES_PER_PLAYER, type Pos, type WallDir, type State } from '@/lib/types'
import {
  makeInitialState,
  snapshotFromState,
  restoreSnapshot,
  set2PlayerDefaultBoard,
} from './gameState'
import { createHistoryHandlers } from './history'
import { placingTurnIndex, advanceTurn } from './actions'
import { isLegalMove, getPath } from '@/utils/move'
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
  const PLAYERS = [...PLAYER_LIST]

  // 初始化時 _history 應包含初始狀態
  const initial = makeInitialState()
  return {
    ...initial,
    _history: [snapshotFromState(initial)],
    _future: [],
    canUndo: false,
    canRedo: false,
    humanSide: null,
    isBreakMode: false,
    toggleBreakMode() {
      set((state) => {
        const { turn, wallBreaks, phase, selected, board, stepsTaken } = state
        if (phase !== 'playing') return state
        if (!wallBreaks || wallBreaks[turn] <= 0) return state

        // Toggle mode
        const newMode = !state.isBreakMode

        // If a stone is selected, re-calculate legal moves
        let legal = state.legal
        if (selected && stepsTaken === 0) {
          legal = new Set<string>()
          for (let yy = 0; yy < board.length; yy++) {
            for (let xx = 0; xx < board.length; xx++) {
              if (isLegalMove(selected, { x: xx, y: yy }, board, 2, newMode)) {
                legal.add(`${xx},${yy}`)
              }
            }
          }
        }

        return {
          ...state,
          isBreakMode: newMode,
          legal,
        }
      })
    },
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
        const currentIdx = placingTurnIndex(totalPlaced, players.length)
        const currentPlayer = players[currentIdx]
        if (board[pos.y][pos.x].stone) return state
        // Mutate a deep copy of state
        const next = snapshotFromState(state)
        next.board[pos.y][pos.x].stone = currentPlayer
        next.stonesPlaced[currentPlayer]++
        const newTotal = totalPlaced + 1
        const nextIdx = placingTurnIndex(newTotal, players.length)
        const nextPlayer = players[nextIdx]
        const allDone = Object.values(next.stonesPlaced).every((c) => c === stonesLimit)
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
        if (pos.x === 0 && pos.y === 1) {
          console.log('Inspecting board[1][1] for B move', board[1][1], 'board[0][1]', board[0][1])
        }
        for (let yy = 0; yy < board.length; yy++) {
          for (let xx = 0; xx < board.length; xx++) {
            if (isLegalMove(pos, { x: xx, y: yy }, board, 2, state.isBreakMode)) {
              legal.add(`${xx},${yy}`)
            }
          }
        }
        console.log('selectStone result', pos, 'legal size:', legal.size, 'turn:', turn)
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
        if (phase !== 'playing') {
          console.log('moveTo fail: phase', phase)
          return state
        }
        if (!selected) {
          console.log('moveTo fail: no selected')
          return state
        }
        if (!legal.has(`${to.x},${to.y}`)) {
          console.log('moveTo fail: illegal', to.x, to.y, Array.from(legal))
          return state
        }
        const piece = board[selected.y][selected.x].stone
        if (!piece) return state

        // Mutate a deep copy of state
        const next = snapshotFromState(state)
        next.board[selected.y][selected.x].stone = null
        next.board[to.y][to.x].stone = piece

        // --- WALL REMOVAL LOGIC ---
        // Calculate path taken
        // We use getPath to find the actual path and walls crossed
        // Since legal already confirmed it's valid (possibly with break mode), we just need to know IF we crossed walls.
        // NOTE: getPath with allowBreak=false might return null if walls are present.
        // We need to pass state.isBreakMode? No, getPath doesn't take allowBreak, it just returns path and walls.
        // But we need to know if the path *requires* break.
        // If wallsCrossed > 0, we must consume break (if break mode is on).
        // Since `legal` checked validity, we know we can move.
        // If we are in break mode, `legal` allowed us to cross walls.
        // So we should find the path now.

        // Import getPath dynamically or assume it's imported?
        // We need to update imports.

        const pathResult = getPath(selected, to, state.board, 2)
        // If pathResult suggests walls crossed, and we are in break mode (or legal move allowed it), we process removal.
        if (pathResult && pathResult.wallsCrossed.length > 0) {
          if (state.isBreakMode) {
            // Logic: only remove if break mode was active (and required?)
            // Actually, if we crossed walls, we MUST satisfy break conditions.
            // Consume break
            const player = next.turn
            if (next.wallBreaks && next.wallBreaks[player] > 0) {
              next.wallBreaks[player]--

              // Remove the crossed walls!
              pathResult.wallsCrossed.forEach((wc) => {
                const { pos, type } = wc
                if (type === 'wallTop') next.board[pos.y][pos.x].wallTop = null
                if (type === 'wallLeft') next.board[pos.y][pos.x].wallLeft = null
              })
            }
          }
        }

        const dist = Math.abs(to.x - selected.x) + Math.abs(to.y - selected.y)
        const newSteps = stepsTaken + dist // Approximation. `pathResult.path.length - 1` is better.
        // Use path length if available
        const actualSteps = pathResult ? pathResult.path.length : newSteps

        const nextLegal = new Set<string>()
        if (actualSteps < 2) {
          for (let yy = 0; yy < next.board.length; yy++) {
            for (let xx = 0; xx < next.board.length; xx++) {
              // Recalculate legal for POTENTIAL further moves
              // If we broke a wall, we used our break. `next.wallBreaks` is decremented.
              // `state.isBreakMode` is from OLD state.
              // We should probably Disable break mode for subsequent checks if we used it.
              // However, checks rely on `wallBreaks > 0` AND passed `allowBreak`.
              // The UI `isBreakMode` toggle is state-based.

              // If we used the break, subsequent moves cannot break walls.
              // We pass `state.isBreakMode` (user intent) BUT combined with `next.wallBreaks > 0`.
              // If count is 0, allowBreak becomes false.

              if (
                isLegalMove(
                  to,
                  { x: xx, y: yy },
                  next.board,
                  2 - actualSteps,
                  state.isBreakMode && ((next.wallBreaks && next.wallBreaks[next.turn]) || 0) > 0,
                )
              ) {
                nextLegal.add(`${xx},${yy}`)
              }
            }
          }
        }
        next.selected = to
        next.legal = nextLegal
        next.stepsTaken = actualSteps
        next.skipReason = undefined
        // Push the new state (after mutation) to history
        const newHistory = [...state._history, snapshotFromState(next)]

        return {
          ...next,
          _history: newHistory,
          _future: [],
          isBreakMode: false, // Turn off break mode after move? Or keep it?
          // If we used it, we definitely want to reset or at least user sees count 0.
          // Safety: reset to false.
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
        const end = checkGameEnd(next.board, PLAYERS)
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
        const { turn: nextTurn, skipReason } = advanceTurn(next.board, turn, PLAYERS)
        if (skipReason === 'allBlocked') {
          const endB = checkGameEnd(next.board, PLAYERS)
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
    // Atomically apply an action (move/place/wall) and any follow-up actions
    // in a single state mutation. This prevents intermediate UI updates where
    // the board reflects a moved piece but the turn hasn't been advanced yet.
    applyActionSequence(action: import('@/lib/types').PlayerAction | undefined) {
      // Reuse existing apply logic from utils/ai.applyAction but operate on store
      set((state) => {
        // Clone snapshot and reuse existing mutation logic by delegating to
        // existing action handlers where possible.
        // We'll implement a minimal direct application here to ensure atomicity.
        const next = snapshotFromState(state)
        // If no action provided, nothing to do
        if (!action) return state

        // Determine the acting player for this action.
        // For move actions, prefer the stone owner at `from` (handles cases where
        // tests set up board manually but `state.turn` may differ). Otherwise
        // fall back to the canonical state.turn.
        const players =
          (next as unknown as { players?: import('@/lib/types').Player[] }).players || PLAYERS
        const board = next.board as import('@/lib/types').Cell[][]
        let actor = state.turn
        if (action.type === 'move' && action.from) {
          const owner = board[action.from.y][action.from.x].stone
          if (owner) actor = owner
        }
        if (action.type === 'place') {
          board[action.pos.y][action.pos.x].stone = actor
          // update stonesPlaced if exists
          if (
            next.stonesPlaced &&
            typeof (next.stonesPlaced as Record<string, number>)[actor as string] === 'number'
          ) {
            ;(next.stonesPlaced as Record<string, number>)[actor as string] =
              ((next.stonesPlaced as Record<string, number>)[actor as string] || 0) + 1
          }
        } else if (action.type === 'move' && action.from) {
          board[action.from.y][action.from.x].stone = null
          board[action.pos.y][action.pos.x].stone = actor
        } else if (action.type === 'wall' && action.dir) {
          if (action.dir === 'top') board[action.pos.y][action.pos.x].wallTop = actor
          if (action.dir === 'left') board[action.pos.y][action.pos.x].wallLeft = actor
          if (action.dir === 'right') board[action.pos.y][action.pos.x + 1].wallLeft = actor
          if (action.dir === 'bottom') board[action.pos.y + 1][action.pos.x].wallTop = actor
        }

        // If there is a followUp action, apply it immediately (atomic)
        if (action.followUp) {
          const fu = action.followUp
          if (fu.type === 'place') {
            board[fu.pos.y][fu.pos.x].stone = actor
          } else if (fu.type === 'move' && fu.from) {
            board[fu.from.y][fu.from.x].stone = null
            board[fu.pos.y][fu.pos.x].stone = actor
          } else if (fu.type === 'wall' && fu.dir) {
            if (fu.dir === 'top') board[fu.pos.y][fu.pos.x].wallTop = actor
            if (fu.dir === 'left') board[fu.pos.y][fu.pos.x].wallLeft = actor
            if (fu.dir === 'right') board[fu.pos.y][fu.pos.x + 1].wallLeft = actor
            if (fu.dir === 'bottom') board[fu.pos.y + 1][fu.pos.x].wallTop = actor
          }
        }

        // Advance turn deterministically
        const idx = players.indexOf(actor)
        next.turn = players[(idx + 1) % players.length]

        // push to history
        const newHistory = [...state._history, snapshotFromState(next)]
        return {
          ...next,
          _history: newHistory,
          _future: [],
        }
      })
    },
    resetGame() {
      set(() => {
        // Mutate a new initial state
        const initial = makeInitialState()
        return {
          ...initial,
          phase: 'placing',
          _history: [snapshotFromState({ ...initial, phase: 'placing' })],
          _future: [],
          isBreakMode: false,
        }
      })
    },
    setPhase(phase) {
      set({ phase })
    },
    setPlayers(players: import('@/lib/types').Player[]) {
      set((state) => {
        // Create a new empty board
        const size = state.board.length
        let emptyBoard = Array.from({ length: size }, () =>
          Array.from({ length: size }, () => ({
            stone: null,
            wallTop: null,
            wallLeft: null,
          })),
        ) as import('@/lib/types').Cell[][]

        const is2P = players.length === 2
        if (is2P) {
          emptyBoard = set2PlayerDefaultBoard(emptyBoard)
        }

        return {
          ...state,
          board: emptyBoard,
          players,
          turn: players[0],
          phase: state.phase === 'selecting' ? 'placing' : state.phase, // 只有在 selecting 時才自動進入 placing
          stepsTaken: 0,
          selected: undefined,
          legal: new Set(),
          result: undefined,
          skipReason: undefined,
          stonesPlaced: Object.fromEntries(players.map((p) => [p, is2P ? 2 : 0])) as Record<
            string,
            number
          >,
          wallBreaks: Object.fromEntries(players.map((p) => [p, 1])) as Record<string, number>,
          isBreakMode: false,
          stonesLimit: STONES_PER_PLAYER[players.length as 2 | 3 | 4],
        }
      })
    },
  }
})
