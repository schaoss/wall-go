import clsx from 'clsx'
import { BOARD_SIZE, type Player } from './lib/types'
import Cell from './Cell'

export interface BoardProps {
  board: import('./lib/types').Cell[][]
  phase: string
  turn: Player
  selected: { x: number, y: number } | null
  legal: Set<string>
  selectStone: (pos: { x: number, y: number }) => void
  placeStone: (pos: { x: number, y: number }) => void
  moveTo: (pos: { x: number, y: number }) => void
  buildWall: (pos: { x: number, y: number }, dir: 'top'|'left'|'right'|'bottom') => void
}

export default function Board({
  board, phase, turn, selected, legal,
  selectStone, placeStone, moveTo, buildWall
}: BoardProps) {
  return (
    <div className="border-4 border-zinc-500 rounded-2xl shadow-xl bg-gradient-to-br from-zinc-50 to-zinc-200 transition-all duration-500 hover:shadow-2xl inline-block max-w-[800px] w-full aspect-square">
      <div
        className={clsx(
          'grid',
          `grid-cols-${BOARD_SIZE}`,
          `grid-rows-${BOARD_SIZE}`,
          'gap-[2px] p-2 sm:p-4',
          'transition-all duration-500'
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
              />
            )
          })
        )}
      </div>
    </div>
  )
}
