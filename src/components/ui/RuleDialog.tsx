import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './GameButton'
import type { RuleDialogProps } from '@/lib/componentProps'

export default function RuleDialog({ open, onClose }: RuleDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => {
      if (open) onClose()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [open, onClose])

  useEffect(() => {
    if (open) setVisible(true)
    else setVisible(false)
  }, [open])

  const ruleText = t('rule.content')

  return (
    open && (
      <dialog
        ref={dialogRef}
        open={visible}
        className="fixed left-0 top-0 w-full h-full z-[100] p-0 border-0 bg-transparent flex items-center justify-center"
        style={{ padding: 0 }}
      >
        <div className="fixed inset-0 bg-black/40 z-0" />
        <div className="relative max-w-2xl w-[90vw] rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 animate-fade-in">
          <div className="text-lg font-extrabold mb-1 text-center tracking-tight px-6 py-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-zinc-800 rounded-t-2xl">
            {t('rule.title', 'Game Rules')}
          </div>
          <div className="mb-2 text-base text-zinc-800 dark:text-zinc-100 text-left whitespace-pre-line px-6 pb-6 overflow-y-auto h-[60vh]">
            <p dangerouslySetInnerHTML={{ __html: ruleText }} />
          </div>
          <div className="flex gap-4 justify-center mt-2 px-6 py-4 bg-white dark:bg-zinc-900 z-10 border-t border-zinc-100 dark:border-zinc-800 rounded-b-2xl">
            <GameButton onClick={onClose} ariaLabel={t('rule.close', 'Close')}>
              {t('rule.close', 'Close')}
            </GameButton>
          </div>
        </div>
      </dialog>
    )
  )
}
