import type { PlayerAction, GameSnapshot, Cell, Player, Pos } from '../lib/types'
import { isLegalMove } from './isLegalMove'
import { getLegalWallActions } from './wall'
import { getTerritoryMap } from './territory'

export function getRandomAction({
  legalActions,
}: {
  legalActions: PlayerAction[]
}): PlayerAction | null {
  if (legalActions.length === 0) return null
  return legalActions[Math.floor(Math.random() * legalActions.length)]
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

// 自殺步判斷
export function isSuicideMove(
  gameState: GameSnapshot,
  action: PlayerAction,
  player: string,
): boolean {
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

export function isInPureTerritory(
  gameState: GameSnapshot,
  pos: { x: number; y: number },
  player: string,
): boolean {
  const { board } = gameState
  const territory = getTerritoryMap(board)
  if (territory[pos.y][pos.x] !== player) return false

  return true
}

/**
 * 回傳「玩家能抵達的格子數」：
 *  - 起點：所有屬於 player 的棋子
 *  - 可走：空格 or 同色棋子
 *  - 阻擋：牆、邊界、異色棋子
 */
export function reachable(board: Cell[][], player: Player): number {
  const n = board.length
  const seen = Array.from({ length: n }, () => Array<boolean>(n).fill(false))
  const q: Pos[] = []

  // enqueue all player stones
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (board[y][x].stone === player) {
        seen[y][x] = true
        q.push({ x, y })
      }

  return bfs(board, q, seen)
}

/**
 * Performs a Breadth-First Search to find all reachable empty cells from a given set of starting points.
 *
 * @param board The game board.
 * @param queue An initial queue of positions (typically empty cells adjacent to player stones).
 * @param seen A 2D boolean array marking visited cells.
 * @returns A Set of strings representing the coordinates of reachable empty cells (e.g., "x,y").
 */
function bfsForReachableSet(board: Cell[][], queue: Pos[], seen: boolean[][]): Set<string> {
  const n = board.length
  const reachableEmptyCells = new Set<string>()

  while (queue.length) {
    const { x, y } = queue.shift()!

    // Add the current empty cell to the set
    // The initial queue should only contain empty cells, so no need to check board[y][x].stone here
    reachableEmptyCells.add(`${x},${y}`)

    for (const [dx, dy, dir] of DIRS) {
      const nx = x + dx,
        ny = y + dy
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue

      const blocked =
        dir === 'left'
          ? dx === 1
            ? board[y][x + 1].wallLeft
            : board[y][x].wallLeft
          : dy === 1
            ? board[y + 1][x].wallTop
            : board[y][x].wallTop
      if (blocked) continue

      if (seen[ny][nx]) continue
      const targetCell = board[ny][nx]
      if (targetCell.stone) continue // Can only traverse empty cells

      seen[ny][nx] = true
      queue.push({ x: nx, y: ny })
    }
  }
  return reachableEmptyCells
}

/**
 * Calculates the set of all empty cells reachable by a player.
 *
 * @param board The game board.
 * @param player The player whose reachable set is to be calculated.
 * @returns A Set of strings representing the coordinates of reachable empty cells (e.g., "x,y").
 */
export function getReachableSet(board: Cell[][], player: Player): Set<string> {
  const n = board.length
  const seen = Array.from({ length: n }, () => Array<boolean>(n).fill(false))
  const queue: Pos[] = []

  // Initialize the queue with empty cells adjacent to the player's stones
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (board[y][x].stone === player) {
        seen[y][x] = true // Mark player's stone as seen

        // Check neighbors of this stone
        for (const [dx, dy, dir] of DIRS) {
          const nx = x + dx,
            ny = y + dy
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue

          const blockedByWall =
            dir === 'left'
              ? dx === 1
                ? board[y][x + 1].wallLeft // Wall on the right of current stone (left of neighbor)
                : board[y][x].wallLeft // Wall on the left of current stone
              : dy === 1
                ? board[y + 1][x].wallTop // Wall below current stone (top of neighbor)
                : board[y][x].wallTop // Wall above current stone
          if (blockedByWall) continue

          if (seen[ny][nx]) continue // Already visited or is another player stone
          if (board[ny][nx].stone) continue // Neighbor is not an empty cell

          // If we reach here, {nx, ny} is an empty, non-walled-off, unvisited neighbor
          seen[ny][nx] = true
          queue.push({ x: nx, y: ny })
        }
      }
    }
  }

  // All cells initially added to the queue are empty and seen.
  // bfsForReachableSet will add these initial cells to the result AND explore from them.
  return bfsForReachableSet(board, queue, seen)
}

