import { create } from 'zustand'
import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import {
  type Player,
  type GameSnapshot,
  type Pos,
  type WallDir,
  type Cell,
  PLAYER_LIST,
  STONES_PER_PLAYER,
} from '@/lib/types'
import { snapshotFromState, set2PlayerDefaultBoard, createEmptyBoard } from './gameState'
import { isLegalMove, getPath } from '@/utils/move'
import { checkGameEnd } from '@/utils/game'
import { placingTurnIndex, advanceTurn } from './actions'

export interface RoomPlayerInfo {
  nickname: string
  player: Player
  connected: boolean
}

type MessageType =
  | { type: 'join'; nickname: string }
  | {
      type: 'welcome'
      player: Player
      gameState: SerializedGameSnapshot
      players: RoomPlayerInfo[]
    }
  | { type: 'state_update'; gameState: SerializedGameSnapshot; players: RoomPlayerInfo[] }
  | { type: 'action'; action: GameAction }

type GameAction =
  | { type: 'place_stone'; pos: Pos }
  | { type: 'select_stone'; pos: Pos }
  | { type: 'move_to'; pos: Pos }
  | { type: 'build_wall'; pos: Pos; dir: WallDir }

export interface SerializedGameSnapshot {
  board: Cell[][]
  turn: Player
  selected?: Pos
  legal: string[]
  stepsTaken: number
  phase: 'selecting' | 'placing' | 'playing' | 'finished'
  players: Player[]
  stonesLimit: number
  stonesPlaced: Record<Player, number>
  result?: {
    finished: boolean
    winner?: Player
    tie?: boolean
    score?: Record<Player, number>
  }
  skipReason?: string
  wallBreaks?: Record<Player, number>
}

interface MultiplayerState {
  peer: Peer | null
  connection: DataConnection | null
  connections: DataConnection[]
  connected: boolean
  isHost: boolean
  roomId: string | null
  nickname: string
  myPlayer: Player | null
  roomPlayers: RoomPlayerInfo[]
  gameState: GameSnapshot | null
  error: string | null
  gameStarted: boolean
  opponentDisconnected: boolean

  initPeer: () => Promise<string>
  createRoom: (nickname: string, maxPlayers?: number) => Promise<void>
  joinRoom: (roomId: string, nickname: string) => void
  leaveRoom: () => void

  selectStone: (pos: Pos) => void
  moveTo: (pos: Pos) => void
  buildWall: (pos: Pos, dir: WallDir) => void
  placeStone: (pos: Pos) => void

  clearError: () => void
  reset: () => void
}

function serializeGameState(state: GameSnapshot): SerializedGameSnapshot {
  return {
    ...state,
    legal: Array.from(state.legal),
  }
}

