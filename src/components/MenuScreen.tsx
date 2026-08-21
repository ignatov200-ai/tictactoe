import type { CSSProperties } from 'react';
import type { BoardSize, Difficulty } from '../game/logic';
import { sfx } from '../game/sound';
import { GridLines, IconBot, IconPlay, IconUsers, InkO, InkX, MiniGrid, Scribble } from './decor';

export type Mode = 'duo' | 'cpu';

export const SIZES: { id: BoardSize; label: string; note: string }[] = [
  { id: 3, label: '3×3', note: '3 в ряд' },
  { id: 5, label: '5×5', note: '4 в ряд' },
];

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'лёгкий' },
  { id: 'medium', label: 'средний' },
  { id: 'hard', label: 'мастер' },
];

export interface MenuProps {
  size: BoardSize;
  mode: Mode;
  difficulty: Difficulty;
  vkName: string | null;
  onSize: (s: BoardSize) => void;
  onMode: (m: Mode) => void;
  onDifficulty: (d: Difficulty) => void;
  onPlay: () => void;
}

/* ---------- буква названия в тетрадной клеточке ---------- */
function LetterRow({ word, tone }: { word: string; tone: 'ink' | 'pen' }) {
  return (
    <span className="inline-flex gap-[3px]">
      {word.split('').map((ch, i) => (
        <span
          key={i}
          className={`grid h-8 w-8 cursor-default place-items-center rounded-[5px] border-2 bg-card/80 shadow-[1.5px_2px_0_rgba(90,110,160,0.13)] transition-transform duration-150 hover:-translate-y-0.5 hover:rotate-3 sm:h-10 sm:w-10 lg:h-11 lg:w-11 ${
            tone === 'ink' ? 'border-[#b9c8e6] text-ink' : 'border-[#eebcbc] text-pen'
          }`}
        >
          <span className="font-hand text-[21px] font-bold leading-none sm:text-[27px] lg:text-[30px]">
            {ch}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ---------- мини-лист с начатой партией ---------- */
function MiniSheet({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={`pointer-events-none relative ${className}`} style={style} aria-hidden="true">
      <GridLines className="absolute inset-0 h-full w-full" />
      <InkX still className="absolute left-[6%] top-[6%] h-[26%] w-[26%] text-ink" />
      <InkO still className="absolute left-[38%] top-[38%] h-[26%] w-[26%] text-pen" />
      <InkX still className="absolute bottom-[6%] right-[6%] h-[26%] w-[26%] text-ink" />
    </div>
  );
}

/* ---------- стартовый экран: обложка тетради ---------- */
export function MenuScreen({
  size,
  mode,
  difficulty,
  vkName,
  onSize,
  onMode,
  onDifficulty,
  onPlay,
}: MenuProps) {
  const sizeNote = size === 3 ? 'победа — 3 в ряд' : 'победа — 4 в ряд';

  return (
    <div className="menu-scroll relative flex h-full w-full flex-col items-center overflow-hidden">
      {/* ---- логотип сверху ---- */}
      <div className="anim-fadeup relative mt-2 shrink-0 text-center sm:mt-5">
        <div className="relative inline-block">
          <div aria-hidden className="tape absolute -left-6 -top-3 h-5 w-14 -rotate-12 rounded-[2px]" />
          <div aria-hidden className="tape absolute -right-4 -top-2 h-4 w-11 rotate-6 rounded-[2px]" />
          <div className="-rotate-1">
            <LetterRow word="КРЕСТИКИ" tone="ink" />
            <div className="ml-7 mt-1.5 sm:ml-10">
              <LetterRow word="НОЛИКИ" tone="pen" />
            </div>
          </div>
        </div>

        {vkName && (
          <div
            className="anim-fadeup mt-2 inline-block rotate-1 rounded-sm bg-[#fdf3b1] px-2.5 py-0.5 font-hand text-lg font-semibold text-[#7a6a1f] shadow-[2px_3px_0_rgba(120,100,20,0.15)]"
            style={{ animationDelay: '0.14s' }}
          >
            Привет, {vkName}!
          </div>
        )}

        <MiniSheet
          className="anim-floaty absolute -top-6 right-[-92px] hidden h-24 w-24 rotate-12 text-[#aebfdd] lg:block"
          style={{ animationDuration: '8s' }}
        />
      </div>

      {/* ---- настройки партии по центру ---- */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center py-2">
        <div className="anim-fadeup relative w-full max-w-md" style={{ animationDelay: '0.12s' }}>
          <div aria-hidden className="tape absolute -top-3 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rotate-2 rounded-[2px]" />
          <div className="rounded-xl border border-[#ccd7e8] bg-card/95 p-4 shadow-[6px_7px_0_rgba(90,110,160,0.13)] sm:p-5">
            <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-pencil">
              Настройки партии
            </h2>

            <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-pencil">Поле</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onSize(3);
                }}
                aria-pressed={size === 3}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 ${
                  size === 3
                    ? '-rotate-1 border-ink bg-white text-ink shadow-[3px_4px_0_rgba(43,75,216,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-ink/40 hover:bg-white'
                }`}
              >
                <MiniGrid n={3} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">3×3</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-pencil">классика</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onSize(5);
                }}
                aria-pressed={size === 5}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 ${
                  size === 5
                    ? 'rotate-1 border-pen bg-white text-pen shadow-[3px_4px_0_rgba(224,68,68,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-pen/40 hover:bg-white'
                }`}
              >
                <MiniGrid n={5} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">5×5</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-pencil">4 в ряд</span>
                </span>
              </button>
            </div>

            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-pencil">Соперник</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onMode('cpu');
                }}
                aria-pressed={mode === 'cpu'}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 ${
                  mode === 'cpu'
                    ? '-rotate-1 border-pen bg-white text-pen shadow-[3px_4px_0_rgba(224,68,68,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-pen/40 hover:bg-white'
                }`}
              >
                <IconBot className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">Компьютер</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-pencil">один на один с ИИ</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onMode('duo');
                }}
                aria-pressed={mode === 'duo'}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 ${
                  mode === 'duo'
                    ? 'rotate-1 border-ink bg-white text-ink shadow-[3px_4px_0_rgba(43,75,216,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-ink/40 hover:bg-white'
                }`}
              >
                <IconUsers className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">Друг</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-pencil">рядом, по очереди</span>
                </span>
              </button>
            </div>

            {mode === 'cpu' && (
              <div className="anim-fadeup mt-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pencil">Уровень</p>
                <div className="mt-1 flex items-end gap-4">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (d.id !== difficulty) {
                          sfx.click();
                          onDifficulty(d.id);
                        }
                      }}
                      aria-pressed={difficulty === d.id}
                      className={`relative cursor-pointer pb-1 font-hand text-[21px] font-semibold leading-none transition-colors ${
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
                <p className="mt-1.5 text-xs leading-snug text-pencil">
                  {difficulty === 'easy' && 'Просто разминается — подыграет тебе.'}
                  {difficulty === 'medium' && 'Иногда зевает, но умеет блокировать.'}
                  {difficulty === 'hard' &&
                    (size === 3
                      ? 'Играет идеально. Лучшее, что ты получишь, — ничья.'
                      : 'Держит весь центр и не прощает ошибок.')}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onPlay}
              className="group mt-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-inkdeep bg-ink px-6 py-2.5 text-[#f2f5ff] shadow-[5px_6px_0_rgba(43,75,216,0.32)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-inkdeep hover:shadow-[7px_9px_0_rgba(43,75,216,0.36)] active:translate-y-1 active:shadow-[2px_2px_0_rgba(43,75,216,0.3)] sm:py-3"
            >
              <IconPlay className="h-6 w-6 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:scale-110" />
              <span className="font-hand text-3xl font-bold tracking-wide sm:text-4xl">Играть</span>
            </button>

            <p className="mt-2 text-center text-xs text-pencil">
              {mode === 'cpu' ? 'Ты играешь крестиками · ' : ''}
              {sizeNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


