import LanguageThemeSwitcher from './LanguageThemeSwitcher'
import { useState, useRef, useEffect } from 'react'
import GameButton from './GameButton'
import { useTranslation } from 'react-i18next'

const GAME_MODES = [
  { key: 'pvp', label: '🤝 雙人對戰' },
  { key: 'ai', label: '🤖 單人 vs AI' },
] as const

const AI_LEVELS = [
  { key: 'random', label: '🎲 練習' },
  { key: 'minimax', label: '🌱 初階' },
  { key: 'killer', label: '🐵 中階' },
  // { key: 'devil', label: '👾 高階' },
] as const

type GameMode = typeof GAME_MODES[number]['key']
type AiLevel = typeof AI_LEVELS[number]['key']
type AiSide = 'R' | 'B'

export default function GameModeMenu({
  setMode,
  setAiSide,
  setAiLevel,
  setShowRule,
}: {
  setMode: (m: GameMode) => void
  setAiSide: (s: AiSide) => void
  setAiLevel: (l: AiLevel) => void
  setShowRule: (show: boolean) => void
}) {
  const { t } = useTranslation()
  const [showAiSelect, setShowAiSelect] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<AiLevel>('killer')
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') return true
      if (stored === 'light') return false
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
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
  // 語言切換下拉
  const [open, setOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])
  // 移除原本的切換按鈕與語言下拉，改用共用元件
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
      <div className="fixed top-0 w-full flex justify-end gap-2 mb-2 py-4 px-8">
        <LanguageThemeSwitcher dark={dark} setDark={setDark} />
      </div>
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in">
        {t('menu.title', 'Wall Go · 牆壁圍棋')}
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in min-h-[120px] transition-all duration-500">
        {GAME_MODES.map(m => (
          <GameButton
            key={m.key}
            onClick={m.key === 'ai' ? () => setShowAiSelect(true) : () => setMode(m.key as GameMode)}
            className="text-lg py-3"
            active={m.key === 'ai' && showAiSelect}
          >{t(`menu.mode.${m.key}`, m.label)}</GameButton>
        ))}
      </div>
      {/* AI 難度與先後手合併選擇（難度為下拉選單） */}
      <div style={{ transition: 'opacity 0.3s, max-height 0.3s, margin 0.3s' }}
        className={
          'w-full flex justify-center' +
          (showAiSelect
            ? ' opacity-100 max-h-60 mt-6 flex-col gap-2 items-center animate-fade-in transition-all duration-500'
            : ' opacity-0 max-h-0 overflow-hidden pointer-events-none flex-col gap-2 items-center transition-all duration-500')
        }
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-zinc-700 dark:text-zinc-200 mb-3">{t('menu.ai.select', '選擇難易度與先後手：')}</span>
          <div className="flex flex-col gap-3 w-full mb-2 items-center">
            <label className="mb-2 text-base text-zinc-700 dark:text-zinc-200">
              <span className="mr-2">{t('menu.ai.level', 'AI 強度：')}</span>
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value as AiLevel)}
                className="rounded border border-zinc-300 dark:border-zinc-600 px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                {AI_LEVELS.map(l => (
                  <option className="cursor-pointer" key={l.key} value={l.key}>{t(`menu.ai.levels.${l.key}`, l.label)}</option>
                ))}
                <option value="devil" disabled>{t('menu.ai.levels.devil', '👾 高階')}</option>
              </select>
            </label>
            <div className="flex gap-4 justify-center w-full">
              <GameButton
                onClick={() => { setAiLevel(selectedLevel); setAiSide('B'); setMode('ai') }}
                className="!bg-rose-400 !dark:!bg-rose-500 !text-white !shadow-lg hover:!bg-rose-500 hover:!dark:bg-rose-400 focus:!ring-rose-400 focus:!dark:ring-rose-300 transition-colors px-4 py-2 text-base font-semibold"
              >{t('menu.ai.first', '🐰 先手')}</GameButton>
              <GameButton
                onClick={() => {
                  const side = Math.random() < 0.5 ? 'B' : 'R'
                  setAiLevel(selectedLevel)
                  setAiSide(side)
                  setMode('ai')
                }}
                className="px-4 py-2 text-base font-semibold"
                ariaLabel={t('menu.ai.random', '隨機先後手')}
              >{t('menu.ai.random', '🎲 隨機')}</GameButton>
              <GameButton
                onClick={() => { setAiLevel(selectedLevel); setAiSide('R'); setMode('ai') }}
                className="!bg-indigo-500 !dark:!bg-indigo-400 !text-white !shadow-lg hover:!bg-indigo-600 hover:!dark:bg-indigo-300 focus:!ring-indigo-400 focus:!dark:ring-indigo-300 transition-colors px-4 py-2 text-base font-semibold"
              >{t('menu.ai.second', '🐢 後手')}</GameButton>
            </div>
          </div>
          <GameButton
            onClick={() => setShowAiSelect(false)}
            className="mt-2 !bg-transparent !shadow-none !border-0 text-sm text-zinc-500 hover:underline hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            text
          >{t('menu.ai.back', '返回')}</GameButton>
        </div>
      </div>
      <div className="w-full flex justify-center mt-6 animate-fade-in">
        <GameButton onClick={() => setShowRule(true)} text ariaLabel={t('menu.rule', '遊戲規則')}>
          {t('menu.rule', '遊戲規則')}
        </GameButton>
      </div>
    </div>
  )
}
