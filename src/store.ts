// src/store.ts
import { create } from 'zustand'
import { BOARD_SIZE, type Player, type Cell, type Pos } from './lib/types'
import { isLegalMove } from './utils/isLegalMove'
import { checkGameEnd, type GameResult } from './utils/checkGameEnd'

// Configuration – easily tweakable for 2‑player, 3‑player, etc.
const PLAYERS: Player[] = ['R', 'B']          // order of players
const STONES_PER_PLAYER = 4                   // stones each player places in setup phase

// Helper to compute whose turn during placing phase
function placingTurnIndex(totalPlaced: number, playerCount: number) {
  const round = Math.floor(totalPlaced / playerCount)
  const idx = totalPlaced % playerCount
  return round % 2 === 0 ? idx : playerCount - 1 - idx    // e.g. ABBA pattern for 2 players
}

function playerHasMove(board: Cell[][], player: Player): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = board[y][x]
      if (cell.stone !== player) continue

      // A) Can move 1‑2 steps?
      const from: Pos = { x, y }
      for (let yy = 0; yy < BOARD_SIZE; yy++) {
        for (let xx = 0; xx < BOARD_SIZE; xx++) {
          if (xx === x && yy === y) continue   // skip origin
          if (isLegalMove(from, { x: xx, y: yy }, board)) return true
        }
      }

      // B) Cannot move, but can still build a wall while staying put
      const canBuild =
        (y > 0 && cell.wallTop === null) ||
        (x > 0 && cell.wallLeft === null) ||
        (x < BOARD_SIZE - 1 && board[y][x + 1].wallLeft === null) ||
        (y < BOARD_SIZE - 1 && board[y + 1][x].wallTop === null)

      if (canBuild) return true
    }
  }
  return false
}

interface State {
  board: Cell[][]
  turn: Player
  selected?: Pos       // 當前被點擊的棋子
  legal: Set<string>
  stepsTaken: number
  phase: 'placing' | 'playing' | 'finished'
  players: Player[]
  stonesLimit: number
  stonesPlaced: Record<Player, number>
  placeStone: (pos: Pos) => void
  selectStone: (pos: Pos) => void
  moveTo: (pos: Pos) => void
  buildWall: (pos: Pos, dir: 'top' | 'left' | 'right' | 'bottom') => void
  result?: GameResult
  skipReason?: string   // message to show when a turn is auto‑skipped
  resetGame: () => void
}

const emptyCell = (): Cell => ({ stone: null, wallTop: null, wallLeft: null })

function createEmptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, emptyCell)
  )
}

function makeInitialState(): Omit<State, 'placeStone' | 'selectStone' | 'moveTo' | 'buildWall' | 'resetGame'> {
  return {
    board: createEmptyBoard(),
    turn: 'R',
    selected: undefined,
    legal: new Set(),
    stepsTaken: 0,
    phase: 'placing',
    players: PLAYERS,
    stonesLimit: STONES_PER_PLAYER,
    stonesPlaced: Object.fromEntries(PLAYERS.map(p => [p, 0])) as Record<Player, number>,
    result: undefined,
    skipReason: undefined,
  }
}

export const useGame = create<State>((set, get) => {
  function advanceTurn(board: Cell[][], current: Player): { turn: Player, skipReason?: string } {
    let idx = PLAYERS.indexOf(current)
    for (let i = 0; i < PLAYERS.length; i++) {
      idx = (idx + 1) % PLAYERS.length
      const p = PLAYERS[idx]
      if (playerHasMove(board, p)) {
        return { turn: p }
      }
    }
    return { turn: current, skipReason: 'allBlocked' }  // no one can move
  }

  return {
    ...makeInitialState(),

    placeStone(pos) {
      const { board, players, stonesPlaced, stonesLimit } = get()

      // determine whose turn by counting already placed stones
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
      })
    },

    selectStone(pos) {
      const { board, turn } = get()
      const { stepsTaken } = get()
      // once a move has begun this turn, no further selecting is allowed until a wall is built
      if (stepsTaken > 0) return

      if (board[pos.y][pos.x].stone !== turn) return
      const legal = new Set<string>()
      // enumerate board and use isLegalMove
      for (let yy = 0; yy < BOARD_SIZE; yy++) {
        for (let xx = 0; xx < BOARD_SIZE; xx++) {
          if (isLegalMove(pos, { x: xx, y: yy }, board)) {
            legal.add(`${xx},${yy}`)
          }
        }
      }
      set({ selected: pos, legal, stepsTaken: 0, skipReason: undefined })
    },

    moveTo(to) {
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
        for (let yy = 0; yy < BOARD_SIZE; yy++) {
          for (let xx = 0; xx < BOARD_SIZE; xx++) {
            if (isLegalMove(to, { x: xx, y: yy }, board, 2 - newSteps)) {
              nextLegal.add(`${xx},${yy}`)
            }
          }
        }
      }
      set({ board: [...board], selected: to, legal: nextLegal, stepsTaken: newSteps, skipReason: undefined })
    },

    buildWall(pos, dir) {
      const { board, turn, selected } = get()
      if (!selected || selected.x !== pos.x || selected.y !== pos.y) return

      let built = false
      const cell = board[pos.y][pos.x]

      if (dir === 'top') {
        if (pos.y === 0) return           // cannot build on outer top edge
        if (cell.wallTop === null) {
          cell.wallTop = turn
          built = true
        }
      } else if (dir === 'left') {
        if (pos.x === 0) return           // cannot build on outer left edge
        if (cell.wallLeft === null) {
          cell.wallLeft = turn
          built = true
        }
      } else if (dir === 'right') {
        if (pos.x + 1 < BOARD_SIZE && board[pos.y][pos.x + 1].wallLeft === null) {
          board[pos.y][pos.x + 1].wallLeft = turn
          built = true
        }
      } else if (dir === 'bottom') {
        if (pos.y + 1 < BOARD_SIZE && board[pos.y + 1][pos.x].wallTop === null) {
          board[pos.y + 1][pos.x].wallTop = turn
          built = true
        }
      }

      if (!built) return   // wall already exists, ignore click

      // --- check endgame ---
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
      // switch turn if game not finished
      // decide next player who can actually move
      const { turn: nextTurn, skipReason } = advanceTurn(board, turn)

      // if no one can move anymore, force end (condition B)
      if (skipReason === 'allBlocked') {
        const endB = checkGameEnd(board, PLAYERS)
        if (!endB.finished) {
          // condition B: no moves, declare tie using current pure‑zone scores
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
      // TODO: 檢查終局 && 計分
    },

    resetGame() {
      set({ ...makeInitialState() })
    },
  }
})
