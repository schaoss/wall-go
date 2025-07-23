import clsx from 'clsx'
import { BOARD_SIZE } from '@/lib/types'
import type { Pos } from '@/lib/types'
import Cell from './Cell'
import { getTerritoryMap } from '@/utils/territory'
import { useGame } from '@/store/index'
import { useTranslation } from 'react-i18next'
import { useState, useMemo, useCallback } from 'react'

import type { BoardProps } from '@/lib/componentProps'

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
}: BoardProps) {
  const { t } = useTranslation()
  const { territoryMap: stateTerritory } = useGame()
  const territoryMap = useMemo(() => stateTerritory || getTerritoryMap(board), [stateTerritory, board])
  const [focusPos, setFocusPos] = useState<Pos>({ x: 0, y: 0 })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let { x, y } = focusPos
      switch (e.key) {
        case 'ArrowUp':
          y = Math.max(0, y - 1)
          break
        case 'ArrowDown':
          y = Math.min(BOARD_SIZE - 1, y + 1)
          break
        case 'ArrowLeft':
          x = Math.max(0, x - 1)
          break
        case 'ArrowRight':
          x = Math.min(BOARD_SIZE - 1, x + 1)
          break
        default:
          return
      }
      e.preventDefault()
      setFocusPos({ x, y })
    },
    [focusPos],
  )

  const files = useMemo(() => Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i)), [])
  const ranks = useMemo(() => Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - i), [])

  return (
    <div
      className={clsx(
        'relative w-full min-w-[266px] p-8 border-4 border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-xl transition-all duration-500',
        'box-border aspect-ratio-1',
        'bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800',
        phase === 'playing' || phase === 'placing'
          ? turn === 'R'
            ? 'ring-4 ring-rose-400/60 animate-player-glow-red'
            : 'ring-4 ring-indigo-400/60 animate-player-glow-blue'
          : '',
      )}
    >
      <div
        role="grid"
        aria-label={t('board.label', 'Game Board')}
        aria-colcount={BOARD_SIZE}
        aria-rowcount={BOARD_SIZE}
        onKeyDown={handleKeyDown}
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
      >
        {/* Decorative labels */}
        {files.map((f, i) => (
          <span
            key={f}
            aria-hidden="true"
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
            aria-hidden="true"
            className="pointer-events-none select-none text-xs text-zinc-400 font-mono absolute z-20"
            style={{
              top: `calc(${((i + 0.5) * 100) / BOARD_SIZE}% - 0.5em)`,
              left: '-16px',
            }}
          >
            {r}
          </span>
        ))}
        {/* Board cells */}
        {board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${x},${y}`}
              x={x}
              y={y}
              cell={cell}
              isSel={selected?.x === x && selected?.y === y}
              isFocus={focusPos.x === x && focusPos.y === y}
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
          )),
        )}
      </div>
    </div>
  )
}

export default Board
