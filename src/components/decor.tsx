import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { BoardSize, Player } from '../game/logic';

export function sketchVar(len: number, delay = 0): CSSProperties {
  return { '--len': len, animationDelay: `${delay}s` } as CSSProperties;
}

/* ---------- геометрия рукописных штрихов ---------- */

/** толщина «пера» для линий сетки (в единицах viewBox 300) */
export const GRID_PEN = 4;

/** рукописные линии сетки поля, viewBox 0 0 300 300 */
export function gridLinePaths(size: number): string[] {
  const arr: string[] = [];
  const step = 300 / size;
  for (let i = 1; i < size; i++) {
    const p = Math.round(i * step * 10) / 10;
    arr.push(`M ${p} -6 C ${p - 3} 90, ${p + 3} 210, ${p} 306`);
    arr.push(`M -6 ${p} C 90 ${p - 3}, 210 ${p + 3}, 306 ${p}`);
  }
  return arr;
}

/** толщина «пера» для отметок (viewBox 0 0 100 100) */
export const MARK_STROKE: Record<Player, number> = { x: 9, o: 8.5 };

/** штрихи крестика / нолика в координатах клетки (viewBox 0 0 100 100) */
export function markPaths(p: Player): string[] {
  return p === 'x'
    ? ['M21 19 C 36 37, 58 61, 81 82', 'M80 21 C 62 39, 40 61, 19 79']
    : [
        'M62 16 C 42 8, 18 22, 14 44 C 10 68, 26 88, 50 89 C 74 90, 91 72, 89 49 C 87 28, 73 15, 55 15',
      ];
}

/* ---------- крестик / нолик как отдельные SVG (счёт, мини-лист) ---------- */
export function InkX({ className = '', still = false }: { className?: string; still?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      {markPaths('x').map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={MARK_STROKE.x}
          strokeLinecap="round"
          className={still ? undefined : 'sketch'}
          style={still ? undefined : sketchVar(90, i * 0.13)}
        />
      ))}
    </svg>
  );
}

export function InkO({ className = '', still = false }: { className?: string; still?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d={markPaths('o')[0]}
        stroke="currentColor"
        strokeWidth={MARK_STROKE.o}
        strokeLinecap="round"
        className={still ? undefined : 'sketch'}
        style={still ? undefined : sketchVar(240, 0)}
      />
    </svg>
  );
}

/* ---------- сетка поля отдельным SVG (мини-лист в меню) ---------- */
export function GridLines({ size, className = '' }: { size: number; className?: string }) {
  const paths = useMemo(() => gridLinePaths(size), [size]);
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="none" className={className} fill="none" aria-hidden="true">
      {paths.map((d, i) => (
        <path
          key={`${size}-${i}`}
          d={d}
          stroke="currentColor"
          strokeWidth={GRID_PEN}
          strokeLinecap="round"
          opacity={0.85}
          className="sketch"
          style={sketchVar(340, i * 0.05)}
        />
      ))}
    </svg>
  );
}

