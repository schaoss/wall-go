# Wall‑Go 🧱♟️
![cover](https://schaoss.github.io/wall-go/cover.png)

> Wall Go (牆壁圍棋) – Open-source React + TypeScript implementation of the Devil’s Plan 2 board game. Supports single-player (AI) and two-player modes, territory scoring, undo/redo, and a modern UI. [Wall Go, Devil's Plan, React, TypeScript, GitHub, board game, browser game]

## Features

- 7×7 board, move and wall mechanics faithfully implemented
- Smooth turn switching between human and AI players
- Clear state flow: selecting, placing, playing, finished
- Robust undo/redo (Zustand snapshot time travel)
- All core logic covered by unit tests
- Modern UI (Tailwind CSS v4)
- Static build, deployable to GitHub Pages or any static host

---

## Game Overview

- Two-player or single-player (vs AI)
- Placing phase: players alternate placing stones
- Playing phase: select a stone, move up to 2 steps, then build a wall
- Game ends when all stones are surrounded; territory is scored automatically
- Undo/redo at any time

---

## Main File Structure

- `src/App.tsx`: Main UI and state flow
- `src/store/index.ts`: Core game state, undo/redo, all actions
- `src/agents/TurnManager.ts`: Main loop, AI/human turn switching
- `src/agents/RandomAiAgent.ts`: AI logic
- `src/components/Board/Board.tsx`, `Cell.tsx`: Board and cell interaction
- `src/utils/checkGameEnd.ts`, `territory.ts`: Territory and scoring logic
- `src/store/gameStore.test.ts`, `utils/checkGameEnd.test.ts`: Unit tests

---

## Tech Stack

- **React 19** / **TypeScript**
- **Zustand** (state, undo/redo)
- **Vite** (build)
- **Tailwind CSS v4** (UI)
- **Bun** (dev server, package management)
- **Vitest** (unit tests)

---

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) to start playing!

---

## Tips

- Use the main menu to switch between single-player and two-player modes
- Click ☀️/🌙 to toggle dark/light mode
- Use Undo/Redo to revert or redo moves
- Play again after the game ends

---

## Customization

- **Board size**: `BOARD_SIZE` in `src/lib/types.ts`
- **Player colors**: `playerColorClass()` in `src/lib/color.ts` + Tailwind safelist
- **Stones per player**: `STONES_PER_PLAYER` in `src/lib/types.ts`
- **Number of players**: Edit `PLAYER_LIST` in `src/lib/types.ts`

---

## License

MIT © 2025 Gary Chu
