import GameButton from './GameButton'

const GAME_MODES = [
  { key: 'pvp', label: '雙人對戰' },
  { key: 'ai', label: '單人 vs AI' },
] as const

type GameMode = typeof GAME_MODES[number]['key']
type AiSide = 'R' | 'B'

export default function GameModeMenu({
  mode,
  setMode,
  aiSide,
  setAiSide,
}: {
  mode: GameMode | null
  setMode: (m: GameMode) => void
  aiSide: AiSide
  setAiSide: (s: AiSide) => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gradient-to-br from-rose-50 via-indigo-50 to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-4">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-800 dark:text-zinc-100 drop-shadow animate-fade-in">Wall Go · 牆壁圍棋</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in">
        {GAME_MODES.map(m => (
          <GameButton
            key={m.key}
            onClick={() => setMode(m.key as GameMode)}
            className="text-lg py-3"
          >{m.label}</GameButton>
        ))}
      </div>
      {mode === 'ai' && (
        <div className="mt-6 flex flex-col gap-2 items-center">
          <span className="text-zinc-700 dark:text-zinc-200">選擇你要先手還是後手：</span>
          <div className="flex gap-4">
            <GameButton
              onClick={() => setAiSide('B')}
              className={aiSide === 'B' ? '!bg-rose-200 !dark:!bg-rose-800' : ''}
            >我先手（紅）</GameButton>
            <GameButton
              onClick={() => setAiSide('R')}
              className={aiSide === 'R' ? '!bg-indigo-200 !dark:!bg-indigo-800' : ''}
            >我後手（藍）</GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
