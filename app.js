// ===== Utilities =====
const rnd = ((seedStr) => {
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^ (h >>> 16)) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  return (seed) => {
    if (!seed) {
      seed = Math.random().toString(36).slice(2);
    }
    const h = xmur3(seed)();
    return [mulberry32(h), seed];
  };
})();

const COLORS = [
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#eab308",
];

const $ = (sel) => document.querySelector(sel);
const boardEl = $("#board");
const tplCell = $("#tplCell");
const paletteEl = $("#palette");
const statusEl = $("#status");
const rowsEl = $("#rows");
const colsEl = $("#cols");
const colorsEl = $("#colors");
const movesEl = $("#moves");
const seedEl = $("#seed");
const seedEcho = $("#seedEcho");
const movesUsedEl = $("#movesUsed");
const movesLeftEl = $("#movesLeft");
const coverageEl = $("#coverage");
const scoreEl = $("#score");
const btnNew = $("#btnNew");
const btnUndo = $("#btnUndo");
const btnReset = $("#btnReset");
const highContrastEl = $("#highContrast");
const dlgHelp = $("#dlgHelp");
$("#btnHelp").addEventListener("click", () => dlgHelp.showModal());

const state = {
  rows: 10,
  cols: 10,
  colorCount: 6,
  limit: 25,
  seed: "",
  rng: null,
  grid: [],
  history: [],
  movesUsed: 0,
  lastColor: null,
};

function setupPalette() {
  paletteEl.innerHTML = "";
  for (let i = 0; i < state.colorCount; i++) {
    const btn = document.createElement("button");
    btn.className = "swatch";
    btn.title = `Color ${i + 1}`;
    btn.setAttribute("aria-label", `Choose color ${i + 1}`);
    btn.style.background = COLORS[i % COLORS.length];
    btn.addEventListener("click", () => chooseColor(i));
    paletteEl.appendChild(btn);
  }
}

function initGrid() {
  const [rng, seed] = rnd(state.seed.trim());
  state.rng = rng;
  state.seed = seed;
  seedEcho.textContent = seed;
  const { rows, cols, colorCount } = state;
  state.grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(rng() * colorCount))
  );
  state.history = [];
  state.movesUsed = 0;
  state.lastColor = state.grid[0][0];
  renderBoard();
  updateStats();
  statusEl.textContent = `New game started (seed ${seed}).`;
}

function renderBoard() {
  const { rows, cols } = state;
  boardEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  boardEl.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = tplCell.content.firstElementChild.cloneNode(true);
      cell.style.background = COLORS[state.grid[r][c]];
      boardEl.appendChild(cell);
    }
  }
  // Only draw seams if HC is enabled
  if (highContrastEl.checked) drawSeams();
  else clearSeams();
}

// Seam helpers
function clearSeams() {
  [...boardEl.children].forEach((cell) => {
    cell.style.borderTop =
      cell.style.borderRight =
      cell.style.borderBottom =
      cell.style.borderLeft =
        "0px solid transparent";
  });
}
function drawSeams() {
  const { rows, cols } = state;
  const cells = boardEl.children;
  const seam = "1px solid rgba(255,255,255,.15)";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cell = cells[idx];
      const val = state.grid[r][c];
      const topDiff = r > 0 ? state.grid[r - 1][c] !== val : true;
      const leftDiff = c > 0 ? state.grid[r][c - 1] !== val : true;
      const rightDiff = c < cols - 1 ? state.grid[r][c + 1] !== val : true;
      const bottomDiff = r < rows - 1 ? state.grid[r + 1][c] !== val : true;
      cell.style.borderTop = topDiff ? seam : "0px solid transparent";
      cell.style.borderLeft = leftDiff ? seam : "0px solid transparent";
      cell.style.borderRight = rightDiff ? seam : "0px solid transparent";
      cell.style.borderBottom = bottomDiff ? seam : "0px solid transparent";
    }
  }
}

// Flood logic
function flood(originColor, newColor) {
  if (originColor === newColor) return 0;
  // Use actual grid dimensions (tests can swap state.grid size)
  const rows = state.grid.length;
  const cols = rows ? state.grid[0].length : 0;
  const grid = state.grid.map((row) => row.slice());
  let count = 0;
  const q = [[0, 0]];
  const seen = new Set(["0,0"]);
  while (q.length) {
    const [r, c] = q.shift();
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (grid[r][c] !== originColor) continue;
    grid[r][c] = newColor;
    count++;
    const nbrs = [
      [r + 1, c],
      [r - 1, c],
      [r, c + 1],
      [r, c - 1],
    ];
    for (const [nr, nc] of nbrs) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const key = nr + "," + nc;
        if (!seen.has(key) && grid[nr][nc] === originColor) {
          seen.add(key);
          q.push([nr, nc]);
        }
      }
    }
  }
  state.grid = grid;
  return count;
}

