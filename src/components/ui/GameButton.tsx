import React from 'react'
import clsx from 'clsx'

interface GameButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function GameButton({ onClick, disabled, ariaLabel, children, type = 'button', className }: GameButtonProps) {
  return (
    <button
      className={clsx(
        'px-3 py-1 rounded font-semibold border',
        'bg-white/80 dark:bg-zinc-800/80',
        'border-zinc-300 dark:border-zinc-700',
        'text-zinc-700 dark:text-zinc-100',
        'shadow',
        'transition-all duration-200',
        'cursor-pointer',
        'hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80',
        'hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-zinc-600',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className // 保證自訂 className 最後套用
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      type={type}
    >
      {children}
    </button>
  )
}
