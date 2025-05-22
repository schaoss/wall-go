export const BOARD_SIZE = 7 as const
export type Player = 'R' | 'B'
export interface Pos { x: number; y: number }

export interface Cell {
  stone: Player | null          // 棋子
  wallTop: Player | null        // 上邊牆
  wallLeft: Player | null       // 左邊牆
}
