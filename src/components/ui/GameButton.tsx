
import clsx from 'clsx'
import { COLOR } from '@/lib/colors'

import type { GameButtonProps } from '@/lib/componentProps'

export default function GameButton({
  onClick,
  disabled,
  ariaLabel,
  children,
  type = 'button',
  className,
  active,
  text,
  variant,
}: GameButtonProps) {
  const variantClass = text
    ? ''
    : active
      ? COLOR.success
      : (variant && COLOR[variant]) || COLOR.neutral

  return (
    <button
      className={clsx(
        text
          ? 'bg-transparent border-0 shadow-none px-2 py-1 text-sm text-zinc-500 hover:underline hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer'
          : [
              'px-3 py-1 rounded font-semibold border whitespace-nowrap',
              'shadow',
              'transition-all duration-200',
              'cursor-pointer',
              'hover:shadow-lg',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              variantClass,
            ],
        className, // Ensure custom className is applied last
      )}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onClick()
        }
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      type={type}
    >
      {children}
    </button>
  )
}
