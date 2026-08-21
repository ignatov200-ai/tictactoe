/* Логика крестиков-ноликов: классика 3×3 и большое поле 5×5 (победа — 4 в ряд). */

export type Player = 'x' | 'o';
export type Cell = Player | null;
export type BoardSize = 3 | 5;
export type BoardState = Cell[];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WinResult {
  player: Player;
  line: number[];
}

export const makeEmptyBoard = (size: BoardSize): BoardState =>
  Array.from({ length: size * size }, () => null);

export const other = (p: Player): Player => (p === 'x' ? 'o' : 'x');

/** Сколько отметок в ряд нужно для победы */
export const winLength = (size: BoardSize): number => (size === 3 ? 3 : 4);

/** Чей сейчас ход, если партию начал starter */
export function turnOf(board: BoardState, starter: Player): Player {
  let xs = 0;
  let os = 0;
  for (const c of board) {
    if (c === 'x') xs++;
    else if (c === 'o') os++;
  }
  return xs === os ? starter : other(starter);
}

const linesCache = new Map<BoardSize, number[][]>();

/** Все выигрышные линии доски */
export function winningLines(size: BoardSize): number[][] {
  const cached = linesCache.get(size);
  if (cached) return cached;
  const n = winLength(size);
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c + n <= size; c++) {
      lines.push(Array.from({ length: n }, (_, k) => r * size + c + k));
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r + n <= size; r++) {
      lines.push(Array.from({ length: n }, (_, k) => (r + k) * size + c));
    }
  }
  for (let r = 0; r + n <= size; r++) {
    for (let c = 0; c + n <= size; c++) {
      lines.push(Array.from({ length: n }, (_, k) => (r + k) * size + c + k));
    }
  }
  for (let r = 0; r + n <= size; r++) {
    for (let c = n - 1; c < size; c++) {
      lines.push(Array.from({ length: n }, (_, k) => (r + k) * size + c - k));
    }
  }
  linesCache.set(size, lines);
  return lines;
}

export function getWinner(board: BoardState, size: BoardSize): WinResult | null {
  for (const line of winningLines(size)) {
    const v = board[line[0]];
    if (v && line.every((i) => board[i] === v)) return { player: v, line };
  }
  return null;
}

export function isFull(board: BoardState): boolean {
  return board.every((c) => c !== null);
}

/* ======================= компьютер ======================= */

function emptiesOf(board: BoardState): number[] {
  const out: number[] = [];
  board.forEach((c, i) => {
    if (!c) out.push(i);
  });
  return out;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findWinningMove(board: BoardState, player: Player, size: BoardSize): number {
  for (const i of emptiesOf(board)) {
    board[i] = player;
    const w = getWinner(board, size);
    board[i] = null;
    if (w && w.player === player) return i;
  }
  return -1;
}

export function getAiMove(
  board: BoardState,
  ai: Player,
  difficulty: Difficulty,
  size: BoardSize,
): number {
  const empties = emptiesOf(board);
  if (empties.length === 0) return -1;
  return size === 3
    ? getAiMove3(board, ai, difficulty)
    : getAiMove5(board, ai, difficulty);
}

/* ---------- 3×3: точный minimax ---------- */

const LINES3 = winningLines(3);

function checkWin3(board: BoardState): Player | null {
  for (const [a, b, c] of LINES3) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function minimax3(
  board: BoardState,
  turn: Player,
  ai: Player,
  depth: number,
): { score: number; index: number } {
  const w = checkWin3(board);
  if (w) return { score: w === ai ? 10 - depth : depth - 10, index: -1 };
  const empties = emptiesOf(board);
  if (empties.length === 0) return { score: 0, index: -1 };

  let best: { score: number; index: number } | null = null;
  for (const i of empties) {
    board[i] = turn;
    const r = minimax3(board, other(turn), ai, depth + 1);
    board[i] = null;
    const score = r.score;
    if (!best || (turn === ai ? score > best.score : score < best.score)) {
      best = { score, index: i };
    }
  }
  return best ?? { score: 0, index: -1 };
}

function getAiMove3(board: BoardState, ai: Player, difficulty: Difficulty): number {
  const empties = emptiesOf(board);
  if (empties.length === 9) return pickRandom([0, 2, 4, 4, 4, 6, 8]);
  if (difficulty === 'easy' && Math.random() < 0.45) return pickRandom(empties);
  if (difficulty === 'medium') {
    const win = findWinningMove(board, ai, 3);
    if (win >= 0) return win;
    const block = findWinningMove(board, other(ai), 3);
    if (block >= 0 && Math.random() < 0.85) return block;
    if (Math.random() < 0.25) return pickRandom(empties);
  }
  return minimax3([...board], ai, ai, 0).index;
}

/* ---------- 5×5: эвристика по линиям (угрозы и вилки) ---------- */

const throughCache = new Map<BoardSize, number[][][]>();

function linesThrough(size: BoardSize): number[][][] {
  let m = throughCache.get(size);
  if (!m) {
    m = Array.from({ length: size * size }, () => [] as number[][]);
    for (const line of winningLines(size)) {
      for (const i of line) m[i].push(line);
    }
    throughCache.set(size, m);
  }
  return m;
}

/** Насколько полезно игроку ai поставить отметку в клетку index */
function scoreCell(board: BoardState, size: BoardSize, index: number, ai: Player): number {
  const opp = other(ai);
  const n = winLength(size);
  let s = 0;
  for (const line of linesThrough(size)[index]) {
    let mine = 0;
    let theirs = 0;
    for (const j of line) {
      const v = board[j];
      if (v === ai) mine++;
      else if (v === opp) theirs++;
    }
    /* атака: линия, где соперника нет */
    if (theirs === 0) {
      const a = mine + 1;
      s += a >= n ? 1000 : a === n - 1 ? 14 : a === n - 2 ? 3 : 0.8;
    }
    /* защита: линия, где нет моих отметок */
    if (mine === 0) {
      s += theirs >= n - 1 ? 100 : theirs === n - 2 ? 6 : theirs === n - 3 ? 1.5 : 0;
    }
  }
  /* ближе к центру — чуть приятнее */
  const mid = (size - 1) / 2;
  const r = Math.floor(index / size);
  const c = index % size;
  s += (mid - Math.max(Math.abs(r - mid), Math.abs(c - mid)) + 0.5) * 0.12;
  return s;
}

function getAiMove5(board: BoardState, ai: Player, difficulty: Difficulty): number {
  const empties = emptiesOf(board);
  if (empties.length === board.length) {
    return Math.random() < 0.8 ? Math.floor(board.length / 2) : pickRandom(empties);
  }
  /* своя победа — всегда */
  const winMove = findWinningMove(board, ai, 5);
  if (winMove >= 0) return winMove;
  const blockMove = findWinningMove(board, other(ai), 5);
  if (difficulty === 'easy') {
    if (blockMove >= 0 && Math.random() < 0.35) return blockMove;
    return pickRandom(empties);
  }
  /* чужую победу закрываем */
  if (blockMove >= 0) return blockMove;
  const noise = difficulty === 'medium' ? 8 : 0.4;
  let best = empties[0];
  let bestScore = -Infinity;
  for (const i of empties) {
    const s = scoreCell(board, 5, i, ai) + Math.random() * noise;
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}
