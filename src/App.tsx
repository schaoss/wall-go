import { useGame } from './store'
import { checkGameEnd } from './utils/checkGameEnd'
import Board from './Board'
import { useState, useEffect } from 'react'

export default function App() {
  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, resetGame,
  } = useGame()

  const live = checkGameEnd(board, ['R','B'])

  // 深色模式切換
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    // 直接操作 html 標籤，確保 tailwind dark class 正確切換
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [dark])

  return (
    <div className="flex flex-col items-center gap-4 py-6 min-h-screen bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-500">
      <div className="w-full flex justify-end px-4">
        <button
          className="rounded-full px-3 py-1 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-100 shadow hover:bg-rose-100/80 dark:hover:bg-zinc-700/90 transition-all duration-200"
          onClick={() => setDark(d => !d)}
          aria-label="切換深色/亮色模式"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in">
        Wall Go · {phase === 'placing' ? '擺子階段' : `輪到 ${turn}`}
      </h1>

      <div className="flex gap-4 mb-2 animate-fade-in">
        {Object.entries(live.score ?? {}).map(([p,s]) => (
          <span key={p} className="font-mono text-lg px-2 py-1 rounded bg-white/70 dark:bg-zinc-800/80 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300">
            {p}: {s}
          </span>
        ))}
      </div>

      {phase === 'playing' && skipReason === 'noMove' && (
        <div className="px-4 py-2 bg-yellow-200/80 dark:bg-yellow-700/80 rounded shadow animate-bounce-in text-zinc-900 dark:text-zinc-100">此玩家無合法行動，自動跳過！</div>
      )}
      {phase === 'playing' && skipReason === 'allBlocked' && (
        <div className="px-4 py-2 bg-yellow-200/80 dark:bg-yellow-700/80 rounded shadow animate-bounce-in text-zinc-900 dark:text-zinc-100">所有玩家皆無合法行動，遊戲結束條件 B！</div>
      )}

      {phase === 'finished' && result && (
        <div className="p-4 bg-amber-100/90 dark:bg-zinc-700/90 rounded-2xl shadow-lg mb-4 animate-fade-in flex flex-col items-center">
          <span className="text-xl font-bold mb-1 text-zinc-800 dark:text-zinc-100">{result.tie ? '平局！' : `勝者：${result.winner}`}</span>
          <button onClick={resetGame} className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-300 animate-pop-in">
            再來一局
          </button>
        </div>
      )}

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
