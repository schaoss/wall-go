// DarkModeToggle component moved from App.tsx

function DarkModeToggle({ dark, setDark }: { dark: boolean, setDark: (fn: (v: boolean) => boolean) => void }) {
  return (
    <button
      className="rounded-full px-3 py-1 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-100 shadow hover:bg-rose-100/80 dark:hover:bg-zinc-700/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-zinc-600"
      onClick={() => setDark(d => !d)}
      aria-label="切換深色/亮色模式"
      type="button"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

export default DarkModeToggle
