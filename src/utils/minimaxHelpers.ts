// src/utils/minimaxHelpers.ts
import type { GameSnapshot, PlayerAction } from '../lib/types'
import { getTerritoryMap } from './territory'
import { getLegalActions, getRandomAiAction } from './ai'

// 評分函數：領地分數 + 可走格數
export function evaluate(gameState: GameSnapshot, player: string): number {
  const { board } = gameState
  const size = board.length
  // 找出雙方所有棋子
  const myStones: { x: number, y: number }[] = []
  const oppStones: { x: number, y: number }[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x].stone === player) myStones.push({ x, y })
      else if (board[y][x].stone && board[y][x].stone !== player) oppStones.push({ x, y })
    }
  }
  if (myStones.length === 0) return -9999
  if (oppStones.length === 0) return 9999

  // 領地分數（只計算「值得封閉」的區域）
  const territory = getTerritoryMap(board)
  let myTerritory = 0, oppTerritory = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const owner = territory[y][x]
      if (!owner) continue
      // 計算這個封閉區域的所有格子
      // 用 flood fill 找出此區域所有格子
      const visited = Array.from({ length: size }, () => Array(size).fill(false))
      function areaCount(sx: number, sy: number, player: string): { count: number, myStones: number, oppStones: number } {
        let count = 0, myStones = 0, oppStones = 0
        const q = [{ x: sx, y: sy }]
        while (q.length) {
          const { x, y } = q.pop()!
          if (visited[y][x]) continue
          visited[y][x] = true
          if (territory[y][x] !== player) continue
          count++
          if (board[y][x].stone === player) myStones++
          else if (board[y][x].stone) oppStones++
          // 四方向
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[ny][nx]) {
              q.push({ x: nx, y: ny })
            }
          }
        }
        return { count, myStones, oppStones }
      }
      if (!visited[y][x]) {
        const { count, myStones, oppStones } = areaCount(x, y, owner)
        // 只計算值得封閉的區域
        if (owner === player) {
          if (count > myStones * 7 - oppStones * 3) myTerritory += count
        } else {
          if (count > oppStones * 7 - myStones * 3) oppTerritory += count
        }
      }
    }
  }

  // flood fill 計算每方可到達的格子數
  function reachable(starts: { x: number, y: number }[]): number {
    const visited = Array.from({ length: size }, () => Array(size).fill(false))
    const queue = [...starts]
    let count = 0
    while (queue.length) {
      const { x, y } = queue.shift()!
      if (visited[y][x]) continue
      visited[y][x] = true
      count++
      // 四方向
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ]
      for (const { dx, dy } of dirs) {
        const nx = x + dx, ny = y + dy
        if (
          nx >= 0 && nx < size && ny >= 0 && ny < size &&
          !visited[ny][nx] && !board[ny][nx].stone &&
          // 判斷牆阻擋
          ((dx === 1 && !board[y][x + 1].wallLeft) ||
           (dx === -1 && !board[y][x].wallLeft) ||
           (dy === 1 && !board[y + 1]?.[x]?.wallTop) ||
           (dy === -1 && !board[y][x].wallTop))
        ) {
          queue.push({ x: nx, y: ny })
        }
      }
    }
    return count
  }
  const myReach = reachable(myStones)
  const oppReach = reachable(oppStones)
  // 若己方所有棋子都被困住（無法移動），給極低分
  if (myReach <= myStones.length) return -9999
  // 綜合評分：領地優先，其次可走格
  return (myTerritory - oppTerritory) * 10 + (myReach - oppReach)
}

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

// 自殺步判斷
export function isSuicideMove(gameState: GameSnapshot, action: PlayerAction, player: string): boolean {
  // 模擬這步之後，對手能否直接吃掉己方任一棋子
  const nextState = applyAction(gameState, action)
  const oppActions = getLegalActions(nextState)
  for (const oppAction of oppActions) {
    if (oppAction.type === 'move' && oppAction.from) {
      const fromCell = nextState.board[oppAction.from.y][oppAction.from.x]
      if (fromCell.stone === player) {
        return true
      }
    }
  }
  return false
}