function deserializeGameState(data: SerializedGameSnapshot): GameSnapshot {
  return {
    ...data,
    legal: new Set(data.legal),
  }
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createInitialGameState(maxPlayers: number): GameSnapshot {
  const players = PLAYER_LIST.slice(0, maxPlayers) as Player[]
  let board = createEmptyBoard()
  const is2P = maxPlayers === 2

  if (is2P) {
    board = set2PlayerDefaultBoard(board)
  }

  const stonesLimit = STONES_PER_PLAYER[maxPlayers as 2 | 3 | 4]

  return {
    board,
    turn: 'R',
    selected: undefined,
    legal: new Set<string>(),
    stepsTaken: 0,
    phase: 'placing',
    players,
    stonesLimit,
    stonesPlaced: Object.fromEntries(players.map((p) => [p, is2P ? 2 : 0])) as Record<
      Player,
      number
    >,
    wallBreaks: Object.fromEntries(players.map((p) => [p, 1])) as Record<Player, number>,
  }
}

const PEER_PREFIX = 'WALL-GO-V1-'

export const useMultiplayer = create<MultiplayerState>((set, get) => ({
  peer: null,
  connection: null,
  connections: [],
  connected: false,
  isHost: false,
  roomId: null,
  nickname: '',
  myPlayer: null,
  roomPlayers: [],
  gameState: null,
  error: null,
  gameStarted: false,
  opponentDisconnected: false,

  initPeer: () => {
    return new Promise((resolve, reject) => {
      const existingPeer = get().peer
      if (existingPeer && !existingPeer.destroyed) {
        resolve(existingPeer.id)
        return
      }

      const peer = new Peer()

      peer.on('open', (id) => {
        set({ peer, connected: true, error: null })
        resolve(id)
      })

      peer.on('error', (err) => {
        console.error('PeerJS error:', err)
        set({ error: err.type })
        if (
          ['browser-incompatible', 'disconnected', 'invalid-id', 'ssl-unavailable'].includes(
            err.type,
          )
        ) {
          reject(err)
        }
      })

      peer.on('disconnected', () => {
        set({ connected: false })
      })
    })
  },

  createRoom: async (nickname: string, maxPlayers: number = 2) => {
    const { peer: oldPeer } = get()
    if (oldPeer) oldPeer.destroy()

    const roomId = generateRoomId()
    const fullPeerId = `${PEER_PREFIX}${roomId}`
    const gameState = createInitialGameState(maxPlayers)
    const roomPlayers: RoomPlayerInfo[] = [{ nickname, player: 'R', connected: true }]

    const peer = new Peer(fullPeerId)

    peer.on('open', () => {
      set({
        peer,
        connected: true,
        isHost: true,
        roomId,
        nickname,
        myPlayer: 'R',
        roomPlayers,
        gameState,
        gameStarted: false,
        error: null,
        connections: [],
      })
    })

    peer.on('error', (err) => {
      console.error('PeerJS error in host:', err)
      if (err.type === 'unavailable-id') {
        get().createRoom(nickname, maxPlayers)
      } else {
        set({ error: err.type })
      }
    })

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        addConnection(conn)
        const state = get()
        const maxP = state.gameState?.players.length || 2

        if (state.roomPlayers.length >= maxP) {
          conn.close()
          removeConnection(conn)
          return
        }

        const metadata = (conn.metadata ?? {}) as { nickname?: string }
        const nicknameFromConn = metadata.nickname?.trim() || 'Guest'
        const nextPlayerColor = PLAYER_LIST[state.roomPlayers.length]
        const updatedPlayers: RoomPlayerInfo[] = [
          ...state.roomPlayers,
          { nickname: nicknameFromConn, player: nextPlayerColor, connected: true },
        ]
        const isFull = updatedPlayers.length === maxP

        set({
          roomPlayers: updatedPlayers,
          gameStarted: isFull,
          opponentDisconnected: false,
        })

        conn.send({
          type: 'welcome',
          player: nextPlayerColor,
          gameState: serializeGameState(state.gameState!),
          players: updatedPlayers,
        } as MessageType)

        broadcast({
          type: 'state_update',
          gameState: serializeGameState(state.gameState!),
          players: updatedPlayers,
        })
      })

      conn.on('data', (data) => {
        const msg = data as MessageType
        if (msg.type === 'action') {
          const state = get()
          if (!state.gameStarted) return
          handleAction(msg.action)
        }
      })

      conn.on('close', () => {
        set({ opponentDisconnected: true })
        removeConnection(conn)
      })
    })

    function handleAction(action: GameAction) {
      const state = get()
      if (!state.gameState) return

      let newState: GameSnapshot | null = null

      switch (action.type) {
        case 'place_stone':
          newState = applyPlaceStone(state.gameState, action.pos)
          break
        case 'select_stone':
          newState = applySelectStone(state.gameState, action.pos)
          break
        case 'move_to':
          newState = applyMoveTo(state.gameState, action.pos)
          break
        case 'build_wall':
          newState = applyBuildWall(state.gameState, action.pos, action.dir)
          break
      }

      if (newState) {
        set({ gameState: newState })
        broadcast({
          type: 'state_update',
          gameState: serializeGameState(newState),
          players: get().roomPlayers,
        })
      }
    }
  },

  joinRoom: (roomIdInput: string, nickname: string) => {
    const { peer } = get()
    if (!peer) return

    set({ nickname, error: null, roomId: roomIdInput })

    const hostPeerId = `${PEER_PREFIX}${roomIdInput}`
    const conn = peer.connect(hostPeerId, { metadata: { nickname } })

    conn.on('open', () => {
      set({ connection: conn, roomId: roomIdInput })
    })

    conn.on('data', (data) => {
      const msg = data as MessageType
      if (msg.type === 'welcome') {
        set({
          isHost: false,
          myPlayer: msg.player,
          gameState: deserializeGameState(msg.gameState),
          roomPlayers: msg.players,
          gameStarted: msg.players.length === msg.gameState.players.length,
          opponentDisconnected: false,
        })
      } else if (msg.type === 'state_update') {
        const newState = deserializeGameState(msg.gameState)
        set({
          gameState: newState,
          roomPlayers: msg.players,
          gameStarted: msg.players.length === newState.players.length,
        })
      }
    })

    conn.on('close', () => {
      set({ opponentDisconnected: true })
    })

    conn.on('error', (err) => {
      console.error('Connection error:', err)
      set({ error: 'CONNECTION_FAILED' })
    })
  },

  leaveRoom: () => {
    const { peer, connection, connections } = get()
    if (connection) connection.close()
    if (connections) {
      connections.forEach((c) => c.close())
    }
    if (peer) peer.destroy()
    set({
      peer: null,
      connection: null,
      connections: [],
      connected: false,
      isHost: false,
      roomId: null,
      myPlayer: null,
      roomPlayers: [],
      gameState: null,
      gameStarted: false,
      opponentDisconnected: false,
    })
  },

  selectStone: (pos: Pos) => {
    const { isHost, connection, gameState, myPlayer } = get()
    if (!gameState || gameState.turn !== myPlayer) return

    if (isHost) {
      const newState = applySelectStone(gameState, pos)
      if (newState) {
        set({ gameState: newState })
        broadcast({
          type: 'state_update',
          gameState: serializeGameState(newState),
          players: get().roomPlayers,
        })
      }
    } else if (connection) {
      connection.send({ type: 'action', action: { type: 'select_stone', pos } } as MessageType)
    }
  },

  moveTo: (pos: Pos) => {
    const { isHost, connection, gameState, myPlayer } = get()
    if (!gameState || gameState.turn !== myPlayer) return

    if (isHost) {
      const newState = applyMoveTo(gameState, pos)
      if (newState) {
        set({ gameState: newState })
        broadcast({
          type: 'state_update',
          gameState: serializeGameState(newState),
          players: get().roomPlayers,
        })
      }
    } else if (connection) {
      connection.send({ type: 'action', action: { type: 'move_to', pos } } as MessageType)
    }
  },

  buildWall: (pos: Pos, dir: WallDir) => {
    const { isHost, connection, gameState, myPlayer } = get()
    if (!gameState || gameState.turn !== myPlayer) return

    if (isHost) {
      const newState = applyBuildWall(gameState, pos, dir)
      if (newState) {
        set({ gameState: newState })
        broadcast({
          type: 'state_update',
          gameState: serializeGameState(newState),
          players: get().roomPlayers,
        })
      }
    } else if (connection) {
      connection.send({ type: 'action', action: { type: 'build_wall', pos, dir } } as MessageType)
    }
  },

  placeStone: (pos: Pos) => {
    const { isHost, connection, gameState, myPlayer } = get()
    if (!gameState || gameState.turn !== myPlayer) return

    if (isHost) {
      const newState = applyPlaceStone(gameState, pos)
      if (newState) {
        set({ gameState: newState })
        broadcast({
          type: 'state_update',
          gameState: serializeGameState(newState),
          players: get().roomPlayers,
        })
      }
    } else if (connection) {
      connection.send({ type: 'action', action: { type: 'place_stone', pos } } as MessageType)
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    const { peer, connection, connections } = get()
    if (connection) connection.close()
    if (connections) connections.forEach((c) => c.close())
    if (peer) peer.destroy()
    set({
      peer: null,
      connection: null,
      connections: [],
      connected: false,
      isHost: false,
      roomId: null,
      nickname: '',
      myPlayer: null,
      roomPlayers: [],
      gameState: null,
      error: null,
      gameStarted: false,
      opponentDisconnected: false,
    })
  },
}))

