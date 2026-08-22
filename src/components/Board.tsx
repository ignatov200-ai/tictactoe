import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { BoardState, BoardSize, Player } from '../game/logic';
import { gridPaths, O_STROKE, sketchVar, X_STROKES } from './decor';

/* Единое игровое поле.
   Сетка, крестики, нолики, подсветка победы и зачёркивание нарисованы
   в ОДНОМ SVG с общей системой координат (0..300). Отметки стоят в
   математически точных центрах клеток, и слои не могут сместиться друг
   относительно друга ни на каком устройстве — ни на ПК, ни на мобильном.
   Сверху лежит только прозрачная сетка кнопок для тапов. */

const INK = '#2b4bd8';
const PEN = '#e04444';
const GRID = '#8ba0c4';
const HL = '#ffe28a';
const BOX = 300;

interface BoardProps {
  board: BoardState;
  size: BoardSize;
  current: Player;
  /** может ли человек сейчас ставить отметку */
  interactive: boolean;
  ended: boolean;
  line: number[] | null;
  onTapCell: (i: number) => void;
}

export function BoardView({
  board,
  size,
  current,
  interactive,
  ended,
  line,
  onTapCell,
}: BoardProps) {
  const [hover, setHover] = useState<number | null>(null);
  const grid = useMemo(() => gridPaths(size), [size]);

  const cell = BOX / size;
  const markScale = (cell * 0.72) / 100;
  const markOff = cell * 0.14;
  const colOf = (i: number) => i % size;
  const rowOf = (i: number) => Math.floor(i / size);
  const centerOf = (i: number): [number, number] => [
    (colOf(i) + 0.5) * cell,
    (rowOf(i) + 0.5) * cell,
  ];

  const mark = (i: number, player: Player, ghost: boolean): ReactElement => (
    <g
      key={ghost ? `ghost-${i}` : `mark-${i}-${player}`}
      transform={`translate(${colOf(i) * cell + markOff} ${rowOf(i) * cell + markOff}) scale(${markScale})`}
      opacity={ghost ? 0.25 : 1}
    >
      {player === 'x'
        ? X_STROKES.map((s, k) => (
            <path
              key={k}
              d={s.d}
              stroke={INK}
              strokeWidth={s.w}
              strokeLinecap="round"
              fill="none"
              className={ghost ? undefined : 'sketch'}
              style={ghost ? undefined : sketchVar(s.len, k * 0.13)}
            />
          ))
        : null}
      {player === 'o' ? (
        <path
          d={O_STROKE.d}
          stroke={PEN}
          strokeWidth={O_STROKE.w}
          strokeLinecap="round"
          fill="none"
          className={ghost ? undefined : 'sketch'}
          style={ghost ? undefined : sketchVar(O_STROKE.len, 0)}
        />
      ) : null}
    </g>
  );

  /* зачёркивание победной комбинации — в тех же координатах */
  let strike: ReactElement | null = null;
  if (line) {
    const [x1, y1] = centerOf(line[0]);
    const [x2, y2] = centerOf(line[line.length - 1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L;
    const uy = dy / L;
    const ax = x1 - ux * cell * 0.36;
    const ay = y1 - uy * cell * 0.36;
    const bx = x2 + ux * cell * 0.36;
    const by = y2 + uy * cell * 0.36;
    const mx = (ax + bx) / 2 - uy * cell * 0.15;
    const my = (ay + by) / 2 + ux * cell * 0.15;
    const len = Math.hypot(bx - ax, by - ay) + 8;
    strike = (
      <path
        key={`strike-${line.join('-')}`}
        d={`M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`}
        stroke={PEN}
        strokeWidth={size === 3 ? 10 : 7.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
        className="sketch"
        style={sketchVar(len, 0.15)}
      />
    );
  }

  const ghostIndex =
    interactive && !ended && hover !== null && !board[hover] ? hover : null;

  const cols = size === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5';

  return (
    <div className="relative h-full w-full" onMouseLeave={() => setHover(null)}>
      {/* всё поле — один SVG с общей системой координат */}
      <svg
        viewBox={`0 0 ${BOX} ${BOX}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* рукописная сетка */}
        <g stroke={GRID} fill="none" strokeLinecap="round" opacity={0.85}>
          {grid.map((d, i) => (
            <path
              key={`${size}-${i}`}
              d={d}
              strokeWidth={cell / 16}
              className="sketch"
              style={sketchVar(BOX + 40, i * 0.05)}
            />
          ))}
        </g>

        {/* маркер-подсветка победных клеток */}
        {line?.map((i) => (
          <rect
            key={`hl-${i}`}
            x={colOf(i) * cell + cell * 0.07}
            y={rowOf(i) * cell + cell * 0.07}
            width={cell * 0.86}
            height={cell * 0.86}
            rx={cell * 0.14}
            fill={HL}
            opacity={0.55}
          />
        ))}

        {/* отметки — точно в центрах клеток */}
        {board.map((v, i) => (v ? mark(i, v, false) : null))}

        {/* превью хода при наведении */}
        {ghostIndex !== null ? mark(ghostIndex, current, true) : null}

        {strike}
      </svg>

      {/* прозрачные кнопки для тапов и доступности */}
      <div className={`absolute inset-0 grid ${cols}`}>
        {board.map((value, i) => {
          const clickable = (!value && interactive && !ended) || ended;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTapCell(i)}
              onMouseEnter={() => setHover(i)}
              aria-label={`Клетка ${i + 1}${
                value ? (value === 'x' ? ', крестик' : ', нолик') : ', свободно'
              }`}
              className={`touch-manipulation ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              } ${!value && interactive && !ended ? 'hover:bg-[#e9f0fb]/60' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
