import { playerColorClass } from '@/lib/color'
import type { Phase, Player } from '@/lib/types'

export default function TurnTimer({
  timeLeft,
  timeLimit = 90000,
  turn,
  phase,
}: {
  timeLeft: number
  timeLimit?: number
  turn: Player
  phase: Phase
}) {
  const widthPercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100))
  return (
    <div className="fixed top-0 w-full h-1 bg-transparent overflow-hidden">
      <div
        className={
          `${phase === 'playing' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ` +
          `${playerColorClass(turn)} h-full transition-all duration-100 mr-auto rounded-lg`
        }
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  )
}
