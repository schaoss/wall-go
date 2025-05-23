import { useEffect, useState } from 'react'
import Board from './components/Board/Board'
import GameStatus from './components/ui/GameStatus'
import { useGame } from './store/index'
import { checkGameEnd } from './utils/checkGameEnd'
import { PLAYER_LIST } from './lib/types'
import GameButton from './components/ui/GameButton'
import Navbar from './components/ui/Navbar'
import Footer from './components/ui/Footer'
import GameModeMenu from './components/ui/GameModeMenu'
import ConfirmDialog from './components/ui/ConfirmDialog'
type GameMode = 'pvp' | 'ai'
type AiSide = 'R' | 'B'

export default function App() {
  // 新增：遊戲模式與 AI 先後手
  const [mode, setMode] = useState<GameMode | null>(null)
  const [aiSide, setAiSide] = useState<AiSide>('B')

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

  const [showConfirm, setShowConfirm] = useState(false)
  const handleHome = () => {
    if ((canUndo || canRedo) && (phase !== 'finished')) {
      setShowConfirm(true)
      return
    }
    setMode(null); resetGame();
  }

  // 選擇模式畫面
  if (!mode) {
    return (
      <GameModeMenu
        mode={mode}
        setMode={setMode}
        aiSide={aiSide}
        setAiSide={setAiSide}
      />
    )
  }

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
        <Navbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onHome={handleHome}
          onToggleDark={() => setDark(d => !d)}
          dark={dark}
        />
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
          {(phase === 'placing'
            ? PLAYER_LIST.map(p => [p, 0])
            : Object.entries(live.score ?? {}))
          .map(([p, s]) => (
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
      <Footer />
      <ConfirmDialog
        open={showConfirm}
        title="回到模式選擇"
        message={
          '遊戲尚未結束，確定要回到模式選擇嗎？\n目前進度將會消失。'
        }
        confirmText="確定"
        cancelText="取消"
        onConfirm={() => {
          setShowConfirm(false)
          setMode(null)
          resetGame()
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
