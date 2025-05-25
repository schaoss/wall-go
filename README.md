# Wall‑Go 🧱♟️
![cover](https://schaoss.github.io/wall-go/cover.png)

> Wall Go (牆壁圍棋) – Free, open-source online strategy board game inspired by Devil’s Plan 2. Play solo (AI) or with friends, territory scoring, undo/redo, and a modern UI. [Wall Go, Devil's Plan, React, TypeScript, GitHub, board game, browser game]

## Features

- 7×7 board, move and wall mechanics faithfully implemented
- Single-player (AI) and two-player (PvP) modes
- Multi-language UI (English, 繁體中文)
- Modern, responsive UI (Tailwind CSS v4)
- Robust undo/redo (Zustand snapshot time travel)
- All static text fully internationalized (i18next)
- SEO meta tags and social sharing optimized (react-helmet-async)
- All core logic covered by unit tests (Vitest)
- Static build, deployable to GitHub Pages or any static host

---

## Game Overview

- Two-player or single-player (vs AI)
- Placing phase: players alternate placing stones
- Playing phase: select a stone, move up to 2 steps, then build a wall
- Game ends when all stones are surrounded; territory is scored automatically
- Undo/redo at any time
- Rules dialog and accessibility labels fully localized

---

## Main File Structure

- `src/App.tsx`: Main UI and state flow
- `src/store/index.ts`: Core game state, undo/redo, all actions
- `src/agents/*`: AI logic
- `src/components/Board/Board.tsx`, `Cell.tsx`: Board and cell interaction
- `src/components/SeoHelmet.tsx`: SEO meta tags
- `src/locales/*`: Language files
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
- **i18next / react-i18next** (internationalization)
- **react-helmet-async** (SEO)

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
- Switch language from the menu (EN/Han)

---

## Customization

- **Board size**: `BOARD_SIZE` in `src/lib/types.ts`
- **Player colors**: `playerColorClass()` in `src/lib/color.ts` + Tailwind safelist
- **Stones per player**: `STONES_PER_PLAYER` in `src/lib/types.ts`
- **Number of players**: Edit `PLAYER_LIST` in `src/lib/types.ts`
- **Add new language**: Add JSON to `src/locales/` and update `src/i18n.ts`

---

## License

MIT © 2025 Gary Chu
