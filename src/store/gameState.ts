import {
  BOARD_SIZE,
  PLAYER_LIST,
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

export function makeInitialState(initialPlayers: Player[] = [...PLAYER_LIST]): GameSnapshot {
  let board = createEmptyBoard();
  const players = [...initialPlayers];
  const initialStonesPlaced: Record<Player, number> = Object.fromEntries(
    PLAYER_LIST.map(p => [p, 0])
  ) as Record<Player, number>;

  // Only initialize stones for 2-player games
  // For 3-4 player games, board stays empty and stones placed remain 0
  if (players.length === 2 && players.every(p => p === 'R' || p === 'B')) {
    board = set2PlayerDefaultBoard(board);
    // Don't set stonesPlaced to 2, so players still need to place stones in the placing phase
    // initialStonesPlaced['R'] = 2;
    // initialStonesPlaced['B'] = 2;
  }

  return {
    board,
    turn: players[0],
    selected: undefined,
    legal: new Set(),
    stepsTaken: 0,
    phase: 'placing',
    players,
    stonesLimit: STONES_PER_PLAYER,
    stonesPlaced: initialStonesPlaced,
    result: undefined,
    skipReason: undefined,
    territoryMap: undefined,
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
    territoryMap: state.territoryMap ? state.territoryMap.map(row => [...row]) : undefined,
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
    territoryMap: s.territoryMap ? s.territoryMap.map(row => [...row]) : undefined,
  }
}
