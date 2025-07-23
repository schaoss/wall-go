import { type Player } from './types'

export interface GameResult {
  finished: boolean
  winner?: Player
  tie?: boolean
  score?: Record<Player, number>
}