import clsx from 'clsx'
import { BOARD_SIZE } from '../../lib/types'
import type { Phase, WallDir, Player, Pos } from '../../lib/types'
import Cell from './Cell'
import { getTerritoryMap } from '../../utils/territory'

export interface BoardProps {
  board: import('../../lib/types').Cell[][]
  phase: Phase
  turn: Player
  selected: Pos | null
  legal: Set<string>
  selectStone?: (pos: Pos) => void
  placeStone?: (pos: Pos) => void
  moveTo?: (pos: Pos) => void
  buildWall?: (pos: Pos, dir: WallDir) => void
}

function Board({
  board, phase, turn, selected, legal,
  selectStone, placeStone, moveTo, buildWall
}: BoardProps) {
  // 領地資訊: 每次都計算
  const territoryMap = getTerritoryMap(board)
  return (
    <div
      className="border-4 border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 transition-all duration-500 hover:shadow-2xl inline-block"
      style={{
        width: '100%',
        maxWidth: 'min(800px, 100vw - 32px)', // 32px padding for mobile
        aspectRatio: '1 / 1',
        height: 'auto',
        maxHeight: 'calc(100dvh - 120px)', // 120px: header/footer/padding
      }}
    >
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

export default Board
