import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import type { BoardSize, BoardState, Difficulty, Player } from './game/logic';
import { getAiMove, getWinner, isFull, makeEmptyBoard, other, turnOf } from './game/logic';
import { sfx } from './game/sound';
import { BoardView } from './components/Board';
import type { DoodleKind } from './components/decor';
import {
  Burst,
  Doodle,
  IconArrow,
  IconArrowLeft,
  IconBot,
  IconMute,
  IconPencil,
  IconRestart,
  IconSound,
  InkO,
  InkX,
  Scribble,
} from './components/decor';
import { MenuScreen } from './components/MenuScreen';
import type { Mode } from './components/MenuScreen';

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

  /* --- знакомство с ВКонтакте --- */
  useEffect(() => {
    vkBridge.send('VKWebAppInit').catch(() => undefined);
    vkBridge
      .send('VKWebAppGetUserInfo')
      .then((u) => setVkName(u.first_name))
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

  const tryMove = (i: number) => {
    if (phase !== 'playing' || board[i]) return;
    const mover = turnOf(board, starter);
    if (mode === 'cpu' && mover === 'o') return;
    applyMove(i, mover);
  };

  const onTapCell = (i: number) => {
    if (ended) {
      newRound();
      return;
    }
    tryMove(i);
  };

  /* --- ход компьютера (только на экране игры) --- */
  useEffect(() => {
    if (
      screen !== 'game' ||
      mode !== 'cpu' ||
      phase !== 'playing' ||
      turnOf(board, starter) !== 'o'
    )
      return;
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

  const play = () => {
    sfx.click();
    setScreen('game');
  };

  const backToMenu = () => {
    sfx.click();
    setScreen('menu');
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sfx.setMuted(next);
    if (!next) sfx.click();
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
        backToMenu();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const burstSeed = phase === 'playing' ? 0 : round * 10 + (phase === 'won' ? 1 : 2);
  const markName = (p: Player) => (p === 'x' ? 'крестики' : 'нолики');
  const markColor = (p: Player) => (p === 'x' ? 'text-ink' : 'text-pen');

  /* ---------- строка статуса ---------- */
  const statusNode = () => {
    if (phase === 'won' && winner) {
      const text =
        mode === 'cpu'
          ? winner === 'x'
            ? 'Твоя победа!'
            : 'Победил компьютер'
          : winner === 'x'
            ? 'Победили крестики!'
            : 'Победили нолики!';
      return (
        <div key={`won-${round}`} className="anim-pop text-center sm:text-left">
          <p className={`inline-block -rotate-1 font-hand text-3xl font-bold leading-tight sm:text-4xl ${markColor(winner)}`}>
            {text}
          </p>
          <Scribble className={`mx-auto -mt-1 h-2.5 w-36 sm:mx-0 sm:w-44 ${markColor(winner)}`} />
        </div>
      );
    }
    if (phase === 'draw') {
      return (
        <div key={`draw-${round}`} className="anim-pop text-center sm:text-left">
          <p className="inline-block rotate-1 font-hand text-3xl font-bold leading-tight text-graphite sm:text-4xl">
            Ничья! <span className="text-xl sm:text-2xl">{'¯\\_(ツ)_/¯'}</span>
          </p>
          <Scribble className="mx-auto -mt-1 h-2.5 w-28 text-pencil sm:mx-0 sm:w-32" />
        </div>
      );
    }
    if (cpuThinking) {
      return (
        <div className="flex items-center justify-center gap-2.5 sm:justify-start">
          <IconBot className="h-7 w-7 text-pen" />
          <p className="font-hand text-2xl font-bold text-pen sm:text-3xl">
            Компьютер думает
            <span className="dots align-middle">
              <i />
              <i />
              <i />
            </span>
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2.5 sm:justify-start">
        <IconArrow className={`anim-wiggle h-7 w-7 shrink-0 ${markColor(current)}`} />
        <p className={`font-hand text-2xl font-bold leading-tight sm:text-3xl ${markColor(current)}`}>
          Ходят {markName(current)}
          {mode === 'cpu' && current === 'x' ? ' — твой ход' : ''}
        </p>
      </div>
    );
  };

  /* ---------- экран игры ---------- */
  const gameScreen = (
    <div key="game" className="anim-screenin flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-dashed border-[#c6d2e6] px-1 pb-2 pt-2.5 sm:gap-3 sm:px-2">
        <button
          type="button"
          onClick={backToMenu}
          title="В меню (Esc)"
          className="flex cursor-pointer items-center gap-1 rounded-lg border-2 border-[#b9c6dd] bg-card px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-graphite shadow-[2px_2px_0_rgba(90,110,160,0.15)] transition-all hover:-translate-x-0.5 hover:border-ink hover:text-ink active:translate-x-0"
        >
          <IconArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Меню</span>
        </button>
        <h1 className="hidden -rotate-1 font-hand text-2xl font-bold leading-none min-[400px]:block sm:text-3xl">
          <span className="text-ink">Крестики</span>
          <span className="text-pencil">-</span>
          <span className="text-pen">нолики</span>
        </h1>
        <span className="hidden -rotate-1 rounded border-2 border-dashed border-pencil/40 px-2 py-0.5 text-[11px] font-semibold text-pencil md:inline-block">
          {size}×{size} · {size === 3 ? '3' : '4'} в ряд · партия {round} · первым {markName(starter)}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 rounded-lg border border-[#ccd7e8] bg-card/80 px-2.5 py-1 shadow-[2px_2px_0_rgba(90,110,160,0.12)]">
          <InkX still className="h-4 w-4 text-ink" />
          <span className="font-hand text-xl font-bold leading-none text-ink">{scores.x}</span>
          <span className="font-hand text-lg leading-none text-pencil">:</span>
          <span className="font-hand text-xl font-bold leading-none text-pen">{scores.o}</span>
          <InkO still className="h-4 w-4 text-pen" />
          {scores.d > 0 && (
            <span className="ml-1 hidden text-[10px] font-semibold text-pencil sm:inline">
              ничьи {scores.d}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-[#b9c6dd] bg-card text-graphite transition-transform hover:-rotate-6 hover:scale-105 active:scale-95"
        >
          {muted ? <IconMute className="h-4 w-4" /> : <IconSound className="h-4 w-4" />}
        </button>
      </header>

      <div className="flex min-h-[52px] items-center justify-center px-2 py-1 sm:min-h-[58px] sm:justify-start sm:px-3">
        {statusNode()}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
        <div className="board-fit relative">
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

      <div className="flex items-center justify-center gap-3 px-2 pb-3 pt-1.5 sm:justify-between sm:px-4 sm:pb-3.5">
        <span className="hidden items-center gap-1.5 text-[11px] text-pencil sm:inline-flex">
          <IconPencil className="h-4 w-4" />
          {size === 3 ? 'клавиши 1–9 — ход · R — заново' : 'R — заново · Esc — в меню'}
        </span>
        <div className="flex items-center gap-3">
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
    </div>
  );

  return (
    <div className="paper-grid relative h-[100dvh] overflow-hidden font-body text-graphite">
      {/* красная линия полей и дырочки от скоросшивателя */}
      <div aria-hidden className="absolute bottom-0 left-9 top-0 z-0 w-[2px] sm:left-20" style={MARGIN_STYLE} />
      {[16, 50, 84].map((top) => (
        <div
          key={top}
          aria-hidden
          className="absolute left-[7px] z-0 h-3 w-3 rounded-full border border-[#d8dbe2] bg-[#e9ebef] shadow-[inset_2px_2px_3px_rgba(60,70,90,0.25)] sm:left-6 sm:h-4 sm:w-4"
          style={{ top: `${top}%` }}
        />
      ))}
      {/* лёгкая тень по краям листа */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(130% 100% at 50% 6%, transparent 55%, rgba(93,105,140,0.10) 100%)',
        }}
      />
      <BgDoodles />

      <main className="relative z-10 h-full pl-12 pr-3 sm:pl-[104px] sm:pr-8">
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
    { kind: 'star', cls: 'right-[5%] top-[12%] h-14 w-14 text-[#c3d2ea]', dur: 7, delay: 0 },
    { kind: 'spiral', cls: 'left-[7%] top-[46%] h-20 w-20 text-[#f0c6c6]', dur: 8.5, delay: 0.8 },
    { kind: 'zig', cls: 'bottom-[12%] left-[14%] h-9 w-24 text-[#c3d2ea]', dur: 6.4, delay: 1.6 },
    { kind: 'plane', cls: 'left-[36%] top-[7%] h-11 w-11 text-[#dccb9f]', dur: 9, delay: 0.4 },
    { kind: 'ring', cls: 'right-[9%] bottom-[16%] h-16 w-16 text-[#f0c6c6]', dur: 7.8, delay: 2.2 },
    { kind: 'cross', cls: 'right-[26%] top-[26%] h-8 w-8 text-[#c3d2ea]', dur: 6.8, delay: 1.1 },
    { kind: 'star', cls: 'left-[30%] bottom-[8%] h-7 w-7 text-[#dccb9f]', dur: 8.2, delay: 2.8 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-70">
      {items.map((it, i) => (
        <div
          key={i}
          className={`anim-floaty absolute ${it.cls}`}
          style={{ animationDuration: `${it.dur}s`, animationDelay: `${it.delay}s` }}
        >
          <Doodle kind={it.kind} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
