// src/components/ui/Footer.tsx
export default function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 w-full z-50 text-center text-sm text-zinc-500 dark:text-zinc-400 select-none bg-white/80 dark:bg-zinc-900/90 shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.08)] backdrop-blur border-t border-zinc-200 dark:border-zinc-800 py-2"
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
        <span>
          © 2025 Gary Chu &nbsp;·&nbsp; Made with <span className="text-rose-400">♥</span>
        </span>
        <a
          href="https://github.com/schaoss/wall-go"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
