import { useEffect, useState } from 'react'
import Board from './components/Board/Board'
import DarkModeToggle from './components/ui/DarkModeToggle'
import GameStatus from './components/ui/GameStatus'
import { useGame } from './store/index'
import { checkGameEnd } from './utils/checkGameEnd'
import { PLAYER_LIST } from './lib/types'
import GameButton from './components/ui/GameButton'

export default function App() {
  const {
    board, turn, phase, result, selected, legal, skipReason,
    placeStone, selectStone, moveTo, buildWall, resetGame,
    undo, redo, canUndo, canRedo,
  } = useGame()

  const live = checkGameEnd(board, [...PLAYER_LIST])

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
    <>
      <div
        className={[
          'flex flex-col items-center gap-4 py-4 min-h-dvh min-w-0',
          'bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900',
          'transition-all duration-500',
          'box-border',
          'p-4',
        ].join(' ')}
        style={{
          maxWidth: '100vw',
          minHeight: '100dvh',
          paddingBottom: '80px', // 防止內容被 footer 遮住
        }}
      >
        <div className="w-full flex justify-between px-4">
          <div className="flex gap-2">
            <GameButton
              onClick={undo}
              disabled={!canUndo}
              ariaLabel="復原 (Undo)"
            >↶ Undo</GameButton>
            <GameButton
              onClick={redo}
              disabled={!canRedo}
              ariaLabel="重做 (Redo)"
            >↷ Redo</GameButton>
          </div>
          <DarkModeToggle dark={dark} setDark={setDark} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in flex items-center gap-2">
          {phase === 'finished' && result ? (
            result.tie ? (
              <>平手！</>
            ) : result.winner ? (
              <>
                勝者：
                <span
                  className={
                    result.winner === 'R'
                      ? 'inline-block w-6 h-6 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mx-1 align-middle'
                      : 'inline-block w-6 h-6 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mx-1 align-middle'
                  }
                  aria-label={result.winner === 'R' ? '紅方' : '藍方'}
                />
              </>
            ) : null
          ) : (
            <>Wall Go · {phase === 'placing' ? '擺子階段' : phase === 'playing' ? '行動階段' : '結算階段'}</>
          )}
        </h1>
        <div className="flex gap-4 mb-2 animate-fade-in items-center">
          {Object.entries(live.score ?? {}).map(([p, s]) => (
            <span
              key={p}
              className="flex items-center gap-2 font-mono text-lg px-2 py-1 rounded bg-white/70 dark:bg-zinc-800/80 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300"
            >
              <span
                className={
                  p === 'R'
                    ? 'inline-block w-5 h-5 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mr-1'
                    : 'inline-block w-5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mr-1'
                }
                aria-label={p === 'R' ? '紅方' : '藍方'}
              />
              {s}
            </span>
          ))}
          {phase === 'finished' && (
            <GameButton
              onClick={resetGame}
              ariaLabel="再玩一次"
              className="!bg-emerald-200/80 !dark:bg-emerald-900/80 !hover:bg-emerald-400/80 !dark:hover:bg-emerald-800/95 !text-emerald-900 !dark:text-emerald-100 !border-emerald-300 !dark:border-emerald-700 shadow-lg"
            >再玩一次</GameButton>
          )}
        </div>
        <GameStatus phase={phase} skipReason={skipReason ?? null} />
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
    </>
  )
}
