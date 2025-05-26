import React from 'react'
import clsx from 'clsx'
import { COLOR } from '../../lib/colors'

interface GameButtonProps {
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  className?: string
  active?: boolean
  text?: boolean // 純文字按鈕
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

export default function GameButton({ onClick, disabled, ariaLabel, children, type = 'button', className, active, text, variant }: GameButtonProps) {
  const variantClass = text
    ? ''
    : active
    ? COLOR.success
    : variant && COLOR[variant] || COLOR.neutral

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
