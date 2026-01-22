import { BOARD_SIZE, type Pos, type Cell, type WallDir } from '@/lib/types'

export function isLegalMove(from: Pos, to: Pos, board: Cell[][], maxSteps = 2, allowBreak = false) {
  const q: [Pos, number][] = [[from, 0]]
  const seen = new Set<string>([`${from.x},${from.y}`])
  while (q.length) {
    const [{ x, y }, d] = q.shift()!
    if (d > maxSteps) continue
    // can't count staying in place
    if (x === to.x && y === to.y) {
      if (d === 0) {
        // ignore the origin
      } else {
        return true
      }
    }
    if (d === maxSteps) continue
    const dirs: [number, number, WallDir][] = [
      [1, 0, 'left'],
      [-1, 0, 'left'],
      [0, 1, 'top'],
      [0, -1, 'top'],
    ]
    dirs.forEach(([dx, dy, dir]) => {
      const nx = x + (dx as number),
        ny = y + (dy as number)
      if (isOutbound(nx, ny)) return
      // 牆判斷
      const blocked =
        dir === 'left'
          ? dx === 1
            ? board[y][x + 1].wallLeft
            : board[y][x].wallLeft
          : dy === 1
            ? board[y + 1][x].wallTop
            : board[y][x].wallTop
      if (blocked && !allowBreak) return
      if (board[ny][nx].stone) return
      const key = `${nx},${ny}`
      if (seen.has(key)) return
      seen.add(key)
      q.push([{ x: nx, y: ny }, d + 1])
    })
  }
  return false
}

export interface MovePath {
  path: Pos[]
  wallsCrossed: { pos: Pos; dir: WallDir; type: 'wallTop' | 'wallLeft' }[]
}

export function getPath(from: Pos, to: Pos, board: Cell[][], maxSteps = 2): MovePath | null {
  // BFS to find path with minimal wall crossings?
  // Actually, standard rule is: cannot cross wall unless break mode.
  // With break mode: can cross wall.
  // Optimization: prefer path with 0 walls > 1 wall.
  // Since maxSteps is small (2), we can just BFS state (pos, wallsCrossedCount).

  // Sort by walls crossed then distance?
  // DFS or BFS.
  // BFS is good for shortest path.
  // We want shortest path (steps), THEN minimal walls?
  // Or minimal walls first?
  // Usually minimal moves is primary. If same moves, minimize walls.
  // Let's use priority queue logic or just simple BFS layers.
  // Layer 0: 0 steps.
  // Layer 1: 1 step neighbors.
  // Layer 2: 2 step neighbors.

  // We can collect all valid paths to `to`, then sort.
  const validPaths: MovePath[] = []

  // Note: we might revisit same node if fewer walls?
  // But with maxSteps=2, graph is tiny.
  // Let's iterate steps 1..maxSteps.

  // Custom BFS
  const queue: { pos: Pos; path: Pos[]; walls: MovePath['wallsCrossed'] }[] = [
    { pos: from, path: [from], walls: [] },
  ]

  while (queue.length > 0) {
    const curr = queue.shift()!
    const { pos, path, walls } = curr

    if (pos.x === to.x && pos.y === to.y) {
      if (path.length > 1) {
        // exclude start node itself as a "move"
        validPaths.push({ path, wallsCrossed: walls })
      }
      continue
    }

    if (path.length - 1 >= maxSteps) continue

    const dirs: [number, number, WallDir][] = [
      [1, 0, 'left'],
      [-1, 0, 'left'], // moving left checks current cell's left wall? No.
      // moving right checks NEXT cell's left wall.
      // moving down checks NEXT cell's top wall.
      // moving up checks current cell's top wall.
      [0, 1, 'top'],
      [0, -1, 'top'],
    ]

    dirs.forEach(([dx, dy, dir]) => {
      const nx = pos.x + dx
      const ny = pos.y + dy
      if (isOutbound(nx, ny)) return

      // Calculate wall obstruction
      let wallBlocked: { pos: Pos; dir: WallDir; type: 'wallTop' | 'wallLeft' } | null = null

      if (dir === 'left') {
        // Moving horizontal
        if (dx === 1) {
          // Right: check (x+1, y) left wall
          if (board[ny][nx].wallLeft)
            wallBlocked = { pos: { x: nx, y: ny }, dir: 'left', type: 'wallLeft' }
        } else {
          // Left: check (x, y) left wall
          if (board[ny][pos.x].wallLeft)
            wallBlocked = { pos: { x: pos.x, y: ny }, dir: 'left', type: 'wallLeft' }
        }
      } else {
        // Moving vertical
        if (dy === 1) {
          // Down: check (x, y+1) top wall
          if (board[ny][nx].wallTop)
            wallBlocked = { pos: { x: nx, y: ny }, dir: 'top', type: 'wallTop' }
        } else {
          // Up: check (x, y) top wall
          if (board[pos.y][nx].wallTop)
            wallBlocked = { pos: { x: nx, y: pos.y }, dir: 'top', type: 'wallTop' }
        }
      }

      // Check stone collision
      if (board[ny][nx].stone) return // Cannot move onto stone

      // Add to queue
      // We don't check "seen" strictly because we might find a better path with fewer walls?
      // But max steps is 2. Cycles impossible.
      // 0->1->2.
      // Only danger is 0->1(right)->0(left). Backtracking.
      // Check if nx,ny in path?
      if (path.some((p) => p.x === nx && p.y === ny)) return

      queue.push({
        pos: { x: nx, y: ny },
        path: [...path, { x: nx, y: ny }],
        walls: wallBlocked ? [...walls, wallBlocked] : walls,
      })
    })
  }

  if (validPaths.length === 0) return null

  // Sort paths:
  // 1. Total walls crossed (ascending)
  // 2. Path length (ascending) - actually shorter path is preferred?
  //    Rule: "Move 0, 1 or 2 steps".
  //    If I want to go to X.
  //    If X is 1 step away, great.
  //    If X is 2 steps away, I must step on intermediate.
  //    Moves are usually defined by destination.
  //    So path length is strictly defined by geometry?
  //    Not necessarily. 0,0 -> 1,1 has 2 paths: (0,0->1,0->1,1) or (0,0->0,1->1,1).
  //    We should pick the one with fewer walls.

  validPaths.sort((a, b) => {
    if (a.wallsCrossed.length !== b.wallsCrossed.length) {
      return a.wallsCrossed.length - b.wallsCrossed.length
    }
    return a.path.length - b.path.length
  })

  return validPaths[0]
}

export function isOutbound(x: number, y: number): boolean {
  return x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE
}
