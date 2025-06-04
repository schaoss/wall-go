import { playerColorClass } from '@/lib/color'
import type { Player } from '@/lib/types'

export default function TurnTimer({
  timeLeft,
  timeLimit = 90000,
  turn,
}: {
  timeLeft: number
  timeLimit?: number
  turn: Player
}) {
  const widthPercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100))
  return (
    <div className="w-full h-1 bg-transparent overflow-hidden">
      <div
        className={`${playerColorClass(turn)} h-full transition-all duration-100 ml-auto`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  )
}
