# Wall‑Go 🧱♟️

Minimalist React + TypeScript implementation of the “Wall Go / 牆壁圍棋” mini-game (as seen in Devil’s Plan 2).

- 7×7 board, 0–2 step movement, wall building, ABBA stone placement, auto endgame and scoring
- Robust undo/redo (Zustand, deep copy snapshots, time travel)
- Fully unit-tested state logic
- Modern UI (Tailwind CSS v4)
- Static build for GitHub Pages or any static host

---

## Tech Stack

- **React 19** / **TypeScript**
- **Zustand** (state, undo/redo)
- **Vite** (build)
- **Tailwind CSS v4** (UI)
- **Bun** (dev server, package manager)
- **Vitest** (unit tests)

---

## Undo/Redo & State Management

- Every mutation pushes a deep copy of the state to history before mutation (see `src/store/index.ts`).
- Undo/redo is robust, bug-free, and covered by unit tests (`src/store/gameStore.test.ts`).
- All state mutations are performed on deep copies to guarantee history isolation.

---

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) and play!

---

## Customization

- **Board size:** `BOARD_SIZE` in `src/lib/types.ts`
- **Player colors:** `playerColorClass()` in `src/lib/color.ts` + Tailwind safelist
- **Stones per player:** `STONES_PER_PLAYER` in `src/lib/types.ts`
- **Add players:** Edit `PLAYER_LIST` in `src/lib/types.ts`

---

## License

MIT © 2025 Gary Chu
