# 🎨 Flood Fill Game (DGL-213 Milestone)

A web-based puzzle game built with **HTML, CSS, and JavaScript**.  
Players must turn the entire grid into a single color within a set number of moves.  
The game includes seeded random board generation, undo/reset, scoring, accessibility features, and a seamless UI.

---

## ✨ Features

- **Seamless UI**
  - Adjacent same-colored cells visually merge with no gaps.
- **Seeded boards**
  - Enter a seed to replay or share specific challenges.
- **Controls**
  - Set rows, columns, number of colors, and move limit.
  - Start a new game, reset, or undo the last move.
- **Scoring & stats**
  - Coverage % of grid filled.
  - Normalized score vs. estimated optimal moves.
  - Moves used / remaining counters.
- **Accessibility**
  - ARIA labels and live status updates.
  - Keyboard shortcuts:
    - `1–9` choose colors
    - `N` new game
    - `U` undo
    - `R` reset
    - `?` or `H` help
- **High-contrast mode**
  - Adds seams between different colors for easier distinction.

---

## 📂 Project Structure

flood-fill-game/
├── index.html # Main page structure
├── style.css # Styling and layout
└── app.js # Game logic, RNG, flood algorithm, tests

---

## 🚀 Getting Started

### Run locally

1. Clone the repo:
   ```bash
   git clone https://github.com/Elsa2405/flood-fill-game.git
   cd flood-fill-game
   ```
   Then open index.html in your browser.
   That’s it — no build tools required.

## 🎮 How to Play

- The origin is always the top-left cell (0,0).

- Choose a color by clicking a palette swatch or pressing a number key (1–9).

- The origin region floods to that color, expanding into connected areas.

- Win when the entire board is one color before you run out of moves.

## 🧪 Testing

This project includes lightweight in-browser tests to validate core logic.

Tests covered

✅ Seed determinism → same seed generates the same board.

✅ Coverage correctness → uniform grids report coverage = 1.0.

✅ Flood behavior → changes origin region only.

✅ Value range → all generated cells are within [0, colorCount).

✅ Grid safety → flood works on non-standard grids (e.g., 3×3, 2×5).

### How to run tests

- Open the game in your browser.

- Open Developer Tools → Console.

- Refresh the page → automated tests will run on load and output PASS/FAIL.

## 🛠 Development Mode

- For contributors or debugging:

- Clone and edit

- git clone https://github.com/Elsa2405/flood-fill-game.git
  cd flood-fill-game

- Open the project in your editor and modify index.html, style.css, or app.js.

- Run locally
- Refresh the browser after saving changes. No build step required.

- Debugging

- Use console.log() in app.js for debugging.

- Inspect output in the browser console.

- Extending tests

- Add new checks inside the runTests() function in app.js.

- Reload the page → your tests will run automatically.

## ⏱ Development Notes

Estimated time spent coding: 25–30 hours

- Planning & setup ............ 2–3 hrs
- Grid rendering & mechanics .. 6–8 hrs
- Controls, scoring, undo ..... 5–6 hrs
- Styling & accessibility ..... 6–7 hrs
- Testing & debugging ......... 4–6 hrs

## 📜 License

MIT License © 2025 Nguyen Thi Thu Uyen
