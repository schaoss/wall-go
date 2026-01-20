import { useEffect, useState } from 'react'
import Game from './components/Game'
import Footer from './components/ui/Footer'
import GameModeMenu from './components/ui/GameModeMenu'
import MultiplayerMenu from './components/ui/MultiplayerMenu'
import RuleDialog from './components/ui/RuleDialog'
import SeoHelmet from './components/SeoHelmet'
import MultiplayerGame from './components/MultiplayerGame'
import type { AiLevel, GameMode } from './lib/types'
import { useMultiplayer } from './store/multiplayerStore'

type AppMode = GameMode | 'online' | null
type AiSide = 'R' | 'B'

export default function App() {
  const [showRule, setShowRule] = useState(false)
  const [mode, setMode] = useState<AppMode>(null)
  const [aiSide, setAiSide] = useState<AiSide>('B')
  const [aiLevel, setAiLevel] = useState<AiLevel>('middle')
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const { gameStarted, reset: resetMultiplayer } = useMultiplayer()

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const handleBackFromMultiplayer = () => {
    resetMultiplayer()
    setMode(null)
  }

  const renderContent = () => {
    if (mode === null) {
      return (
        <GameModeMenu
          setMode={(m) => setMode(m)}
          setAiSide={setAiSide}
          setAiLevel={setAiLevel}
          setShowRule={setShowRule}
        />
      )
    }

    if (mode === 'online') {
      if (gameStarted) {
        return (
          <MultiplayerGame
            setShowRule={setShowRule}
            dark={dark}
            setDark={setDark}
            onBack={handleBackFromMultiplayer}
          />
        )
      }
      return <MultiplayerMenu onBack={handleBackFromMultiplayer} dark={dark} setDark={setDark} />
    }

    return (
      <Game
        gameMode={mode}
        aiSide={aiSide}
        aiLevel={aiLevel}
        setGameMode={(m) => setMode(m)}
        setShowRule={setShowRule}
        dark={dark}
        setDark={setDark}
      />
    )
  }

  return (
    <>
      <SeoHelmet />
      {renderContent()}
      <Footer />
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
    </>
  )
}
