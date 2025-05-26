// src/utils/minimaxHelpers.ts
import type { GameSnapshot, PlayerAction } from '../lib/types'
import { getTerritoryMap } from './territory'
import { getLegalActions, getRandomAction, applyAction, isInPureTerritory } from './ai'

// Scoring function: territory score + number of reachable cells
export function evaluate(gameState: GameSnapshot, player: string): number {
  const { board } = gameState
  const size = board.length
  // Find all stones for both sides
  const myStones: { x: number; y: number }[] = []
  const oppStones: { x: number; y: number }[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x].stone === player) myStones.push({ x, y })
      else if (board[y][x].stone && board[y][x].stone !== player) oppStones.push({ x, y })
    }
  }
  if (myStones.length === 0) return -9999
  if (oppStones.length === 0) return 9999

  // Territory score (only calculate for areas worth enclosing)
  const territory = getTerritoryMap(board)
  let myTerritory = 0,
    oppTerritory = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const owner = territory[y][x]
      if (!owner) continue
      // Calculate all cells in this enclosed area
      // Use flood fill to find all cells in this area
      const visited = Array.from({ length: size }, () => Array(size).fill(false))
      function areaCount(
        sx: number,
        sy: number,
        player: string,
      ): { count: number; myStones: number; oppStones: number } {
        let count = 0,
          myStones = 0,
          oppStones = 0
        const q = [{ x: sx, y: sy }]
        while (q.length) {
          const { x, y } = q.pop()!
          if (visited[y][x]) continue
          visited[y][x] = true
          if (territory[y][x] !== player) continue
          count++
          if (board[y][x].stone === player) myStones++
          else if (board[y][x].stone) oppStones++
          // Four directions
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = x + dx,
              ny = y + dy
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[ny][nx]) {
              q.push({ x: nx, y: ny })
            }
          }
        }
        return { count, myStones, oppStones }
      }
      if (!visited[y][x]) {
        const { count, myStones, oppStones } = areaCount(x, y, owner)
        // Only count areas worth enclosing
        if (owner === player) {
          if (count > myStones * 7 - oppStones * 3) myTerritory += count
        } else {
          if (count > oppStones * 7 - myStones * 3) oppTerritory += count
        }
      }
    }
  }

  // Flood fill to calculate number of reachable cells for each side
  function reachable(starts: { x: number; y: number }[]): number {
    const visited = Array.from({ length: size }, () => Array(size).fill(false))
    const queue = [...starts]
    let count = 0
    while (queue.length) {
      const { x, y } = queue.shift()!
      if (visited[y][x]) continue
      visited[y][x] = true
      count++
      // Four directions
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ]
      for (const { dx, dy } of dirs) {
        const nx = x + dx,
          ny = y + dy
        if (
          nx >= 0 &&
          nx < size &&
          ny >= 0 &&
          ny < size &&
          !visited[ny][nx] &&
          !board[ny][nx].stone &&
          // Check wall blocking
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
  // If all my stones are trapped (cannot move), give a very low score
  if (myReach <= myStones.length) return -9999
  // Combined score: prioritize territory, then reachable cells
  return (myTerritory - oppTerritory) * 10 + (myReach - oppReach)
}

// Minimax main function
export function minimax(
  state: GameSnapshot,
  depth: number,
  maximizing: boolean,
  player: string,
): number {
  if (depth === 0) return evaluate(state, player)
  let actions = getLegalActions(state)
  // Filter out moves that move stones inside pure territory
  if (state.phase === 'playing') {
    actions = actions.filter((a) => {
      if (a.type === 'move' && a.from) {
        return !isInPureTerritory(state, a.from, state.turn)
      }
      return true
    })
  }
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

// Placing phase: maximize number of reachable cells
// Fix getRandomAction usage, ensure passing { legalActions } and return type
export function selectBestPlacingAction(
  gameState: GameSnapshot,
  actions: PlayerAction[],
): PlayerAction {
  const placeActions = actions.filter((a) => a.type === 'place')
  if (placeActions.length === 1) {
    return placeActions[0]
  }
  const size = gameState.board.length

  function calcReachable(state: GameSnapshot, player: string): number {
    const { board } = state
    const myStones: { x: number; y: number }[] = []
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
        const nx = x + dx,
          ny = y + dy
        if (
          nx >= 0 &&
          nx < size &&
          ny >= 0 &&
          ny < size &&
          !visited[ny][nx] &&
          !board[ny][nx].stone &&
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

  function edgePenalty(pos: { x: number; y: number }): number {
    const { x, y } = pos
    const isCorner = (x === 0 || x === size - 1) && (y === 0 || y === size - 1)
    if (isCorner) return -3
    if (x === 0 || x === size - 1 || y === 0 || y === size - 1) return -2
    return 0
  }

  // Score each placement by reachable cells (higher is better), with edge penalty
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
  // Pick randomly among best
  return getRandomAction({ legalActions: bestActions })!
}
