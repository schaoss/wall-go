// src/ai/MinimaxAI.ts
import { BaseAI } from './base-ai'
import { BOARD_SIZE } from '@/lib/types'
import type {
  GameSnapshot,
  PlayerAction,
  FindBestActionsResult,
  Player,
  Cell,
  Pos,
} from '@/lib/types'
import { getLegalActions, getRandomAction, applyAction } from '@/utils/ai'
import { isWallBetween, DIRS } from '@/utils/wall'
import { getAllPlayerStones } from '@/utils/player'
import { isOutbound } from '@/utils/move'
import { floodRegions, getPosKey } from '@/utils/region'

export class MinimaxAI extends BaseAI {
  constructor(maxDepth = 2) {
    super(`MinimaxAI - D${maxDepth}`)
    this.maxDepth = maxDepth
  }

  maxDepth: number
  startTime: number = 0
  timeLimit: number = 5000
  private zocCache = new Map<number, { redDist: number[][]; blueDist: number[][] }>()
  private tt: Map<number, number> = new Map()

  evaluate(state: GameSnapshot): number {
    // 計算ZOC，紅正藍負
    const zocScore = this.evaluateZOCDistance(state)
    // 計算領土潛力，紅正藍負
    const territoryScore = this.evaluateTerritoryPotential(state)

    return 1.5 * zocScore + territoryScore
  }

  getBestPlace(state: GameSnapshot): PlayerAction {
    const actions = getLegalActions(state)
    const meIsRed = state.turn === 'R'
    const placeResult = this.findBestAction(state, actions, meIsRed, () =>
      this.evaluateZOCDistance.bind(this),
    )
    return getRandomAction(placeResult.actions)!
  }

