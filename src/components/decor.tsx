import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export function sketchVar(len: number, delay = 0): CSSProperties {
  return { '--len': len, animationDelay: `${delay}s` } as CSSProperties;
}

/* ---------- крестик, нарисованный ручкой ---------- */
export function InkX({ className = '', still = false }: { className?: string; still?: boolean }) {
  const cls = still ? undefined : 'sketch';
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d="M21 19 C 36 37, 58 61, 81 82"
        stroke="currentColor"
        strokeWidth={9}
        strokeLinecap="round"
        className={cls}
        style={still ? undefined : sketchVar(90, 0)}
      />
      <path
        d="M80 21 C 62 39, 40 61, 19 79"
        stroke="currentColor"
        strokeWidth={8}
        strokeLinecap="round"
        className={cls}
        style={still ? undefined : sketchVar(90, 0.13)}
      />
    </svg>
  );
}

/* ---------- нолик ---------- */
export function InkO({ className = '', still = false }: { className?: string; still?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
      <path
        d="M62 16 C 42 8, 18 22, 14 44 C 10 68, 26 88, 50 89 C 74 90, 91 72, 89 49 C 87 28, 73 15, 55 15"
        stroke="currentColor"
        strokeWidth={8.5}
        strokeLinecap="round"
        className={still ? undefined : 'sketch'}
        style={still ? undefined : sketchVar(240, 0)}
      />
    </svg>
  );
}

/* ---------- рукописная сетка поля ---------- */
export function GridLines({ size = 3, className = '' }: { size?: number; className?: string }) {
  const pos = Array.from({ length: size - 1 }, (_, k) => ((k + 1) / size) * 100);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {pos.map((p, k) => (
        <path
          key={`v${k}`}
          d={`M ${p} 2 Q ${p + (k % 2 ? 0.7 : -0.7)} 50 ${p} 98`}
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.8}
          className="sketch"
          style={sketchVar(102, k * 0.06)}
        />
      ))}
      {pos.map((p, k) => (
        <path
          key={`h${k}`}
          d={`M 2 ${p} Q 50 ${p + (k % 2 ? -0.7 : 0.7)} 98 ${p}`}
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.8}
          className="sketch"
          style={sketchVar(102, k * 0.06 + 0.25)}
        />
      ))}
    </svg>
  );
}

/* ---------- зачёркивающая линия победной комбинации ---------- */
export function StrikeLine({
  line,
  size,
  className = '',
}: {
  line: number[];
  size: number;
  className?: string;
}) {
  const cell = 100 / size;
  const center = (i: number): [number, number] => [
    ((i % size) + 0.5) * cell,
    (Math.floor(i / size) + 0.5) * cell,
  ];
  const [x1, y1] = center(line[0]);
  const [x2, y2] = center(line[line.length - 1]);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const ax = x1 - ux * cell * 0.34;
  const ay = y1 - uy * cell * 0.34;
  const bx = x2 + ux * cell * 0.34;
  const by = y2 + uy * cell * 0.34;
  const mx = (ax + bx) / 2 - uy * cell * 0.16;
  const my = (ay + by) / 2 + ux * cell * 0.16;
  const len = Math.hypot(bx - ax, by - ay) + 8;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
        stroke="currentColor"
        strokeWidth={cell * 0.1}
        strokeLinecap="round"
        opacity={0.7}
        className="sketch"
        style={sketchVar(len, 0.12)}
      />
    </svg>
  );
}

