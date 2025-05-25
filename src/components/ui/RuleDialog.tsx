import { useRef, useEffect, useState } from 'react'
import GameButton from './GameButton'

interface RuleDialogProps {
  open: boolean
  onClose: () => void
}

export default function RuleDialog({ open, onClose }: RuleDialogProps) {
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

  const ruleText = `【遊戲目標】
在 7×7 棋盤上移動棋子並建造牆壁，劃分自己的「領地」（封閉且只包含本方棋子的區域）。遊戲結束時計算各玩家領地內的格子數，格數多者獲勝。

【棋具與人數】
・棋盤：7×7 格  
・玩家：2 人（紅、藍），各 4 枚棋子  
・牆壁：不限數量，分屬玩家顏色  

【遊戲流程】
一、擺子階段  
雙方依 紅、藍、藍、紅、紅、... 順序輪流放完 4 枚棋子。  

二、行動階段（輪流進行）  
1. 選擇己方任一仍可行動的棋子。  
2. 移動 0、1 或 2 步；每步僅能上下左右，不能穿牆、越牆，亦不能穿過其他棋子。  
3. 移動結束後，必須在該棋子四周仍無牆的位置放置一段牆（0 步亦同）。  

【牆壁與邊界】
・棋盤邊框視為牆壁。  
・雙人遊戲牆壁放置後不可拆除。  

【終局條件】
棋盤上所有封閉區域皆僅含單一玩家棋子。  

【計分方式】
計算領地的格子數，每格一分。

【勝負判定】
分數高者勝；若分數相同則平局。  

── 祝遊戲愉快！
`

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
          <div className="text-lg font-extrabold mb-1 text-center tracking-tight px-6 py-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-zinc-800 rounded-t-2xl">遊戲規則說明</div>
          <div className="mb-2 text-base text-zinc-800 dark:text-zinc-100 text-left whitespace-pre-line px-6 pb-6 overflow-y-auto h-[60vh]">
            {ruleText}
          </div>
          <div className="flex gap-4 justify-center mt-2 px-6 py-4 bg-white dark:bg-zinc-900 z-10 border-t border-zinc-100 dark:border-zinc-800 rounded-b-2xl">
            <GameButton
              onClick={onClose}
              ariaLabel="關閉規則說明"
            >關閉</GameButton>
          </div>
        </div>
      </dialog>
    )
  )
}