function chooseColor(colorIdx) {
  if (isWon() || isOutOfMoves()) return;
  const originColor = state.grid[0][0];
  if (colorIdx === originColor) {
    statusEl.textContent = "Pick a different color than the origin.";
    return;
  }
  state.history.push({
    grid: state.grid.map((r) => r.slice()),
    movesUsed: state.movesUsed,
  });
  flood(originColor, colorIdx);
  state.movesUsed += 1;
  state.lastColor = colorIdx;
  renderBoard();
  updateStats();
  if (isWon()) announceWin();
  else if (isOutOfMoves()) announceLose();
}

function isWon() {
  const v = state.grid[0][0];
  for (const row of state.grid) {
    for (const x of row) {
      if (x !== v) return false;
    }
  }
  return true;
}
function isOutOfMoves() {
  return state.movesUsed >= state.limit;
}

function coverage() {
  // Compute using the grid's actual size so tests that change grid dimensions remain valid
  const rows = state.grid.length;
  const cols = rows ? state.grid[0].length : 0;
  if (rows === 0 || cols === 0) return 0;
  const v = state.grid[0][0];
  let n = 0,
    total = rows * cols;
  for (const row of state.grid) {
    for (const x of row) {
      if (x === v) n++;
    }
  }
  return total ? n / total : 0;
}

// Heuristic estimate of optimal moves: greedy 1‑ply from multiple restarts
function estimateOptimalMoves(trials = 3) {
  // Derive rows/cols from current grid for robustness in tests
  const rows = state.grid.length;
  const cols = rows ? state.grid[0].length : 0;
  const colorCount = state.colorCount;
  const total = rows * cols;
  let best = Infinity;
  for (let t = 0; t < trials; t++) {
    let g = state.grid.map((r) => r.slice());
    let moves = 0,
      guard = total * 3;
    while (guard--) {
      const origin = g[0][0];
      if (g.every((row) => row.every((x) => x === origin))) break;
      let bestColor = 0,
        bestGain = -1;
      for (let c = 0; c < colorCount; c++) {
        if (c === origin) continue;
        const sim = g.map((r) => r.slice());
        const q = [[0, 0]];
        const seen = new Set(["0,0"]);
        while (q.length) {
          const [r, c2] = q.shift();
          if (sim[r][c2] !== origin) continue;
          sim[r][c2] = c;
          const nbrs = [
            [r + 1, c2],
            [r - 1, c2],
            [r, c2 + 1],
            [r, c2 - 1],
          ];
          for (const [nr, nc] of nbrs) {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const key = nr + "," + nc;
              if (!seen.has(key) && sim[nr][nc] === origin) {
                seen.add(key);
                q.push([nr, nc]);
              }
            }
          }
        }
        let covered = 0;
        const v = sim[0][0];
        for (const row of sim) {
          for (const x of row) {
            if (x === v) covered++;
          }
        }
        if (covered > bestGain) {
          bestGain = covered;
          bestColor = c;
        }
      }
      const originBefore = g[0][0];
      const q = [[0, 0]];
      const seen = new Set(["0,0"]);
      while (q.length) {
        const [r, c2] = q.shift();
        if (g[r][c2] !== originBefore) continue;
        g[r][c2] = bestColor;
        const nbrs = [
          [r + 1, c2],
          [r - 1, c2],
          [r, c2 + 1],
          [r, c2 - 1],
        ];
        for (const [nr, nc] of nbrs) {
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const key = nr + "," + nc;
            if (!seen.has(key) && g[nr][nc] === originBefore) {
              seen.add(key);
              q.push([nr, nc]);
            }
          }
        }
      }
      moves++;
      if (moves > total) break;
    }
    if (moves < best) best = moves;
  }
  return isFinite(best) ? best : total;
}

function computeScore() {
  const est = Math.max(1, estimateOptimalMoves(3));
  const remaining = Math.max(0, state.limit - state.movesUsed);
  return [(remaining / est).toFixed(2), est];
}

function updateStats() {
  movesUsedEl.textContent = state.movesUsed;
  movesLeftEl.textContent = Math.max(0, state.limit - state.movesUsed);
  coverageEl.textContent = Math.round(coverage() * 100) + "%";
  const [sc] = computeScore();
  scoreEl.textContent = sc;
}
function announceWin() {
  statusEl.innerHTML = `<span class="good">You win!</span> Cleared in <b>${state.movesUsed}</b> moves. Seed <code>${state.seed}</code>.`;
}
function announceLose() {
  statusEl.innerHTML = `<span class="bad">Out of moves.</span> Adjust settings or try a new route. Seed <code>${state.seed}</code>.`;
}

