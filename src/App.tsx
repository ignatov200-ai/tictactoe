import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import type { BoardState, Difficulty, Player } from './game/logic';
import { EMPTY_BOARD, getAiMove, getWinner, isFull, other, turnOf } from './game/logic';
import { sfx } from './game/sound';
import { BoardView } from './components/Board';
import type { DoodleKind } from './components/decor';
import {
  Burst,
  Doodle,
  IconArrow,
  IconBot,
  IconMute,
  IconPencil,
  IconRestart,
  IconSound,
  IconUsers,
  InkO,
  InkX,
  Scribble,
  Tally,
  VkBadge,
  sketchVar,
} from './components/decor';

type Phase = 'playing' | 'won' | 'draw';
type Mode = 'duo' | 'cpu';

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'лёгкий' },
  { id: 'medium', label: 'средний' },
  { id: 'hard', label: 'мастер' },
];

const MARGIN_STYLE: CSSProperties = { background: 'rgba(238, 158, 158, 0.75)' };

export default function App() {
  const [board, setBoard] = useState<BoardState>(() => [...EMPTY_BOARD]);
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

  const applyMove = (i: number, mover: Player) => {
    const next = [...board];
    next[i] = mover;
    setBoard(next);
    if (mover === 'x') sfx.placeX();
    else sfx.placeO();

    const w = getWinner(next);
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

  /* --- ход компьютера --- */
  useEffect(() => {
    if (mode !== 'cpu' || phase !== 'playing' || turnOf(board, starter) !== 'o') return;
    const t = window.setTimeout(
      () => {
        const i = getAiMove(board, 'o', difficulty);
        if (i >= 0) applyMove(i, 'o');
      },
      520 + Math.random() * 480,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, mode, phase, starter, difficulty]);

  const newRound = () => {
    sfx.click();
    setBoard([...EMPTY_BOARD]);
    setLine(null);
    setWinner(null);
    setPhase('playing');
    setStarter((s) => other(s));
    setRound((r) => r + 1);
  };

  const resetMatch = () => {
    sfx.click();
    setBoard([...EMPTY_BOARD]);
    setLine(null);
    setWinner(null);
    setPhase('playing');
    setStarter('x');
    setRound(1);
    setScores({ x: 0, o: 0, d: 0 });
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    sfx.click();
    setMode(m);
    setBoard([...EMPTY_BOARD]);
    setLine(null);
    setWinner(null);
    setPhase('playing');
    setStarter('x');
    setRound(1);
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sfx.setMuted(next);
    if (!next) sfx.click();
  };

  /* --- клавиатура: 1–9, R — новая партия, Enter — переиграть --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        onTapCell(Number(e.key) - 1);
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        newRound();
      } else if (e.key === 'Enter' && phaseRef.current !== 'playing') {
        newRound();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const phaseRef = { current: phase };
  phaseRef.current = phase;

  const burstSeed = phase === 'playing' ? 0 : round * 10 + (phase === 'won' ? 1 : 2);
  const leader: 'x' | 'o' | null =
    scores.x === scores.o ? null : scores.x > scores.o ? 'x' : 'o';

  const markName = (p: Player) => (p === 'x' ? 'крестики' : 'нолики');
  const markColor = (p: Player) => (p === 'x' ? 'text-ink' : 'text-pen');

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
        <div key={`won-${round}`} className="anim-pop">
          <p className={`inline-block -rotate-1 font-hand text-4xl font-bold leading-tight sm:text-5xl ${markColor(winner)}`}>
            {text}
          </p>
          <Scribble className={`-mt-1 h-3 w-44 sm:w-60 ${markColor(winner)}`} />
          <p className="mt-2 text-sm text-pencil">
            +1 к счёту · тапни по полю или жми «ещё раз»
          </p>
        </div>
      );
    }
    if (phase === 'draw') {
      return (
        <div key={`draw-${round}`} className="anim-pop">
          <p className="inline-block rotate-1 font-hand text-4xl font-bold leading-tight text-graphite sm:text-5xl">
            Ничья! <span className="text-2xl sm:text-3xl">{'¯\\_(ツ)_/¯'}</span>
          </p>
          <Scribble className="-mt-1 h-3 w-36 text-pencil" />
          <p className="mt-2 text-sm text-pencil">все клетки заняты — переиграем?</p>
        </div>
      );
    }
    if (cpuThinking) {
      return (
        <div className="flex items-center gap-3">
          <IconBot className="h-8 w-8 text-pen" />
          <p className="font-hand text-3xl font-bold text-pen sm:text-4xl">
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
      <div className="flex items-center gap-3">
        <IconArrow className={`anim-wiggle h-9 w-9 shrink-0 ${markColor(current)}`} />
        <div>
          <p className={`font-hand text-3xl font-bold leading-tight sm:text-4xl ${markColor(current)}`}>
            Ходят {markName(current)}
            {mode === 'cpu' && current === 'x' ? ' — твой ход' : ''}
          </p>
          <p className="mt-0.5 text-xs text-pencil sm:text-sm">
            партия {round} · первым ходит{' '}
            {starter === 'x' ? (
              <InkX still className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-ink" />
            ) : (
              <InkO still className="mx-0.5 inline h-3.5 w-3.5 align-[-2px] text-pen" />
            )}
            {mode === 'cpu' ? ' · ты играешь крестиками' : ''}
          </p>
        </div>
      </div>
    );
  };

  const scoreCols: { key: 'x' | 'd' | 'o'; label: string; cls: string }[] = [
    { key: 'x', label: 'крестики', cls: 'text-ink' },
    { key: 'd', label: 'ничьи', cls: 'text-pencil' },
    { key: 'o', label: 'нолики', cls: 'text-pen' },
  ];

  return (
    <div className="paper-grid relative min-h-screen overflow-x-hidden font-body text-graphite">
      {/* красная линия полей и дырочки от скоросшивателя */}
      <div aria-hidden className="fixed bottom-0 left-12 top-0 z-0 w-[2px] sm:left-20" style={MARGIN_STYLE} />
      {[16, 50, 84].map((top) => (
        <div
          key={top}
          aria-hidden
          className="fixed left-2.5 z-0 h-4 w-4 rounded-full border border-[#d8dbe2] bg-[#e9ebef] shadow-[inset_2px_2px_3px_rgba(60,70,90,0.25)] sm:left-6"
          style={{ top: `${top}%` }}
        />
      ))}
      {/* лёгкая тень по краям листа */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(130% 100% at 50% 6%, transparent 55%, rgba(93,105,140,0.10) 100%)',
        }}
      />
      <BgDoodles />

      <main className="relative z-10 mx-auto max-w-5xl py-6 pl-[68px] pr-4 sm:py-10 sm:pl-[112px] sm:pr-10">
        {/* ---------- шапка ---------- */}
        <header className="anim-fadeup flex flex-wrap items-start justify-between gap-4">
          <div className="relative">
            <div
              aria-hidden
              className="tape absolute -left-5 -top-3 h-5 w-16 -rotate-12 rounded-[2px]"
            />
            <h1 className="-rotate-1 font-hand text-[44px] font-bold leading-[0.95] sm:text-6xl">
              <span className="text-ink">Крестики</span>
              <span className="text-pencil">-</span>
              <span className="text-pen">нолики</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="max-w-xs text-sm leading-snug text-pencil">
                Партия на листке в клетку: сыграй с другом рядом или попробуй обыграть компьютер.
              </p>
              <span className="inline-block -rotate-2 rounded border-2 border-dashed border-pen/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-pen/80">
                школьная классика
              </span>
            </div>
            {vkName && (
              <div className="mt-3 inline-block rotate-1 rounded-sm bg-[#fdf3b1] px-3 py-1.5 font-hand text-2xl font-semibold text-[#7a6a1f] shadow-[2px_3px_0_rgba(120,100,20,0.15)]">
                Привет, {vkName}!
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-[#b9c6dd] bg-card text-graphite shadow-[2px_3px_0_rgba(90,110,160,0.18)] transition-transform hover:-rotate-6 hover:scale-105 active:scale-95"
          >
            {muted ? <IconMute className="h-5 w-5" /> : <IconSound className="h-5 w-5" />}
          </button>
        </header>

        {/* ---------- игра ---------- */}
        <div className="mt-6 grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="anim-fadeup" style={{ animationDelay: '0.08s' }}>
            <div className="min-h-[86px] sm:min-h-[96px]">{statusNode()}</div>

            <div
              className="relative mx-auto mt-2 w-full max-w-[470px] lg:mx-0"
              style={{ width: 'min(100%, 470px, 62svh)' }}
            >
              <BoardView
                board={board}
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
                    className="anim-pop -rotate-2 cursor-pointer rounded-xl border-2 border-ink bg-card px-7 py-2.5 font-hand text-3xl font-bold text-ink shadow-[4px_5px_0_rgba(43,75,216,0.22)] transition-transform duration-150 hover:rotate-0 hover:scale-105 active:scale-95"
                  >
                    Ещё раз!
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ---------- боковая колонка ---------- */}
          <aside className="flex flex-col gap-7">
            {/* счёт */}
            <div
              className="anim-fadeup relative order-1 -rotate-1 rounded-lg border border-[#ccd7e8] bg-card/90 p-5 shadow-[5px_6px_0_rgba(90,110,160,0.12)] lg:order-2"
              style={{ animationDelay: '0.16s' }}
            >
              <div aria-hidden className="tape absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-2 rounded-[2px]" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">
                Счёт матча
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                {scoreCols.map((col) => (
                  <div key={col.key}>
                    <div className={`relative inline-block px-2 ${col.cls}`}>
                      <span className="font-hand text-[42px] font-bold leading-none">
                        {scores[col.key]}
                      </span>
                      {leader === col.key && (
                        <svg
                          key={`ell-${scores[col.key]}`}
                          viewBox="0 0 120 64"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute -inset-x-1.5 -inset-y-1 text-pen"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M62 8 C 34 6, 10 16, 9 31 C 8 47, 34 57, 64 56 C 94 55, 113 45, 111 30 C 109 15, 88 7, 58 9"
                            stroke="currentColor"
                            strokeWidth={3.5}
                            strokeLinecap="round"
                            opacity={0.75}
                            className="sketch"
                            style={sketchVar(310, 0)}
                          />
                        </svg>
                      )}
                    </div>
                    <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wider ${col.cls} opacity-80`}>
                      {col.label}
                    </p>
                    <div className={`mt-1 flex h-4 justify-center ${col.cls} opacity-70`}>
                      <Tally count={scores[col.key]} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-dashed border-[#ccd7e8] pt-3 text-xs text-pencil">
                Партия {round} · первым ходит {markName(starter)}
              </p>
            </div>

            {/* настройки */}
            <div
              className="anim-fadeup relative order-2 rotate-1 rounded-lg border border-[#ccd7e8] bg-card/90 p-5 shadow-[5px_6px_0_rgba(90,110,160,0.12)] lg:order-1"
              style={{ animationDelay: '0.24s' }}
            >
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">
                Как играем
              </h2>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchMode('duo')}
                  aria-pressed={mode === 'duo'}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 transition-all duration-150 ${
                    mode === 'duo'
                      ? '-rotate-1 border-ink bg-white text-ink shadow-[3px_3px_0_rgba(43,75,216,0.18)]'
                      : 'border-transparent text-pencil hover:bg-[#eef2fa]'
                  }`}
                >
                  <IconUsers className="h-6 w-6" />
                  <span className="font-hand text-xl font-semibold leading-none">Вдвоём</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('cpu')}
                  aria-pressed={mode === 'cpu'}
                  className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 transition-all duration-150 ${
                    mode === 'cpu'
                      ? 'rotate-1 border-pen bg-white text-pen shadow-[3px_3px_0_rgba(224,68,68,0.18)]'
                      : 'border-transparent text-pencil hover:bg-[#eef2fa]'
                  }`}
                >
                  <IconBot className="h-6 w-6" />
                  <span className="font-hand text-xl font-semibold leading-none">С компьютером</span>
                </button>
              </div>

              {mode === 'cpu' && (
                <div className="anim-fadeup mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">
                    Уровень
                  </p>
                  <div className="mt-1.5 flex items-end gap-4">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          if (d.id !== difficulty) {
                            sfx.click();
                            setDifficulty(d.id);
                          }
                        }}
                        aria-pressed={difficulty === d.id}
                        className={`relative cursor-pointer pb-1 font-hand text-[22px] font-semibold leading-none transition-colors ${
                          difficulty === d.id ? 'text-pendeep' : 'text-pencil hover:text-graphite'
                        }`}
                      >
                        {d.label}
                        {difficulty === d.id && (
                          <Scribble className="absolute -bottom-0.5 left-0 h-2 w-full text-pen" w={5} />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-snug text-pencil">
                    {difficulty === 'easy' && 'Просто разминается — подыграет тебе.'}
                    {difficulty === 'medium' && 'Иногда зевает, но умеет блокировать.'}
                    {difficulty === 'hard' && 'Играет идеально. Лучшее, что ты получишь, — ничья.'}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={newRound}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-ink bg-ink px-4 py-2.5 text-sm font-bold text-[#f2f5ff] shadow-[3px_4px_0_rgba(43,75,216,0.3)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-inkdeep active:translate-y-0.5 active:shadow-none"
                >
                  <IconRestart className="h-4.5 w-4.5" />
                  Новая партия
                </button>
                <button
                  type="button"
                  onClick={resetMatch}
                  className="cursor-pointer self-center rounded px-2 py-1 text-xs font-semibold text-pencil underline decoration-dotted decoration-2 underline-offset-4 transition-colors hover:text-pen"
                >
                  сбросить счёт матча
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* ---------- подвал ---------- */}
        <footer
          className="anim-fadeup mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#c6d2e6] pb-6 pt-4 text-xs text-pencil"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <IconPencil className="h-4 w-4" />
            клавиши 1–9 — ход · R — новая партия
          </span>
          <span className="sm:hidden">Жми на клетки — и поехали!</span>
          <VkBadge />
        </footer>
      </main>
    </div>
  );
}

/* ---------- каракули, парящие на полях листа ---------- */
function BgDoodles() {
  const items: { kind: DoodleKind; cls: string; dur: number; delay: number }[] = [
    { kind: 'star', cls: 'right-[5%] top-24 h-14 w-14 text-[#c3d2ea]', dur: 7, delay: 0 },
    { kind: 'spiral', cls: 'left-[8%] top-[46%] h-20 w-20 text-[#f0c6c6]', dur: 8.5, delay: 0.8 },
    { kind: 'zig', cls: 'bottom-28 left-[14%] h-9 w-24 text-[#c3d2ea]', dur: 6.4, delay: 1.6 },
    { kind: 'plane', cls: 'left-[36%] top-9 h-11 w-11 text-[#dccb9f]', dur: 9, delay: 0.4 },
    { kind: 'ring', cls: 'right-[10%] bottom-36 h-16 w-16 text-[#f0c6c6]', dur: 7.8, delay: 2.2 },
    { kind: 'cross', cls: 'right-[28%] top-[30%] h-8 w-8 text-[#c3d2ea]', dur: 6.8, delay: 1.1 },
    { kind: 'star', cls: 'left-[30%] bottom-14 h-7 w-7 text-[#dccb9f]', dur: 8.2, delay: 2.8 },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-70">
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
