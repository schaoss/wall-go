// WallButton component extracted from Cell.tsx
import clsx from 'clsx'
import type { WallDir, Player } from '../../lib/types'
import { useTranslation } from 'react-i18next'

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

export default function WallButton({
  dir,
  show,
  x,
  y,
  turn,
  onBuild,
  btnClass,
  divClass,
}: WallButtonProps) {
  const { t } = useTranslation()
  if (!show) return null
  const dirLabel =
    dir === 'top'
      ? t('game.wall.top', 'top')
      : dir === 'bottom'
        ? t('game.wall.bottom', 'bottom')
        : dir === 'left'
          ? t('game.wall.left', 'left')
          : t('game.wall.right', 'right')
  return (
    <button
      onClick={() => onBuild(dir)}
      className={clsx(
        'group bg-transparent cursor-pointer z-1',
        btnClass,
        'transition-all duration-200',
        'hover:scale-110',
      )}
      aria-label={t('game.wall.aria', {
        x,
        y,
        dir: dirLabel,
        defaultValue: `Build ${dirLabel} wall at (${x},${y})`,
      })}
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
