// StatusMessage component moved from App.tsx

function StatusMessage({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={
      'px-4 py-2 rounded shadow animate-bounce-in text-zinc-900 dark:text-zinc-100 text-center ' + (className ?? '')
    }>
      {children}
    </div>
  )
}

export default StatusMessage