// Events
btnNew.addEventListener("click", () => {
  readSettings();
  initGrid();
});
btnReset.addEventListener("click", () => {
  state.movesUsed = 0;
  renderBoard();
  updateStats();
  statusEl.textContent = "Board reset (same seed).";
});
btnUndo.addEventListener("click", () => {
  const prev = state.history.pop();
  if (!prev) {
    statusEl.textContent = "Nothing to undo.";
    return;
  }
  state.grid = prev.grid.map((r) => r.slice());
  state.movesUsed = prev.movesUsed;
  renderBoard();
  updateStats();
  statusEl.textContent = "Undid last move.";
});
highContrastEl.addEventListener("change", () => renderBoard());

function readSettings() {
  state.rows = clamp(+rowsEl.value, 4, 20);
  state.cols = clamp(+colsEl.value, 4, 20);
  state.colorCount = clamp(+colorsEl.value, 3, 8);
  state.limit = clamp(+movesEl.value, 8, 60);
  state.seed = seedEl.value.trim();
  document.documentElement.style.setProperty(
    "--cell-size",
    state.rows * state.cols > 196 ? "28px" : "36px"
  );
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, isFinite(v) ? v : min));
}

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "9") {
    const idx = +e.key - 1;
    if (idx < state.colorCount) chooseColor(idx);
  }
  if (e.key === "n" || e.key === "N") {
    readSettings();
    initGrid();
  }
  if (e.key === "u" || e.key === "U") {
    btnUndo.click();
  }
  if (e.key === "r" || e.key === "R") {
    btnReset.click();
  }
  if (e.key === "?" || e.key === "h" || e.key === "H") {
    dlgHelp.open ? dlgHelp.close() : dlgHelp.showModal();
  }
});

// ===== Minimal console tests (extended) =====
function assert(name, cond) {
  if (!cond) {
    console.error("Test FAIL:", name);
  } else {
    console.log("Test PASS:", name);
  }
}
function cloneGrid(g) {
  return g.map((r) => r.slice());
}
function generateGrid(rows, cols, colorCount, seed) {
  const [rng] = rnd(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(rng() * colorCount))
  );
}
function runTests() {
  // T1: Seed determinism
  const g1 = generateGrid(4, 4, 3, "seed123");
  const g2 = generateGrid(4, 4, 3, "seed123");
  assert(
    "Seeded grids are identical",
    JSON.stringify(g1) === JSON.stringify(g2)
  );

  // T2: Coverage on uniform grid (dynamic by grid size)
  const snap = { grid: cloneGrid(state.grid), moves: state.movesUsed };
  state.grid = Array.from({ length: 3 }, () => Array(3).fill(0));
  assert("Coverage of uniform 3x3 grid = 1", Math.abs(coverage() - 1) < 1e-9);

  // T3: Flood changes origin color only via connected region (works even if state.rows!=grid.length)
  // Do NOT modify state.rows/cols here; flood must use dynamic grid bounds
  state.grid = [
    [0, 1, 1],
    [0, 2, 1],
    [2, 2, 1],
  ];
  const before = JSON.stringify(state.grid);
  flood(0, 1);
  const after = JSON.stringify(state.grid);
  assert("Flood modifies grid", before !== after);
  assert("Flood result origin is new color", state.grid[0][0] === 1);

  // Additional tests
  // T4: Different seeds usually yield different grids
  const g3 = generateGrid(4, 4, 3, "seedA");
  const g4 = generateGrid(4, 4, 3, "seedB");
  assert(
    "Different seeds usually yield different grids",
    JSON.stringify(g3) !== JSON.stringify(g4)
  );

  // T5: Coverage on non-square uniform grid uses actual dimensions
  state.grid = Array.from({ length: 2 }, () => Array(5).fill(7));
  assert("Coverage of uniform 2x5 grid = 1", Math.abs(coverage() - 1) < 1e-9);

  // T6: Generated cell values are within range [0, colorCount)
  const g5 = generateGrid(5, 6, 4, "rangeCheck");
  const inRange = g5.every((row) =>
    row.every((x) => Number.isInteger(x) && x >= 0 && x < 4)
  );
  assert("Generated values within range", inRange);

  // T7: flood on 3x3 does not access out-of-bounds when state.rows!=3
  state.grid = [
    [0, 0, 1],
    [1, 0, 2],
    [2, 2, 2],
  ];
  try {
    flood(0, 1);
    assert("Flood did not throw on 3x3 grid", true);
  } catch (e) {
    console.error(e);
    assert("Flood did not throw on 3x3 grid", false);
  }

  // Restore snapshot
  state.grid = snap.grid;
  state.movesUsed = snap.moves;
}

// Boot
(function boot() {
  readSettings();
  setupPalette();
  initGrid();
  runTests();
})();
