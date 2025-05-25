import { PLAYER_LIST, type Player, type Phase, type Pos, type Cell, type PlayerAction } from '../lib/types'
import GameButton from './ui/GameButton'
import Navbar from './ui/Navbar'
import Board from './Board/Board'
import { useTranslation } from 'react-i18next'
import type { GameResult } from '../utils/checkGameEnd'

interface GameProps {
  board: Cell[][]
  phase: Phase
  turn: Player
  selected: Pos | null
  legal: Set<string>
  result: GameResult | null
  live: { score?: Record<Player, number> }
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  handleHome: () => void
  dark: boolean
  setDark: (d: boolean) => void
  isHumanTurn: boolean
  handlePlayerAction: (action: PlayerAction) => void
  selectStone: (pos: Pos) => void
  resetGame: () => void
  setMode: (m: any) => void
  setPhase: (p: Phase) => void
  setShowRule: (b: boolean) => void
}

export default function Game({
  board, phase, turn, selected, legal, result, live,
  canUndo, canRedo, undo, redo, handleHome, dark, setDark,
  isHumanTurn, handlePlayerAction, selectStone, resetGame, setMode, setPhase, setShowRule
}: GameProps) {
  const { t } = useTranslation()
  return (
    <div
      className={[
        'flex flex-col items-center gap-4 py-4 min-h-dvh min-w-0',
        'bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-700 dark:to-zinc-900',
        'transition-all duration-500',
        'box-border',
        'p-4',
      ].join(' ')}
      style={{
        maxWidth: '100vw',
        minHeight: '100dvh',
        paddingBottom: '80px',
      }}
    >
      <Navbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        phase={phase}
        onHome={handleHome}
        dark={dark}
        setDark={setDark}
      />
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in flex items-center gap-2">
        {phase === 'finished' && result ? (
          result.tie ? (
            <>{t('game.tie', '平手！')}</>
          ) : result.winner ? (
            <>
              {t('game.winner', '勝者：')}
              <span
                className={
                  result.winner === 'R'
                    ? 'inline-block w-6 h-6 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mx-1 align-middle'
                    : 'inline-block w-6 h-6 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mx-1 align-middle'
                }
                aria-label={result.winner === 'R' ? t('game.red', '紅方') : t('game.blue', '藍方')}
              />
            </>
          ) : null
        ) : (
          <>
            Wall Go · {
              phase === 'placing'
                ? t('game.phase.placing', '擺子階段')
                : phase === 'playing'
                ? t('game.phase.playing', '行動階段')
                : t('game.phase.finished', '結算階段')
            }
          </>
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
              aria-label={p === 'R' ? t('game.red', '紅方') : t('game.blue', '藍方')}
            />
            {s}
          </span>
        ))}
        {phase === 'finished' && (
          <GameButton
            onClick={() => {
              setMode(null)
              resetGame()
              setPhase('selecting')
            }}
            ariaLabel={t('game.again', '再玩一次')}
            variant='success'
          >{t('game.again', '再玩一次')}</GameButton>
        )}
      </div>
      <Board
        board={board}
        phase={phase}
        turn={turn}
        selected={selected ?? null}
        legal={legal}
        placeStone={phase === 'placing' ? (pos => handlePlayerAction({ type: 'place', pos })) : (isHumanTurn ? (pos => handlePlayerAction({ type: 'place', pos })) : undefined)}
        selectStone={isHumanTurn && phase === 'playing' ? (pos => selectStone(pos)) : undefined}
        moveTo={isHumanTurn && phase === 'playing' ? (pos => handlePlayerAction({ type: 'move', pos })) : undefined}
        buildWall={isHumanTurn && phase === 'playing' ? ((pos, dir) => handlePlayerAction({ type: 'wall', pos, dir })) : undefined}
      />
      <div className="w-full flex justify-center my-3 animate-fade-in">
        <GameButton onClick={() => setShowRule(true)} text ariaLabel={t('menu.rule', '遊戲規則')}>
          {t('menu.rule', '遊戲規則')}
        </GameButton>
      </div>
    </div>
  )
}