function applyPlaceStone(state: GameSnapshot, pos: Pos): GameSnapshot | null {
  const { board, players, stonesPlaced, stonesLimit, phase } = state
  if (phase !== 'placing') return null
  const totalPlaced = Object.values(stonesPlaced).reduce((a, b) => a + b, 0)
  const currentIdx = placingTurnIndex(totalPlaced, players.length)
  const currentPlayer = players[currentIdx]
  if (board[pos.y][pos.x].stone) return null

  const next = snapshotFromState(state)
  next.board[pos.y][pos.x].stone = currentPlayer
  next.stonesPlaced[currentPlayer]++
  const newTotal = totalPlaced + 1
  const nextIdx = placingTurnIndex(newTotal, players.length)
  const nextPlayer = players[nextIdx]
  const allDone = Object.values(next.stonesPlaced).every((c) => c === stonesLimit)
  next.turn = nextPlayer
  next.phase = allDone ? 'playing' : 'placing'
  next.selected = undefined
  next.legal = new Set<string>()
  next.stepsTaken = 0
  return next
}

function applySelectStone(state: GameSnapshot, pos: Pos): GameSnapshot | null {
  const { board, turn, stepsTaken, phase } = state
  if (phase !== 'playing') return null
  if (stepsTaken > 0) return null
  if (board[pos.y][pos.x].stone !== turn) return null

  const legal = new Set<string>()
  for (let yy = 0; yy < board.length; yy++) {
    for (let xx = 0; xx < board.length; xx++) {
      if (isLegalMove(pos, { x: xx, y: yy }, board, 2, false)) {
        legal.add(`${xx},${yy}`)
      }
    }
  }

  return {
    ...state,
    selected: pos,
    legal,
    stepsTaken: 0,
  }
}

