import clsx from 'clsx'
import { type Player } from './lib/types'

const color = (p: Player) =>
  p === 'R'
    ? 'bg-rose-500 dark:bg-rose-400'
    : 'bg-indigo-500 dark:bg-indigo-400'

export interface CellProps {
  x: number
  y: number
  cell: import('./lib/types').Cell
  isSel: boolean
  phase: string
  turn: Player
  legal: Set<string>
  selectStone: (pos: { x: number, y: number }) => void
  placeStone: (pos: { x: number, y: number }) => void
  moveTo: (pos: { x: number, y: number }) => void
  buildWall: (pos: { x: number, y: number }, dir: 'top'|'left'|'right'|'bottom') => void
  board: import('./lib/types').Cell[][]
  boardSize: number
}

export default function Cell({
  x, y, cell, isSel, phase, turn, legal,
  selectStone, placeStone, moveTo, buildWall, board, boardSize
}: CellProps) {
  const posKey = `${x},${y}`
  return (
    <div
      className={clsx(
        'relative aspect-square border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 overflow-visible',
        'transition-all duration-300',
        'flex items-center justify-center',
        !cell.stone && phase === 'placing' && 'hover:bg-amber-100/60 dark:hover:bg-zinc-800/40',
        legal.has(posKey) && 'hover:bg-emerald-200/40 dark:hover:bg-emerald-900/40',
      )}
    >
      {/* 牆動畫 */}
      {cell.wallTop && (
        <div
          className={clsx(
            'absolute left-0 top-0 w-full h-1/2 flex items-start justify-center pointer-events-none',
          )}
        >
          <div
            className={clsx(
              color(cell.wallTop),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{
              width: '80%',
              height: '5px',
              marginTop: '-2.5px',
              zIndex: 2,
            }}
          />
        </div>
      )}
      {cell.wallLeft && (
        <div
          className={clsx(
            'absolute top-0 left-0 h-full w-1/2 flex items-center justify-start pointer-events-none',
          )}
        >
          <div
            className={clsx(
              color(cell.wallLeft),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{
              height: '80%',
              width: '5px',
              marginLeft: '-2.5px',
              zIndex: 2,
            }}
          />
        </div>
      )}

      {/* 石子動畫 */}
      {cell.stone && (
        <button
          className={clsx(
            'rounded-full cursor-pointer',
            color(cell.stone),
            'shadow-lg drop-shadow-md',
            'transition-transform transition-shadow duration-200',
            'hover:scale-110',
            'flex items-center justify-center',
            'border border-zinc-200 dark:border-zinc-700',
          )}
          style={{
            width: '70%',
            height: '70%',
            minWidth: '24px',
            minHeight: '24px',
            maxWidth: '60px',
            maxHeight: '60px',
            // 不再用 left/top/transform 置中
          }}
          onClick={() => phase === 'playing' && selectStone({ x, y })}
        />
      )}

      {/* 擺子階段空格動畫 */}
      {!cell.stone && phase === 'placing' && (
        <button
          className="absolute inset-0 bg-transparent hover:bg-amber-100/60 cursor-pointer transition-all duration-200"
          onClick={() => placeStone({ x, y })}
        />
      )}

      {/* 合法移動格動畫 */}
      {legal.has(posKey) && (
        <button
          className="absolute inset-0 bg-emerald-400/20 hover:bg-emerald-400/60 cursor-pointer transition-all duration-200 animate-pulse"
          onClick={() => moveTo({ x, y })}
        />
      )}

      {/* 建牆按鈕動畫（若此格被選中） */}
      {isSel && (() => {
        const wallDirs = [
          {
            dir: 'top',
            show: y > 0 && !cell.wallTop,
            btnClass: 'absolute left-1/2 -translate-x-1/2 -top-[10%] w-[60%] h-[14%] min-h-[16px] max-h-[32px] min-w-[40px] max-w-[120px] flex items-center justify-center',
            divClass: 'h-[60%] w-full min-h-[4px] max-h-[12px] rounded',
          },
          {
            dir: 'left',
            show: x > 0 && !cell.wallLeft,
            btnClass: 'absolute top-1/2 -translate-y-1/2 -left-[10%] h-[60%] w-[14%] min-h-[40px] max-h-[120px] min-w-[16px] max-w-[32px] flex items-center justify-center',
            divClass: 'w-[60%] h-full min-w-[4px] max-w-[12px] rounded',
          },
          {
            dir: 'right',
            show: x < boardSize - 1 && !board[y][x + 1].wallLeft,
            btnClass: 'absolute top-1/2 -translate-y-1/2 -right-[10%] h-[60%] w-[14%] min-h-[40px] max-h-[120px] min-w-[16px] max-w-[32px] flex items-center justify-center',
            divClass: 'w-[60%] h-full min-w-[4px] max-w-[12px] rounded',
          },
          {
            dir: 'bottom',
            show: y < boardSize - 1 && !board[y + 1][x].wallTop,
            btnClass: 'absolute left-1/2 -translate-x-1/2 -bottom-[10%] w-[60%] h-[14%] min-h-[16px] max-h-[32px] min-w-[40px] max-w-[120px] flex items-center justify-center',
            divClass: 'h-[60%] w-full min-h-[4px] max-h-[12px] rounded',
          },
        ]
        return wallDirs.filter(d => d.show).map(d => (
          <button
            key={d.dir}
            onClick={() => buildWall({ x, y }, d.dir as 'top'|'left'|'right'|'bottom')}
            className={clsx(
              'group bg-transparent cursor-pointer z-1',
              d.btnClass,
              'transition-all duration-200',
              'hover:scale-110',
            )}
          >
            <div
              className={clsx(
                'bg-gray-500/60 transition-all duration-200 shadow',
                d.divClass,
                turn === 'R'
                  ? 'group-hover:bg-rose-300/60 dark:group-hover:bg-rose-400/60'
                  : 'group-hover:bg-indigo-300/60 dark:group-hover:bg-indigo-400/60',
              )}
            />
          </button>
        ))
      })()}
    </div>
  )
}
