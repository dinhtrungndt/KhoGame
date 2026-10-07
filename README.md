# Kho Game UI

React + Vite frontend prototype for a landscape-first card game hub.

## Run locally

```bash
npm install
npm run dev
```

## Structure

- `src/App.jsx`: top-level navigation and demo state
- `src/pages/`: authentication, game lobby, and table screens
- `src/Rooms.jsx`: create/find/quick-join room screens
- `src/data/cards.js`: card image catalog sourced from `src/assets/meono/coban`
- `src/style.css`: responsive visual styles

Login, password recovery, room listings, and card actions are presentation-only until a backend and game rules are connected.
