# Multiplayer Mode Implementation

## Context

### Original Request

"Continue completing multiplayer mode".

### Interview Summary

- **Architecture**: Central Authoritative Server (Node.js + Socket.io).
- **Structure**: Simple `server/` directory in root, importing logic from `../src`.
- **Auth**: Stateless/Nickname-based (no database).
- **Logic**: Pure TS logic in `src/utils` verified to be reusable.

### Metis Review (Simulated)

- **Guardrail**: Server must enforce the 90s timer, not just the client.
- **Guardrail**: Handle basic reconnects via `roomId` + `nickname`.
- **Scope**: No persistent stats, no chat, no global lobby list (Direct ID join).
- **Tech**: Use `tsx` for seamless ESM/TS execution of shared code.

---

## Work Objectives

### Core Objective

Enable online PvP by implementing a Socket.io server that validates moves using existing game logic and synchronizes state to clients.

### Concrete Deliverables

- `server/` directory with `package.json` and `server.ts`.
- `MultiplayerStore` in frontend (Zustand).
- UI: "Online Mode" menu -> "Create/Join Room" -> Game.

### Definition of Done

- [ ] User can create a room and get a Room ID.
- [ ] Second user can join with Room ID.
- [ ] Moves are synchronized between browsers.
- [ ] Invalid moves (checked by server) are rejected.
- [ ] Win condition ends the game for both players.

### Must Have

- Authoritative state (Server is source of truth).
- Turn timer enforcement on server.
- Nickname display.

### Must NOT Have (Guardrails)

- Chat system (Out of scope).
- User accounts/Database.
- Spectator mode.

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: Yes (Vitest).
- **Strategy**:
  - **Unit Tests**: Add tests for `server/room.ts` (game flow logic).
  - **Manual Verification**: Vital for WebSocket interactions.

### Verification Procedures

**1. Server Logic (TUI)**

- Run `cd server && npm test` (or equivalent).
- Verify room creation, joining, and state updates in isolation.

**2. End-to-End (Browser)**

- Open Browser A (Chrome) and Browser B (Firefox).
- A: Create Room -> Copy ID.
- B: Join Room [ID] -> Enter.
- A: Move -> Verify B updates.
- B: Move -> Verify A updates.
- Disconnect A -> Verify B gets "Opponent Disconnected" message.

---

## Task Flow

```
Setup Server → Shared Logic Bridge → Room Manager
                                        ↓
Frontend UI → Socket Integration → Game Loop Hook
```

---

## TODOs

- [ ] 1. Setup Server Directory & Config
     **What to do**:
  - Create `server/` directory.
  - Initialize `package.json` (deps: `socket.io`, `express`, `tsx`, `cors`).
  - Create `tsconfig.server.json` to allow importing `../src`.
  - Create basic `server/index.ts` that runs.
    **Verification**:
  - `cd server && npm start` -> Logs "Server running on 3000".

- [ ] 2. Implement Room Manager (Server)
     **What to do**:
  - Create `server/roomManager.ts`.
  - Logic to Map `roomId` -> `GameSnapshot`.
  - Implement `createRoom()`, `joinRoom()`, `leaveRoom()`.
  - **Import Types**: Import `GameSnapshot`, `Player` from `../src/lib/types`.
    **Verification**:
  - Create a test file `server/test/room.test.ts`.
  - Run with `vitest` (or `bun test` if available, else `tsx`).

- [ ] 3. Integrate Game Logic (Server)
     **What to do**:
  - Import `makeInitialState`, `checkGameEnd` from `../src/utils`.
  - Implement `handleMove(roomId, move)`:
    - Validate move (is it legal?).
    - Update state.
    - Switch turn.
    - Check win condition.
  - Implement `handleTimeout(roomId)` for 90s timer.
    **Reference**: `src/store/index.ts` (matches frontend logic).
    **Verification**:
  - Test valid move -> State updates.
  - Test invalid move -> Rejected.

- [ ] 4. Setup Socket.io Events
     **What to do**:
  - In `server/index.ts`, handle events:
    - `join_room`
    - `place_stone` / `move_stone`
    - `disconnect`
  - Emit events:
    - `game_start`
    - `state_update`
    - `error`
      **Verification**:
  - Use `wscat` or Postman WebSocket to connect and send events.

- [ ] 5. Frontend: Socket Store & Client
     **What to do**:
  - Install `socket.io-client` in root.
  - Create `src/store/multiplayerStore.ts` (Zustand).
  - Manage connection state (`connected`, `roomID`, `isMyTurn`).
    **Verification**:
  - Console log "Connected to server" in browser.

- [ ] 6. Frontend: Lobby UI
     **What to do**:
  - Create `src/components/MultiplayerMenu.tsx`.
  - Inputs: Nickname, Room ID (for joining).
  - Buttons: "Create Room", "Join Room".
  - Integrate into `GameModeMenu.tsx`.
    **Verification**:
  - UI appears. Clicking Create returns a Room ID (mocked or real).

- [ ] 7. Frontend: Game Loop Integration
     **What to do**:
  - Modify `Game.tsx` or create `MultiplayerGame.tsx`.
  - If `mode === 'online'`, ignore local clicks if not my turn.
  - Send moves to server instead of `gameStore.dispatch`.
  - Listen for `state_update` to call `gameStore.sync(newState)`.
    **Verification**:
  - Browser A moves -> Server -> Browser B updates.

- [ ] 8. Handle Disconnects & Errors
     **What to do**:
  - Show "Opponent disconnected" modal.
  - Handle "Room full" or "Game does not exist" errors.
    **Verification**:
  - Close tab A -> Tab B shows alert.

---

## Success Criteria

- [ ] `cd server && npm start` runs without errors.
- [ ] Frontend can connect to backend.
- [ ] Full game cycle (Start -> Move -> Win) works online.
