import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getPlayerTheme } from '@/lib/color'
import type { Pos, WallDir, Player } from '@/lib/types'
import { useMultiplayer } from '@/store/multiplayerStore'
import { checkGameEnd } from '@/utils/game'
import Board from './Board/Board'
import Navbar from './ui/Navbar'
import GameButton from './ui/GameButton'
import ConfirmDialog from './ui/ConfirmDialog'
import TurnTimer from './ui/TurnTimer'

interface MultiplayerGameProps {
  setShowRule: (show: boolean) => void
  dark: boolean
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
  onBack: () => void
}

export default function MultiplayerGame({
  setShowRule,
  dark,
  setDark,
  onBack,
}: MultiplayerGameProps) {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState(90_000)
  const [turnStart, setTurnStart] = useState<number | null>(null)
  const turnTimeLimit = 90_000

  const {
    gameState,
    myPlayer,
    roomPlayers,
    opponentDisconnected,
    selectStone,
    moveTo,
    buildWall,
    placeStone,
    leaveRoom,
  } = useMultiplayer()

  const isMyTurn = gameState?.turn === myPlayer
  const phase = gameState?.phase ?? 'placing'
  const board = gameState?.board ?? []
  const turn = gameState?.turn ?? 'R'
  const selected = gameState?.selected ?? null
  const legal = gameState?.legal ?? new Set<string>()
  const result = gameState?.result
  const players = gameState?.players ?? ['R', 'B']
  const wallBreaks = gameState?.wallBreaks

  const live = board.length > 0 ? checkGameEnd(board, players) : { finished: false, score: {} }

  useEffect(() => {
    if (phase === 'playing' && isMyTurn) {
      setTurnStart(Date.now())
      setTimeLeft(turnTimeLimit)
    } else if (phase === 'finished') {
      setTurnStart(null)
      setTimeLeft(0)
    }
  }, [phase, turn, isMyTurn])

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

  const handleSelectStone = useCallback(
    (pos: Pos) => {
      if (!isMyTurn || phase !== 'playing') return
      selectStone(pos)
    },
    [isMyTurn, phase, selectStone],
  )

  const handleMoveTo = useCallback(
    (pos: Pos) => {
      if (!isMyTurn || phase !== 'playing') return
      moveTo(pos)
    },
    [isMyTurn, phase, moveTo],
  )

  const handleBuildWall = useCallback(
    (pos: Pos, dir: WallDir) => {
      if (!isMyTurn || phase !== 'playing') return
      buildWall(pos, dir)
    },
    [isMyTurn, phase, buildWall],
  )

  const handlePlaceStone = useCallback(
    (pos: Pos) => {
      if (!isMyTurn || phase !== 'placing') return
      placeStone(pos)
    },
    [isMyTurn, phase, placeStone],
  )

  const handleLeave = () => {
    leaveRoom()
    onBack()
  }

  if (!gameState || board.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="text-zinc-600 dark:text-zinc-400">
          {t('multiplayer.loading', 'Loading game...')}
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        'relative flex flex-col items-center gap-4 py-4 min-h-dvh min-w-0',
        'bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900',
        'transition-color',
        'box-border',
        'p-4 pb-12',
      ].join(' ')}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-indigo-200/40 dark:bg-indigo-900/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-rose-200/40 dark:bg-rose-900/30 blur-3xl" />
      </div>

      <TurnTimer timeLeft={timeLeft} timeLimit={turnTimeLimit} turn={turn} phase={phase} />

      <Navbar
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
        phase={phase}
        onHome={() => {
          const inProgress =
            phase !== 'finished' && board.some((row) => row.some((c) => c.stone !== null))
          if (inProgress) setShowConfirm(true)
          else handleLeave()
        }}
        dark={dark}
        setDark={setDark}
      />

      {opponentDisconnected && (
        <div className="bg-amber-100/90 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200 px-4 py-2 rounded-xl text-sm animate-fade-in shadow-sm">
          {t('multiplayer.opponentDisconnected', 'Opponent disconnected. Waiting for reconnect...')}
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {roomPlayers.map((p) => (
            <div
              key={p.player}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-colors duration-300 ${
                p.player === myPlayer
                  ? `${getPlayerTheme(p.player).territory} ${getPlayerTheme(p.player).border}`
                  : 'bg-white/80 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-4 h-4 rounded-full border-2 ${getPlayerTheme(p.player).bg} ${getPlayerTheme(p.player).border}`}
                />
                <span
                  className={`font-medium truncate ${p.player === myPlayer ? getPlayerTheme(p.player).text : 'text-zinc-700 dark:text-zinc-100'}`}
                >
                  {p.nickname}
                </span>
                {p.player === myPlayer && (
                  <span className={`text-xs ${getPlayerTheme(p.player).text}`}>
                    ({t('multiplayer.you', 'You')})
                  </span>
                )}
              </div>
              <span
                role="status"
                aria-label={
                  p.connected ? `${p.nickname} (Connected)` : `${p.nickname} (Disconnected)`
                }
                className={
                  p.connected
                    ? `text-xs px-2 py-0.5 rounded-full transition-colors duration-200 ${
                        getPlayerTheme(p.player).bg
                      } ${getPlayerTheme(p.player).text} ${getPlayerTheme(p.player).border}`
                    : `text-xs px-2 py-0.5 rounded-full transition-colors duration-200 bg-white/50 dark:bg-zinc-800/40 ${
                        getPlayerTheme(p.player).border
                      } ${getPlayerTheme(p.player).text}`
                }
              >
                {p.connected
                  ? t('multiplayer.ready', 'Ready')
                  : t('multiplayer.disconnected', 'Disconnected')}
              </span>
            </div>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in flex items-center gap-2">
          {phase === 'finished' && result ? (
            result.tie ? (
              <>{t('game.tie', '🤜🤛 Draw!')}</>
            ) : result.winner ? (
              <>
                {t('game.winner', '🥇 Winner:')}
                <span
                  className={`inline-block w-6 h-6 rounded-full shadow-sm mx-1 align-middle border-2 ${getPlayerTheme(result.winner).bg} ${getPlayerTheme(result.winner).border}`}
                  aria-label={t(
                    getPlayerTheme(result.winner).nameKey,
                    getPlayerTheme(result.winner).nameDef,
                  )}
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
              {isMyTurn && (
                <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400 ml-2">
                  ({t('multiplayer.yourTurn', 'Your turn')})
                </span>
              )}
            </>
          )}
        </h1>

        <div className="flex flex-wrap gap-3 animate-fade-in items-center">
          {(phase === 'placing'
            ? players.map((p): [string, number] => [p, 0])
            : (Object.entries(live.score ?? {}) as [string, number][])
          ).map(([p, s]) => (
            <span
              key={p}
              className="flex items-center gap-2 font-mono text-lg px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all duration-300"
            >
              <span
                className={`inline-block w-5 h-5 rounded-full shadow-sm mr-1 border-2 ${getPlayerTheme(p as Player).bg} ${getPlayerTheme(p as Player).border}`}
                aria-label={t(
                  getPlayerTheme(p as Player).nameKey,
                  getPlayerTheme(p as Player).nameDef,
                )}
              />
              {s}
            </span>
          ))}
          {phase === 'finished' && (
            <GameButton
              onClick={handleLeave}
              ariaLabel={t('multiplayer.backToLobby', 'Back to Lobby')}
              variant="success"
            >
              {t('multiplayer.backToLobby', 'Back to Lobby')}
            </GameButton>
          )}
        </div>
      </div>

      <div className="board-container flex flex-col aspect-ratio-1 items-center w-[min(820px,100dvh-280px)] max-w-[calc(100dvw-32px)] transition-all">
        <Board
          board={board}
          phase={phase}
          turn={turn}
          selected={selected}
          legal={legal}
          placeStone={isMyTurn && phase === 'placing' ? handlePlaceStone : undefined}
          selectStone={isMyTurn && phase === 'playing' ? handleSelectStone : undefined}
          moveTo={isMyTurn && phase === 'playing' ? handleMoveTo : undefined}
          buildWall={isMyTurn && phase === 'playing' ? handleBuildWall : undefined}
          isBreakMode={false}
          toggleBreakMode={() => {}}
          wallBreaks={wallBreaks}
        />
      </div>

      <div className="w-full flex justify-center mt-3 animate-fade-in">
        <GameButton onClick={() => setShowRule(true)} text ariaLabel={t('menu.rule', 'Game Rules')}>
          {t('menu.rule', 'Game Rules')}
        </GameButton>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title={t('multiplayer.leaveGame', 'Leave Game')}
        message={t(
          'multiplayer.confirmLeave',
          'Are you sure you want to leave this game? You will forfeit the match.',
        )}
        confirmText={t('common.confirm', 'Confirm')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setShowConfirm(false)
          handleLeave()
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
