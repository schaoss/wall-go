import { useRef, useEffect } from 'react'
import { COLOR } from '../../lib/colors'

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

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] rounded-2xl shadow-2xl p-0 border-0 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 max-w-xs w-[90vw] animate-fade-in backdrop:bg-black/30"
      style={{ padding: 0 }}
    >
      <form method="dialog" className="flex flex-col gap-4 p-6">
        {title && <div className="text-lg font-extrabold mb-1 text-center tracking-tight">{title}</div>}
        <div className="mb-2 whitespace-pre-line text-center text-base">{message}</div>
        <div className="flex gap-4 justify-end mt-2">
          <button
            type="button"
            className={`px-4 py-1 rounded font-semibold border transition ${COLOR.neutral}`}
            onClick={onCancel}
            autoFocus
          >{cancelText}</button>
          <button
            type="button"
            className={`px-4 py-1 rounded font-semibold border transition shadow ${COLOR.danger}`}
            onClick={onConfirm}
          >{confirmText}</button>
        </div>
      </form>
    </dialog>
  )
}
