import type { BoardSize, Difficulty } from '../game/logic';
import type { ZipStatus } from '../lib/downloadZip';
import {
  Doodle,
  GridLines,
  IconBot,
  IconDownload,
  IconMute,
  IconPlay,
  IconSound,
  IconUsers,
  InkO,
  InkX,
  MiniGrid,
  VkBadge,
} from './decor';

export type Mode = 'duo' | 'cpu';

const DIFFS: { id: Difficulty; label: string; note: string }[] = [
  { id: 'easy', label: 'лёгкий', note: 'компьютер поддаётся и разминается' },
  { id: 'medium', label: 'средний', note: 'блокирует угрозы, но иногда зевает' },
  { id: 'hard', label: 'мастер', note: 'играет идеально — максимум ничья' },
];

interface MenuScreenProps {
  size: BoardSize;
  mode: Mode;
  difficulty: Difficulty;
  vkName: string | null;
  muted: boolean;
  zipStatus: ZipStatus;
  onSize: (s: BoardSize) => void;
  onMode: (m: Mode) => void;
  onDifficulty: (d: Difficulty) => void;
  onToggleSound: () => void;
  onPlay: () => void;
  onDownloadZip: () => void;
}

export function MenuScreen({
  size,
  mode,
  difficulty,
  vkName,
  muted,
  zipStatus,
  onSize,
  onMode,
  onDifficulty,
  onToggleSound,
  onPlay,
  onDownloadZip,
}: MenuScreenProps) {
  const diffNote = DIFFS.find((d) => d.id === difficulty)?.note ?? '';

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-5 sm:px-8 sm:py-8">
      <div className="anim-screenin my-auto w-full max-w-4xl md:grid md:grid-cols-[1.05fr_1fr] md:items-center md:gap-8 lg:gap-14">
        {/* ---------- обложка ---------- */}
        <div className="relative mx-auto w-full max-w-md text-center md:mx-0 md:text-left">
          <div
            aria-hidden
            className="anim-floaty absolute -top-8 right-2 h-12 w-12 text-[#c3d2ea] lg:-right-10"
            style={{ animationDuration: '7.5s' }}
          >
            <Doodle kind="star" className="h-full w-full" />
          </div>
          <div
            aria-hidden
            className="anim-floaty absolute -left-8 bottom-16 hidden h-14 w-14 text-[#f0c6c6] lg:block"
            style={{ animationDuration: '9s', animationDelay: '1s' }}
          >
            <Doodle kind="spiral" className="h-full w-full" />
          </div>

          <div className="anim-fadeup relative inline-block">
            <div aria-hidden className="tape absolute -left-7 -top-4 h-5 w-16 -rotate-12 rounded-[2px]" />
            <div aria-hidden className="tape absolute -right-5 -top-2 h-4 w-12 rotate-6 rounded-[2px]" />
            <h1 className="-rotate-1 font-hand font-bold leading-[0.88]">
              <span className="block text-[46px] text-ink sm:text-6xl md:text-7xl lg:text-[84px]">Крестики</span>
              <span className="my-0.5 block text-xl tracking-[0.2em] text-pencil sm:my-1 sm:text-3xl">— и —</span>
              <span className="block text-[46px] text-pen sm:text-6xl md:text-7xl lg:text-[84px]">нолики</span>
            </h1>
          </div>

          <p className="anim-fadeup mt-3 -rotate-1 font-hand text-xl text-graphite/80 sm:mt-4 sm:text-3xl" style={{ animationDelay: '0.1s' }}>
            школьная классика на листке в клетку
          </p>

          {vkName && (
            <div className="anim-fadeup mt-4 inline-block rotate-1 rounded-sm bg-[#fdf3b1] px-3 py-1.5 font-hand text-2xl font-semibold text-[#7a6a1f] shadow-[2px_3px_0_rgba(120,100,20,0.15)]" style={{ animationDelay: '0.18s' }}>
              Привет, {vkName}! Готов сыграть?
            </div>
          )}

          {/* мини-поле, как нарисованное на уроке */}
          <div
            aria-hidden
            className="anim-floaty absolute -bottom-10 right-0 hidden h-36 w-36 rotate-6 lg:block"
            style={{ animationDuration: '8s', animationDelay: '0.5s' }}
          >
            <div className="tape absolute -top-2 left-1/2 z-10 h-4 w-14 -translate-x-1/2 rotate-2 rounded-[2px]" />
            <div className="absolute inset-0 rounded-md border border-[#d3dcec] bg-[#fffef8] p-2 shadow-[4px_5px_0_rgba(90,110,160,0.15)]">
              <div className="relative h-full w-full">
                <GridLines className="absolute inset-0 h-full w-full text-[#8ba0c4]" />
                <InkX className="absolute left-[3%] top-[3%] h-[30%] w-[30%] text-ink" />
                <InkO className="absolute left-[35%] top-[35%] h-[30%] w-[30%] text-pen" />
                <InkX className="absolute left-[67%] top-[67%] h-[30%] w-[30%] text-ink" />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- настройки партии ---------- */}
        <div className="anim-fadeup relative mx-auto mt-6 w-full max-w-md md:mx-0 md:mt-0" style={{ animationDelay: '0.14s' }}>
          <div aria-hidden className="tape absolute -top-3 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rotate-2 rounded-[2px]" />
          <div className="rotate-0 rounded-xl border border-[#ccd7e8] bg-card/95 p-4 shadow-[6px_7px_0_rgba(90,110,160,0.13)] sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">
                Настройка партии
              </h2>
              <button
                type="button"
                onClick={onToggleSound}
                aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-[#b9c6dd] bg-card text-graphite transition-transform hover:-rotate-6 hover:scale-105 active:scale-95"
              >
                {muted ? <IconMute className="h-4 w-4" /> : <IconSound className="h-4 w-4" />}
              </button>
            </div>

            {/* размер поля */}
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">Поле</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onSize(3)}
                aria-pressed={size === 3}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 sm:gap-3 sm:p-3 ${
                  size === 3
                    ? '-rotate-1 border-ink bg-white text-ink shadow-[3px_4px_0_rgba(43,75,216,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-ink/40 hover:bg-white'
                }`}
              >
                <MiniGrid n={3} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">3×3</span>
                  <span className="mt-0.5 block text-[11px] text-pencil">3 в ряд</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSize(5)}
                aria-pressed={size === 5}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 sm:gap-3 sm:p-3 ${
                  size === 5
                    ? 'rotate-1 border-pen bg-white text-pen shadow-[3px_4px_0_rgba(224,68,68,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-pen/40 hover:bg-white'
                }`}
              >
                <MiniGrid n={5} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">5×5</span>
                  <span className="mt-0.5 block text-[11px] text-pencil">4 в ряд</span>
                </span>
              </button>
            </div>

            {/* соперник */}
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">Соперник</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onMode('cpu')}
                aria-pressed={mode === 'cpu'}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 sm:gap-3 sm:p-3 ${
                  mode === 'cpu'
                    ? '-rotate-1 border-pen bg-white text-pen shadow-[3px_4px_0_rgba(224,68,68,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-pen/40 hover:bg-white'
                }`}
              >
                <IconBot className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">Компьютер</span>
                  <span className="mt-0.5 block text-[11px] text-pencil">ты — крестики</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onMode('duo')}
                aria-pressed={mode === 'duo'}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all duration-150 sm:gap-3 sm:p-3 ${
                  mode === 'duo'
                    ? 'rotate-1 border-ink bg-white text-ink shadow-[3px_4px_0_rgba(43,75,216,0.18)]'
                    : 'border-[#dbe3f0] bg-white/70 text-graphite hover:border-ink/40 hover:bg-white'
                }`}
              >
                <IconUsers className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
                <span>
                  <span className="block font-hand text-xl font-bold leading-none sm:text-2xl">Друг</span>
                  <span className="mt-0.5 block text-[11px] text-pencil">вдвоём на одном</span>
                </span>
              </button>
            </div>

            {/* сложность */}
            {mode === 'cpu' && (
              <div className="anim-fadeup mt-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pencil">Уровень</p>
                <div className="mt-1.5 flex items-end gap-4">
                  {DIFFS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onDifficulty(d.id)}
                      aria-pressed={difficulty === d.id}
                      className={`relative cursor-pointer pb-1 font-hand text-[22px] font-semibold leading-none transition-colors ${
                        difficulty === d.id ? 'text-pendeep' : 'text-pencil hover:text-graphite'
                      }`}
                    >
                      {d.label}
                      {difficulty === d.id && (
                        <svg viewBox="0 0 240 20" preserveAspectRatio="none" className="absolute -bottom-0.5 left-0 h-2 w-full text-pen" fill="none" aria-hidden="true">
                          <path d="M4 13 C 45 5, 88 17, 128 10 C 164 4, 202 15, 236 8" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-pencil">{diffNote}</p>
              </div>
            )}

            {/* играть */}
            <button
              type="button"
              onClick={onPlay}
              className="group mt-4 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-inkdeep bg-ink px-6 py-2.5 text-[#f2f5ff] shadow-[5px_6px_0_rgba(43,75,216,0.32)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-inkdeep hover:shadow-[7px_9px_0_rgba(43,75,216,0.36)] active:translate-y-1 active:shadow-[2px_2px_0_rgba(43,75,216,0.3)] sm:mt-6 sm:py-3.5"
            >
              <IconPlay className="h-6 w-6 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:scale-110" />
              <span className="font-hand text-3xl font-bold tracking-wide sm:text-4xl">Играть</span>
            </button>

            <p className="mt-2 text-center text-xs text-pencil sm:mt-3">
              поле {size}×{size} · {mode === 'cpu' ? `против компьютера, уровень «${DIFFS.find((d) => d.id === difficulty)?.label}»` : 'двое на одном экране'} · счёт матча сохранится
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 pb-2">
            <VkBadge className="text-[11px] text-pencil" />
            <button
              type="button"
              onClick={onDownloadZip}
              disabled={zipStatus === 'working'}
              title="Собрать игру в ZIP — его можно загрузить на хостинг ВКонтакте вручную"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-dashed px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-150 ${
                zipStatus === 'working'
                  ? 'cursor-wait border-graphite/40 text-graphite/60'
                  : zipStatus === 'done'
                    ? 'border-pen/60 text-pen'
                    : zipStatus === 'error'
                      ? 'border-pen text-pen'
                      : 'border-ink/50 text-ink hover:-translate-y-0.5 hover:border-ink hover:bg-[#e9f0fb] active:translate-y-0'
              }`}
            >
              <IconDownload className="h-3.5 w-3.5" />
              {zipStatus === 'working' ? 'Пакуем…' : zipStatus === 'done' ? 'Скачано!' : zipStatus === 'error' ? 'Ещё раз' : 'Скачать ZIP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
