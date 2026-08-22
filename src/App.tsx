import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BoardSize, BoardState, Difficulty, Mode, Player } from './game/logic';
import { getAiMove, getWinner, isFull, makeEmptyBoard, other, turnOf } from './game/logic';
import { sfx } from './game/sound';
import { fetchVkName, initVk } from './game/vk';
import { BoardView } from './components/Board';
import type { DoodleKind } from './components/decor';
import {
  Burst,
  Doodle,
  IconArrow,
  IconArrowLeft,
  IconMute,
  IconPencil,
  IconRestart,
  IconSound,
  InkO,
  InkX,
  Scribble,
} from './components/decor';
import { MenuScreen } from './components/MenuScreen';

type Phase = 'playing' | 'won' | 'draw';
type Screen = 'menu' | 'game';

const MARGIN_STYLE: CSSProperties = { background: 'rgba(238, 158, 158, 0.75)' };

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [size, setSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<BoardState>(() => makeEmptyBoard(3));
  const [phase, setPhase] = useState<Phase>('playing');
  const [winner, setWinner] = useState<Player | null>(null);
  const [line, setLine] = useState<number[] | null>(null);
  const [starter, setStarter] = useState<Player>('x');
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ x: 0, o: 0, d: 0 });
  const [mode, setMode] = useState<Mode>('cpu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [vkName, setVkName] = useState<string | null>(null);
  const [muted, setMuted] = useState(sfx.isMuted());

  const current = useMemo(() => turnOf(board, starter), [board, starter]);
  const ended = phase !== 'playing';
  const cpuThinking = mode === 'cpu' && phase === 'playing' && current === 'o';

  /* --- знакомство с ВКонтакте (никогда не роняет игру) --- */
  useEffect(() => {
    initVk();
    fetchVkName()
      .then((name) => setVkName(name))
      .catch(() => undefined);
  }, []);

  const clearBoard = (sz: BoardSize) => {
    setBoard(makeEmptyBoard(sz));
    setLine(null);
    setWinner(null);
    setPhase('playing');
    setStarter('x');
    setRound(1);
    setScores({ x: 0, o: 0, d: 0 });
  };

  const applyMove = (i: number, mover: Player) => {
    const next = [...board];
    next[i] = mover;
    setBoard(next);
    if (mover === 'x') sfx.placeX();
    else sfx.placeO();

    const w = getWinner(next, size);
    if (w) {
      setLine(w.line);
      setWinner(w.player);
      setPhase('won');
      setScores((s) => ({ ...s, [w.player]: s[w.player] + 1 }));
      const humanLost = mode === 'cpu' && w.player === 'o';
      window.setTimeout(() => (humanLost ? sfx.lose() : sfx.win()), 420);
    } else if (isFull(next)) {
      setPhase('draw');
      setScores((s) => ({ ...s, d: s.d + 1 }));
      window.setTimeout(() => sfx.draw(), 320);
    }
  };

  const onTapCell = (i: number) => {
    if (phase !== 'playing' || board[i]) return;
    const mover = turnOf(board, starter);
    if (mode === 'cpu' && mover === 'o') return;
    applyMove(i, mover);
  };

  /* --- ход компьютера (на паузе, пока открыто меню) --- */
  useEffect(() => {
    if (screen !== 'game') return;
    if (mode !== 'cpu' || phase !== 'playing' || turnOf(board, starter) !== 'o') return;
    const t = window.setTimeout(
      () => {
        const i = getAiMove(board, 'o', difficulty, size);
        if (i >= 0) applyMove(i, 'o');
      },
      520 + Math.random() * 480,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, mode, phase, starter, difficulty, size, screen]);

  const newRound = () => {
    sfx.click();
    setBoard(makeEmptyBoard(size));
    setLine(null);
    setWinner(null);
    setPhase('playing');
    setStarter((s) => other(s));
    setRound((r) => r + 1);
  };

  const resetMatch = () => {
    sfx.click();
    clearBoard(size);
  };

  const play = () => {
    sfx.click();
    setScreen('game');
  };

  const toMenu = () => {
    sfx.click();
    setScreen('menu');
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sfx.setMuted(next);
    if (!next) sfx.click();
  };

  const handleSize = (s: BoardSize) => {
    if (s === size) return;
    sfx.click();
    setSize(s);
    clearBoard(s);
  };

  const handleMode = (m: Mode) => {
    if (m === mode) return;
    sfx.click();
    setMode(m);
    clearBoard(size);
  };

  /* --- клавиатура --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === 'menu') {
        if (e.key === 'Enter') play();
        return;
      }
      if (size === 3 && e.key >= '1' && e.key <= '9') {
        onTapCell(Number(e.key) - 1);
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        newRound();
      } else if (e.key === 'Enter' && phase !== 'playing') {
        newRound();
      } else if (e.key === 'Escape') {
        toMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const markName = (p: Player) => (p === 'x' ? 'крестики' : 'нолики');
  const markColor = (p: Player) => (p === 'x' ? 'text-ink' : 'text-pen');
  const burstSeed = phase === 'playing' ? 0 : round * 10 + (phase === 'won' ? 1 : 2);

  /* ---------- игровой экран ---------- */
  const gameScreen = (
    <div className="anim-screenin flex h-full min-h-0 flex-col">
      {/* компактная шапка: меню · счёт · поле · звук */}
      <div className="flex shrink-0 items-center justify-between gap-2 pb-1.5 pt-2.5 sm:pt-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={toMenu}
            title="В меню (Esc)"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border-2 border-[#b9c6dd] bg-card text-graphite shadow-[2px_3px_0_rgba(90,110,160,0.16)] transition-transform hover:-translate-x-0.5 active:translate-x-0 active:scale-95"
          >
            <IconArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#ccd7e8] bg-card/90 px-2.5 py-1 shadow-[2px_3px_0_rgba(90,110,160,0.10)]">
            <InkX still className="h-3.5 w-3.5 text-ink" />
            <span className="font-hand text-xl font-bold leading-none text-ink">{scores.x}</span>
            <span className="font-hand text-lg leading-none text-pencil">:</span>
            <span className="font-hand text-xl font-bold leading-none text-pen">{scores.o}</span>
            <InkO still className="h-3.5 w-3.5 text-pen" />
            <span className="ml-1 hidden text-[11px] text-pencil sm:inline">· ничьи {scores.d}</span>
            <span className="text-[11px] text-pencil">· №{round}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border border-dashed border-[#b9c6dd] px-2 py-1 font-hand text-lg font-semibold leading-none text-graphite/80">
            {size}×{size}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-2 border-[#b9c6dd] bg-card text-graphite shadow-[2px_3px_0_rgba(90,110,160,0.16)] transition-transform hover:-rotate-6 active:scale-95"
          >
            {muted ? <IconMute className="h-4.5 w-4.5" /> : <IconSound className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* строка статуса */}
      <div className="flex shrink-0 items-center justify-center px-2 py-1 text-center">
        {phase === 'won' && winner ? (
          <div key={`won-${round}`} className="anim-pop">
            <p className={`inline-block -rotate-1 font-hand text-3xl font-bold leading-tight sm:text-4xl ${markColor(winner)}`}>
              {mode === 'cpu'
                ? winner === 'x'
                  ? 'Твоя победа!'
                  : 'Победил компьютер'
                : winner === 'x'
                  ? 'Победили крестики!'
                  : 'Победили нолики!'}
            </p>
            <Scribble className={`-mt-0.5 h-2.5 w-40 sm:w-52 ${markColor(winner)}`} />
          </div>
        ) : phase === 'draw' ? (
          <div key={`draw-${round}`} className="anim-pop">
            <p className="inline-block rotate-1 font-hand text-3xl font-bold leading-tight text-graphite sm:text-4xl">Ничья!</p>
            <Scribble className="-mt-0.5 h-2.5 w-28 text-pencil" />
          </div>
        ) : cpuThinking ? (
          <p className="flex items-center gap-2 font-hand text-2xl font-bold text-pen sm:text-3xl">
            Компьютер думает
            <span className="dots align-middle">
              <i />
              <i />
              <i />
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 font-hand text-2xl font-bold leading-none sm:text-3xl">
            <IconArrow className={`anim-wiggle h-7 w-7 ${markColor(current)}`} />
            <span className={markColor(current)}>
              Ходят {markName(current)}
              {mode === 'cpu' && current === 'x' ? ' — твой ход' : ''}
            </span>
          </p>
        )}
      </div>

      {/* поле: гарантированный квадрат, всегда влезает без прокрутки */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div className="board-square relative">
          <BoardView
            board={board}
            size={size}
            current={current}
            interactive={!cpuThinking}
            ended={ended}
            line={line}
            onTapCell={onTapCell}
          />

          {ended && <Burst seed={burstSeed} />}

          {ended && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <button
                type="button"
                onClick={newRound}
                className="anim-pop -rotate-2 cursor-pointer rounded-xl border-2 border-ink bg-card px-6 py-2 font-hand text-2xl font-bold text-ink shadow-[4px_5px_0_rgba(43,75,216,0.22)] transition-transform duration-150 hover:rotate-0 hover:scale-105 active:scale-95 sm:text-3xl"
              >
                Ещё раз!
              </button>
            </div>
          )}
        </div>
      </div>

      {/* нижние кнопки */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-2.5 pt-1.5 sm:justify-between sm:pb-3">
        <span className="hidden items-center gap-1.5 text-[11px] text-pencil md:inline-flex">
          <IconPencil className="h-3.5 w-3.5" />
          {size === 3 ? 'клавиши 1–9 — ход' : 'жми на клетки'} · R — заново · Esc — меню
        </span>
        <button
          type="button"
          onClick={resetMatch}
          className="cursor-pointer rounded px-1.5 py-1 text-[11px] font-semibold text-pencil underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-pen"
        >
          сбросить счёт
        </button>
        <button
          type="button"
          onClick={newRound}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-ink px-4 py-2 text-xs font-bold text-[#f2f5ff] shadow-[3px_4px_0_rgba(43,75,216,0.3)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-inkdeep active:translate-y-0.5 active:shadow-none"
        >
          <IconRestart className="h-4 w-4" />
          Новая партия
        </button>
      </div>
    </div>
  );

  return (
    <div className="paper-grid relative h-[100dvh] overflow-hidden font-body text-graphite">
      {/* красная линия полей и дырочки от скоросшивателя */}
      <div
        aria-hidden
        className={`absolute bottom-0 top-0 z-0 w-[2px] ${
          screen === 'menu' ? 'left-9 hidden sm:left-20 sm:block' : 'left-9 sm:left-20'
        }`}
        style={MARGIN_STYLE}
      />
      {[16, 50, 84].map((top) => (
        <div
          key={top}
          aria-hidden
          className={`absolute left-[7px] z-0 h-3 w-3 rounded-full border border-[#d8dbe2] bg-[#e9ebef] shadow-[inset_2px_2px_3px_rgba(60,70,90,0.25)] sm:left-6 sm:h-4 sm:w-4 ${
            screen === 'menu' ? 'hidden sm:block' : ''
          }`}
          style={{ top: `${top}%` }}
        />
      ))}
      {/* лёгкая тень по краям листа */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(130% 100% at 50% 6%, transparent 55%, rgba(93,105,140,0.10) 100%)',
        }}
      />
      <BgDoodles />

      <main className={`relative z-10 h-full ${screen === 'menu' ? 'px-4 sm:px-[104px]' : 'pl-12 pr-3 sm:pl-[104px] sm:pr-8'}`}>
        {screen === 'menu' ? (
          <MenuScreen
            size={size}
            mode={mode}
            difficulty={difficulty}
            vkName={vkName}
            onSize={handleSize}
            onMode={handleMode}
            onDifficulty={(d) => {
              if (d !== difficulty) {
                sfx.click();
                setDifficulty(d);
              }
            }}
            onPlay={play}
          />
        ) : (
          gameScreen
        )}
      </main>
    </div>
  );
}

/* ---------- каракули, парящие на полях листа ---------- */
function BgDoodles() {
  const items: { kind: DoodleKind; cls: string; dur: number; delay: number }[] = [
    { kind: 'star', cls: 'right-[4%] top-[12%] h-12 w-12 text-[#c3d2ea]', dur: 7, delay: 0 },
    { kind: 'spiral', cls: 'left-[3%] top-[44%] h-16 w-16 text-[#f0c6c6] sm:left-[6%]', dur: 8.5, delay: 0.8 },
    { kind: 'zig', cls: 'bottom-[10%] left-[8%] h-8 w-20 text-[#c3d2ea] sm:left-[12%]', dur: 6.4, delay: 1.6 },
    { kind: 'plane', cls: 'left-[32%] top-[6%] h-10 w-10 text-[#dccb9f]', dur: 9, delay: 0.4 },
    { kind: 'ring', cls: 'right-[7%] bottom-[16%] h-14 w-14 text-[#f0c6c6]', dur: 7.8, delay: 2.2 },
    { kind: 'cross', cls: 'right-[24%] top-[26%] h-7 w-7 text-[#c3d2ea]', dur: 6.8, delay: 1.1 },
    { kind: 'star', cls: 'left-[26%] bottom-[7%] h-6 w-6 text-[#dccb9f]', dur: 8.2, delay: 2.8 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-70">
      {items.map((it, i) => (
        <div key={i} className={`anim-floaty absolute ${it.cls}`} style={{ animationDuration: `${it.dur}s`, animationDelay: `${it.delay}s` }}>
          <Doodle kind={it.kind} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
