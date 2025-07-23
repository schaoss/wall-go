// StatusMessage component moved from App.tsx
import type { StatusMessageProps } from '@/lib/componentProps'

function StatusMessage({ children, className }: StatusMessageProps) {
  return (
    <div
      className={
        'px-4 py-2 rounded shadow animate-bounce-in text-zinc-900 dark:text-zinc-100 text-center ' +
        (className ?? '')
      }
    >
      {children}
    </div>
  )
}

export default StatusMessage
