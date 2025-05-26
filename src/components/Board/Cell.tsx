import clsx from 'clsx'
import { playerColorClass } from '../../lib/color'
import type { Phase, Player, Pos, WallDir } from '../../lib/types'
import WallButton from './WallButton'
import { useRef, useEffect } from 'react'

export interface CellProps {
  x: number
  y: number
  cell: import('../../lib/types').Cell
  isSel: boolean
  phase: Phase
  turn: Player
  legal: Set<string>
  selectStone?: (pos: Pos) => void
  placeStone?: (pos: Pos) => void
  moveTo?: (pos: Pos) => void
  buildWall?: (pos: Pos, dir: WallDir) => void
  board: import('../../lib/types').Cell[][]
  boardSize: number
  // 新增: 領地資訊
  territoryOwner?: Player | null
}

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
}: CellProps) {
  const posKey = `${x},${y}`
  // --- 棋子移動動畫 ---
  const stoneRef = useRef<HTMLButtonElement>(null)
  const prevPosRef = useRef<{ x: number; y: number } | null>(null)
  // Track piece movement
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
                {
                  transform: `translate(${dx}px,${dy}px) scale(0.7)`,
                  opacity: 0.7,
                },
                {
                  transform: 'translate(0,0) scale(1.15)',
                  opacity: 1,
                  offset: 0.6,
                },
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
              ],
              {
                duration: 320,
                easing: 'cubic-bezier(0.4,0,0.2,1)',
              },
            )
          }
        }
        // 只在 x/y 變動時更新 prevPosRef
        if (!prev || prev.x !== x || prev.y !== y) {
          prevPosRef.current = { x, y }
        }
      }
    } else if (!cell.stone) {
      prevPosRef.current = null
    }
  }, [cell.stone, x, y, phase])
  return (
    <div
      className={clsx(
        'relative aspect-square border border-zinc-300 dark:border-zinc-700 overflow-visible rounded-lg',
        'transition-all duration-300',
        'flex items-center justify-center',
        // 結算時只顯示領地顏色，不加預設底色
        (phase !== 'finished' && !territoryOwner) ||
          (phase === 'placing' && 'bg-white/70 dark:bg-zinc-900/70'),
        !cell.stone && phase === 'placing' && 'hover:bg-amber-100/60 dark:hover:bg-zinc-800/40',
        legal.has(`${x},${y}`) && 'hover:bg-emerald-200/40 dark:hover:bg-emerald-900/40',
        // 只要 territoryOwner 有值就上色
        territoryOwner === 'R' && 'bg-rose-100 dark:bg-rose-900/60',
        territoryOwner === 'B' && 'bg-indigo-100 dark:bg-indigo-900/60',
      )}
      data-cell-x={x}
      data-cell-y={y}
    >
      {/* 牆動畫 */}
      {cell.wallTop && (
        <div className="absolute left-0 top-0 w-full h-1/2 flex items-start justify-center pointer-events-none">
          <div
            className={clsx(
              playerColorClass(cell.wallTop),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{
              width: '85%',
              height: '7px',
              marginTop: '-5px',
              zIndex: 2,
            }}
          />
        </div>
      )}
      {cell.wallLeft && (
        <div className="absolute top-0 left-0 h-full w-1/2 flex items-center justify-start pointer-events-none">
          <div
            className={clsx(
              playerColorClass(cell.wallLeft),
              'shadow-md transition-all duration-300 rounded',
              'border border-zinc-200 dark:border-zinc-700',
            )}
            style={{
              height: '85%',
              width: '7px',
              marginLeft: '-5px',
              zIndex: 2,
            }}
          />
        </div>
      )}

      {/* 石子動畫 */}
      {cell.stone && (
        <button
          ref={stoneRef}
          key={cell.stone + '-' + x + '-' + y}
          className={clsx(
            'rounded-full',
            playerColorClass(cell.stone),
            'shadow-lg drop-shadow-md',
            'transition-transform transition-shadow duration-300',
            'hover:scale-110',
            'flex items-center justify-center',
            'border border-zinc-200 dark:border-zinc-700',
            'animate-stone-move',
            // 只有輪到該玩家時才是 pointer
            phase === 'playing' && cell.stone === turn && selectStone
              ? 'cursor-pointer'
              : 'cursor-default',
          )}
          style={{
            width: '70%',
            height: '70%',
            minWidth: '24px',
            minHeight: '24px',
            maxWidth: '60px',
            maxHeight: '60px',
          }}
          onClick={() =>
            phase === 'playing' && cell.stone === turn && selectStone && selectStone({ x, y })
          }
        />
      )}

      {/* Empty cell animation for placing phase */}
      {placeStone && !cell.stone && phase === 'placing' && (
        <button
          className="absolute inset-0 bg-transparent hover:bg-amber-100/60 cursor-pointer transition-all duration-200 rounded-lg"
          onClick={() => placeStone({ x, y })}
        />
      )}

      {/* Legal move cell animation */}
      {moveTo && legal.has(posKey) && (
        <button
          className="absolute inset-0 bg-emerald-400/20 hover:bg-emerald-400/60 cursor-pointer transition-all duration-200 animate-pulse rounded-lg"
          onClick={() => moveTo({ x, y })}
        />
      )}

      {/* Wall button animation (if this cell is selected) */}
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
