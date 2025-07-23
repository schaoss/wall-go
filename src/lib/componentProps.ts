/**
 * Centralized component prop types for the Wall Go game
 * This file exports all component prop types for consistent usage across the application
 */

import type { ReactNode } from 'react'
import type { Player, Phase, WallDir, Pos, AiLevel, GameMode, AiSide, Cell } from './types'

// Game component props
export interface GameConfig {
  /** Array of players participating in the game */
  players: Player[]
  /** Game mode configuration */
  gameMode: 'mixed'
  /** AI level assignments for each player */
  aiAssignments: Record<Player, string>
}

/**
 * Props for the main Game component
 */
export interface GameProps {
  /** Configuration object containing players and AI assignments */
  gameConfig: GameConfig
  /** Callback function to return to the main menu */
  onBackToMenu: () => void
  /** Current dark mode state */
  dark: boolean
  /** Function to toggle dark mode */
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
}

// PlayerSetup component props
/**
 * Props for the PlayerSetup component
 */
export interface PlayerSetupProps {
  /** Callback function to start the game with selected configuration */
  onStartGame: (players: Player[], aiAssignments: Record<Player, string>) => void
}

// Board component props
/**
 * Props for the Board component
 */
export interface BoardProps {
  /** 2D array representing the game board state */
  board: Cell[][]
  /** Current game phase (placing, playing, finished) */
  phase: Phase
  /** Current player's turn */
  turn: Player
  /** Currently selected stone position */
  selected: Pos | null
  /** Set of legal moves for the current turn */
  legal: Set<string>
  /** Optional callback to select a stone */
  selectStone?: (pos: Pos) => void
  /** Optional callback to place a stone */
  placeStone?: (pos: Pos) => void
  /** Optional callback to move to a position */
  moveTo?: (pos: Pos) => void
  /** Optional callback to build a wall */
  buildWall?: (pos: Pos, dir: WallDir) => void
}

// Cell component props
/**
 * Props for the Cell component
 */
export interface CellProps {
  /** X coordinate on the board */
  x: number
  /** Y coordinate on the board */
  y: number
  /** Cell data containing stone and wall information */
  cell: Cell
  /** Whether this cell is currently selected */
  isSel: boolean
  /** Whether this cell has keyboard focus */
  isFocus: boolean
  /** Current game phase */
  phase: Phase
  /** Current player's turn */
  turn: Player
  /** Set of legal moves */
  legal: Set<string>
  /** Optional callback to select a stone */
  selectStone?: (pos: Pos) => void
  /** Optional callback to place a stone */
  placeStone?: (pos: Pos) => void
  /** Optional callback to move to a position */
  moveTo?: (pos: Pos) => void
  /** Optional callback to build a wall */
  buildWall?: (pos: Pos, dir: WallDir) => void
  /** Reference to the full board state */
  board: Cell[][]
  /** Size of the board */
  boardSize: number
  /** Owner of this territory (for scoring) */
  territoryOwner?: Player | null
}

// WallButton component props
/**
 * Props for the WallButton component
 */
export interface WallButtonProps {
  /** Direction of the wall to build */
  dir: WallDir
  /** Whether to show this wall button */
  show: boolean
  /** X coordinate of the wall position */
  x: number
  /** Y coordinate of the wall position */
  y: number
  /** Current player's turn */
  turn: Player
  /** Callback to build the wall */
  onBuild: (dir: WallDir) => void
  /** CSS class for the button container */
  btnClass: string
  /** CSS class for the wall visual element */
  divClass: string
}

// UI Components props
/**
 * Props for the GameButton component
 */
export interface GameButtonProps {
  /** Click handler for the button */
  onClick: () => void
  /** Whether the button is disabled */
  disabled?: boolean
  /** Accessibility label for screen readers */
  ariaLabel?: string
  /** Button content */
  children: ReactNode
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
  /** Additional CSS classes */
  className?: string
  /** Whether the button is in active state */
  active?: boolean
  /** Whether to render as text-only button */
  text?: boolean
  /** Button variant for styling */
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Dialog title */
  title?: string
  /** Confirmation message */
  message: string
  /** Text for confirm button */
  confirmText?: string
  /** Text for cancel button */
  cancelText?: string
  /** Callback when confirmed */
  onConfirm: () => void
  /** Callback when cancelled */
  onCancel: () => void
}

/**
 * Props for the RuleDialog component
 */
export interface RuleDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog is closed */
  onClose: () => void
}

/**
 * Props for the StatusMessage component
 */
export interface StatusMessageProps {
  /** Message content to display */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for the TurnTimer component
 */
export interface TurnTimerProps {
  /** Remaining time in milliseconds */
  timeLeft: number
  /** Total time limit in milliseconds */
  timeLimit?: number
  /** Current player's turn */
  turn: Player
  /** Current game phase */
  phase: Phase
}

/**
 * Props for the Navbar component
 */
export interface NavbarProps {
  /** Callback to undo the last move */
  onUndo: () => void
  /** Callback to redo the last undone move */
  onRedo: () => void
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Callback to return to home menu */
  onHome: () => void
  /** Current game phase */
  phase: Phase
  /** Current dark mode state */
  dark: boolean
  /** Function to toggle dark mode */
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
}

/**
 * Props for the GameModeMenu component
 */
export interface GameModeMenuProps {
  /** Callback to set the game mode */
  setMode: (m: GameMode) => void
  /** Callback to set the AI side */
  setAiSide: (s: AiSide) => void
  /** Callback to set the AI level */
  setAiLevel: (l: AiLevel) => void
  /** Callback to show/hide rules */
  setShowRule: (show: boolean) => void
}

/**
 * Props for the LanguageThemeSwitcher component
 */
export interface LanguageThemeSwitcherProps {
  /** Current dark mode state */
  dark: boolean
  /** Function to toggle dark mode */
  setDark: (d: boolean | ((d: boolean) => boolean)) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Props for the Footer component
 */
// Footer component has no props - intentionally empty
export type FooterProps = Record<string, never>
