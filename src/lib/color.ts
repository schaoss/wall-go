// src/lib/color.ts
// Helper for player color classes (for stones and walls)
import type { Player } from './types'

// Returns { bg, border } classes
export function getPlayerTheme(p: Player) {
  switch (p) {
    case 'R':
      return {
        bg: 'bg-rose-500 dark:bg-rose-400',
        border: 'border-rose-300 dark:border-rose-500',
        text: 'text-rose-600 dark:text-rose-300',
        territory: 'bg-rose-100 dark:bg-rose-900/60',
        ring: 'ring-4 ring-rose-400/60 animate-player-glow-red',
        nameKey: 'game.red',
        nameDef: 'Red',
      }
    case 'B':
      return {
        bg: 'bg-indigo-500 dark:bg-indigo-400',
        border: 'border-indigo-300 dark:border-indigo-500',
        text: 'text-indigo-600 dark:text-indigo-300',
        territory: 'bg-indigo-100 dark:bg-indigo-900/60',
        ring: 'ring-4 ring-indigo-400/60 animate-player-glow-blue',
        nameKey: 'game.blue',
        nameDef: 'Blue',
      }
    case 'Y':
      return {
        bg: 'bg-amber-400 dark:bg-amber-300',
        border: 'border-amber-200 dark:border-amber-400',
        text: 'text-amber-600 dark:text-amber-300',
        territory: 'bg-amber-100 dark:bg-amber-900/60',
        ring: 'ring-4 ring-amber-400/60 animate-player-glow-yellow',
        nameKey: 'game.yellow',
        nameDef: 'Yellow',
      }
    case 'G':
      return {
        bg: 'bg-emerald-500 dark:bg-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-300',
        territory: 'bg-emerald-100 dark:bg-emerald-900/60',
        ring: 'ring-4 ring-emerald-400/60 animate-player-glow-green',
        nameKey: 'game.green',
        nameDef: 'Green',
      }
  }
}

export function playerColorClass(p: Player) {
  return getPlayerTheme(p).bg
}
