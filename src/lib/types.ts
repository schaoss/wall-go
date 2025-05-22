export const BOARD_SIZE = 7 as const
export type Player = 'R' | 'B'
export interface Pos { x: number; y: number }

export interface Cell {
  stone: Player | null          // 棋子
  wallTop: Player | null        // 上邊牆
  wallLeft: Player | null       // 左邊牆
}

export type Phase = 'placing' | 'playing' | 'finished'
export type WallDir = 'top' | 'left' | 'right' | 'bottom'
export const PLAYER_LIST = ['R', 'B'] as readonly Player[]
export const STONES_PER_PLAYER = 4 as const
export const WallDirArray = ['top', 'left', 'right', 'bottom'] as const
