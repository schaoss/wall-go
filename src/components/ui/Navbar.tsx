// src/components/ui/Navbar.tsx
import GameButton from './GameButton'
import type { NavbarProps } from '@/lib/componentProps'
import LanguageThemeSwitcher from './LanguageThemeSwitcher'
import { useTranslation } from 'react-i18next'

export default function Navbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onHome,
  phase,
  dark,
  setDark,
}: NavbarProps) {
  const { t } = useTranslation()
  return (
    <div className="w-full flex justify-between transition-all duration-500">
      <div className="flex gap-2 items-center">
        <GameButton
          onClick={onUndo}
          disabled={!canUndo || phase === 'finished'}
          ariaLabel={t('nav.undoAria', 'Undo')}
        >
          ↶ {t('nav.undo', 'Undo')}
        </GameButton>
        <GameButton
          onClick={onRedo}
          disabled={!canRedo || phase === 'finished'}
          ariaLabel={t('nav.redoAria', 'Redo')}
        >
          ↷ {t('nav.redo', 'Redo')}
        </GameButton>
      </div>
      <div className="flex gap-2 items-center">
        <GameButton onClick={onHome} ariaLabel={t('nav.menu', 'Menu')}>
          <span role="img" aria-label={t('nav.menu', 'Menu')} className="text-xl">
            🏠
          </span>
        </GameButton>
        <LanguageThemeSwitcher dark={dark} setDark={setDark} />
      </div>
    </div>
  )
}