/* ---------- каракуля-подчёркивание ---------- */
export function Scribble({ className = '', w = 4 }: { className?: string; w?: number }) {
  return (
    <svg viewBox="0 0 240 20" preserveAspectRatio="none" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 13 C 45 5, 88 17, 128 10 C 164 4, 202 15, 236 8"
        stroke="currentColor"
        strokeWidth={w}
        strokeLinecap="round"
      />
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
  zig: <path d="M8 62 L28 38 L48 62 L68 38 L88 62" />,
  plane: (
    <>
      <path d="M10 50 L90 14 L58 86 L46 58 Z" />
      <path d="M46 58 L90 14" />
    </>
  ),
  ring: <ellipse cx="50" cy="50" rx="36" ry="30" transform="rotate(-14 50 50)" />,
  cross: (
    <>
      <path d="M27 27 L73 73" />
      <path d="M73 27 L27 73" />
    </>
  ),
};

export function Doodle({
  kind,
  className = '',
  strokeWidth = 5,
}: {
  kind: DoodleKind;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {DOODLE_NODES[kind]}
    </svg>
  );
}

/* ---------- счёт «палочками», как на уроке ---------- */
export function Tally({ count, className = '' }: { count: number; className?: string }) {
  if (count === 0) {
    return <span className={`font-hand text-xl leading-none opacity-40 ${className}`}>·</span>;
  }
  const shown = Math.min(count, 15);
  const groups = Math.ceil(shown / 5);
  const w = groups * 34 + 2;
  const nodes: ReactNode[] = [];
  for (let i = 0; i < shown; i++) {
    const g = Math.floor(i / 5);
    const p = i % 5;
    if (p < 4) {
      const x = 7 + g * 34 + p * 7;
      nodes.push(
        <line key={i} x1={x} y1={4} x2={x - 1.5} y2={26} strokeWidth={3} strokeLinecap="round" />,
      );
    }
  }
  for (let g = 0; g < groups; g++) {
    if (Math.min(shown - g * 5, 5) === 5) {
      nodes.push(
        <line
          key={`d${g}`}
          x1={3 + g * 34}
          y1={24}
          x2={29 + g * 34}
          y2={6}
          strokeWidth={3}
          strokeLinecap="round"
        />,
      );
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} 30`}
      className={className}
      height={16}
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
    >
      {nodes}
    </svg>
  );
}

/* ---------- конфетти из каракулей при победе ---------- */
export function Burst({ seed }: { seed: number }) {
  const parts = useMemo(() => {
    const kinds: DoodleKind[] = ['star', 'zig', 'ring', 'cross', 'spiral', 'plane'];
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (seed % 5) * 0.25 + Math.random() * 0.55;
      const dist = 95 + Math.random() * 130;
      return {
        kind: kinds[(i + seed) % kinds.length],
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 35,
        rot: Math.round(Math.random() * 360 - 180),
        delay: Math.round(Math.random() * 130),
        dur: Math.round(650 + Math.random() * 550),
        size: Math.round(15 + Math.random() * 17),
        color: i % 3 === 0 ? 'text-pen' : i % 3 === 1 ? 'text-ink' : 'text-[#e8a200]',
      };
    });
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 block"
          style={
            {
              width: p.size,
              height: p.size,
              opacity: 0,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
              animation: `burst ${p.dur}ms cubic-bezier(0.2, 0.6, 0.3, 1) ${p.delay}ms forwards`,
            } as CSSProperties
          }
        >
          <Doodle kind={p.kind} className={`h-full w-full ${p.color}`} strokeWidth={8} />
        </span>
      ))}
    </div>
  );
}

/* ---------- иконки, нарисованные от руки ---------- */
type IconProps = { className?: string };
const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconUsers({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.8" cy="9.5" r="2.5" />
      <path d="M15.6 14.4c2.6.2 4.3 1.9 4.9 4.6" />
    </svg>
  );
}

export function IconBot({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 8V5" />
      <circle cx="12" cy="3.6" r="1.1" />
      <circle cx="9.3" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9.4 15.6c1.7 1.2 3.5 1.2 5.2 0" />
    </svg>
  );
}

export function IconRestart({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M19.5 12.5a7.5 7.5 0 1 1-2.2-5.4" />
      <path d="M17.8 3.4v4h-4" />
    </svg>
  );
}

export function IconSound({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4 10v4h3l4.5 3.8V6.2L7 10H4Z" />
      <path d="M15 9.4c1.5 1.5 1.5 3.7 0 5.2" />
      <path d="M17.6 7c2.9 2.9 2.9 7.1 0 10" />
    </svg>
  );
}

export function IconMute({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4 10v4h3l4.5 3.8V6.2L7 10H4Z" />
      <path d="M15 10l5 5" />
      <path d="M20 10l-5 5" />
    </svg>
  );
}

export function IconArrow({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} strokeWidth={2.2} aria-hidden="true">
      <path d="M3 14.5 C 8 5, 13 21, 19 10" />
      <path d="M14.6 9.4 L19.2 9.7 L18.3 14.2" />
    </svg>
  );
}

export function IconDownload({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M12 3.5 C 11.7 7, 12.3 10.5, 12 14.2" />
      <path d="M7.3 10.3 L12 15 L16.7 10.4" />
      <path d="M4.5 17.6 C 7.5 19.2, 16.5 19.2, 19.5 17.7" />
    </svg>
  );
}

export function IconPencil({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...iconBase} aria-hidden="true">
      <path d="M4 20l1.1-4.1L16.6 4.4a2.15 2.15 0 0 1 3 3L8.1 18.9 4 20Z" />
      <path d="M14 7l3 3" />
    </svg>
  );
}

export function VkBadge({ className = '' }: IconProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="6.5" fill="#0077FF" />
        <text
          x="12"
          y="16.4"
          textAnchor="middle"
          fontFamily="'Golos Text', sans-serif"
          fontWeight="700"
          fontSize="10.5"
          fill="#fff"
        >
          VK
        </text>
      </svg>
      мини-приложение для ВКонтакте
    </span>
  );
}
