import { PLAYER_LIST, type Cell, type Player, type Pos } from '@/lib/types'
import { isWallBetween, DIRS } from './wall'

/**
 * A connected empty region on the board, along with any adjacent player stones.
 */
export interface Region {
  /** All empty positions in this region */
  cells: Pos[]
  /** Count of bordering stones for each player */
  borderingCounts: Record<Player, number>
}

/**
 * Flood-fill all connected empty regions on the board.
 * Treats board edges as walls and stops at walls stored in Cell.
 *
 * @param board - 2D array of Cell representing the game board
 * @returns Array of Region objects, each containing a list of empty cells and any bordering players
 */
export function floodRegions(board: Cell[][]): Region[] {
  const n = board.length
  const visited = new Set<string>()
  const regions: Region[] = []

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const key = getPosKey({ x, y })
      if (visited.has(key)) continue

      // flood fill: 空格和棋子都能走，全部都加入 cells
      const queue: Pos[] = [{ x, y }]
      const cells: Pos[] = []
      const stoneColors = new Set<Player>()
      while (queue.length > 0) {
        const pos = queue.pop()!
        const posKey = getPosKey(pos)
        if (visited.has(posKey)) continue
        visited.add(posKey)
        cells.push(pos)
        const stone = board[pos.y][pos.x].stone
        if (stone !== null) stoneColors.add(stone)
        // Explore neighbors
        for (const [dx, dy] of DIRS) {
          const nx = pos.x + dx
          const ny = pos.y + dy
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) {
            continue
          }
          if (isWallBetween(board, pos, { x: nx, y: ny })) {
            continue
          }
          const neighborKey = getPosKey({ x: nx, y: ny })
          if (!visited.has(neighborKey)) {
            queue.push({ x: nx, y: ny })
          }
        }
      }
      // 統計區域內所有棋子的顏色和數量
      console.log(`Initializing borderingCounts for players: ${PLAYER_LIST.join(', ')}`);
      const borderingCounts: Record<Player, number> = PLAYER_LIST.reduce(
        (acc: Record<Player, number>, player: Player) => ({ ...acc, [player]: 0 }),
        {} as Record<Player, number>,
      )
      for (const pos of cells) {
        const stone = board[pos.y][pos.x].stone
        if (stone !== null) borderingCounts[stone]++
      }
      regions.push({ cells, borderingCounts })
    }
  }
  return regions
}

export function getPosKey(pos: Pos) {
  return `${pos.x},${pos.y}`
}
