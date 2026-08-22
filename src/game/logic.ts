export type Player = 'x' | 'o';
export type Cell = Player | null;
export type BoardSize = 3 | 5;
export type BoardState = Cell[];
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Mode = 'duo' | 'cpu';

export interface WinResult {
  player: Player;
  line: number[];
}

export const makeEmptyBoard = (size: BoardSize): BoardState =>
  Array.from({ length: size * size }, () => null);

export const other = (p: Player): Player => (p === 'x' ? 'o' : 'x');

/** сколько в ряд нужно для победы */
export const winLength = (size: BoardSize): number => (size === 3 ? 3 : 4);

/** чей сейчас ход: сколько отметок уже стоит */
export function turnOf(board: BoardState, starter: Player): Player {
  let n = 0;
  for (const c of board) if (c) n++;
  return n % 2 === 0 ? starter : other(starter);
}

/* ---------- выигрышные линии ---------- */
export function winningLines(size: BoardSize): number[][] {
  const need = winLength(size);
  const lines: number[][] = [];
  const at = (r: number, c: number) => r * size + c;
  for (let r = 0; r < size; r++)
    for (let c = 0; c + need <= size; c++)
      lines.push(Array.from({ length: need }, (_, k) => at(r, c + k)));
  for (let c = 0; c < size; c++)
    for (let r = 0; r + need <= size; r++)
      lines.push(Array.from({ length: need }, (_, k) => at(r + k, c)));
  for (let r = 0; r + need <= size; r++)
    for (let c = 0; c + need <= size; c++)
      lines.push(Array.from({ length: need }, (_, k) => at(r + k, c + k)));
  for (let r = 0; r + need <= size; r++)
    for (let c = need - 1; c < size; c++)
      lines.push(Array.from({ length: need }, (_, k) => at(r + k, c - k)));
  return lines;
}

export function getWinner(board: BoardState, size: BoardSize): WinResult | null {
  for (const line of winningLines(size)) {
    const first = board[line[0]];
    if (first && line.every((i) => board[i] === first)) {
      return { player: first, line };
    }
  }
  return null;
}

export function isFull(board: BoardState): boolean {
  return board.every((c) => c !== null);
}

/* ---------- ИИ ---------- */
export function getAiMove(
  board: BoardState,
  ai: Player,
  difficulty: Difficulty,
  size: BoardSize,
): number {
  const empty = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (empty.length === 0) return -1;
  const human = other(ai);

  const tryWin = (p: Player): number => {
    for (const i of empty) {
      board[i] = p;
      const w = getWinner(board, size);
      board[i] = null;
      if (w && w.player === p) return i;
    }
    return -1;
  };

  if (difficulty === 'easy') {
    if (Math.random() < 0.25) {
      const w = tryWin(ai);
      if (w >= 0) return w;
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  const winNow = tryWin(ai);
  if (winNow >= 0) return winNow;
  const block = tryWin(human);
  if (block >= 0) return block;

  if (difficulty === 'medium') {
    if (Math.random() < 0.18) return empty[Math.floor(Math.random() * empty.length)];
    return bestHeuristic(board, ai, size, 0);
  }

  // «мастер»: точный minimax на 3×3, глубокая эвристика на 5×5
  return size === 3 ? minimaxRoot(board, ai) : bestHeuristic(board, ai, size, 3);
}

/* ---------- minimax для 3×3 (идеальная игра) ---------- */
function minimaxRoot(board: BoardState, ai: Player): number {
  const human = other(ai);
  let best = -Infinity;
  let moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = ai;
    const s = minimax(board, human, ai, 0);
    board[i] = null;
    if (s > best) {
      best = s;
      moves = [i];
    } else if (s === best) {
      moves.push(i);
    }
  }
  return moves[Math.floor(Math.random() * moves.length)] ?? -1;
}

function minimax(board: BoardState, current: Player, ai: Player, depth: number): number {
  const w = getWinner(board, 3);
  if (w) return w.player === ai ? 10 - depth : depth - 10;
  if (isFull(board)) return 0;
  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = current;
    scores.push(minimax(board, other(current), ai, depth + 1));
    board[i] = null;
  }
  return current === ai ? Math.max(...scores) : Math.min(...scores);
}

/* ---------- эвристика для 5×5: угрозы, вилки, центр ---------- */
function bestHeuristic(board: BoardState, ai: Player, size: BoardSize, forkDepth: number): number {
  const human = other(ai);
  const empty: number[] = [];
  board.forEach((c, i) => {
    if (!c) empty.push(i);
  });
  const center = (size * size - 1) / 2;

  const lineScore = (p: Player, o: Player): number => {
    let total = 0;
    for (const line of winningLines(size)) {
      let mine = 0;
      let theirs = 0;
      for (const i of line) {
        const v = board[i];
        if (v === p) mine++;
        else if (v === o) theirs++;
      }
      if (theirs === 0) total += mine === 3 ? 90 : mine === 2 ? 12 : mine === 1 ? 2 : 0;
      else if (mine === 0) total -= theirs === 3 ? 80 : theirs === 2 ? 10 : theirs === 1 ? 1 : 0;
    }
    return total;
  };

  /** сколько победных продолжений даёт ход i для игрока p */
  const threatsAfter = (i: number, p: Player): number => {
    board[i] = p;
    let count = 0;
    for (const line of winningLines(size)) {
      if (!line.includes(i)) continue;
      let mine = 0;
      let theirs = 0;
      for (const j of line) {
        const v = board[j];
        if (v === p) mine++;
        else if (v) theirs++;
      }
      if (theirs === 0 && mine === winLength(size) - 1) count++;
    }
    board[i] = null;
    return count;
  };

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const i of empty) {
    board[i] = ai;
    let score = lineScore(ai, human) + (center - Math.abs(i - center)) * 0.6;

    if (forkDepth > 0) {
      const myThreats = threatsAfter(i, ai);
      const oppThreats = threatsAfter(i, human);
      if (myThreats >= 2) score += 400; // вилка — почти победа
      else if (oppThreats >= 2) score += 260; // не дать построить вилку
      else if (myThreats === 1) score += 60;
      // отвечаем на худший ход соперника
      let worst = 40;
      for (const j of empty) {
        if (j === i) continue;
        board[j] = human;
        worst = Math.min(worst, lineScore(ai, human));
        board[j] = null;
      }
      score += worst * 0.35;
    }

    board[i] = null;

    score += Math.random() * 0.8; // лёгкий шум — партии не повторяются
    if (score > bestScore + 1e-9) {
      bestScore = score;
      bestMoves = [i];
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      bestMoves.push(i);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? -1;
}