  getBestMove(state: GameSnapshot): PlayerAction {
    this.startTime = performance.now()
    const meIsRed = state.turn === 'R'
    const claimedPositions = this.getClaimedTerritoryPositions(state, state.turn)
    const actions = getLegalActions(state)
    const filteredActions = actions.filter((action) => {
      return !claimedPositions.has(getPosKey(action.from!))
    })
    const candidateActions = filteredActions.length > 0 ? filteredActions : actions
    candidateActions.sort((a, b) => this.actionHeuristic(b, state) - this.actionHeuristic(a, state))

    let bestScore = -Infinity
    let bestActions: PlayerAction[] = []

    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const evaluateDepth = (isMaximizing: boolean) => (s: GameSnapshot) => {
        if (performance.now() - this.startTime > this.timeLimit) return bestScore
        return this.minimax(s, depth - 1, isMaximizing)
      }
      const { actions, score } = this.findBestAction(
        state,
        candidateActions,
        meIsRed,
        evaluateDepth as (...args: unknown[]) => (s: GameSnapshot) => number,
      )
      if (!isFinite(score) || isNaN(score)) continue
      if (score > bestScore) {
        bestScore = score
        bestActions = actions
      }
    }
    if (!bestActions.length) bestActions = candidateActions
    return getRandomAction(bestActions)!
  }

  private findBestAction(
    state: GameSnapshot,
    actions: PlayerAction[],
    isMaximizing: boolean,
    evaluateFn: (...args: unknown[]) => (state: GameSnapshot) => number,
  ): FindBestActionsResult {
    const defaultScore = isMaximizing ? -Infinity : Infinity
    const result: FindBestActionsResult = { actions: [], score: defaultScore }
    const isBetterResult = (newScore: number, bestScore: number) =>
      isMaximizing ? newScore > bestScore : newScore < bestScore

    for (const action of actions) {
      const newScore = evaluateFn(!isMaximizing)(applyAction(state, action))
      if (!isFinite(newScore) || isNaN(newScore)) continue
      if (isBetterResult(newScore, result.score)) {
        result.score = newScore
        result.actions.length = 0 // Clear previous actions
        result.actions.push(action)
      } else if (newScore === result.score) {
        result.actions.push(action)
      }
    }
    return result.actions.length > 0 ? result : { actions, score: defaultScore }
  }

  private minimax(
    state: GameSnapshot,
    depth: number,
    maximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity,
  ): number {
    const ttKey = getTranspositionKey(state, depth, maximizing)
    if (this.tt.has(ttKey)) return this.tt.get(ttKey)!

    if (depth === 0) return this.evaluate(state)

    const result = this.checkGameResult(state)
    if (result.finished) return this.evaluate(state)

    const PROCESS_CONFIG = {
      max: {
        defaultValue: -Infinity,
        isBetterResult: (score: number) => score > alpha,
        updateFunction: (score: number) => (alpha = Math.max(alpha, score)),
      },
      min: {
        defaultValue: Infinity,
        isBetterResult: (score: number) => score < beta,
        updateFunction: (score: number) => (beta = Math.min(beta, score)),
      },
    }

    const config = maximizing ? PROCESS_CONFIG.max : PROCESS_CONFIG.min
    let bestScore = config.defaultValue
    const actions = getLegalActions(state)
    for (const action of actions) {
      const evalScore = this.minimax(
        applyAction(state, action),
        depth - 1,
        !maximizing,
        alpha,
        beta,
      )
      if (config.isBetterResult(evalScore)) {
        bestScore = evalScore
        config.updateFunction(evalScore)
      }
      if (alpha >= beta) break // Cut-off condition met
    }
    this.tt.set(ttKey, bestScore)
    return bestScore
  }

  /**
   * 計算每格與雙方棋子的最短距離差異，紅方越近加分，藍方越近扣分。
   * @param state
   * @param player
   * @returns {number}
   */
  private evaluateZOCDistance(
    state: GameSnapshot,
    stones = getAllPlayerStones(state.board),
  ): number {
    // Generate a simple key for the board to reuse BFS results
    const boardKey = computeHash(state)
    let redDist: number[][], blueDist: number[][]
    if (this.zocCache.has(boardKey)) {
      const cached = this.zocCache.get(boardKey)!
      redDist = cached.redDist
      blueDist = cached.blueDist
    } else {
      const board = state.board

      const redPositions: Pos[] = stones
        .filter((stone) => stone.player === 'R')
        .map((stone) => stone.position)
      const bluePositions: Pos[] = stones
        .filter((stone) => stone.player === 'B')
        .map((stone) => stone.position)

      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (board[y][x].stone === 'R') redPositions.push({ x, y })
          if (board[y][x].stone === 'B') bluePositions.push({ x, y })
        }
      }
      // 若某方無子，避免無窮距離
      if (redPositions.length === 0 || bluePositions.length === 0) return 0
      // BFS 計算從所有紅/藍子到每格的最短距離
      function bfsAll(starts: Pos[]): number[][] {
        const dist = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
        const queue: [number, number, number][] = []
        for (const { x, y } of starts) {
          dist[y][x] = 0
          queue.push([x, y, 0])
        }
        while (queue.length > 0) {
          const [cx, cy, d] = queue.shift()!
          for (const [dx, dy] of DIRS) {
            const nx = cx + dx
            const ny = cy + dy
            if (isOutbound(nx, ny)) continue
            if (isWallBetween(board, { x: cx, y: cy }, { x: nx, y: ny })) continue

            if (dist[ny][nx] > d + 1) {
              dist[ny][nx] = d + 1
              queue.push([nx, ny, d + 1])
            }
          }
        }
        return dist
      }
      redDist = bfsAll(redPositions)
      blueDist = bfsAll(bluePositions)
      this.zocCache.set(boardKey, { redDist, blueDist })
    }
    // 對每格計算距離差
    let score = 0
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const dRed = redDist[y][x]
        const dBlue = blueDist[y][x]
        if (!isFinite(dRed) && !isFinite(dBlue)) continue

        // Use inverse-distance difference: cells closer to me score more, far cells near opponent score negatively
        const invRed = 1 / (dRed + 1)
        const invBlue = 1 / (dBlue + 1)

        const isStone = state.board[y][x].stone !== null
        const weight = isStone ? 0.2 : 1
        score += weight * (invRed - invBlue)
      }
    }
    return score
  }

  /**
   * Evaluate the territory potential for the given player on the current game state.
   * Territory is defined as empty areas fully enclosed by the player's stones and walls.
   * @param state - The current game snapshot.
   * @returns A numeric score representing the net territory potential (red minus blue).
   */
  private evaluateTerritoryPotential(state: GameSnapshot): number {
    const board = state.board
    let score = 0

    const regions = floodRegions(board)
    for (const { borderingCounts, cells } of regions) {
      const numBorderingPlayers = Object.values(borderingCounts).filter((count) => !count).length
      if (numBorderingPlayers !== 1) continue

      const player = borderingCounts['R'] > 0 ? 'R' : 'B'
      const area = cells.length

      // Count stones on the border of the region
      const borderStonePositions = new Set<string>()
      for (const pos of cells) {
        for (const [dx, dy] of DIRS) {
          const nx = pos.x + dx
          const ny = pos.y + dy
          if (isOutbound(nx, ny)) continue
          if (isWallBetween(board, pos, { x: nx, y: ny })) continue
          const neighborCell = board[ny][nx]
          if (neighborCell.stone !== null) {
            borderStonePositions.add(`${nx},${ny}`)
          }
        }
      }

      const stonesCount = borderStonePositions.size
      const regionScore = area - stonesCount * 10
      if (player === 'R') {
        score += regionScore
      } else {
        score -= regionScore
      }
    }

    return score
  }

  private actionHeuristic(action: PlayerAction, state: GameSnapshot): number {
    if (action.type !== 'move') return 0
    const opponent = state.turn === 'R' ? 'B' : 'R'
    const oppStones = getAllPlayerStones(state.board).filter((s) => s.player === opponent)
    let best = Infinity
    for (const s of oppStones) {
      const d = Math.abs(s.position.x - action.pos.x) + Math.abs(s.position.y - action.pos.y)
      if (d < best) best = d
    }
    return -best
  }

  /**
   * Returns a set of string keys representing positions claimed by the player.
   * Claimed territory is empty regions fully enclosed by the player's stones and walls.
   * @param state - The current game snapshot.
   * @param me - The player to get claimed territory for.
   * @returns Set of position keys (e.g., "x,y") claimed by the player.
   */
  getClaimedTerritoryPositions(state: GameSnapshot, me: Player): Set<string> {
    const board = state.board
    const claimedPositions = new Set<string>()

    const regions = floodRegions(board)
    for (const { borderingCounts, cells } of regions) {
      if (Object.values(borderingCounts).reduce((acc, c) => acc + c) === borderingCounts[me]) {
        for (const pos of cells) claimedPositions.add(`${pos.x},${pos.y}`)
      }
    }

    return claimedPositions
  }
}