// Minimax 主體
export function minimax(state: GameSnapshot, depth: number, maximizing: boolean, player: string): number {
  if (depth === 0) return evaluate(state, player)
  const actions = getLegalActions(state)
  if (actions.length === 0) return evaluate(state, player)
  if (maximizing) {
    let maxEval = -Infinity
    for (const action of actions) {
      const evalScore = minimax(applyAction(state, action), depth - 1, false, player)
      if (evalScore > maxEval) maxEval = evalScore
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const action of actions) {
      const evalScore = minimax(applyAction(state, action), depth - 1, true, player)
      if (evalScore < minEval) minEval = evalScore
    }
    return minEval
  }
}

// 擺子階段：最大化可移動格數
export function selectBestPlacingAction(gameState: GameSnapshot, actions: PlayerAction[]): PlayerAction {
  const placeActions = actions.filter(a => a.type === 'place')
  if (placeActions.length === 1) {
    return placeActions[0]
  }
  const isRed = gameState.turn === 'R'
  const myStoneCount = gameState.board.flat().filter(cell => cell.stone === gameState.turn).length
  const isRedFirst = isRed && myStoneCount === 0
  const isRedLast = isRed && placeActions.length === 1
  const size = gameState.board.length
  // 計算可移動格數的輔助函數
  function calcReachable(state: GameSnapshot, player: string): number {
    const { board } = state
    const myStones: { x: number, y: number }[] = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x].stone === player) myStones.push({ x, y })
      }
    }
    // flood fill
    const visited = Array.from({ length: size }, () => Array(size).fill(false))
    const queue = [...myStones]
    let count = 0
    while (queue.length) {
      const { x, y } = queue.shift()!
      if (visited[y][x]) continue
      visited[y][x] = true
      count++
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ]
      for (const { dx, dy } of dirs) {
        const nx = x + dx, ny = y + dy
        if (
          nx >= 0 && nx < size && ny >= 0 && ny < size &&
          !visited[ny][nx] && !board[ny][nx].stone &&
          ((dx === 1 && !board[y][x + 1].wallLeft) ||
           (dx === -1 && !board[y][x].wallLeft) ||
           (dy === 1 && !board[y + 1]?.[x]?.wallTop) ||
           (dy === -1 && !board[y][x].wallTop))
        ) {
          queue.push({ x: nx, y: ny })
        }
      }
    }
    return count
  }
  // 計算邊緣/角落懲罰
  function edgePenalty(pos: {x: number, y: number}): number {
    const { x, y } = pos
    const isCorner = (x === 0 || x === size - 1) && (y === 0 || y === size - 1)
    if (isCorner) return -3
    if (x === 0 || x === size - 1 || y === 0 || y === size - 1) return -2
    return 0
  }
  if (isRedFirst || isRedLast) {
    let bestScore = -Infinity
    let bestActions: PlayerAction[] = []
    for (const action of placeActions) {
      const nextState = applyAction(gameState, action)
      const score = calcReachable(nextState, gameState.turn) + edgePenalty(action.pos)
      if (score > bestScore) {
        bestScore = score
        bestActions = [action]
      } else if (score === bestScore) {
        bestActions.push(action)
      }
    }
    return getRandomAiAction({ legalActions: bestActions })!
  } else {
    let bestScore = -Infinity
    let bestFirstActions: PlayerAction[] = []
    for (let i = 0; i < placeActions.length; i++) {
      for (let j = 0; j < placeActions.length; j++) {
        if (i === j) continue
        const first = placeActions[i]
        const second = placeActions[j]
        const afterFirst = applyAction(gameState, first)
        const afterSecond = applyAction(afterFirst, second)
        const penalty = edgePenalty(first.pos) + edgePenalty(second.pos)
        const score = calcReachable(afterSecond, gameState.turn) + penalty
        if (score > bestScore) {
          bestScore = score
          bestFirstActions = [first]
        } else if (score === bestScore) {
          bestFirstActions.push(first)
        }
      }
    }
    return getRandomAiAction({ legalActions: bestFirstActions })!
  }
}
