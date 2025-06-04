import type { PlayerAction, GameSnapshot, Cell, Player, Pos } from '@/lib/types'
import { isLegalMove } from './move'
import { getLegalWallActions } from './wall'

export function getRandomAction(actions: PlayerAction[] = []): PlayerAction | null {
  if (actions.length === 0) return null
  return actions[Math.floor(Math.random() * actions.length)]
}

export function getLegalDestinations(gameState: GameSnapshot, from: Pos): Pos[] {
  const { board } = gameState
  const destinations: Pos[] = []
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (isLegalMove(from, { x, y }, board)) {
        destinations.push({ x, y })
      }
    }
  }
  return destinations
}

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
        if (board[y][x].stone !== turn) continue // 只考慮自己的棋子
        // 移動+建牆

        getLegalDestinations(gameState, { x, y }).forEach((pos) => {
          for (const wallAction of getLegalWallActions(board, pos.x, pos.y)) {
            legalActions.push({
              type: 'move',
              from: { x, y },
              pos: { x: pos.x, y: pos.y },
              followUp: wallAction,
            })
          }
        })
        // 原地建牆
        legalActions.push(...getLegalWallActions(board, x, y))
      }
    }
  }
  return legalActions
}

export function placeScore(board: Cell[][], x: number, y: number, me: Player): number {
  const opp = me === 'R' ? 'B' : 'R'

  // 1. 中心
  const central = 3 - Math.max(Math.abs(x - 3), Math.abs(y - 3))

  // 2. 與己子形成短牆
  let cut = 0
  let oppBlock = 0
  board.forEach((row, yy) =>
    row.forEach((c, xx) => {
      if (c.stone === me) {
        if ((xx === x && Math.abs(yy - y) <= 2) || (yy === y && Math.abs(xx - x) <= 2)) cut = 2
      } else if (c.stone === opp) {
        if ((xx === x && Math.abs(yy - y) <= 2) || (yy === y && Math.abs(xx - x) <= 2)) oppBlock = 2
      }
    }),
  )

  // 3. Edge penalty (自己)
  const edge = -(Number(x === 0 || x === 6) + Number(y === 0 || y === 6))

  // 4. CornerPressure：如果對手子距角≤2，我放在同角方向+分
  let cornerP = 0
  board.forEach((row, yy) =>
    row.forEach((c, xx) => {
      if (c.stone === opp) {
        const d = Math.min(xx + yy, xx + 6 - yy, 6 - xx + yy, 12 - xx - yy)
        cornerP += Math.max(0, 2 - d) // 角=2, 邊下一格=1, 其他=0
      }
    }),
  )
  // scale down
  cornerP = Math.min(2, cornerP)

  return 3 * central + 4 * cut + 2 * oppBlock + 1 * cornerP + 1 * edge
}

export function getBestPlacement(state: GameSnapshot): PlayerAction {
  const { board, turn } = state
  let best = -Infinity
  const cands: { x: number; y: number }[] = []

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      if (board[y][x].stone) continue // 已佔
      const s = placeScore(board, x, y, turn)
      if (s > best) {
        best = s
        cands.length = 0
        cands.push({ x, y })
      } else if (s === best) cands.push({ x, y })
    }
  }
  // 同分隨機
  const pick = cands[Math.floor(Math.random() * cands.length)]
  return { type: 'place', pos: pick }
}

// 行動
// 複製遊戲狀態（淺拷貝，僅用於模擬）
export function cloneGameState(state: GameSnapshot): GameSnapshot {
  return JSON.parse(JSON.stringify(state))
}

// 模擬執行 action，回傳新狀態（僅處理棋子/牆，忽略複雜規則）
export function applyAction(state: GameSnapshot, action: PlayerAction): GameSnapshot {
  const newState = cloneGameState(state)
  const { board, turn } = newState
  if (action.type === 'place') {
    board[action.pos.y][action.pos.x].stone = turn
  } else if (action.type === 'move' && action.from) {
    board[action.from.y][action.from.x].stone = null
    board[action.pos.y][action.pos.x].stone = turn
    if (action.followUp) {
      return applyAction(newState, action.followUp)
    }
  } else if (action.type === 'wall' && action.dir) {
    if (action.dir === 'top') board[action.pos.y][action.pos.x].wallTop = turn
    if (action.dir === 'left') board[action.pos.y][action.pos.x].wallLeft = turn
    if (action.dir === 'right') board[action.pos.y][action.pos.x + 1].wallLeft = turn
    if (action.dir === 'bottom') board[action.pos.y + 1][action.pos.x].wallTop = turn
  }
  // 換手
  newState.turn = turn === 'R' ? 'B' : 'R'
  return newState
}
