// 隨機 AI 玩家代理
import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot } from '../store/gameState'
import { getRandomAiAction } from '../utils/ai'
import type { PlayerAction } from '../lib/types'
import { WallDirArray } from '../lib/types'
import { isLegalMove } from '../utils/isLegalMove'

export class RandomAiAgent implements PlayerAgent {
  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    const { board, turn, phase } = gameState
    // 增加隨機延遲，避免 JS 卡死
    await new Promise(res => setTimeout(res, 400 + Math.floor(Math.random() * 50)))
    
    const legalActions: PlayerAction[] = []
    if (phase === 'placing') {
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board.length; x++) {
          if (!board[y][x].stone) legalActions.push({ type: 'place', pos: { x, y } })
        }
      }
      return getRandomAiAction({ legalActions })!
    } else if (phase === 'playing') {
      // 只允許「移動後必須建牆」的複合行動，避免只移動不建牆造成無窮迴圈
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board.length; x++) {
          if (board[y][x].stone === turn) {
            // 只產生合法移動+建牆的複合行動
            for (let yy = 0; yy < board.length; yy++) {
              for (let xx = 0; xx < board.length; xx++) {
                if (isLegalMove({ x, y }, { x: xx, y: yy }, board)) {
                  // 對每個合法移動，產生所有合法建牆 followUp
                  for (const dir of WallDirArray) {
                    let canBuild = false
                    if (dir === 'top' && yy > 0 && !board[yy][xx].wallTop) canBuild = true
                    if (dir === 'left' && xx > 0 && !board[yy][xx].wallLeft) canBuild = true
                    if (dir === 'right' && xx < board.length - 1 && !board[yy][xx + 1].wallLeft) canBuild = true
                    if (dir === 'bottom' && yy < board.length - 1 && !board[yy + 1][xx].wallTop) canBuild = true
                    if (canBuild) {
                      legalActions.push({
                        type: 'move',
                        from: { x, y },
                        pos: { x: xx, y: yy },
                        followUp: {
                          type: 'wall',
                          from: { x: xx, y: yy },
                          pos: { x: xx, y: yy },
                          dir
                        }
                      })
                    }
                  }
                }
              }
            }
            // 也允許原地建牆（不移動）
            for (const dir of WallDirArray) {
              let canBuild = false
              if (dir === 'top' && y > 0 && !board[y][x].wallTop) canBuild = true
              if (dir === 'left' && x > 0 && !board[y][x].wallLeft) canBuild = true
              if (dir === 'right' && x < board.length - 1 && !board[y][x + 1].wallLeft) canBuild = true
              if (dir === 'bottom' && y < board.length - 1 && !board[y + 1][x].wallTop) canBuild = true
              if (canBuild) {
                legalActions.push({
                  type: 'wall',
                  from: { x, y },
                  pos: { x, y },
                  dir
                })
              }
            }
          }
        }
      }
      // 隨機選一個複合行動
      return getRandomAiAction({ legalActions })!
    }
    throw new Error('No legal action')
  }
}