// Zobrist hashing setup
function randomUInt32(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0
}

// encode one cell: piece (0 empty,1 R,2 B) and wall bits (bit0=left, bit1=top)
function encodeCell(cell: Cell): number {
  const piece = cell.stone === 'R' ? 1 : cell.stone === 'B' ? 2 : 0
  let bits = 0
  if (cell.wallLeft) bits |= 1
  if (cell.wallTop) bits |= 2
  return piece * 4 + bits // 3*4+3 = up to 11
}

// generate ZOBRIST table
const ZOBRIST: number[][][] = (() => {
  const s = BOARD_SIZE
  const states = 12
  const table: number[][][] = Array.from({ length: s }, () =>
    Array.from({ length: s }, () => Array.from({ length: states }, () => randomUInt32())),
  )
  return table
})()

// compute full board hash
function computeHash(state: GameSnapshot): number {
  let h = 0
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const idx = encodeCell(state.board[y][x])
      h ^= ZOBRIST[y][x][idx]
    }
  }
  return h >>> 0
}

// transposition key: numeric hash combined with depth/max flag
function getTranspositionKey(state: GameSnapshot, depth: number, maximizing: boolean): number {
  const h = computeHash(state)
  // shift depth and flag into low bits
  return (h ^ ((depth << 1) >>> 0) ^ (maximizing ? 1 : 0)) >>> 0
}
