import GameButton from './GameButton'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'

export default function LanguageThemeSwitcher({
  dark,
  setDark,
  className = '',
}: {
  dark: boolean
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
  className?: string
}) {
  const { i18n } = useTranslation()
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

  const languages = [
    { code: 'zh-Hant', label: '繁體中文' },
    { code: 'en', label: 'English' },
  ]

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <GameButton
        onClick={() => setDark((d: boolean) => !d)}
        ariaLabel="切換深色/亮色模式"
      >
        <span role="img" aria-label="切換深色/亮色模式" className="text-xl">{dark ? '☀️' : '🌙'}</span>
      </GameButton>

      <div className="relative" ref={selectRef}>
        <GameButton
          onClick={() => setOpen((o: boolean) => !o)}
          ariaLabel="切換語言"
          className="flex items-center gap-1 px-3 py-1 text-base"
          text={false}
        >
          <span role="img" aria-label="語言" className="text-xl">🌏</span>
        </GameButton>
        {open && (
          <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-lg z-50 animate-fade-in">
            {languages.map(lang => (
              <button
                key={lang.code}
                className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-800 dark:text-zinc-100 cursor-pointer"
                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false) }}
                disabled={i18n.language === lang.code}
              >{lang.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
