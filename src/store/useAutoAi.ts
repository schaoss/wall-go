import { useEffect } from 'react'
import { getRandomAiAction, type AiAction } from '../utils/ai'
import { WallDirArray } from '../lib/types'
import type { Phase, Player, Cell, WallDir, Pos } from '../lib/types'
import { isLegalMove } from '../utils/isLegalMove'

type GameMode = 'pvp' | 'ai'
type AiSide = 'R' | 'B'

export function useAutoAi({
  mode,
  aiSide,
  phase,
  turn,
  board,
  legal,
  placeStone,
  selectStone,
  moveTo,
  buildWall,
}: {
  mode: GameMode | null
  aiSide: AiSide
  phase: Phase
  turn: Player
  board: Cell[][]
  legal: Set<string>
  placeStone: (pos: Pos) => void
  selectStone: (pos: Pos) => void
  moveTo: (pos: Pos) => void
  buildWall: (pos: Pos, dir: WallDir) => void
}) {
  useEffect(() => {
    if (mode !== 'ai' || phase === 'finished' || turn !== aiSide) return
    if (phase === 'placing') {
      const legalActions: AiAction[] = []
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board.length; x++) {
          if (!board[y][x].stone) legalActions.push({ type: 'place', pos: { x, y } })
        }
      }
      const action = getRandomAiAction({ legalActions })
      if (action && action.type === 'place') {
        setTimeout(() => placeStone(action.pos), 400)
      }
    } else if (phase === 'playing') {
      const legalActions: AiAction[] = []
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board.length; x++) {
          if (board[y][x].stone === turn) {
            // 針對每一顆己方棋子，模擬 selectStone，取得 legal set
            const legalSet = new Set<string>()
            for (let yy = 0; yy < board.length; yy++) {
              for (let xx = 0; xx < board.length; xx++) {
                if (isLegalMove({ x, y }, { x: xx, y: yy }, board)) {
                  legalSet.add(`${xx},${yy}`)
                  legalActions.push({ type: 'move', from: { x, y }, pos: { x: xx, y: yy } })
                }
              }
            }
            // 建牆（不需 legal set）
            for (const dir of WallDirArray) {
              if (dir === 'top' && y > 0 && !board[y][x].wallTop) legalActions.push({ type: 'wall', from: { x, y }, pos: { x, y }, dir: 'top' })
              if (dir === 'left' && x > 0 && !board[y][x].wallLeft) legalActions.push({ type: 'wall', from: { x, y }, pos: { x, y }, dir: 'left' })
              if (dir === 'right' && x < board.length - 1 && !board[y][x + 1].wallLeft) legalActions.push({ type: 'wall', from: { x, y }, pos: { x, y }, dir: 'right' })
              if (dir === 'bottom' && y < board.length - 1 && !board[y + 1][x].wallTop) legalActions.push({ type: 'wall', from: { x, y }, pos: { x, y }, dir: 'bottom' })
            }
          }
        }
      }
      const action = getRandomAiAction({ legalActions })
      if (action) {
        setTimeout(() => {
          if (action.type === 'move' && action.from) {
            selectStone(action.from)
            setTimeout(() => {
              moveTo(action.pos)
              // 嘗試移動後自動建牆
              // 取得新位置
              const to = action.pos
              // 檢查該棋子移動後可建牆
              const wallActions: AiAction[] = []
              for (const dir of WallDirArray) {
                if (dir === 'top' && to.y > 0 && !board[to.y][to.x].wallTop) wallActions.push({ type: 'wall', from: to, pos: to, dir: 'top' })
                if (dir === 'left' && to.x > 0 && !board[to.y][to.x].wallLeft) wallActions.push({ type: 'wall', from: to, pos: to, dir: 'left' })
                if (dir === 'right' && to.x < board.length - 1 && !board[to.y][to.x + 1].wallLeft) wallActions.push({ type: 'wall', from: to, pos: to, dir: 'right' })
                if (dir === 'bottom' && to.y < board.length - 1 && !board[to.y + 1][to.x].wallTop) wallActions.push({ type: 'wall', from: to, pos: to, dir: 'bottom' })
              }
              if (wallActions.length > 0) {
                const wallAction = getRandomAiAction({ legalActions: wallActions })
                if (wallAction && wallAction.dir) {
                  setTimeout(() => {
                    selectStone(to)
                    setTimeout(() => buildWall(to, wallAction.dir!), 100)
                  }, 200)
                }
              }
            }, 100)
          } else if (action.type === 'wall' && action.from && action.dir) {
            selectStone(action.from)
            setTimeout(() => buildWall(action.pos, action.dir!), 100)
          }
        }, 400)
      }
    }
  }, [mode, phase, turn, aiSide, board, legal, placeStone, selectStone, moveTo, buildWall])
}
