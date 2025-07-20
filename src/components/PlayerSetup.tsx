import { useState } from 'react'
import { GAME_CONFIG } from '@/config/gameConfig'
import GameButton from './ui/GameButton'
import { useTranslation } from 'react-i18next'
import type { Player } from '@/lib/types'

interface PlayerSetupProps {
  onStartGame: (players: Player[], aiAssignments: Record<Player, string>) => void;
}

export default function PlayerSetup({ onStartGame }: PlayerSetupProps) {
  const { t } = useTranslation()
  const [playerCount, setPlayerCount] = useState(2)
  const [aiAssignments, setAiAssignments] = useState<Record<string, string>>({})

  const handleStartGame = () => {
    const players = GAME_CONFIG.extendedPlayers.slice(0, playerCount) as Player[]
    onStartGame(players, aiAssignments as Record<Player, string>)
  }

  const handleAiAssignment = (player: Player, level: string) => {
    setAiAssignments(prev => ({
      ...prev,
      [player]: level
    }))
  }

  const getPlayerColorClass = (player: Player, type: 'bg' | 'border' | 'text') => {
    if (type === 'bg') {
      return player === 'R' ? 'bg-rose-500 dark:bg-rose-400' :
             player === 'B' ? 'bg-indigo-500 dark:bg-indigo-400' :
             player === 'G' ? 'bg-emerald-500 dark:bg-emerald-400' :
             'bg-amber-500 dark:bg-amber-400'
    }
    if (type === 'border') {
      return player === 'R' ? 'border-rose-300 dark:border-rose-500' :
             player === 'B' ? 'border-indigo-300 dark:border-indigo-500' :
             player === 'G' ? 'border-emerald-300 dark:border-emerald-500' :
             'border-amber-300 dark:border-amber-500'
    }
    return player === 'R' ? 'text-rose-500 dark:text-rose-400' :
           player === 'B' ? 'text-indigo-500 dark:text-indigo-400' :
           player === 'G' ? 'text-emerald-500 dark:text-emerald-400' :
           'text-amber-500 dark:text-amber-400'
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
        {t('setup.title', 'Game Setup')}
      </h2>
      
      {/* Player Count Selection */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          {t('setup.players', 'Number of Players')}
        </h3>
        <div className="flex gap-2">
          {[2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                playerCount === count
                  ? 'bg-indigo-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              {count} {t('setup.players', 'Players')}
            </button>
          ))}
        </div>
      </div>

      {/* Individual AI Assignment */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          {t('setup.assignAI', 'Assign Players')}
        </h3>
        <div className="grid gap-3">
          {GAME_CONFIG.extendedPlayers.slice(0, playerCount).map(player => (
            <div key={player} className="flex items-center gap-3">
              <span
                className={`inline-block w-6 h-6 rounded-full ${getPlayerColorClass(player as Player, 'bg')} ${getPlayerColorClass(player as Player, 'border')} shadow-sm`}
              />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 w-8">
                {player}
              </span>
              <select
                value={aiAssignments[player] || ''}
                onChange={e => handleAiAssignment(player as Player, e.target.value)}
                className="px-3 py-1 rounded bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
              >
                <option value="">{t('setup.human', 'Human')}</option>
                <option value="practice">{t('setup.practice', 'Practice AI')}</option>
                <option value="easy">{t('setup.easy', 'Easy AI')}</option>
                <option value="middle">{t('setup.middle', 'Medium AI')}</option>
                <option value="hard">{t('setup.hard', 'Hard AI')}</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <GameButton
        onClick={handleStartGame}
        ariaLabel={t('setup.start', 'Start Game')}
        variant="success"
        className="mt-4"
      >
        {t('setup.start', 'Start Game')}
      </GameButton>
    </div>
  )
}