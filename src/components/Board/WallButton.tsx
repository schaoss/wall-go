// WallButton component extracted from Cell.tsx
import clsx from 'clsx'
import type { WallDir, Player } from '../../lib/types'

interface WallButtonProps {
  dir: WallDir
  show: boolean
  x: number
  y: number
  turn: Player
  onBuild: (dir: WallDir) => void
  btnClass: string
  divClass: string
}

export default function WallButton({ dir, show, x, y, turn, onBuild, btnClass, divClass }: WallButtonProps) {
  if (!show) return null
  return (
    <button
      onClick={() => onBuild(dir)}
      className={clsx(
        'group bg-transparent cursor-pointer z-1',
        btnClass,
        'transition-all duration-200',
        'hover:scale-110',
      )}
      aria-label={`在(${x},${y})建${dir === 'top' ? '上' : dir === 'bottom' ? '下' : dir === 'left' ? '左' : '右'}牆`}
      type="button"
    >
      <div
        className={clsx(
          'bg-gray-500/60 transition-all duration-200 shadow',
          divClass,
          turn === 'R'
            ? 'group-hover:bg-rose-300/60 dark:group-hover:bg-rose-400/60'
            : 'group-hover:bg-indigo-300/60 dark:group-hover:bg-indigo-400/60',
        )}
      />
    </button>
  )
}
