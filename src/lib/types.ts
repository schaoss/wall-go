export const BOARD_SIZE = 7 as const
export type Player = 'R' | 'B'
export interface Pos {
  x: number
  y: number
}

export interface Cell {
  stone: Player | null // 棋子
  wallTop: Player | null // 上邊牆
  wallLeft: Player | null // 左邊牆
}

export type Phase = 'selecting' | 'placing' | 'playing' | 'finished'
export type WallDir = 'top' | 'left' | 'right' | 'bottom'
export const PLAYER_LIST = ['R', 'B'] as readonly Player[]
export const STONES_PER_PLAYER = 4 as const
export const WallDirArray = ['top', 'left', 'right', 'bottom'] as const

// 玩家與 AI 共用的行動型別
export interface PlayerAction {
  type: 'place' | 'move' | 'wall'
  from?: Pos // 僅 playing 階段需要
  pos: Pos // 目標座標（move: to, wall: 牆座標, place: 落子）
  dir?: WallDir
  followUp?: PlayerAction // 若有，代表移動後自動建牆
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
  result?: import('../utils/checkGameEnd').GameResult
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
