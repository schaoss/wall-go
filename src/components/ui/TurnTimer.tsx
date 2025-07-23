import { playerColorClass } from '@/lib/color'
import type { TurnTimerProps } from '@/lib/componentProps'

export default function TurnTimer({
  timeLeft,
  timeLimit = 90000,
  turn,
  phase,
}: TurnTimerProps) {
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
