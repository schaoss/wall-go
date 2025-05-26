// src/ai/MinimaxAI.ts
import { BaseAI } from './base-ai'
import type { GameSnapshot, PlayerAction, Player } from '../lib/types'
import { cloneGameState, getLegalActions, applyAction, isSuicideMove } from '../utils/ai'

export class MinimaxAI extends BaseAI {
  constructor(maxDepth = 2) {
    super('MinimaxAI')
    this.maxDepth = maxDepth
  }

  maxDepth: number
  startTime: number = 0
  timeLimit: number = 5000

  evaluate(state: GameSnapshot): number {
    const myReachable = new Set(
      Array.from(
        state.board.flatMap((row, y) =>
          row.map((cell, x) => {
            if (cell.stone === state.turn) return `${x},${y}`
            return null
          }),
        ),
      ).filter(Boolean) as string[],
    )

    const other = state.turn === 'R' ? 'B' : 'R'
    const myTerritory = this.evaluateTerritory(state, state.turn)
    const enemyTerritory = this.evaluateTerritory(state, other)

    return (
      3 * myReachable.size -
      3 * this.evaluateReachable(state, other) +
      5 * myTerritory -
      4 * enemyTerritory
    )
  }

  private evaluateReachable(state: GameSnapshot, player: Player): number {
    const reachable = new Set<string>()
    for (let y = 0; y < state.board.length; y++) {
      for (let x = 0; x < state.board[0].length; x++) {
        if (state.board[y][x].stone === player) {
          reachable.add(`${x},${y}`)
        }
      }
    }
    return reachable.size
  }

  getBestPlace(state: GameSnapshot): PlayerAction {
    const placements = getLegalActions(state).filter((a) => a.type === 'place')
    return placements[Math.floor(Math.random() * placements.length)]
  }

  getBestMove(state: GameSnapshot): PlayerAction {
    this.startTime = performance.now()
    const baseResult = this.checkGameResult(state)
    const baseScore = baseResult.score?.[state.turn] ?? 0
    let bestScore = -Infinity
    let bestActions: PlayerAction[] = []
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const legalActions = getLegalActions(state).filter(
        (a) => a.type !== 'place' && !isSuicideMove(state, a, state.turn),
      )
      const actions = legalActions.length > 0 ? legalActions : getLegalActions(state)
      if (performance.now() - this.startTime > this.timeLimit) {
        break
      }
      let currentBestScore = -Infinity
      let currentBestActions: PlayerAction[] = []
      for (const action of actions) {
        if (performance.now() - this.startTime > this.timeLimit) {
          break
        }
        const newState = applyAction(cloneGameState(state), action)
        const newResult = this.checkGameResult(newState)
        const newScore = newResult.score?.[state.turn] ?? 0
        if (newScore < baseScore) continue
        const score = this.minimax(newState, depth - 1, false, state.turn, -Infinity, Infinity)
        if (score > currentBestScore) {
          currentBestScore = score
          currentBestActions = [action]
        } else if (score === currentBestScore) {
          currentBestActions.push(action)
        }
      }
      if (currentBestScore > bestScore) {
        bestScore = currentBestScore
        bestActions = currentBestActions
      }
    }
    return bestActions[Math.floor(Math.random() * bestActions.length)]
  }

  private minimax(
    state: GameSnapshot,
    depth: number,
    maximizing: boolean,
    me: Player,
    alpha: number = -Infinity,
    beta: number = Infinity,
  ): number {
    if (performance.now() - this.startTime > this.timeLimit) {
      return this.evaluate(state)
    }
    const result = this.checkGameResult(state)
    if (depth === 0 || result.finished) return this.evaluate(state)

    const actions = getLegalActions(state).filter((a) => a.type !== 'place')

    if (maximizing) {
      let maxEval = -Infinity
      for (const action of actions) {
        const evalScore = this.minimax(
          applyAction(cloneGameState(state), action),
          depth - 1,
          false,
          me,
          alpha,
          beta,
        )
        maxEval = Math.max(maxEval, evalScore)
        alpha = Math.max(alpha, evalScore)
        if (beta <= alpha) {
          break // beta cut-off
        }
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const action of actions) {
        const evalScore = this.minimax(
          applyAction(cloneGameState(state), action),
          depth - 1,
          true,
          me,
          alpha,
          beta,
        )
        minEval = Math.min(minEval, evalScore)
        beta = Math.min(beta, evalScore)
        if (beta <= alpha) {
          break // alpha cut-off
        }
      }
      return minEval
    }
  }

  private evaluateTerritory(state: GameSnapshot, player: Player): number {
    const visited = new Set<string>()
    const board = state.board
    const height = board.length
    const width = board[0].length
    let totalArea = 0

    const isWall = (x: number, y: number, dx: number, dy: number): boolean => {
      if (dx === -1 && x > 0) return board[y][x].wallLeft !== null // left wall
      if (dx === 1 && x < width - 1) return board[y][x + 1].wallLeft !== null // right wall: right cell's left wall
      if (dy === -1 && y > 0) return board[y][x].wallTop !== null // top wall
      if (dy === 1 && y < height - 1) return board[y + 1][x].wallTop !== null // bottom wall: below cell's top wall
      return false
    }

    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]

    const floodFill = (x: number, y: number): number => {
      const queue: [number, number][] = [[x, y]]
      const region: [number, number][] = []
      let touchesEdge = false
      const containedPlayers = new Set<Player | null>()

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!
        const key = `${cx},${cy}`
        if (visited.has(key)) continue
        visited.add(key)
        region.push([cx, cy])

        if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) {
          touchesEdge = true
        }

        containedPlayers.add(board[cy][cx].stone)

        for (const [dx, dy] of directions) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          if (isWall(cx, cy, dx, dy)) continue

          const nextKey = `${nx},${ny}`
          if (!visited.has(nextKey)) {
            queue.push([nx, ny])
          }
        }
      }

      if (!touchesEdge && containedPlayers.size === 1 && containedPlayers.has(player)) {
        return region.length
      } else {
        return 0
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`
        if (!visited.has(key)) {
          totalArea += floodFill(x, y)
        }
      }
    }

    return totalArea
  }
}
