import {
  BOARD_SIZE,
  PLAYER_LIST,
  STONES_PER_PLAYER,
  type Player,
  type Cell,
  type GameSnapshot,
} from '../lib/types'

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
  if (PLAYER_LIST.length === 2) board = set2PlayerDefaultBoard(board)
  return {
    board,
    turn: PLAYER_LIST[0],
    selected: undefined,
    legal: new Set(),
    stepsTaken: 0,
    phase: 'placing',
    players: [...PLAYER_LIST],
    stonesLimit: STONES_PER_PLAYER,
    stonesPlaced: Object.fromEntries(PLAYER_LIST.map((p) => [p, 2])) as Record<Player, number>,
    result: undefined,
    skipReason: undefined,
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
  }
}
