import { useEffect, useState } from 'react'
import Board from './components/Board/Board'
import DarkModeToggle from './components/ui/DarkModeToggle'
import GameStatus from './components/ui/GameStatus'
import { useGame } from './store/index'
import { checkGameEnd } from './utils/checkGameEnd'

export default function App() {
  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, resetGame,
    undo, redo, canUndo, canRedo,
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
      <div className="w-full flex justify-between px-4">
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 font-semibold shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            onClick={undo}
            disabled={!canUndo}
            type="button"
            aria-label="復原 (Undo)"
          >↶ Undo</button>
          <button
            className="px-3 py-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 font-semibold shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            onClick={redo}
            disabled={!canRedo}
            type="button"
            aria-label="重做 (Redo)"
          >↷ Redo</button>
        </div>
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
      <GameStatus phase={phase} skipReason={skipReason ?? null} result={result ?? null} resetGame={resetGame} />
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
