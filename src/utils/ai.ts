import type { PlayerAction, Cell } from '../lib/types'
import { WallDirArray } from '../lib/types'
import { isLegalMove } from './isLegalMove'
import type { GameSnapshot } from '../store/gameState'

// 隨機 AI：從合法行動中隨機選一個
export function getRandomAiAction({ legalActions }: { legalActions: PlayerAction[] }): PlayerAction | null {
  if (legalActions.length === 0) return null
  return legalActions[Math.floor(Math.random() * legalActions.length)]
}

// 產生所有合法建牆行動
export function getLegalWallActions(board: Cell[][], x: number, y: number): PlayerAction[] {
  const actions: PlayerAction[] = []
  for (const dir of WallDirArray) {
    let canBuild = false
    if (dir === 'top' && y > 0 && !board[y][x].wallTop) canBuild = true
    if (dir === 'left' && x > 0 && !board[y][x].wallLeft) canBuild = true
    if (dir === 'right' && x < board.length - 1 && !board[y][x + 1].wallLeft) canBuild = true
    if (dir === 'bottom' && y < board.length - 1 && !board[y + 1][x].wallTop) canBuild = true
    if (canBuild) {
      actions.push({
        type: 'wall',
        from: { x, y },
        pos: { x, y },
        dir
      })
    }
  }
  return actions
}

// 產生所有合法行動
export function getLegalActions(gameState: GameSnapshot): PlayerAction[] {
  const { board, turn, phase } = gameState
  const legalActions: PlayerAction[] = []
  if (phase === 'placing') {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (!board[y][x].stone) legalActions.push({ type: 'place', pos: { x, y } })
      }
    }
  } else if (phase === 'playing') {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (board[y][x].stone === turn) {
          // 移動+建牆
          for (let yy = 0; yy < board.length; yy++) {
            for (let xx = 0; xx < board.length; xx++) {
              if (isLegalMove({ x, y }, { x: xx, y: yy }, board)) {
                for (const wallAction of getLegalWallActions(board, xx, yy)) {
                  legalActions.push({
                    type: 'move',
                    from: { x, y },
                    pos: { x: xx, y: yy },
                    followUp: wallAction
                  })
                }
              }
            }
          }
          // 原地建牆
          legalActions.push(...getLegalWallActions(board, x, y))
        }
      }
    }
  }
  return legalActions
}
