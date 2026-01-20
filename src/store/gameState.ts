import {
  BOARD_SIZE,
  STONES_PER_PLAYER,
  type Player,
  type Cell,
  type GameSnapshot,
} from '@/lib/types'

export function createEmptyBoard(): Cell[][] {
  const emptyCell = (): Cell => ({
    stone: null,
    wallTop: null,
    wallLeft: null,
  })
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, emptyCell))
}

export function set2PlayerDefaultBoard(board: Cell[][]): Cell[][] {
  // Red player starts at [1, 1] & [5, 5]
  // Blue player starts at [1, 5] & [5, 1]
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if ((x === 1 && y === 1) || (x === 5 && y === 5)) {
        cell.stone = 'R'
      } else if ((x === 1 && y === 5) || (x === 5 && y === 1)) {
        cell.stone = 'B'
      } else {
        cell.stone = null
      }
    })
  })
  return board
}

export function makeInitialState(): GameSnapshot {
  let board = createEmptyBoard()
  const defaultPlayers: Player[] = ['R', 'B']
  const is2P = defaultPlayers.length === 2
  if (is2P) board = set2PlayerDefaultBoard(board)
  return {
    board,
    turn: defaultPlayers[0],
    selected: undefined,
    legal: new Set(),
    stepsTaken: 0,
    phase: 'placing',
    players: defaultPlayers,
    stonesLimit: is2P ? STONES_PER_PLAYER[2] : STONES_PER_PLAYER[defaultPlayers.length as 3 | 4],
    stonesPlaced: Object.fromEntries(defaultPlayers.map((p) => [p, is2P ? 2 : 0])) as Record<
      Player,
      number
    >,
    result: undefined,
    skipReason: undefined,
    wallBreaks: Object.fromEntries(defaultPlayers.map((p) => [p, 1])) as Record<Player, number>, // Everyone gets 1 break
  }
}

export function snapshotFromState(state: GameSnapshot): GameSnapshot {
  return {
    board: state.board.map((row: Cell[]) => row.map((cell) => ({ ...cell }))),
    turn: state.turn,
    selected: state.selected ? { ...state.selected } : undefined,
    legal: new Set(state.legal),
    stepsTaken: state.stepsTaken,
    phase: state.phase,
    players: [...state.players],
    stonesLimit: state.stonesLimit,
    stonesPlaced: { ...state.stonesPlaced },
    result: state.result ? JSON.parse(JSON.stringify(state.result)) : undefined,
    skipReason: state.skipReason,
    wallBreaks: state.wallBreaks ? { ...state.wallBreaks } : undefined,
  }
}

export function restoreSnapshot(s: GameSnapshot): GameSnapshot {
  return {
    board: s.board.map((row) => row.map((cell) => ({ ...cell }))),
    turn: s.turn,
    selected: s.selected ? { ...s.selected } : undefined,
    legal: new Set(s.legal),
    stepsTaken: s.stepsTaken,
    phase: s.phase,
    players: [...s.players],
    stonesLimit: s.stonesLimit,
    stonesPlaced: { ...s.stonesPlaced },
    result: s.result ? JSON.parse(JSON.stringify(s.result)) : undefined,
    skipReason: s.skipReason,
    wallBreaks: s.wallBreaks ? { ...s.wallBreaks } : undefined,
  }
}
