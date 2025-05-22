import { BOARD_SIZE, PLAYER_LIST, STONES_PER_PLAYER, type Player, type Cell, type Pos, type Phase, type WallDir } from '../lib/types'

export interface GameSnapshot {
  board: Cell[][]
  turn: Player
  selected?: Pos
  legal: Set<string>
  stepsTaken: number
  phase: Phase
  players: Player[]
  stonesLimit: number
  stonesPlaced: Record<Player, number>
  result?: import('../utils/checkGameEnd').GameResult
  skipReason?: string
}

export function createEmptyBoard(): Cell[][] {
  const emptyCell = (): Cell => ({ stone: null, wallTop: null, wallLeft: null })
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, emptyCell)
  )
}

export function makeInitialState(): GameSnapshot {
  return {
    board: createEmptyBoard(),
    turn: PLAYER_LIST[0],
    selected: undefined,
    legal: new Set(),
    stepsTaken: 0,
    phase: 'placing',
    players: [...PLAYER_LIST],
    stonesLimit: STONES_PER_PLAYER,
    stonesPlaced: Object.fromEntries(PLAYER_LIST.map(p => [p, 0])) as Record<Player, number>,
    result: undefined,
    skipReason: undefined,
  }
}

export function snapshotFromState(state: GameSnapshot): GameSnapshot {
  return {
    board: state.board.map((row: Cell[]) => row.map(cell => ({ ...cell }))),
    turn: state.turn,
    selected: state.selected ? { ...state.selected } : undefined,
    legal: new Set(state.legal),
    stepsTaken: state.stepsTaken,
    phase: state.phase,
    players: [...state.players],
    stonesLimit: state.stonesLimit,
    stonesPlaced: { ...state.stonesPlaced },
    result: state.result ? { ...state.result } : undefined,
    skipReason: state.skipReason,
  }
}

export function restoreSnapshot(s: GameSnapshot): GameSnapshot {
  return {
    board: s.board.map(row => row.map(cell => ({ ...cell }))),
    turn: s.turn,
    selected: s.selected ? { ...s.selected } : undefined,
    legal: new Set(s.legal),
    stepsTaken: s.stepsTaken,
    phase: s.phase,
    players: [...s.players],
    stonesLimit: s.stonesLimit,
    stonesPlaced: { ...s.stonesPlaced },
    result: s.result ? { ...s.result } : undefined,
    skipReason: s.skipReason,
  }
}

export interface State extends GameSnapshot {
  placeStone: (pos: Pos) => void
  selectStone: (pos: Pos) => void
  moveTo: (pos: Pos) => void
  buildWall: (pos: Pos, dir: WallDir) => void
  resetGame: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  _history: GameSnapshot[]
  _future: GameSnapshot[]
}
