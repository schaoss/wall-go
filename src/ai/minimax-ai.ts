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
import { getTerritoryMap } from '@/utils/territory'

export class MinimaxAI extends BaseAI {
  constructor(maxDepth = 2) {
    super(`MinimaxAI - D${maxDepth}`)
    this.maxDepth = maxDepth
  }

  maxDepth: number
  startTime: number = 0
  timeLimit: number = 5000
  private zocCache = new Map<number, Record<Player, number[][]>>()
  private tt: Map<number, number> = new Map()

  evaluate(state: GameSnapshot): number {
    const zocScore = this.evaluateZOCDistance(state)
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

    actions.sort((a, b) => this.actionHeuristic(b, state) - this.actionHeuristic(a, state))

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
      if (alpha >= beta) break
    }
    this.tt.set(ttKey, bestScore)
    return bestScore
  }

  private evaluateZOCDistance(
    state: GameSnapshot,
    stones = getAllPlayerStones(state.board),
  ): number {
    const boardKey = computeHash(state)
    const me = state.turn
    const opponents = state.players.filter((p) => p !== me)
    let distByPlayer: Record<Player, number[][]>

    if (this.zocCache.has(boardKey)) {
      distByPlayer = this.zocCache.get(boardKey)!
    } else {
      const board = state.board
      distByPlayer = { R: [], B: [], Y: [], G: [] }

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

      for (const player of state.players) {
        const positions: Pos[] = stones.filter((s) => s.player === player).map((s) => s.position)
        for (let y = 0; y < BOARD_SIZE; y++) {
          for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x].stone === player) positions.push({ x, y })
          }
        }
        distByPlayer[player] =
          positions.length > 0
            ? bfsAll(positions)
            : Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
      }
      this.zocCache.set(boardKey, distByPlayer)
    }

    const myDist = distByPlayer[me]
    if (!myDist || myDist.length === 0) return 0

    let score = 0
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const dMe = myDist[y][x]
        const minOppDist = Math.min(
          ...opponents.map((opp) => distByPlayer[opp]?.[y]?.[x] ?? Infinity),
        )

        if (!isFinite(dMe) && !isFinite(minOppDist)) continue

        const invMe = 1 / (dMe + 1)
        const invOpp = 1 / (minOppDist + 1)

        const isStone = state.board[y][x].stone !== null
        const weight = isStone ? 0.2 : 1
        score += weight * (invMe - invOpp)
      }
    }
    return score
  }

  private evaluateTerritoryPotential(state: GameSnapshot): number {
    const board = state.board
    const territory = getTerritoryMap(board)
    const me = state.turn
    const opponents = state.players.filter((p) => p !== me)

    const totals: Record<Player, number> = { R: 0, B: 0, Y: 0, G: 0 }
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        const owner = territory[y][x]
        if (owner) totals[owner]++
      }
    }

    const myTerritory = totals[me]
    const oppTerritory = opponents.reduce((sum, opp) => sum + totals[opp], 0)
    const score = myTerritory - oppTerritory / opponents.length

    if (score !== 0) return score

    const visited = new Set<string>()
    const largest: Record<Player, number> = { R: 0, B: 0, Y: 0, G: 0 }
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        const owner = territory[y][x]
        const key = `${x},${y}`
        if (!owner || visited.has(key)) continue

        let area = 0
        const queue: Pos[] = [{ x, y }]
        visited.add(key)
        while (queue.length > 0) {
          const p = queue.pop()!
          area++
          for (const [dx, dy] of DIRS) {
            const nx = p.x + dx
            const ny = p.y + dy
            if (isOutbound(nx, ny)) continue
            if (territory[ny][nx] !== owner) continue
            const nKey = `${nx},${ny}`
            if (visited.has(nKey)) continue
            visited.add(nKey)
            queue.push({ x: nx, y: ny })
          }
        }
        largest[owner] = Math.max(largest[owner], area)
      }
    }

    const myLargest = largest[me]
    const oppLargest = Math.max(...opponents.map((opp) => largest[opp]))
    return myLargest - oppLargest
  }

  private actionHeuristic(action: PlayerAction, state: GameSnapshot): number {
    if (action.type !== 'move') return 0
    const opponents = state.players.filter((p) => p !== state.turn)
    const oppStones = getAllPlayerStones(state.board).filter((s) => opponents.includes(s.player))
    let best = Infinity
    for (const s of oppStones) {
      const d = Math.abs(s.position.x - action.pos.x) + Math.abs(s.position.y - action.pos.y)
      if (d < best) best = d
    }
    return -best
  }

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

function randomUInt32(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0
}

const PIECE_INDEX: Record<string, number> = { R: 1, B: 2, Y: 3, G: 4 }

function encodeCell(cell: Cell): number {
  const piece = cell.stone ? PIECE_INDEX[cell.stone] : 0
  let bits = 0
  if (cell.wallLeft) bits |= 1
  if (cell.wallTop) bits |= 2
  return piece * 4 + bits
}

const ZOBRIST: number[][][] = (() => {
  const s = BOARD_SIZE
  const states = 20
  const table: number[][][] = Array.from({ length: s }, () =>
    Array.from({ length: s }, () => Array.from({ length: states }, () => randomUInt32())),
  )
  return table
})()

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

function getTranspositionKey(state: GameSnapshot, depth: number, maximizing: boolean): number {
  const h = computeHash(state)
  return (h ^ ((depth << 1) >>> 0) ^ (maximizing ? 1 : 0)) >>> 0
}
