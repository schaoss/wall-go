import { useRef, useEffect, useState } from 'react'
import GameButton from './GameButton'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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

  // 關閉時觸發 onCancel
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => {
      if (open) onCancel()
    }
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [open, onCancel])

  useEffect(() => {
    if (open) setVisible(true)
    else setVisible(false)
  }, [open])

  return (
    open && (
      <dialog
        ref={dialogRef}
        open={visible}
        className="fixed left-0 top-0 w-full h-full z-[100] p-0 border-0 bg-transparent flex items-center justify-center"
        style={{ padding: 0 }}
      >
        <div className="fixed inset-0 bg-black/40 z-0" />
        <div className="relative max-w-xs w-[90vw] rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 animate-fade-in">
          <form method="dialog" className="flex flex-col gap-4 p-6">
            {title && (
              <div className="text-lg font-extrabold mb-1 text-center tracking-tight">{title}</div>
            )}
            <div className="mb-2 whitespace-pre-line text-center text-base">{message}</div>
            <div className="flex gap-4 justify-end mt-2">
              <GameButton onClick={onCancel} ariaLabel="取消">
                {cancelText}
              </GameButton>
              <GameButton onClick={onConfirm} variant="danger" ariaLabel="確定">
                {confirmText}
              </GameButton>
            </div>
          </form>
        </div>
      </dialog>
    )
  )
}
