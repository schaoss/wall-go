export const BOARD_SIZE = 7 as const
export type Player = 'R' | 'B'
export interface Pos {
  x: number
  y: number
}

export interface Cell {
  stone: Player | null // stone
  wallTop: Player | null // top wall
  wallLeft: Player | null // left wall
}

export type GameMode = 'pvp' | 'ai'
export type AiSide = 'R' | 'B'
export type AiLevel = 'practice' | 'easy' | 'middle' | 'hard'
export type Phase = 'selecting' | 'placing' | 'playing' | 'finished'
export type WallDir = 'top' | 'left' | 'right' | 'bottom'
export const PLAYER_LIST = ['R', 'B'] as readonly Player[]
export const STONES_PER_PLAYER = 4 as const
export const WallDirArray = ['top', 'left', 'right', 'bottom'] as const

// Shared action type for both player and AI
export interface PlayerAction {
  type: 'place' | 'move' | 'wall'
  from?: Pos // only needed in 'playing' phase
  pos: Pos // target position (move: to, wall: wall position, place: placement)
  dir?: WallDir
  followUp?: PlayerAction // if present, means auto-build wall after move
}

export interface Stone {
  player: Player
  position: Pos
}

export interface FindBestActionsResult {
  actions: PlayerAction[]
  score: number
}

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
  result?: import('@/utils/game').GameResult
  skipReason?: string
}

export interface State extends GameSnapshot {
  placeStone: (pos: Pos) => void
  selectStone: (pos: Pos) => void
  moveTo: (to: Pos) => void
  buildWall: (pos: Pos, dir: WallDir) => void
  resetGame: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  setPhase: (phase: Phase) => void
  setPlayers: (players: Player[]) => void
  _history: GameSnapshot[]
  _future: GameSnapshot[]
  humanSide: Player | null
  setHumanSide: (side: Player | null) => void
}
