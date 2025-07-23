import clsx from 'clsx'
import { playerColorClass } from '@/lib/color'
import type { WallDir } from '@/lib/types'
import WallButton from './WallButton'
import { useRef, useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { getPosKey } from '@/utils/region'

import type { CellProps } from '@/lib/componentProps'

export default function Cell({
  x,
  y,
  cell,
  isSel,
  phase,
  turn,
  legal,
  selectStone,
  placeStone,
  moveTo,
  buildWall,
  board,
  boardSize,
  territoryOwner,
  isFocus,
}: CellProps) {
  const { t } = useTranslation()
  const posKey = getPosKey({ x, y })
  const cellId = useId()
  const stoneRef = useRef<HTMLDivElement>(null)
  const prevPosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (cell.stone && phase === 'playing') {
      if (stoneRef.current) {
        const prev = prevPosRef.current
        if (prev && (prev.x !== x || prev.y !== y)) {
          const parent = stoneRef.current.parentElement?.getBoundingClientRect()
          const prevCell = document.querySelector(
            `[data-cell-x='${prev.x}'][data-cell-y='${prev.y}']`,
          ) as HTMLElement | null
          if (parent && prevCell) {
            const prevRect = prevCell.getBoundingClientRect()
            const dx = prevRect.left - parent.left
            const dy = prevRect.top - parent.top
            stoneRef.current.animate(
              [
                { transform: `translate(${dx}px,${dy}px) scale(0.7)`, opacity: 0.7 },
                { transform: 'translate(0,0) scale(1.15)', opacity: 1, offset: 0.6 },
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
              ],
              {
                duration: 320,
                easing: 'cubic-bezier(0.4,0,0.2,1)',
              },
            )
          }
        }
        if (!prev || prev.x !== x || prev.y !== y) {
          prevPosRef.current = { x, y }
        }
      }
    } else if (!cell.stone) {
      prevPosRef.current = null
    }
  }, [cell.stone, x, y, phase])

  const getCellLabel = () => {
    const pos = `(${x}, ${y})`
    if (cell.stone) {
      return t('cell.occupied', { pos, player: cell.stone })
    }
    if (phase === 'finished' && territoryOwner) {
      return t('cell.territory', { pos, player: territoryOwner })
    }
    return t('cell.empty', { pos })
  }

  const getAction = () => {
    if (phase === 'placing' && !cell.stone && placeStone) return () => placeStone({ x, y })
    if (phase === 'playing' && cell.stone === turn && selectStone) return () => selectStone({ x, y })
    if (moveTo && legal.has(posKey)) return () => moveTo({ x, y })
    return undefined
  }
  const action = getAction()
  const isClickable = !!action

  return (
    <div
      id={cellId}
      role="gridcell"
      aria-label={getCellLabel()}
      aria-selected={isSel}
      aria-disabled={!isClickable}
      tabIndex={isFocus ? 0 : -1}
      ref={isFocus ? (el) => el?.focus() : null}
      onClick={action}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && action) {
          e.preventDefault()
          action()
        }
      }}
      className={clsx(
        'relative aspect-square border border-zinc-300 dark:border-zinc-700 overflow-visible rounded-lg',
        'transition-all duration-300',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-sky-400',
        isClickable && 'cursor-pointer',
        (phase !== 'finished' && !territoryOwner) ||
          (phase === 'placing' && 'bg-white/70 dark:bg-zinc-900/70'),
        !cell.stone && phase === 'placing' && 'hover:bg-amber-100/60 dark:hover:bg-zinc-800/40',
        legal.has(`${x},${y}`) && 'hover:bg-emerald-200/40 dark:hover:bg-emerald-900/40',
        territoryOwner === 'R' && 'bg-rose-100 dark:bg-rose-900/60',
        territoryOwner === 'B' && 'bg-indigo-100 dark:bg-indigo-900/60',
        territoryOwner === 'G' && 'bg-emerald-100 dark:bg-emerald-900/60',
        territoryOwner === 'Y' && 'bg-amber-100 dark:bg-amber-900/60',
      )}
      data-cell-x={x}
      data-cell-y={y}
    >
      {/* Wall visuals */}
      {cell.wallTop && (
        <div
          role="img"
          aria-label={t('wall.top', { player: cell.wallTop })}
          className="absolute left-0 top-0 w-full h-1/2 flex items-start justify-center pointer-events-none"
        >
          <div
            className={clsx(
              playerColorClass(cell.wallTop),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{ width: '85%', height: '7px', marginTop: '-5px', zIndex: 2 }}
          />
        </div>
      )}
      {cell.wallLeft && (
        <div
          role="img"
          aria-label={t('wall.left', { player: cell.wallLeft })}
          className="absolute top-0 left-0 h-full w-1/2 flex items-center justify-start pointer-events-none"
        >
          <div
            className={clsx(
              playerColorClass(cell.wallLeft),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{ height: '85%', width: '7px', marginLeft: '-5px', zIndex: 2 }}
          />
        </div>
      )}

      {/* Stone */}
      {cell.stone && (
        <div
          ref={stoneRef}
          aria-label={t('stone.label', { player: cell.stone })}
          className={clsx(
            'rounded-full',
            playerColorClass(cell.stone),
            'shadow-lg drop-shadow-md',
            'transition-all duration-300',
            'flex items-center justify-center',
            'border border-zinc-200 dark:border-zinc-700',
            'w-[70%] h-[70%]',
            'min-w-[24px] min-h-[24px]',
            'max-w-[60px] max-h-[60px]',
          )}
        />
      )}

      {/* Legal Move Indicator */}
      {moveTo && legal.has(posKey) && (
        <div
          className="absolute inset-0 bg-emerald-400/20 animate-pulse rounded-lg"
          aria-hidden="true"
        />
      )}

      {/* Wall buttons */}
      {buildWall &&
        isSel &&
        (() => {
          const wallDirs = [
            {
              dir: 'top',
              show: y > 0 && !cell.wallTop,
              btnClass:
                'absolute left-1/2 -translate-x-1/2 -top-[10%] w-[60%] h-[14%] min-h-[16px] max-h-[32px] min-w-[40px] max-w-[120px] flex items-center justify-center',
              divClass: 'h-[60%] w-full min-h-[4px] max-h-[12px] rounded',
            },
            {
              dir: 'left',
              show: x > 0 && !cell.wallLeft,
              btnClass:
                'absolute top-1/2 -translate-y-1/2 -left-[10%] h-[60%] w-[14%] min-h-[40px] max-h-[120px] min-w-[16px] max-w-[32px] flex items-center justify-center',
              divClass: 'w-[60%] h-full min-w-[4px] max-w-[12px] rounded',
            },
            {
              dir: 'right',
              show: x < boardSize - 1 && !board[y][x + 1].wallLeft,
              btnClass:
                'absolute top-1/2 -translate-y-1/2 -right-[10%] h-[60%] w-[14%] min-h-[40px] max-h-[120px] min-w-[16px] max-w-[32px] flex items-center justify-center',
              divClass: 'w-[60%] h-full min-w-[4px] max-w-[12px] rounded',
            },
            {
              dir: 'bottom',
              show: y < boardSize - 1 && !board[y + 1][x].wallTop,
              btnClass:
                'absolute left-1/2 -translate-x-1/2 -bottom-[10%] w-[60%] h-[14%] min-h-[16px] max-h-[32px] min-w-[40px] max-w-[120px] flex items-center justify-center',
              divClass: 'h-[60%] w-full min-h-[4px] max-h-[12px] rounded',
            },
          ]
          return wallDirs
            .filter((d) => d.show)
            .map((d) => (
              <WallButton
                key={d.dir}
                dir={d.dir as WallDir}
                show={d.show}
                x={x}
                y={y}
                turn={turn}
                onBuild={(dir) => buildWall({ x, y }, dir)}
                btnClass={d.btnClass}
                divClass={d.divClass}
              />
            ))
        })()}
    </div>
  )
}
