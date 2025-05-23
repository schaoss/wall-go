import { useState } from 'react'
import GameButton from './GameButton'

const GAME_MODES = [
  { key: 'pvp', label: '雙人對戰' },
  { key: 'ai', label: '單人 vs AI' },
] as const

type GameMode = typeof GAME_MODES[number]['key']
type AiSide = 'R' | 'B'

export default function GameModeMenu({
  setMode,
  setAiSide,
}: {
  setMode: (m: GameMode) => void
  aiSide: AiSide
  setAiSide: (s: AiSide) => void
}) {
  const [showAiSideSelect, setShowAiSideSelect] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in">Wall Go · 牆壁圍棋</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in min-h-[120px] transition-all duration-500">
        {GAME_MODES.map(m => (
          m.key === 'ai' ? (
            <GameButton
              key={m.key}
              onClick={() => setShowAiSideSelect(true)}
              className="text-lg py-3"
              active={showAiSideSelect}
            >{m.label}</GameButton>
          ) : (
            <GameButton
              key={m.key}
              onClick={() => setMode(m.key as GameMode)}
              className="text-lg py-3"
            >{m.label}</GameButton>
          )
        ))}
      </div>
      <div style={{ minHeight: 120, transition: 'opacity 0.5s, max-height 0.5s, margin 0.5s' }}
        className={
          'w-full flex justify-center' +
          (showAiSideSelect
            ? ' opacity-100 max-h-60 mt-6 flex-col gap-2 items-center animate-fade-in transition-all duration-500'
            : ' opacity-0 max-h-0 overflow-hidden pointer-events-none flex-col gap-2 items-center transition-all duration-500')
        }
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-zinc-700 dark:text-zinc-200 mb-3">選擇你要先手還是後手：</span>
          <div className="flex gap-4 justify-center w-full mb-2">
            <GameButton
              onClick={() => { setAiSide('B'); setMode('ai'); }}
              className="!bg-rose-400 !dark:!bg-rose-500 !text-white !shadow-lg hover:!bg-rose-500 hover:!dark:bg-rose-400 focus:!ring-rose-400 focus:!dark:ring-rose-300 transition-colors"
            >先手</GameButton>
            <GameButton
              onClick={() => { setAiSide('R'); setMode('ai'); }}
              className="!bg-indigo-500 !dark:!bg-indigo-400 !text-white !shadow-lg hover:!bg-indigo-600 hover:!dark:bg-indigo-300 focus:!ring-indigo-400 focus:!dark:ring-indigo-300 transition-colors"
            >後手</GameButton>
          </div>
          <GameButton
            onClick={() => setShowAiSideSelect(false)}
            className="mt-2 !bg-transparent !shadow-none !border-0 text-sm text-zinc-500 hover:underline hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            text
          >返回</GameButton>
        </div>
      </div>
    </div>
  )
}
