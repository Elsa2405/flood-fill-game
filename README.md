🎨 Flood Fill Game (DGL-213 Milestone)

A web-based puzzle game built with HTML, CSS, and JavaScript.
Players must turn the entire grid into a single color within a set number of moves.
The game includes seeded random board generation, undo/reset, scoring, accessibility features, and seamless UI rendering.

✨ Features

Seamless UI: Adjacent same-colored cells visually merge with no gaps.

Seeded boards: Enter a seed to replay or share specific challenges.

Controls:

Set rows, columns, number of colors, move limit.

New game, reset, undo last move.

Scoring & stats:

Coverage % of grid filled.

Normalized score vs. estimated optimal moves.

Moves used / remaining counters.

Accessibility:

ARIA labels, live status updates.

Keyboard shortcuts (1–9 for colors, N new, U undo, R reset, ? help).

High-contrast mode: Adds seams for easier color distinction.

📂 Project Structure
flood-fill-game/
├── index.html   # Main page structure
├── style.css    # Styling and layout
└── app.js       # Game logic, RNG, flood algorithm, tests

🚀 Getting Started
Run locally

Clone the repo:

git clone https://github.com/YOUR-USERNAME/flood-fill-game.git
cd flood-fill-game


Open index.html in your browser.

That’s it — no build tools required.

🎮 How to Play

The origin is always the top-left cell (0,0).

Choose a color by clicking a palette swatch or pressing a number key (1–9).

The origin region floods to that color, expanding into connected areas.

Win when the entire board is one color before you run out of moves.

🧪 Testing

Console tests run automatically when the game loads:

Seed determinism (same seed → same board).

Coverage correctness on uniform grids.

Flood behavior changes origin region only.

Generated values are in range [0, colorCount).

Additional tests confirm flood safety on different grid sizes.

Check the browser developer console for PASS/FAIL results.

⏱ Development Notes

Estimated time spent coding: 17–25 hours

Planning & setup: 1–2 hrs

Grid rendering & mechanics: 5–7 hrs

Controls, scoring, undo: 4–6 hrs

Styling & accessibility: 4–6 hrs

Testing & debugging: 3–4 hrs

📜 License

MIT License © 2025 Nguyen Thi Thu Uyen