/**
 * 某顆棋在目前版面是否「被完全孤立」（可走格 = 1 → 只有自己）
 */
export function isIsolated(board: Cell[][], x: number, y: number): boolean {
  const owner = board[y][x].stone
  if (!owner) return false
  const n = board.length
  const seen = Array.from({ length: n }, () => Array<boolean>(n).fill(false))
  seen[y][x] = true
  const cnt = bfs(board, [{ x, y }], seen)
  return cnt === 1
}

/* ---------- private helpers ---------- */

const DIRS: [dx: number, dy: number, wallKey: 'left' | 'top'][] = [
  [1, 0, 'left'], // 往右要看右格的 left 牆
  [-1, 0, 'left'], // 往左看自身 left 牆
  [0, 1, 'top'], // 往下看下格 top 牆
  [0, -1, 'top'], // 往上看自身 top 牆
]

/** 計算指定座標(石)的“氣”數 = 四方向尚未被牆封且目標格為空 */
function stoneLiberties(board: Cell[][], x: number, y: number): number {
  const n = board.length
  let lib = 0
  // 四向: 右(+1,0), 左(-1,0), 下(0,+1), 上(0,-1)
  if (x < n - 1 && !board[y][x + 1].wallLeft && !board[y][x + 1].stone) lib++
  if (!board[y][x].wallLeft && x > 0 && !board[y][x - 1].stone) lib++
  if (y < n - 1 && !board[y + 1][x].wallTop && !board[y + 1][x].stone) lib++
  if (!board[y][x].wallTop && y > 0 && !board[y - 1][x].stone) lib++
  return lib
}

function totalLiberties(board: Cell[][], player: Player): number {
  let sum = 0
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board.length; x++) {
      if (board[y][x].stone === player) sum += stoneLiberties(board, x, y)
    }
  }
  return sum
}

function bfs(board: Cell[][], queue: Pos[], seen: boolean[][]): number {
  const n = board.length
  let count = 0

  while (queue.length) {
    const { x, y } = queue.shift()!
    count++

    for (const [dx, dy, dir] of DIRS) {
      const nx = x + dx,
        ny = y + dy
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue

      // 是否有牆阻擋
      const blocked =
        dir === 'left'
          ? dx === 1
            ? board[y][x + 1].wallLeft
            : board[y][x].wallLeft
          : dy === 1
            ? board[y + 1][x].wallTop
            : board[y][x].wallTop
      if (blocked) continue

      if (seen[ny][nx]) continue
      const target = board[ny][nx]
      // 不能踩棋子
      if (target.stone) continue

      seen[ny][nx] = true
      queue.push({ x: nx, y: ny })
    }
  }
  return count
}

export function scoreAction(state: GameSnapshot, action: PlayerAction, me: Player): number {
  const opp = me === 'R' ? 'B' : 'R'

  const myBefore = reachable(state.board, me)
  const oppBefore = reachable(state.board, opp)

  // 用你現有的 clone+applyAction 產生下一個 board
  const next = applyAction(state, action) // <== 直接呼叫你檔案裡的函式
  const myAfter = reachable(next.board, me)
  const oppAfter = reachable(next.board, opp)

  /** 1) ΔReach */
  const deltaReach = myAfter - myBefore - (oppAfter - oppBefore)

  /** 2) Isolate bonus：堵死一顆對手棋 +50 */
  let iso = 0
  next.board.forEach((row, y) =>
    row.forEach((c, x) => {
      if (c.stone === opp && isIsolated(next.board, x, y)) iso++
    }),
  )

  /** 2.5) opponent liberties reduction */
  const oppLibBefore = totalLiberties(state.board, opp)
  const oppLibAfter = totalLiberties(next.board, opp)
  const deltaLib = oppLibBefore - oppLibAfter // 正數 = 壓對手氣

  /** 3) 自殘懲罰 */
  const selfLoss = Math.max(0, myBefore - myAfter) // 正數 = 自己可走格減少

  /* 4) 若落在最外邊框且沒隔絕對手，給額外負分 */
  let edgePenalty = 0
  if (action.type === 'move') {
    const { x, y } = action.pos
    const onEdge = x === 0 || x === 6 || y === 0 || y === 6
    if (onEdge && iso === 0) edgePenalty = -12
  }

  return (
    8 * deltaReach +
    100 * iso + // 完全封死價值更高
    20 * deltaLib - // 每減一口氣 +20
    10 * selfLoss + // 強力懲罰自斷氣
    edgePenalty
  )
}
