// src/lib/colors.ts
// Global semantic color classes (including hover/focus states)
export const COLOR = {
  primary: [
    'bg-indigo-500 text-white border-indigo-400',
    'dark:bg-indigo-600 dark:border-indigo-500',
    'hover:bg-indigo-600 dark:hover:bg-indigo-700',
    'focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700',
  ].join(' '),
  success: [
    'bg-emerald-500 text-white border-emerald-400',
    'dark:bg-emerald-600 dark:border-emerald-500',
    'hover:bg-emerald-600 dark:hover:bg-emerald-700',
    'focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700',
  ].join(' '),
  warning: [
    'bg-amber-500 text-white border-amber-400',
    'dark:bg-amber-600 dark:border-amber-500',
    'hover:bg-amber-600 dark:hover:bg-amber-700',
    'focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700',
  ].join(' '),
  danger: [
    'bg-rose-500 text-white border-rose-400',
    'dark:bg-rose-700 dark:border-rose-600',
    'hover:bg-rose-600 dark:hover:bg-rose-800',
    'focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800',
  ].join(' '),
  neutral: [
    'bg-zinc-100 text-zinc-700 border-zinc-300',
    'dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700',
    'hover:bg-zinc-200 dark:hover:bg-zinc-700',
    'focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700',
  ].join(' '),
}
