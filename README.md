> This game is inspired by the “Wall Go” game featured in **Devil’s Plan 2 (魔鬼的計謀 2)**, a Netflix reality show where strategy and psychological warfare collide. This is a faithful and minimalist implementation of that mini-game in the browser, open-sourced for fans, educators, and curious coders.

# Wall‑Go 🧱♟️

A minimalist **React + TypeScript** implementation of the “Wall Go / 牆壁圍棋” mini‑game seen in *Devil’s Plan 2*.  
Builds to a completely static site so it can be served on **GitHub Pages** (or any static host).

---

## Demo

https://schaoss.github.io/wall-go/

---

## Features

* 7 × 7 board, dynamic 0–2‑step movement, wall building on four sides — just like in *Devil’s Plan 2*
* ABBA… stone placement order, auto‑skip turns when a player is blocked  
* Auto end‑game detection + scoring, live score board, “Play again” reset  
* Zustand for state, Tailwind CSS v4 for styling, Bun as package manager / dev server

---

## Tech Stack

This project uses the following tools and libraries:

| Tool / Library      | Purpose                               |
|---------------------|----------------------------------------|
| **Bun**             | Runtime, package manager, and dev server |
| **React**           | JavaScript framework                          |
| **TypeScript**      | Type-safe development                 |
| **Vite**            | Lightning-fast bundler                |
| **Tailwind CSS v4** | Utility-first styling                 |
| **Zustand**         | Lightweight state management          |
| **gh-pages**        | Deployment helper to GitHub Pages     |

---

## Quick Start

```bash
# Clone
git clone https://github.com/schaoss/wall-go.git
cd wall-go

# Install deps (Bun)
bun install

# Local dev (hot reload)
bun run dev

# Production build
bun run build        # outputs to /dist
```

Open <http://localhost:5173> and start placing stones!

---

## Customising

| What | Where |
|------|-------|
| Board size | `BOARD_SIZE` in `src/lib/types.ts` |
| Player colours | `color()` helper in `src/App.tsx` + Tailwind safelist |
| Stones per player | `STONES_PER_PLAYER` in `src/store.ts` |
| Add more players | Edit the `PLAYERS` array and safelist new colours |

---

## License

MIT © 2025 Gary Chu
