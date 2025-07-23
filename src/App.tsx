import { useState } from 'react'
import Game from './components/Game'
import Footer from './components/ui/Footer'
import PlayerSetup from './components/PlayerSetup'
import RuleDialog from './components/ui/RuleDialog'
import SeoHelmet from './components/SeoHelmet'
import type { Player } from './lib/types'

interface GameConfig {
  players: Player[]
  gameMode: 'mixed'
  aiAssignments: Record<Player, string>
}

export default function App() {
  const [showRule, setShowRule] = useState(false)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const handleStartGame = (players: Player[], aiAssignments: Record<Player, string>) => {
    setGameConfig({
      players,
      gameMode: 'mixed',
      aiAssignments,
    })
  }

  const handleBackToMenu = () => {
    setGameConfig(null)
  }

  return (
    <>
      <SeoHelmet />
      {gameConfig === null ? (
        <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
          <div className="fixed top-0 w-full flex justify-end gap-2 mb-2 p-4">
            <button
              onClick={() => setShowRule(true)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Rules
            </button>
          </div>
          <h1 className="text-3xl font-extrabold mb-6 text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in">
            Wall Go
          </h1>
          <PlayerSetup onStartGame={handleStartGame} />
        </div>
      ) : (
        <Game
          gameConfig={gameConfig}
          onBackToMenu={handleBackToMenu}
          dark={dark}
          setDark={setDark}
        />
      )}
      <Footer />
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
    </>
  )
}
