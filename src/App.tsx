import { useEffect, useState } from 'react'
import Board from './Board'
import { useGame } from './store'
import { checkGameEnd } from './utils/checkGameEnd'
import type { GameResult } from './utils/checkGameEnd'

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

function StatusMessage({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={
      'px-4 py-2 rounded shadow animate-bounce-in text-zinc-900 dark:text-zinc-100 text-center ' + (className ?? '')
    }>
      {children}
    </div>
  )
}

interface GameStatusProps {
  phase: string
  skipReason: string | null
  result: GameResult | null
  resetGame: () => void
}

function GameStatus({ phase, skipReason, result, resetGame }: GameStatusProps) {
  if (phase === 'playing' && skipReason === 'noMove') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">無法移動，自動跳過</StatusMessage>
  }
  if (phase === 'playing' && skipReason === 'allBlocked') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">所有玩家皆被堵住，遊戲結束</StatusMessage>
  }
  if (phase === 'finished' && result) {
    return (
      <StatusMessage className="bg-emerald-100 dark:bg-emerald-900/70 border border-emerald-300 dark:border-emerald-700">
        {result.tie ? '平手！' : result.winner ? `勝者：${result.winner}` : null}
        <button
          className="ml-4 px-3 py-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 font-semibold shadow hover:bg-rose-100/80 dark:hover:bg-zinc-700/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-zinc-600"
          onClick={resetGame}
          type="button"
        >再玩一次</button>
      </StatusMessage>
    )
  }
  return null
}

export default function App() {
  const {
    board, turn, phase, result = null, selected, legal, skipReason = null,
    placeStone, selectStone, moveTo, buildWall, resetGame,
  } = useGame()

  const live = checkGameEnd(board, ['R', 'B'])

  // 深色模式切換
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  return (
    <div className="flex flex-col items-center gap-4 py-6 min-h-screen bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-500">
      <div className="w-full flex justify-end px-4">
        <DarkModeToggle dark={dark} setDark={setDark} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in">
        Wall Go · {phase === 'placing' ? '擺子階段' : `輪到 ${turn}`}
      </h1>
      <div className="flex gap-4 mb-2 animate-fade-in">
        {Object.entries(live.score ?? {}).map(([p, s]) => (
          <span
            key={p}
            className="font-mono text-lg px-2 py-1 rounded bg-white/70 dark:bg-zinc-800/80 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300"
          >
            {p}: {s}
          </span>
        ))}
      </div>
      <GameStatus phase={phase} skipReason={skipReason} result={result} resetGame={resetGame} />
      <Board
        board={board}
        phase={phase}
        turn={turn}
        selected={selected ?? null}
        legal={legal}
        selectStone={selectStone}
        placeStone={placeStone}
        moveTo={moveTo}
        buildWall={buildWall}
      />
    </div>
  )
}
