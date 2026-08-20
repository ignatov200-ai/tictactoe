export type Player = 'x' | 'o';
export type CellValue = Player | null;
export type BoardState = CellValue[];
export type Difficulty = 'easy' | 'medium' | 'hard';

export const EMPTY_BOARD: BoardState = Array<CellValue>(9).fill(null);

export const WIN_LINES: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function other(p: Player): Player {
  return p === 'x' ? 'o' : 'x';
}

/** Чей сейчас ход: если отметок поровну — ходит тот, кто начинал партию. */
export function turnOf(board: BoardState, starter: Player): Player {
  let xs = 0;
  let os = 0;
  for (const c of board) {
    if (c === 'x') xs++;
    else if (c === 'o') os++;
  }
  return xs === os ? starter : other(starter);
}

export function getWinner(board: BoardState): { player: Player; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { player: v, line: [...line] };
    }
  }
  return null;
}

export function isFull(board: BoardState): boolean {
  return board.every((c) => c !== null);
}

export function freeCells(board: BoardState): number[] {
  const res: number[] = [];
  board.forEach((c, i) => {
    if (c === null) res.push(i);
  });
  return res;
}

/** Есть ли у игрока p ход, сразу дающий победу. */
export function findWinningMove(board: BoardState, p: Player): number {
  for (const i of freeCells(board)) {
    board[i] = p;
    const won = getWinner(board) !== null;
    board[i] = null;
    if (won) return i;
  }
  return -1;
}

function minimax(board: BoardState, current: Player, ai: Player, depth: number): number {
  const w = getWinner(board);
  if (w) return w.player === ai ? 10 - depth : depth - 10;
  const free = freeCells(board);
  if (free.length === 0) return 0;

  const maximizing = current === ai;
  let best = maximizing ? -Infinity : Infinity;
  for (const i of free) {
    board[i] = current;
    const score = minimax(board, other(current), ai, depth + 1);
    board[i] = null;
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/** Идеальный ход (minimax); при равных оценках выбирает случайно — партии не повторяются. */
export function bestMove(board: BoardState, ai: Player): number {
  const free = freeCells(board);
  if (free.length === 0) return -1;
  // первый ход — сразу в центр или угол, чтобы не гонять minimax по пустому полю
  if (free.length === 9) return [4, 0, 2, 6, 8][Math.floor(Math.random() * 5)];

  let bestScore = -Infinity;
  let candidates: number[] = [];
  for (const i of free) {
    board[i] = ai;
    const score = minimax(board, other(ai), ai, 0);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      candidates = [i];
    } else if (score === bestScore) {
      candidates.push(i);
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function randomMove(board: BoardState): number {
  const free = freeCells(board);
  return free.length ? free[Math.floor(Math.random() * free.length)] : -1;
}

export function getAiMove(board: BoardState, ai: Player, difficulty: Difficulty): number {
  const human = other(ai);
  const b = [...board];

  if (difficulty === 'easy') {
    // изредка замечает свой выигрыш, в остальном — ходит куда попало
    if (Math.random() < 0.3) {
      const win = findWinningMove(b, ai);
      if (win >= 0) return win;
    }
    return randomMove(b);
  }

  const winNow = findWinningMove(b, ai);
  if (winNow >= 0) return winNow;
  const block = findWinningMove(b, human);
  if (block >= 0) return block;

  if (difficulty === 'medium') {
    return Math.random() < 0.55 ? bestMove(b, ai) : randomMove(b);
  }
  // hard — не ошибается никогда
  return bestMove(b, ai);
}
