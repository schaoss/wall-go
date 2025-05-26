import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Game from './components/Game'
import Footer from './components/ui/Footer'
import GameModeMenu from './components/ui/GameModeMenu'
import ConfirmDialog from './components/ui/ConfirmDialog'
import RuleDialog from './components/ui/RuleDialog'
import SeoHelmet from './components/SeoHelmet'

type GameMode = 'pvp' | 'ai'
type AiSide = 'R' | 'B'

export default function App() {
  const { t } = useTranslation()

  // 只保留全域 UI 狀態與頁面切換
  const [showRule, setShowRule] = useState(false)
  const [mode, setMode] = useState<GameMode | null>(null)
  const [aiSide, setAiSide] = useState<AiSide>('B')
  const [aiLevel, setAiLevel] = useState<'random' | 'minimax' | 'killer' | 'devil'>('killer')
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // 深色模式切換
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

  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <SeoHelmet />
      {mode === null || mode === undefined ? (
        <GameModeMenu
          setMode={(m) => {
            setMode(m)
          }}
          setAiSide={setAiSide}
          setAiLevel={setAiLevel}
          setShowRule={setShowRule}
        />
      ) : (
        <Game
          gameMode={mode}
          aiSide={aiSide}
          aiLevel={aiLevel}
          setGameMode={setMode}
          setShowRule={setShowRule}
          dark={dark}
          setDark={setDark}
        />
      )}
      <Footer />
      <RuleDialog open={showRule} onClose={() => setShowRule(false)} />
      <ConfirmDialog
        open={showConfirm}
        title={t('menu.home', '回到首頁')}
        message={t('menu.confirmHome', '遊戲尚未結束，確定要回到首頁嗎？\n目前進度將會消失。')}
        confirmText={t('common.confirm', '確定')}
        cancelText={t('common.cancel', '取消')}
        onConfirm={() => {
          setShowConfirm(false)
          setMode(null)
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
