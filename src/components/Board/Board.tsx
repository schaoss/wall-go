import clsx from 'clsx'
import { BOARD_SIZE } from '@/lib/types'
import type { Phase, WallDir, Player, Pos } from '@/lib/types'
import Cell from './Cell'
import { getTerritoryMap } from '@/utils/territory'
import { getPlayerTheme } from '@/lib/color'

export interface BoardProps {
  board: import('@/lib/types').Cell[][]
  phase: Phase
  turn: Player
  selected: Pos | null
  legal: Set<string>
  selectStone?: (pos: Pos) => void
  placeStone?: (pos: Pos) => void
  moveTo?: (pos: Pos) => void
  buildWall?: (pos: Pos, dir: WallDir) => void
  isBreakMode?: boolean
  toggleBreakMode?: () => void
  wallBreaks?: Record<Player, number>
}

function Board({
  board,
  phase,
  turn,
  selected,
  legal,
  selectStone,
  placeStone,
  moveTo,
  buildWall,
  isBreakMode,
  toggleBreakMode,
  wallBreaks,
}: BoardProps) {
  // Territory information: calculated every time
  const territoryMap = getTerritoryMap(board)

  // Chessboard edge labels
  const files = Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i)) // A-G
  const ranks = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - i) // 7-1

  return (
    <div
      data-testid="board-container"
      className={clsx(
        'relative w-full min-w-[266px] p-8 border-4 border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xl transition-all duration-500',
        'box-border aspect-ratio-1',
        'bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800',
        phase === 'playing' || phase === 'placing' ? getPlayerTheme(turn).ring : '',
      )}
    >
      {/* Chessboard body */}
      <div
        data-testid="board-grid"
        className={clsx(
          'relative',
          'grid',
          `grid-cols-${BOARD_SIZE}`,
          `grid-rows-${BOARD_SIZE}`,
          'gap-[2px]',
          'bg-white/80 dark:bg-zinc-900/80',
          'rounded-xl',
          'p-0',
          'transition-all duration-500',
        )}
        style={{ position: 'relative' }}
      >
        {files.map((f, i) => (
          <span
            key={f}
            className="pointer-events-none select-none text-xs text-zinc-400 font-mono absolute z-20"
            style={{
              left: `calc(${((i + 0.5) * 100) / BOARD_SIZE}% - 0.5em)`,
              top: '-20px',
            }}
          >
            {f}
          </span>
        ))}
        {ranks.map((r, i) => (
          <span
            key={r}
            className="pointer-events-none select-none text-xs text-zinc-400 font-mono absolute z-20"
            style={{
              top: `calc(${((i + 0.5) * 100) / BOARD_SIZE}% - 0.5em)`,
              left: '-16px',
            }}
          >
            {r}
          </span>
        ))}
        {/* Chessboard squares */}
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
          }),
        )}
      </div>

      {/* Break Wall Toggle */}
      {phase === 'playing' && wallBreaks && wallBreaks[turn] > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleBreakMode}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold transition-all shadow-lg border-2',
              isBreakMode
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
            )}
          >
            🔨 {wallBreaks[turn]}
          </button>
        </div>
      )}
    </div>
  )
}

export default Board
