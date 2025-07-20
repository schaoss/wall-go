import { type Player } from '@/lib/types'

export const GAME_CONFIG = {
  // Default player configuration
  players: ['R', 'B'] as Player[],
  
  // Extended player configuration for 3-4 player games
  extendedPlayers: ['R', 'B', 'G', 'Y'] as Player[],
  
  // Stones per player
  stonesPerPlayer: 2,
  
  // Board size
  boardSize: 7,
  
  // Turn time limit in milliseconds
  turnTimeLimit: 90000,
} as const

// Helper function to get player color classes
export const getPlayerColorClasses = (player: Player): string => {
  switch (player) {
    case 'R':
      return 'bg-rose-500 dark:bg-rose-400 border-rose-300 dark:border-rose-500'
    case 'B':
      return 'bg-indigo-500 dark:bg-indigo-400 border-indigo-300 dark:border-indigo-500'
    case 'G':
      return 'bg-emerald-500 dark:bg-emerald-400 border-emerald-300 dark:border-emerald-500'
    case 'Y':
      return 'bg-amber-500 dark:bg-amber-400 border-amber-300 dark:border-amber-500'
    default:
      return 'bg-gray-500 dark:bg-gray-400 border-gray-300 dark:border-gray-500'
  }
}

// Helper function to get player display name
export const getPlayerDisplayName = (player: Player): string => {
  switch (player) {
    case 'R':
      return 'Red'
    case 'B':
      return 'Blue'
    case 'G':
      return 'Green'
    case 'Y':
      return 'Yellow'
    default:
      return 'Unknown'
  }
}