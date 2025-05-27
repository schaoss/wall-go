// src/ai/MinimaxAI.ts
import { BaseAI } from './base-ai'
import { BOARD_SIZE } from '../lib/types'
import type { GameSnapshot, PlayerAction, Player, Pos } from '../lib/types'
import { cloneGameState, getLegalActions, getRandomAction, applyAction } from '../utils/ai'
import { isWallBetween } from '../utils/wall'

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
export class MinimaxAI extends BaseAI {
  constructor(maxDepth = 2) {
    super('MinimaxAI')
    this.maxDepth = maxDepth
  }

  maxDepth: number
  startTime: number = 0
  timeLimit: number = 5000

  evaluate(state: GameSnapshot): number {
    // 計算ZOC，紅正藍負
    const zocScore = this.evaluateZOCDistance(state)
    // 計算領土潛力，紅正藍負
    const territoryScore = this.evaluateTerritoryPotential(state)

    return 2 * zocScore + territoryScore
  }

  getBestPlace(state: GameSnapshot): PlayerAction {
    const placements = getLegalActions(state)
    return placements[Math.floor(Math.random() * placements.length)]
  }

  getBestMove(state: GameSnapshot): PlayerAction {
    this.startTime = performance.now()
    const meIsRed = state.turn === 'R'
    const claimedPositions = this.getClaimedTerritoryPositions(state, state.turn)
    let bestScore = -Infinity
    let bestActions: PlayerAction[] = []
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const actions = getLegalActions(state)
      const noWallActions = actions.filter((action) => action.type === 'move')
      const filteredActions = noWallActions.filter((action) => {
        if (action.type === 'move') {
          const key = `${action.from!.x},${action.from!.y}`
          return !claimedPositions.has(key)
        }
        return true
      })
      const candidateActions =
        filteredActions.length > 0
          ? filteredActions
          : noWallActions.length > 0
            ? noWallActions
            : actions

      if (performance.now() - this.startTime > this.timeLimit) break

      let currentBestScore = meIsRed ? -Infinity : Infinity
      let currentBestActions: PlayerAction[] = []
      const isBetterResult = (score: number) =>
        meIsRed ? score > currentBestScore : score < currentBestScore
      for (const action of candidateActions) {
        if (performance.now() - this.startTime > this.timeLimit) break
        const newState = applyAction(cloneGameState(state), action)
        const score = this.minimax(newState, depth - 1, !meIsRed, -Infinity, Infinity)
        if (!isFinite(score) || isNaN(score)) continue

        if (isBetterResult(score)) {
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
    return getRandomAction({ legalActions: bestActions }) || bestActions[0]
  }

  private minimax(
    state: GameSnapshot,
    depth: number,
    maximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity,
  ): number {
    const result = this.checkGameResult(state)
    if (result.finished) {
      return this.evaluate(state)
    }
    if (depth === 0) {
      // Quiescence search: evaluate current state and all wall-only follow-ups
      let staticEval = this.evaluate(state)
      const quietActions = getLegalActions(state).filter((a) => a.type === 'wall')
      for (const action of quietActions) {
        const qState = applyAction(cloneGameState(state), action)
        const qEval = this.evaluate(qState)
        staticEval = Math.max(staticEval, qEval)
      }
      return staticEval
    }

    const actions = getLegalActions(state)
    const currentState = cloneGameState(state)
    if (maximizing) {
      let maxEval = -Infinity
      for (const action of actions) {
        const evalScore = this.minimax(
          applyAction(currentState, action),
          depth - 1,
          false,
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
          applyAction(currentState, action),
          depth - 1,
          true,
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

  /**
   * 計算每格與雙方棋子的最短距離差異，紅方越近加分，藍方越近扣分。
   * @param state
   * @param player
   * @returns {number}
   */
  private evaluateZOCDistance(state: GameSnapshot): number {
    const board = state.board
    // 收集雙方棋子位置
    const redPositions: [number, number][] = []
    const bluePositions: [number, number][] = []
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (board[y][x].stone === 'R') redPositions.push([x, y])
        if (board[y][x].stone === 'B') bluePositions.push([x, y])
      }
    }
    // 若某方無子，避免無窮距離
    if (redPositions.length === 0 || bluePositions.length === 0) return 0
    let score = 0
    // BFS 計算從所有紅/藍子到每格的最短距離
    function bfsAll(starts: [number, number][]): number[][] {
      const dist = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(Infinity))
      const queue: [number, number, number][] = []
      for (const [x, y] of starts) {
        dist[y][x] = 0
        queue.push([x, y, 0])
      }
      while (queue.length > 0) {
        const [cx, cy, d] = queue.shift()!
        for (const [dx, dy] of DIRECTIONS) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue
          // 若有牆則不可通過
          if (dx === -1 && cx > 0 && board[cy][cx].wallLeft !== null) continue
          if (dx === 1 && cx < BOARD_SIZE - 1 && board[cy][cx + 1].wallLeft !== null) continue
          if (dy === -1 && cy > 0 && board[cy][cx].wallTop !== null) continue
          if (dy === 1 && cy < BOARD_SIZE - 1 && board[cy + 1][cx].wallTop !== null) continue
          if (dist[ny][nx] > d + 1) {
            dist[ny][nx] = d + 1
            queue.push([nx, ny, d + 1])
          }
        }
      }
      return dist
    }
    const redDist = bfsAll(redPositions)
    const blueDist = bfsAll(bluePositions)
    // 對每格計算距離差
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        // 只考慮空格
        if (board[y][x].stone !== null) continue
        const dRed = redDist[y][x]
        const dBlue = blueDist[y][x]
        if (!isFinite(dRed) && !isFinite(dBlue)) continue

        // Use inverse-distance difference: cells closer to me score more, far cells near opponent score negatively
        const invRed = 1 / (dRed + 1)
        const invBlue = 1 / (dBlue + 1)
        // For red perspective, positive if closer to red; will be flipped for blue at return
        score += invRed - invBlue
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
    const visited = new Set<string>()
    let myScore = 0
    let oppScore = 0

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const key = `${x},${y}`
        if (visited.has(key)) continue

        const cell = board[y][x]
        if (cell.stone !== null) {
          visited.add(key)
          continue
        }

        // BFS to find connected empty region
        const queue: Pos[] = [{ x, y }]
        const region: Pos[] = []
        const borderingPlayers = new Set<Player>()
        const borderStonePositions = new Set<string>()

        while (queue.length > 0) {
          const pos = queue.pop()!
          const posKey = `${pos.x},${pos.y}`
          if (visited.has(posKey)) continue
          visited.add(posKey)
          region.push(pos)

          // Check neighbors
          for (const [dx, dy] of DIRECTIONS) {
            const nx = pos.x + dx
            const ny = pos.y + dy
            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) {
              // Treat edges as walls; do not add bordering player
              continue
            }

            // Check if wall exists between pos and neighbor
            if (isWallBetween(board, pos, { x: nx, y: ny })) {
              // Wall blocks connection, do not traverse
              continue
            }

            const neighborCell = board[ny][nx]
            if (neighborCell.stone === null) {
              // Empty cell, add to queue
              const neighborKey = `${nx},${ny}`
              if (!visited.has(neighborKey)) {
                queue.push({ x: nx, y: ny })
              }
            } else {
              borderingPlayers.add(neighborCell.stone)
              borderStonePositions.add(`${nx},${ny}`)
            }
          }
        }

        if (borderingPlayers.has('R') && borderingPlayers.has('B')) {
          continue
        }

        if (borderingPlayers.size === 1) {
          // Region fully enclosed by exactly one player
          const player = [...borderingPlayers][0]
          const area = region.length
          const stonesCount = borderStonePositions.size
          const regionScore = area - stonesCount * 10
          if (player === 'R') {
            myScore += regionScore
          } else {
            oppScore += regionScore
          }
        }
      }
    }

