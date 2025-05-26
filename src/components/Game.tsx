import { PLAYER_LIST, type PlayerAction, type State } from '../lib/types'
import GameButton from './ui/GameButton'
import Navbar from './ui/Navbar'
import Board from './Board/Board'
import { useTranslation } from 'react-i18next'
import { useGame } from '../store/index'
import { checkGameEnd } from '../utils/checkGameEnd'
import { useRef, useEffect, useCallback } from 'react'
import { TurnManager } from '../agents/TurnManager'
import { HumanAgent, RandomAgent, MinimaxAgent, KillerAgent, DevilAgent } from '../agents'
import { snapshotFromState } from '../store/gameState'

export default function Game({
  gameMode, aiSide, aiLevel, setGameMode, setShowRule, dark, setDark
}: {
  gameMode: 'pvp' | 'ai'
  aiSide: 'R' | 'B'
  aiLevel: 'random' | 'minimax' | 'killer' | 'devil'
  setGameMode: (m: 'pvp' | 'ai' | null) => void
  setShowRule: (b: boolean) => void
  dark: boolean
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
}) {
  // 內部自行管理 useGame 狀態與 AI 流程
  const {
    board, turn, phase, result, selected, legal,
    placeStone, selectStone, moveTo, buildWall, setPhase, resetGame,
    undo, redo, canUndo, canRedo,
  } = useGame()
  const live = checkGameEnd(board, [...PLAYER_LIST])
  const { t } = useTranslation()

  // --- 代理主流程整合 ---
  const turnManagerRef = useRef<TurnManager | null>(null)
  const humanAgentRef = useRef<HumanAgent | null>(null)
  // 直接用 useGame() 的完整 state 當 snapshot
  const latestStateRef = useRef<State | null>(null)
  useEffect(() => {
    latestStateRef.current = useGame.getState()
  }, [board, turn, selected, legal, phase, result])

  const turnManagerStartedRef = useRef(false)

  const setupTurnManager = useCallback(() => {
    if (!gameMode) return
    const human = new HumanAgent()
    humanAgentRef.current = human
    const aiMap = {
      random: RandomAgent,
      minimax: MinimaxAgent,
      killer: KillerAgent,
      devil: DevilAgent,
    }
    const ai = new aiMap[aiLevel]()
    const agents =
      gameMode === 'ai'
        ? (aiSide === 'R' ? { R: ai, B: human } : { R: human, B: ai })
        : { R: human, B: human }
    turnManagerRef.current = new TurnManager({
      agents,
      getGameState: () => snapshotFromState(latestStateRef.current!),
      applyAction: async (action: PlayerAction) => {
        if (action.type === 'place') {
          placeStone(action.pos)
        } else if (action.type === 'move') {
          if (action.from) selectStone(action.from)
          moveTo(action.pos)
        } else if (action.type === 'wall' && action.dir) {
          if (action.from) selectStone(action.from)
          buildWall(action.pos, action.dir)
        }
      },
      isGameOver: (state) => state.phase === 'finished' || !!state.result,
    })
    turnManagerStartedRef.current = false
  }, [gameMode, aiSide, aiLevel, buildWall, moveTo, placeStone, selectStone])

  useEffect(() => {
    if (!gameMode) return
    setPhase('placing')
    setupTurnManager()
  }, [gameMode, aiSide, setPhase, setupTurnManager])

  useEffect(() => {
    if (!turnManagerRef.current) return
    if ((phase === 'placing' || phase === 'playing') && !turnManagerStartedRef.current) {
      turnManagerRef.current.startLoop()
      turnManagerStartedRef.current = true
    }
  }, [phase])

  const handlePlayerAction = useCallback((action: PlayerAction) => {
    humanAgentRef.current?.submitAction(action)
  }, [])

  const isHumanTurn = turnManagerRef.current?.['agents']?.[turn] instanceof HumanAgent

  const onTurnEnd = useCallback(() => {
    if (phase !== 'playing') return
    setTimeout(() => {
      if (live.finished) setPhase('finished')
    }, 0)
  }, [phase, live, setPhase])

  // 每當遊戲狀態變化時檢查是否需要結束回合
  useEffect(() => {
    onTurnEnd()
  }, [onTurnEnd, turn, phase, result, live])

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
        onHome={() => {
          setGameMode(null)
          resetGame()
        }}
        dark={dark}
        setDark={setDark}
      />
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow mb-2 animate-fade-in flex items-center gap-2">
        {phase === 'finished' && result ? (
          result.tie ? (
            <>{t('game.tie', '🤜🤛 Draw!')}</>
          ) : result.winner ? (
            <>
              {t('game.winner', '🥇 Winner:')}
              <span
                className={
                  result.winner === 'R'
                    ? 'inline-block w-6 h-6 rounded-full bg-rose-500 dark:bg-rose-400 border-2 border-rose-300 dark:border-rose-500 shadow-sm mx-1 align-middle'
                    : 'inline-block w-6 h-6 rounded-full bg-indigo-500 dark:bg-indigo-400 border-2 border-indigo-300 dark:border-indigo-500 shadow-sm mx-1 align-middle'
                }
                aria-label={result.winner === 'R' ? t('game.red', 'Red') : t('game.blue', 'Blue')}
              />
            </>
          ) : null
        ) : (
          <>
            Wall Go · {
              phase === 'placing'
                ? t('game.phase.placing', 'Placement Phase')
                : phase === 'playing'
                ? t('game.phase.playing', 'Action Phase')
                : t('game.phase.finished', 'Scoring Phase')
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
              aria-label={p === 'R' ? t('game.red', 'Red') : t('game.blue', 'Blue')}
            />
            {s}
          </span>
        ))}
        {phase === 'finished' && (
          <GameButton
            onClick={() => {
              setGameMode(null)
              resetGame()
              setPhase('selecting')
            }}
            ariaLabel={t('game.again', 'Play Again')}
            variant='success'
          >{t('game.again', 'Play Again')}</GameButton>
        )}
      </div>
      <Board
        board={board}
        phase={phase}
        turn={turn}
        selected={selected ?? null}
        legal={legal}
        placeStone={phase === 'placing' || isHumanTurn ? (pos => handlePlayerAction({ type: 'place', pos })) : undefined}
        selectStone={isHumanTurn && phase === 'playing' ? (pos => selectStone(pos)) : undefined}
        moveTo={isHumanTurn && phase === 'playing' ? (pos => handlePlayerAction({ type: 'move', pos })) : undefined}
        buildWall={isHumanTurn && phase === 'playing' ? ((pos, dir) => handlePlayerAction({ type: 'wall', pos, dir })) : undefined}
      />
      <div className="w-full flex justify-center mt-3 animate-fade-in">
        <GameButton onClick={() => setShowRule(true)} text ariaLabel={t('menu.rule', '遊戲規則')}>
          {t('menu.rule', '遊戲規則')}
        </GameButton>
      </div>
    </div>
  )
}
