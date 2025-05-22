import StatusMessage from './StatusMessage'
import type { GameResult } from '../../utils/checkGameEnd'

interface GameStatusProps {
  phase: string
  skipReason: string | null
  result: GameResult | null
  resetGame: () => void
}

function GameStatus({ phase, skipReason, result, resetGame }: GameStatusProps) {
  if (phase === 'playing' && skipReason === 'noMove') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">無法移動，自動跳過</StatusMessage>
  }
  if (phase === 'playing' && skipReason === 'allBlocked') {
    return <StatusMessage className="bg-yellow-100 dark:bg-yellow-900/70 border border-yellow-300 dark:border-yellow-700">所有玩家皆被堵住，遊戲結束</StatusMessage>
  }
  if (phase === 'finished' && result) {
    return (
      <StatusMessage className="bg-emerald-100 dark:bg-emerald-900/70 border border-emerald-300 dark:border-emerald-700">
        {result.tie ? '平手！' : result.winner ? `勝者：${result.winner}` : null}
        <button
          className="ml-4 px-3 py-1 rounded bg-white/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-100 font-semibold shadow hover:bg-rose-100/80 dark:hover:bg-zinc-700/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-zinc-600"
          onClick={resetGame}
          type="button"
        >再玩一次</button>
      </StatusMessage>
    )
  }
  return null
}

export default GameStatus
