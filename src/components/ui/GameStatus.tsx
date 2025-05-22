import StatusMessage from './StatusMessage'

interface GameStatusProps {
  phase: string
  skipReason: string | null
}

function GameStatus({ phase, skipReason }: GameStatusProps) {
  if (phase === 'playing' && skipReason === 'noMove') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">無法移動，自動跳過</StatusMessage>
  }
  if (phase === 'playing' && skipReason === 'allBlocked') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">所有玩家皆被堵住，遊戲結束</StatusMessage>
  }
  // 結算階段的勝者顯示與再玩一次按鈕已移至 App.tsx
  return null
}

export default GameStatus
