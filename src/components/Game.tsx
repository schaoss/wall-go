import { type PlayerAction, type State, type Player } from '@/lib/types'
import type { PlayerAgent } from '@/agents/PlayerAgent'
import GameButton from './ui/GameButton'
import Navbar from './ui/Navbar'
import Board from './Board/Board'
import StatusMessage from './ui/StatusMessage'
import { useTranslation } from 'react-i18next'
import { useGame } from '@/store/index'
import { checkGameEnd } from '@/utils/game'
import { useRef, useEffect, useCallback, useState } from 'react'
import { TurnManager } from '@/agents/TurnManager'
import { HumanAgent, RandomAgent, MinimaxAgent } from '@/agents'
import { snapshotFromState } from '@/store/gameState'
import ConfirmDialog from './ui/ConfirmDialog'
import TurnTimer from './ui/TurnTimer'
import RuleDialog from './ui/RuleDialog'
import { LoadingOverlay } from './ui/LoadingOverlay'
import type { GameProps } from '@/lib/componentProps'

export default function Game({ gameConfig, onBackToMenu, dark, setDark }: GameProps) {
  // 內部自行管理 useGame 狀態與 AI 流程
  const {
    board,
    turn,
    phase,
    result,
    selected,
    legal,
    placeStone,
    selectStone,
    moveTo,
    buildWall,
    setPhase,
    resetGame,
    undo,
    redo,
    canUndo,
    canRedo,
    skipReason,
    isLoading,
    setIsLoading,
  } = useGame()
  const live = checkGameEnd(board, gameConfig.players)
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRule, setShowRule] = useState(false)
  const [timeLeft, setTimeLeft] = useState(90_000)
  const turnTimeLimit = 90_000
  const [turnStart, setTurnStart] = useState<number | null>(null)

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
    if (!gameConfig) return

    const human = new HumanAgent()
    humanAgentRef.current = human

    const aiMap = {
      practice: new RandomAgent(),
      easy: new MinimaxAgent(2),
      middle: new MinimaxAgent(4),
      hard: new MinimaxAgent(6),
    }

    const agents: Record<Player, PlayerAgent> = {} as Record<Player, PlayerAgent>

    gameConfig.players.forEach((player) => {
      const aiLevel = gameConfig.aiAssignments[player]
      if (aiLevel && aiLevel !== '') {
        agents[player] = aiMap[aiLevel as keyof typeof aiMap] || aiMap.middle
      } else {
        agents[player] = human
      }
    })

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
      turnTimeLimit,
      onTurnStart: (state) => {
        if (state.phase !== 'playing') return
        setTurnStart(Date.now())
        setTimeLeft(turnTimeLimit)
      },
      onMessage: (message) => {
        if (message.type === 'start-thinking') {
          setIsLoading(true)
        } else if (message.type === 'stop-thinking') {
          setIsLoading(false)
        }
      },
    })
    turnManagerStartedRef.current = false
  }, [gameConfig, buildWall, moveTo, placeStone, selectStone, setIsLoading])

  useEffect(() => {
    if (!gameConfig) {
      useGame.getState().setHumanSide(null)
      return
    }

    // Set up human players for undo/redo functionality
    const humanPlayers = gameConfig.players.filter((player) => {
      return !gameConfig.aiAssignments?.[player] || gameConfig.aiAssignments[player] === ''
    })

    if (humanPlayers.length === 1) {
      useGame.getState().setHumanSide(humanPlayers[0])
    } else {
      useGame.getState().setHumanSide(null)
    }
  }, [gameConfig])

  useEffect(() => {
    if (!gameConfig) return

    // Initialize game with correct players
    // Set players first, then reset the game to ensure proper initialization
    useGame.getState().setPlayers(gameConfig.players)
    resetGame()
    setPhase('placing')
    setupTurnManager()
  }, [gameConfig, resetGame, setPhase, setupTurnManager])

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

  // Turn timer update
  useEffect(() => {
    if (turnStart === null) return
    let frame: number
    let stopped = false
    const update = () => {
      if (stopped) return
      setTimeLeft(Math.max(0, turnTimeLimit - (Date.now() - turnStart)))
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  }, [turnStart])

  // 只要 phase 進入 playing（不論是 redo/undo 或正常下棋），timer 就 reset
  useEffect(() => {
    if (phase === 'finished') {
      setTurnStart(null)
      setTimeLeft(0)
    }
  }, [phase])

  // 每當遊戲狀態變化時檢查是否需要結束回合
  useEffect(() => {
    onTurnEnd()
  }, [onTurnEnd, turn, phase, result, live])

  const getPlayerColorClass = (player: Player, type: 'bg' | 'border' | 'text') => {
    if (type === 'bg') {
      return player === 'R'
        ? 'bg-rose-500 dark:bg-rose-400'
        : player === 'B'
          ? 'bg-indigo-500 dark:bg-indigo-400'
          : player === 'G'
            ? 'bg-emerald-500 dark:bg-emerald-400'
            : 'bg-amber-500 dark:bg-amber-400'
    }
    if (type === 'border') {
      return player === 'R'
        ? 'border-rose-300 dark:border-rose-500'
        : player === 'B'
          ? 'border-indigo-300 dark:border-indigo-500'
          : player === 'G'
            ? 'border-emerald-300 dark:border-emerald-500'
            : 'border-amber-300 dark:border-amber-500'
    }
    return player === 'R'
      ? 'text-rose-500 dark:text-rose-400'
      : player === 'B'
        ? 'text-indigo-500 dark:text-indigo-400'
        : player === 'G'
          ? 'text-emerald-500 dark:text-emerald-400'
          : 'text-amber-500 dark:text-amber-400'
  }

  return (
    <div
      className={[
        'flex flex-col items-center gap-4 py-4 min-h-dvh min-w-0',
        'bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-700 dark:to-zinc-900',
        'transition-color',
        'box-border',
        'p-4 pb-12',
      ].join(' ')}
    >
      <LoadingOverlay isVisible={isLoading} />
      <TurnTimer timeLeft={timeLeft} timeLimit={turnTimeLimit} turn={turn} phase={phase} />
      <Navbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        phase={phase}
        onHome={() => {
          const inProgress =
            phase !== 'finished' && board.some((row) => row.some((c) => c.stone !== null))
          if (inProgress) setShowConfirm(true)
          else {
            onBackToMenu()
            resetGame()
          }
        }}
        dark={dark}
        setDark={setDark}
      />
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in flex items-center gap-2">
        {phase === 'finished' && result ? (
          result.tie ? (
            <>{t('game.tie', '🤜🤛 Draw!')}</>
          ) : result.winner ? (
            <>
              {t('game.winner', '🥇 Winner:')}
              <span
                className={`inline-block w-6 h-6 rounded-full ${getPlayerColorClass(result.winner, 'bg')} ${getPlayerColorClass(result.winner, 'border')} shadow-sm mx-1 align-middle`}
                aria-label={
                  result.winner === 'R'
                    ? t('game.red', 'Red')
                    : result.winner === 'B'
                      ? t('game.blue', 'Blue')
                      : result.winner === 'G'
                        ? t('game.green', 'Green')
                        : t('game.yellow', 'Yellow')
                }
              />
            </>
          ) : null
        ) : (
          <>
            Wall Go ·{' '}
            {phase === 'placing'
              ? t('game.phase.placing', 'Placement Phase')
              : phase === 'playing'
                ? t('game.phase.playing', 'Action Phase')
                : t('game.phase.finished', 'Scoring Phase')}
          </>
        )}
      </h1>
      <div className="flex gap-4 animate-fade-in items-center flex-wrap justify-center">
        {(phase === 'placing'
          ? gameConfig.players.map((player) => [player, 0])
          : Object.entries(live.score ?? {})
        ).map(([p, s]) => (
          <span
            key={p}
            className="flex items-center gap-2 font-mono text-lg px-2 py-1 rounded bg-white/70 dark:bg-zinc-800/80 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300"
          >
            <span
              className={`inline-block w-5 h-5 rounded-full ${getPlayerColorClass(p as Player, 'bg')} ${getPlayerColorClass(p as Player, 'border')} shadow-sm mr-1`}
              aria-label={
                p === 'R'
                  ? t('game.red', 'Red')
                  : p === 'B'
                    ? t('game.blue', 'Blue')
                    : p === 'G'
                      ? t('game.green', 'Green')
                      : t('game.yellow', 'Yellow')
              }
            />
            {s}
          </span>
        ))}
        {phase === 'finished' && (
          <GameButton
            onClick={() => {
              onBackToMenu()
              resetGame()
            }}
            ariaLabel={t('game.again', 'Play Again')}
            variant="success"
          >
            {t('game.again', 'Play Again')}
          </GameButton>
        )}
      </div>

      {/* Status message for territory capture */}
      {phase === 'playing' && skipReason && (
        <div className="w-full max-w-md animate-fade-in">
          <StatusMessage
            className={`bg-amber-100 dark:bg-amber-900/80 ${getPlayerColorClass(turn, 'border')}`}
          >
            {skipReason === 'pieceInCapturedTerritory' && (
              <span>
                {t(
                  'game.pieceInCapturedTerritory',
                  'This piece is in captured territory and cannot move',
                )}
              </span>
            )}
            {skipReason === 'cannotMoveToTerritory' && (
              <span>
                {t('game.cannotMoveToTerritory', 'Cannot move to a position in captured territory')}
              </span>
            )}
          </StatusMessage>
        </div>
      )}
      <div className="board-container flex flex-col aspect-ratio-1 items-center w-[min(800px,100dvh-280px)] max-w-[calc(100dvw-32px)] transition-all">
        <Board
          board={board}
          phase={phase}
          turn={turn}
          selected={selected ?? null}
          legal={legal}
          placeStone={
            phase === 'placing' || isHumanTurn
              ? (pos) => handlePlayerAction({ type: 'place', pos })
              : undefined
          }
          selectStone={isHumanTurn && phase === 'playing' ? (pos) => selectStone(pos) : undefined}
          moveTo={
            isHumanTurn && phase === 'playing'
              ? (pos) => handlePlayerAction({ type: 'move', pos })
              : undefined
          }
          buildWall={
            isHumanTurn && phase === 'playing'
              ? (pos, dir) => handlePlayerAction({ type: 'wall', pos, dir })
              : undefined
          }
        />
      </div>
      <div className="w-full flex justify-center mt-3 animate-fade-in">
        <GameButton onClick={() => setShowRule(true)} text ariaLabel={t('menu.rule', 'Game Rules')}>
          {t('menu.rule', 'Game Rules')}
        </GameButton>
      </div>
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
      <ConfirmDialog
        open={showConfirm}
        title={t('menu.home', 'Home')}
        message={t(
          'menu.confirmHome',
          'The game is not finished. Are you sure you want to return to the home screen?\nYour current progress will be lost.',
        )}
        confirmText={t('common.confirm', 'Confirm')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setShowConfirm(false)
          onBackToMenu()
          resetGame()
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