    // Return net territory: red minus blue
    return myScore - oppScore
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
    const visited = new Set<string>()
    const claimedPositions = new Set<string>()

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const key = `${x},${y}`
        if (visited.has(key)) continue

        const cell = board[y][x]
        if (cell.stone !== null) {
          visited.add(key)
          continue
        }

        // BFS to find connected empty region
        const queue: Pos[] = [{ x, y }]
        const region: Pos[] = []
        const borderingPlayers = new Set<Player>()

        while (queue.length > 0) {
          const pos = queue.pop()!
          const posKey = `${pos.x},${pos.y}`
          if (visited.has(posKey)) continue
          visited.add(posKey)
          region.push(pos)

          // Check neighbors
          for (const [x, y] of DIRECTIONS) {
            const nx = pos.x + x
            const ny = pos.y + y
            if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) {
              // Treat edges as walls; do not add bordering player
              continue
            }

            // Check if wall exists between pos and neighbor
            if (isWallBetween(board, pos, { x: nx, y: ny })) {
              // Wall blocks connection, do not traverse
              continue
            }

            const neighborCell = board[ny][nx]
            if (neighborCell.stone === null) {
              // Empty cell, add to queue
              const neighborKey = `${nx},${ny}`
              if (!visited.has(neighborKey)) {
                queue.push({ x: nx, y: ny })
              }
            } else {
              borderingPlayers.add(neighborCell.stone)
            }
          }
        }

        // If bordering players include both players, skip this region
        if (borderingPlayers.has('R') && borderingPlayers.has('B')) {
          continue
        }

        // If bordering players include only the player 'me', add all region positions
        if (borderingPlayers.size === 1 && borderingPlayers.has(me)) {
          for (const pos of region) {
            claimedPositions.add(`${pos.x},${pos.y}`)
          }
        }
      }
    }

    return claimedPositions
  }
}
