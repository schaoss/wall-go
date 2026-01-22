import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './GameButton'
import LanguageThemeSwitcher from './LanguageThemeSwitcher'
import { useMultiplayer } from '@/store/multiplayerStore'

type View = 'nickname' | 'options' | 'join' | 'waiting'

interface MultiplayerMenuProps {
  onBack: () => void
  dark: boolean
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
}

export default function MultiplayerMenu({ onBack, dark, setDark }: MultiplayerMenuProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<View>('nickname')
  const [nicknameInput, setNicknameInput] = useState('')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [playerCount, setPlayerCount] = useState(2)

  const {
    connected,
    roomId,
    roomPlayers,
    gameState,
    error,
    initPeer,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
  } = useMultiplayer()

  useEffect(() => {
    initPeer().catch((err) => {
      console.error('Failed to initialize peer:', err)
    })
  }, [initPeer])

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  useEffect(() => {
    if (roomId) {
      setView('waiting')
    }
  }, [roomId])

  const handleBack = () => {
    if (view === 'options') {
      setView('nickname')
    } else if (view === 'join') {
      setView('options')
    } else if (view === 'waiting') {
      leaveRoom()
      setView('options')
    } else {
      leaveRoom()
      onBack()
    }
    clearError()
  }

  const handleCreateRoom = () => {
    if (nicknameInput.trim()) {
      createRoom(nicknameInput.trim(), playerCount)
    }
  }

  const handleJoinRoom = () => {
    if (nicknameInput.trim() && roomIdInput.trim()) {
      joinRoom(roomIdInput.trim().toUpperCase(), nicknameInput.trim())
    }
  }

  const handleCopyRoomId = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
    }
  }

  const inputClassName =
    'rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-white/80 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full shadow-sm'

  const ConnectionStatus = () => (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase border ${
        connected
          ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
          : 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-700'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
        }`}
      />
      {connected
        ? t('multiplayer.connected', 'Connected')
        : t('multiplayer.connecting', 'Connecting...')}
    </div>
  )

  const ErrorDisplay = () =>
    error ? (
      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded text-sm animate-fade-in">
        {t(`multiplayer.error.${error}`, error)}
      </div>
    ) : null

  // Determine max players for waiting view
  const targetPlayers = gameState?.players.length || 2
  const connectedCount = roomPlayers.filter((player) => player.connected).length

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-indigo-200/40 dark:bg-indigo-900/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-rose-200/40 dark:bg-rose-900/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl flex items-center justify-between mb-6">
        <ConnectionStatus />
        <LanguageThemeSwitcher dark={dark} setDark={setDark} />
      </div>

      <div className="relative w-full max-w-xl bg-white/80 dark:bg-zinc-900/80 border border-white/60 dark:border-zinc-800/80 rounded-3xl shadow-xl px-6 py-8 sm:px-8 sm:py-10 backdrop-blur">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in text-center">
          {t('multiplayer.title', 'Online Multiplayer')}
        </h1>

        <div className="mt-6 flex flex-col gap-5 animate-fade-in">
          <ErrorDisplay />

          {view === 'nickname' && (
            <div className="flex flex-col gap-4">
              <label className="text-zinc-700 dark:text-zinc-200 text-sm font-medium">
                {t('multiplayer.nickname', 'Enter Nickname')}
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={t('multiplayer.nicknamePlaceholder', 'Your nickname')}
                className={inputClassName}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nicknameInput.trim()) {
                    setView('options')
                  }
                }}
              />
              <GameButton
                onClick={() => setView('options')}
                disabled={!nicknameInput.trim() || !connected}
                className="text-lg py-3"
              >
                {t('common.confirm', 'Confirm')}
              </GameButton>
            </div>
          )}

          {view === 'options' && (
            <div className="flex flex-col gap-5">
              <div className="text-center text-zinc-600 dark:text-zinc-400 text-sm">
                {t('multiplayer.welcomePlayer', 'Welcome, {{name}}!', { name: nicknameInput })}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-widest">
                  {t('multiplayer.playersCount', 'Players')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setPlayerCount(count)}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        playerCount === count
                          ? 'bg-indigo-500 border-indigo-600 text-white shadow-md scale-[1.03]'
                          : 'bg-white/90 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
                      }`}
                    >
                      {count}P
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <GameButton
                  onClick={handleCreateRoom}
                  disabled={!connected}
                  className="text-lg py-3"
                >
                  {t('multiplayer.create', 'Create Room')}
                </GameButton>
                <GameButton
                  onClick={() => setView('join')}
                  disabled={!connected}
                  className="text-lg py-3"
                >
                  {t('multiplayer.join', 'Join Room')}
                </GameButton>
              </div>
            </div>
          )}

          {view === 'join' && (
            <div className="flex flex-col gap-4">
              <label className="text-zinc-700 dark:text-zinc-200 text-sm font-medium">
                {t('multiplayer.roomId', 'Room ID')}
              </label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder={t('multiplayer.roomIdPlaceholder', 'Enter Room ID')}
                className={`${inputClassName} uppercase tracking-[0.35em] text-center font-mono`}
                maxLength={6}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom()
                  }
                }}
              />
              <GameButton
                onClick={handleJoinRoom}
                disabled={!roomIdInput.trim() || !connected}
                className="text-lg py-3"
              >
                {t('multiplayer.join', 'Join Room')}
              </GameButton>
            </div>
          )}

          {view === 'waiting' && roomId && (
            <div className="flex flex-col gap-5">
              <div className="text-zinc-600 dark:text-zinc-400 text-sm text-center">
                {t('multiplayer.shareRoomId', 'Share this Room ID with your friend:')}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-4 text-center">
                  <span className="text-2xl font-mono font-bold tracking-[0.3em] text-zinc-800 dark:text-zinc-100">
                    {roomId}
                  </span>
                </div>
                <GameButton onClick={handleCopyRoomId} className="px-5 py-3">
                  {copied ? t('multiplayer.copied', 'Copied!') : t('multiplayer.copy', 'Copy')}
                </GameButton>
              </div>

              <div className="bg-white/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
                <div className="flex justify-between items-baseline mb-3">
                  <div className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {t('multiplayer.players', 'Players')}:
                  </div>
                  <div className="text-xs text-zinc-500">
                    {connectedCount} / {targetPlayers}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {roomPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-zinc-700 dark:text-zinc-200"
                    >
                      <span className="font-medium truncate">{player.nickname}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          player.connected
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {player.connected
                          ? t('multiplayer.ready', 'Ready')
                          : t('multiplayer.disconnected', 'Disconnected')}
                      </span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, targetPlayers - roomPlayers.length) }).map(
                    (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="text-zinc-400 dark:text-zinc-500 text-sm py-2 italic border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-center"
                      >
                        {t('multiplayer.waitingSlot', 'Waiting for player...')}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {connectedCount < targetPlayers && (
                <div className="flex items-center justify-center gap-3 text-zinc-600 dark:text-zinc-400 mt-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                  <span>{t('multiplayer.waiting', 'Waiting for opponent...')}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <GameButton onClick={handleBack} text ariaLabel={t('multiplayer.back', 'Back')}>
              {t('multiplayer.back', 'Back')}
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  )
}