/* ---------- каракуля-подчёркивание ---------- */
export function Scribble({ className = '', w = 4 }: { className?: string; w?: number }) {
  return (
    <svg viewBox="0 0 240 20" preserveAspectRatio="none" className={className} fill="none" aria-hidden="true">
      <path d="M4 13 C 45 5, 88 17, 128 10 C 164 4, 202 15, 236 8" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

/* ---------- каракули на полях ---------- */
export type DoodleKind = 'star' | 'spiral' | 'zig' | 'plane' | 'ring' | 'cross';

const DOODLE_NODES: Record<DoodleKind, ReactNode> = {
  star: <path d="M50 12 L59 39 L88 40 L65 57 L73 86 L50 68 L27 86 L35 57 L12 40 L41 39 Z" />,
  spiral: (
    <path d="M50 50 c1 -5 8 -4 8 1 c0 7 -11 8 -13 1 c-3 -9 9 -15 16 -9 c9 7 4 21 -6 23 c-13 3 -24 -9 -20 -21" />
  ),
  zig: <path d="M8 62 L28 38 L46 60 L66 34 L86 58 L94 46" />,
  plane: <path d="M10 66 L90 30 L52 74 L46 56 Z M46 56 L90 30" />,
  ring: <circle cx="50" cy="50" r="30" />,
  cross: <path d="M28 28 L72 72 M72 28 L28 72" />,
};

export function Doodle({ kind, className = '' }: { kind: DoodleKind; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {DOODLE_NODES[kind]}
    </svg>
  );
}

/* ---------- разлёт каракулей при победе ---------- */
const BURST_KINDS: DoodleKind[] = ['star', 'zig', 'ring', 'cross', 'spiral', 'plane'];
const BURST_COLORS = ['#2b4bd8', '#e04444', '#e8a200', '#5a8a4a', '#8b5fbf'];

export function Burst({ seed }: { seed: number }) {
  const bits = useMemo(() => {
    let s = seed * 2654435761 >>> 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2 + rand() * 0.7;
      const dist = 90 + rand() * 130;
      return {
        kind: BURST_KINDS[i % BURST_KINDS.length],
        color: BURST_COLORS[i % BURST_COLORS.length],
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist * 0.85,
        rot: (rand() - 0.5) * 320,
        size: 20 + rand() * 20,
        delay: rand() * 0.12,
      };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      {bits.map((b, i) => (
        <div
          key={i}
          className="anim-burst absolute left-1/2 top-1/2"
          style={
            {
              '--tx': `${b.tx}px`,
              '--ty': `${b.ty}px`,
              '--rot': `${b.rot}deg`,
              animationDelay: `${b.delay}s`,
              color: b.color,
            } as CSSProperties
          }
        >
          <Doodle kind={b.kind} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

/* ---------- мини-сетка для выбора размера поля ---------- */
export function MiniGrid({ n, className = '' }: { n: BoardSize; className?: string }) {
  const cell = 20;
  const total = n * cell;
  const lines: string[] = [];
  for (let i = 1; i < n; i++) {
    const p = i * cell;
    lines.push(`M ${p} 2 C ${p - 1.2} ${total / 3}, ${p + 1.2} ${(total * 2) / 3}, ${p} ${total - 2}`);
    lines.push(`M 2 ${p} C ${total / 3} ${p + 1.2}, ${(total * 2) / 3} ${p - 1.2}, ${total - 2} ${p}`);
  }
  const x = (cx: number, cy: number, r: number, key: string) => (
    <g key={key} strokeWidth={n === 3 ? 3 : 2.4} strokeLinecap="round">
      <path d={`M ${cx - r} ${cy - r} L ${cx + r} ${cy + r}`} />
      <path d={`M ${cx + r} ${cy - r} L ${cx - r} ${cy + r}`} />
    </g>
  );
  const o = (cx: number, cy: number, r: number, key: string) => (
    <circle key={key} cx={cx} cy={cy} r={r} strokeWidth={n === 3 ? 3 : 2.4} />
  );
  return (
    <svg viewBox={`0 0 ${total} ${total}`} className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <g strokeWidth={2} strokeLinecap="round" opacity={0.75}>
        {lines.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {n === 3 ? (
        <>
          {x(10, 10, 5, 'a')}
          {o(30, 30, 5.5, 'b')}
          {x(50, 50, 5, 'c')}
        </>
      ) : (
        <>
          {x(10, 30, 4.5, 'a')}
          {o(50, 50, 4.5, 'b')}
          {x(90, 70, 4.5, 'c')}
          {o(70, 10, 4.5, 'd')}
        </>
      )}
    </svg>
  );
}

/* ---------- рукописные иконки ---------- */
interface IconProps {
  className?: string;
}
const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function IconPlay({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M8.2 5.4 C 12.6 8, 15.4 10.2, 18.6 12.1 C 15.3 14, 12.4 16.2, 8.3 18.7 C 8 14.2, 8.4 9.9, 8.2 5.4 Z" strokeWidth={2.1} />
    </svg>
  );
}

export function IconArrowLeft({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} strokeWidth={2.2} aria-hidden="true">
      <path d="M19.5 12.1 C 14.5 11.7, 10 12.5, 5 12" />
      <path d="M9.6 7.4 L4.8 12 L9.7 16.5" />
    </svg>
  );
}

export function IconArrow({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} strokeWidth={2.2} aria-hidden="true">
      <path d="M4.5 12.1 C 9.5 11.7, 14 12.5, 19 12" />
      <path d="M14.4 7.4 L19.2 12 L14.3 16.5" />
    </svg>
  );
}

export function IconRestart({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M19.5 12 a7.5 7.5 0 1 1 -2.6 -5.7" />
      <path d="M17.3 2.8 L17.1 6.6 L13.4 6.2" />
    </svg>
  );
}

export function IconSound({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4 9.5 L4 14.5 L7.5 14.5 L12 18.5 L12 5.5 L7.5 9.5 Z" />
      <path d="M15.5 9 C 16.8 10.6, 16.8 13.4, 15.5 15" />
      <path d="M18 6.5 C 20.5 9.3, 20.5 14.7, 18 17.5" />
    </svg>
  );
}

export function IconMute({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4 9.5 L4 14.5 L7.5 14.5 L12 18.5 L12 5.5 L7.5 9.5 Z" />
      <path d="M15.5 9.5 L20.5 14.5 M20.5 9.5 L15.5 14.5" />
    </svg>
  );
}

export function IconUsers({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="3" />
      <path d="M3.5 19 C 3.8 15.6, 6 14, 8.5 14 C 11 14, 13.2 15.6, 13.5 19" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M15.5 13.6 C 18.3 13.4, 20.3 15, 20.5 18.4" />
    </svg>
  );
}

export function IconBot({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 8 L12 4.5" />
      <circle cx="12" cy="3.8" r="1.2" />
      <path d="M9.2 13.2 L9.2 13.4 M14.8 13.2 L14.8 13.4" strokeWidth={2.6} />
      <path d="M9.5 16.2 C 10.7 17, 13.3 17, 14.5 16.2" />
    </svg>
  );
}

export function IconPencil({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4.5 19.5 L5.3 16.3 L16.2 5.4 C 17 4.6, 18.3 4.6, 19.1 5.4 C 19.9 6.2, 19.9 7.5, 19.1 8.3 L8.2 19.2 L4.5 19.5 Z" />
      <path d="M14.5 7.1 L17.4 10" />
    </svg>
  );
}
