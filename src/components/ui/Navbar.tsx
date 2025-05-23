// src/components/ui/Navbar.tsx
import GameButton from './GameButton'

export default function Navbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onHome,
  onToggleDark,
  dark,
}: {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onHome: () => void
  onToggleDark: () => void
  dark: boolean
}) {
  return (
    <div className="w-full flex justify-between px-4">
      <div className="flex gap-2 items-center">
        <GameButton
          onClick={onUndo}
          disabled={!canUndo}
          ariaLabel="復原 (Undo)"
        >↶ Undo</GameButton>
        <GameButton
          onClick={onRedo}
          disabled={!canRedo}
          ariaLabel="重做 (Redo)"
        >↷ Redo</GameButton>
      </div>
      <div className="flex gap-2 items-center">
        <GameButton
          onClick={onHome}
          ariaLabel="回到模式選擇"
        >
          <span role="img" aria-label="主選單" className="text-xl">🏠</span>
        </GameButton>
        <GameButton
          onClick={onToggleDark}
          ariaLabel="切換深色/亮色模式"
        >
          <span role="img" aria-label="切換深色/亮色模式" className="text-xl">{dark ? '☀️' : '🌙'}</span>
        </GameButton>
      </div>
    </div>
  )
}
