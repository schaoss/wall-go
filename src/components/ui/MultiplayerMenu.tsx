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
    'rounded border border-zinc-300 dark:border-zinc-600 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full'

  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
      />
      <span className="text-zinc-600 dark:text-zinc-400">
        {connected
          ? t('multiplayer.connected', 'Connected')
          : t('multiplayer.connecting', 'Connecting...')}
      </span>
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

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
      <div className="fixed top-0 w-full flex justify-between items-center gap-2 p-4">
        <ConnectionStatus />
        <LanguageThemeSwitcher dark={dark} setDark={setDark} />
      </div>

      <h1 className="text-3xl font-extrabold mb-6 text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in">
        {t('multiplayer.title', 'Online Multiplayer')}
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in">
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
          <div className="flex flex-col gap-4">
            <div className="text-center text-zinc-600 dark:text-zinc-400 text-sm mb-2">
              {t('multiplayer.welcomePlayer', 'Welcome, {{name}}!', { name: nicknameInput })}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-zinc-700 dark:text-zinc-300 text-xs font-medium uppercase tracking-wider">
                {t('multiplayer.playersCount', 'Players')}
              </label>
              <div className="flex justify-between gap-2 mb-2">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPlayerCount(count)}
                    className={`flex-1 py-2 rounded border text-sm font-bold transition-all ${
                      playerCount === count
                        ? 'bg-indigo-500 border-indigo-600 text-white shadow-md transform scale-105'
                        : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>

            <GameButton onClick={handleCreateRoom} disabled={!connected} className="text-lg py-3">
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
              className={`${inputClassName} uppercase tracking-widest text-center font-mono`}
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
          <div className="flex flex-col gap-4 items-center">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              {t('multiplayer.shareRoomId', 'Share this Room ID with your friend:')}
            </div>

            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-4 py-3 text-center">
                <span className="text-2xl font-mono font-bold tracking-[0.3em] text-zinc-800 dark:text-zinc-100">
                  {roomId}
                </span>
              </div>
              <GameButton onClick={handleCopyRoomId} className="px-4 py-3">
                {copied ? t('multiplayer.copied', 'Copied!') : t('multiplayer.copy', 'Copy')}
              </GameButton>
            </div>

            <div className="w-full mt-4">
              <div className="flex justify-between items-baseline mb-2">
                <div className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('multiplayer.players', 'Players')}:
                </div>
                <div className="text-xs text-zinc-500">
                  {roomPlayers.length} / {targetPlayers}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded p-3">
                {roomPlayers.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 text-zinc-700 dark:text-zinc-200"
                  >
                    <span>{player.nickname}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        player.connected
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
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
                      className="text-zinc-400 dark:text-zinc-500 text-sm py-1 italic border-t border-dashed border-zinc-200 dark:border-zinc-700 first:border-0 mt-1 first:mt-0"
                    >
                      {t('multiplayer.waitingSlot', 'Waiting for player...')}
                    </div>
                  ),
                )}
              </div>
            </div>

            {roomPlayers.length < targetPlayers && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mt-4">
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

        <div className="mt-4">
          <GameButton onClick={handleBack} text ariaLabel={t('multiplayer.back', 'Back')}>
            {t('multiplayer.back', 'Back')}
          </GameButton>
        </div>
      </div>
    </div>
  )
}
