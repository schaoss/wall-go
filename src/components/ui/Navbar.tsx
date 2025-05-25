// src/components/ui/Navbar.tsx
import GameButton from './GameButton'
import type { Phase } from '../../lib/types'
import LanguageThemeSwitcher from './LanguageThemeSwitcher'

export default function Navbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onHome,
  phase,
  dark,
  setDark,
}: {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onHome: () => void
  phase: Phase
  dark: boolean
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
}) {
  return (
    <div className="w-full flex justify-between px-4">
      <div className="flex gap-2 items-center">
        <GameButton
          onClick={onUndo}
          disabled={!canUndo || phase === 'finished'}
          ariaLabel="復原 (Undo)"
        >↶ Undo</GameButton>
        <GameButton
          onClick={onRedo}
          disabled={!canRedo || phase === 'finished'}
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
        <LanguageThemeSwitcher dark={dark} setDark={setDark} />
      </div>
    </div>
  )
}
