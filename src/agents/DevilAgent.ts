import type { PlayerAgent } from './PlayerAgent'
import type { GameSnapshot, PlayerAction, Player, Cell } from '../lib/types'
import { reachable, cloneGameState, applyAction, getLegalActions, getRandomAction, getBestPlacement } from '../utils/ai'

export class DevilAgent implements PlayerAgent {
  private MAX_THINKING_TIME = 2000

  private choosePlacement = (gameState: GameSnapshot): PlayerAction => {
    return getBestPlacement(gameState)
  }

  private getBestMove(gameState: GameSnapshot, legalActions: PlayerAction[]): PlayerAction {
    return bestAction(gameState, legalActions, this.MAX_THINKING_TIME)
  }

  async getAction(gameState: GameSnapshot): Promise<PlayerAction> {
    await new Promise(res => setTimeout(res, 100 + Math.floor(Math.random() * 50)))
    const actions = getLegalActions(gameState)
    if (actions.length === 0) throw new Error('No legal action')

    switch (gameState.phase) {
      case 'placing':
        return this.choosePlacement(gameState)
      case 'playing':
        return this.getBestMove(gameState, actions)
      default:
        return getRandomAction({ legalActions: actions })!
    }
  }
}

/***** Zobrist hash *****************************************************/
const N = 7
const zobristStone: bigint[][][] = [...Array(N)].map(() =>
  [...Array(N)].map(() => [rand64(), rand64()]) // 0: R, 1: B
)
const zobristWallLeft: bigint[][] = [...Array(N)].map(() =>
  [...Array(N)].map(rand64)
)
const zobristWallTop: bigint[][] = [...Array(N)].map(() =>
  [...Array(N)].map(rand64)
)
function rand64(): bigint {
  return BigInt.asUintN(64, BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)))
}


export function hashBoard(board: Cell[][]): string {
  let h = 0n
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const c = board[y][x]
      if (c.stone === 'R') h ^= zobristStone[y][x][0]
      if (c.stone === 'B') h ^= zobristStone[y][x][1]
      if (c.wallLeft) h ^= zobristWallLeft[y][x]
      if (c.wallTop) h ^= zobristWallTop[y][x]
    }
  }
  return h.toString()
}

/***** Transposition Table **********************************************/
interface TTEntry { depth: number; value: number }
const TT = new Map<string, TTEntry>()

/***** Evaluation *******************************************************/
function stoneLiberties(board: Cell[][], x: number, y: number): number {
  let lib = 0
  if (x < N - 1 && !board[y][x + 1].wallLeft && !board[y][x + 1].stone) lib++
  if (x > 0 && !board[y][x].wallLeft && !board[y][x - 1].stone) lib++
  if (y < N - 1 && !board[y + 1][x].wallTop && !board[y + 1][x].stone) lib++
  if (y > 0 && !board[y][x].wallTop && !board[y - 1][x].stone) lib++
  return lib
}
function totalLib(board: Cell[][], p: Player) {
  let sum = 0
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (board[y][x].stone === p) sum += stoneLiberties(board, x, y)
  return sum
}

function evalState(state: GameSnapshot, me: Player): number {
  const opp: Player = me === 'R' ? 'B' : 'R'

  // reach difference
  const reachScore = (reachable(state.board, me) - reachable(state.board, opp)) * 8

  // liberty difference
  const libScore = (totalLib(state.board, opp) - totalLib(state.board, me)) * 6

  // isolate bonus
  let iso = 0
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (state.board[y][x].stone === opp && stoneLiberties(state.board, x, y) === 0) iso += 50

  // critical self‑liberty penalty
  let selfCritical = 0
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (state.board[y][x].stone === me) {
        const l = stoneLiberties(state.board, x, y)
        if (l === 1) selfCritical += 40   // about to be trapped
        if (l === 0) selfCritical += 120  // already trapped / suicide
      }
    }
  }

  return reachScore + libScore + iso - selfCritical
}

function actionHeuristic(state: GameSnapshot, action: PlayerAction, me: Player) {
  const beforeReach = reachable(state.board, me)
  const beforeLib = totalLib(state.board, me)

  const after = applyAction(cloneGameState(state), action)
  const afterReach = reachable(after.board, me)
  if (afterReach === 0) return -Infinity

  const afterLib = totalLib(after.board, me)

  let score = evalState(after, me)
  const selfReachLoss = Math.max(0, beforeReach - afterReach)
  const selfLibLoss = Math.max(0, beforeLib - afterLib)
  score -= 12 * selfReachLoss
  score -= 8 * selfLibLoss

  return score
}

/***** Alpha‑Beta Search ************************************************/
export function bestAction(state: GameSnapshot, legalActions: PlayerAction[], maxMs = 500): PlayerAction {
  const start = performance.now()
  let best: PlayerAction | null = null
  let depth = 1
  while (performance.now() - start < maxMs) {
    const { action } = searchRoot(state, depth, start, maxMs)
    if (action) best = action
    depth++
  }
  return best ?? getRandomAction({ legalActions })!
}

function searchRoot(state: GameSnapshot, depth: number, t0: number, limit: number) {
  let bestVal = -Infinity
  let best: PlayerAction | null = null
  const me = state.turn
  const moves = getLegalActions(state).sort((a, b) => {
    const sA = actionHeuristic(state, a, me)
    const sB = actionHeuristic(state, b, me)
    return sB - sA
  })
  for (const action of moves) {
    const child = applyAction(cloneGameState(state), action)
    const val = -alphaBeta(child, depth - 1, -Infinity, Infinity, me, t0, limit)
    if (val > bestVal) {
      bestVal = val
      best = action
    }
  }
  return { action: best, value: bestVal }
}

function alphaBeta(state: GameSnapshot, depth: number, alpha: number, beta: number, me: Player, t0: number, limit: number): number {
  if (performance.now() - t0 > limit) return evalState(state, me) // time cutoff
  const key = hashBoard(state.board)
  const tt = TT.get(key)
  if (tt && tt.depth >= depth) return tt.value

  if (depth === 0 || state.phase !== 'playing') return evalState(state, me)

  let val = -Infinity
  const moves = getLegalActions(state).sort((a, b) => actionHeuristic(state, b, me) - actionHeuristic(state, a, me))
  for (const action of moves) {
    const child = applyAction(cloneGameState(state), action)
    val = Math.max(val, -alphaBeta(child, depth - 1, -beta, -alpha, me, t0, limit))
    alpha = Math.max(alpha, val)
    if (alpha >= beta) break // beta cut
  }
  TT.set(key, { depth, value: val })
  return val
}