function applyMoveTo(state: GameSnapshot, to: Pos): GameSnapshot | null {
  const { selected, board, legal, stepsTaken, phase } = state
  if (phase !== 'playing') return null
  if (!selected) return null
  if (!legal.has(`${to.x},${to.y}`)) return null
  const piece = board[selected.y][selected.x].stone
  if (!piece) return null

  const next = snapshotFromState(state)
  next.board[selected.y][selected.x].stone = null
  next.board[to.y][to.x].stone = piece

  const pathResult = getPath(selected, to, state.board, 2)
  const actualSteps = pathResult
    ? pathResult.path.length
    : stepsTaken + Math.abs(to.x - selected.x) + Math.abs(to.y - selected.y)

  const nextLegal = new Set<string>()
  if (actualSteps < 2) {
    for (let yy = 0; yy < next.board.length; yy++) {
      for (let xx = 0; xx < next.board.length; xx++) {
        if (isLegalMove(to, { x: xx, y: yy }, next.board, 2 - actualSteps, false)) {
          nextLegal.add(`${xx},${yy}`)
        }
      }
    }
  }

  next.selected = to
  next.legal = nextLegal
  next.stepsTaken = actualSteps
  return next
}

function applyBuildWall(state: GameSnapshot, pos: Pos, dir: WallDir): GameSnapshot | null {
  const { board, turn, selected, phase, players } = state
  if (phase !== 'playing') return null
  if (!selected || selected.x !== pos.x || selected.y !== pos.y) return null

  if (dir === 'top') {
    if (pos.y === 0 || board[pos.y][pos.x].wallTop !== null) return null
  } else if (dir === 'left') {
    if (pos.x === 0 || board[pos.y][pos.x].wallLeft !== null) return null
  } else if (dir === 'right') {
    if (pos.x + 1 >= board.length || board[pos.y][pos.x + 1].wallLeft !== null) return null
  } else if (dir === 'bottom') {
    if (pos.y + 1 >= board.length || board[pos.y + 1][pos.x].wallTop !== null) return null
  } else {
    return null
  }

  const next = snapshotFromState(state)
  const cell = next.board[pos.y][pos.x]
  if (dir === 'top') {
    cell.wallTop = turn
  } else if (dir === 'left') {
    cell.wallLeft = turn
  } else if (dir === 'right') {
    next.board[pos.y][pos.x + 1].wallLeft = turn
  } else if (dir === 'bottom') {
    next.board[pos.y + 1][pos.x].wallTop = turn
  }

  const end = checkGameEnd(next.board, players)
  if (end.finished) {
    next.phase = 'finished'
    next.result = end
    next.selected = undefined
    next.legal = new Set<string>()
    next.stepsTaken = 0
    return next
  }

  const { turn: nextTurn, skipReason } = advanceTurn(next.board, turn, players)
  if (skipReason === 'allBlocked') {
    const endB = checkGameEnd(next.board, players)
    if (!endB.finished) {
      endB.finished = true
      endB.tie = true
    }
    next.phase = 'finished'
    next.result = endB
    next.selected = undefined
    next.legal = new Set<string>()
    next.stepsTaken = 0
    return next
  }

  next.selected = undefined
  next.turn = nextTurn
  next.legal = new Set<string>()
  next.stepsTaken = 0
  next.skipReason = skipReason
  return next
}

function addConnection(conn: DataConnection) {
  const store = useMultiplayer.getState()
  const conns = store.connections || []
  useMultiplayer.setState({ connections: [...conns, conn] })
}

function removeConnection(conn: DataConnection) {
  const store = useMultiplayer.getState()
  const conns = (store.connections || []).filter((c) => c.peer !== conn.peer)
  useMultiplayer.setState({ connections: conns })
}

function broadcast(msg: MessageType) {
  const store = useMultiplayer.getState()
  const conns = store.connections || []
  conns.forEach((conn) => {
    if (conn.open) conn.send(msg)
  })
}
