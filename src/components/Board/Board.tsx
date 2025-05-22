import clsx from 'clsx'
import { BOARD_SIZE } from '../../lib/types'
import type { Phase, WallDir, Player, Pos } from '../../lib/types'
import Cell from './Cell'
import { checkGameEnd } from '../../utils/checkGameEnd'

export interface BoardProps {
  board: import('../../lib/types').Cell[][]
  phase: Phase
  turn: Player
  selected: Pos | null
  legal: Set<string>
  selectStone: (pos: Pos) => void
  placeStone: (pos: Pos) => void
  moveTo: (pos: Pos) => void
  buildWall: (pos: Pos, dir: WallDir) => void
}

function Board({
  board, phase, turn, selected, legal,
  selectStone, placeStone, moveTo, buildWall
}: BoardProps) {
  // 領地資訊: phase finished 時才計算
  let territoryMap: (Player | null)[][] | null = null
  if (phase === 'finished') {
    // 取得領地分布
    territoryMap = getTerritoryMap(board)
  }
  return (
    <div className="w-full border-4 border-zinc-500 dark:border-zinc-700 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 transition-all duration-500 hover:shadow-2xl inline-block max-w-[800px] w-full aspect-square">
      <div
        className={clsx(
          'grid',
          `grid-cols-${BOARD_SIZE}`,
          `grid-rows-${BOARD_SIZE}`,
          'gap-[2px] p-2 sm:p-4',
          'transition-all duration-500',
          'bg-white/80 dark:bg-zinc-900/80',
          'rounded-xl',
          phase === 'playing' || phase === 'placing'
            ? (turn === 'R'
                ? 'animate-player-glow-red'
                : 'animate-player-glow-blue')
            : '',
        )}
      >
        {board.map((row, y) =>
          row.map((cell, x) => {
            const posKey = `${x},${y}`
            const isSel = selected?.x === x && selected?.y === y
            return (
              <Cell
                key={posKey}
                x={x}
                y={y}
                cell={cell}
                isSel={isSel}
                phase={phase}
                turn={turn}
                legal={legal}
                selectStone={selectStone}
                placeStone={placeStone}
                moveTo={moveTo}
                buildWall={buildWall}
                board={board}
                boardSize={BOARD_SIZE}
                territoryOwner={territoryMap ? territoryMap[y][x] : undefined}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

// 計算每格領地歸屬
function getTerritoryMap(board: import('../../lib/types').Cell[][]): (Player | null)[][] {
  // 直接複製 checkGameEnd 的 BFS 領地歸屬邏輯
  const BOARD_SIZE = board.length
  const visited = Array.from({ length: BOARD_SIZE }, () => Array<boolean>(BOARD_SIZE).fill(false))
  const territory = Array.from({ length: BOARD_SIZE }, () => Array<Player | null>(BOARD_SIZE).fill(null))
  const dirs: [number, number, WallDir][] = [
    [1, 0, 'left'],
    [-1, 0, 'left'],
    [0, 1, 'top'],
    [0, -1, 'top'],
  ]
  function bfs(x0: number, y0: number) {
    const q: Pos[] = [{ x: x0, y: y0 }]
    const cells: Pos[] = []
    const playersInArea = new Set<Player>()
    visited[y0][x0] = true
    while (q.length) {
      const { x, y } = q.shift()!
      cells.push({ x, y })
      const cell = board[y][x]
      if (cell.stone) playersInArea.add(cell.stone)
      dirs.forEach(([dx, dy, dir]) => {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return
        // 牆阻擋
        const blocked =
          dir === 'left'
            ? dx === 1
              ? board[y][x + 1].wallLeft
              : cell.wallLeft
            : dy === 1
            ? board[ny][nx].wallTop
            : cell.wallTop
        if (blocked) return
        if (!visited[ny][nx]) {
          visited[ny][nx] = true
          q.push({ x: nx, y: ny })
        }
      })
    }
    // 純淨領地才標記
    if (playersInArea.size === 1) {
      const owner = playersInArea.values().next().value as Player
      cells.forEach(({ x, y }) => { territory[y][x] = owner })
    }
  }
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!visited[y][x]) bfs(x, y)
    }
  }
  return territory
}

export default Board
