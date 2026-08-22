import { useMemo, useState } from 'react';
import type { BoardSize, BoardState, Player } from '../game/logic';
import { GRID_PEN, MARK_STROKE, gridLinePaths, markPaths, sketchVar } from './decor';

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

/* Всё поле — сетка, отметки, подсветка и зачёркивание — нарисовано в ОДНОМ
   SVG с единой системой координат (0–300). Отметки стоят в математически
   точных центрах клеток, поэтому слои физически не могут разъехаться ни на
   каком экране. Поверх лежит лишь прозрачная сетка кнопок для тапов. */
export function BoardView({ board, size, current, interactive, ended, line, onTapCell }: BoardProps) {
  const [hover, setHover] = useState<number | null>(null);
  const cell = 300 / size;
  const paths = useMemo(() => gridLinePaths(size), [size]);

  const btnCols = size === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5';
  const btnRadius = size === 3 ? 'rounded-2xl' : 'rounded-xl';

  const strike = useMemo(() => {
    if (!line) return null;
    const c = (i: number): [number, number] => [
      ((i % size) + 0.5) * cell,
      (Math.floor(i / size) + 0.5) * cell,
    ];
    const [x1, y1] = c(line[0]);
    const [x2, y2] = c(line[line.length - 1]);
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
    return { d: `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`, len: Math.hypot(bx - ax, by - ay) + 10 };
  }, [line, size, cell]);

  return (
    <div className="relative aspect-square w-full">
      {/* единый SVG поля */}
      <svg viewBox="0 0 300 300" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
        {/* рукописная сетка */}
        <g stroke="#8ba0c4" strokeWidth={GRID_PEN} strokeLinecap="round" opacity={0.9}>
          {paths.map((d, i) => (
            <path key={`g-${i}`} d={d} className="sketch" style={sketchVar(340, i * 0.04)} />
          ))}
        </g>

        {/* подсветка победных клеток */}
        {line?.map((i) => (
          <rect
            key={`hl-${i}`}
            x={(i % size) * cell + 4}
            y={Math.floor(i / size) * cell + 4}
            width={cell - 8}
            height={cell - 8}
            rx={cell * 0.14}
            fill="#ffe28a"
            opacity={0.55}
            className="anim-pop"
          />
        ))}

        {/* отметки — ровно в центрах клеток */}
        {board.map((v, i) => {
          if (!v) return null;
          const x = (i % size) * cell;
          const y = Math.floor(i / size) * cell;
          return (
            <g
              key={`m-${i}`}
              transform={`translate(${x + cell * 0.14} ${y + cell * 0.14}) scale(${(cell * 0.72) / 100})`}
              stroke={v === 'x' ? '#2b4bd8' : '#e04444'}
              strokeWidth={MARK_STROKE[v]}
              strokeLinecap="round"
            >
              {markPaths(v).map((d, k) => (
                <path key={k} d={d} className="sketch" style={sketchVar(v === 'x' ? 90 : 240, k * 0.12)} />
              ))}
            </g>
          );
        })}

        {/* зачёркивание победного ряда */}
        {strike && (
          <path
            d={strike.d}
            stroke="#e04444"
            strokeWidth={cell * 0.09}
            strokeLinecap="round"
            opacity={0.7}
            className="sketch"
            style={sketchVar(strike.len, 0.1)}
          />
        )}
      </svg>

      {/* прозрачные кнопки для тапов + превью при наведении */}
      <div className={`absolute inset-0 grid ${btnCols}`}>
        {board.map((value, i) => {
          const showGhost = !value && interactive && !ended && hover === i;
          const clickable = (!value && interactive) || ended;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTapCell(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              aria-label={`Клетка ${i + 1}${value ? (value === 'x' ? ', крестик' : ', нолик') : ', свободно'}`}
              className={`relative touch-manipulation ${btnRadius} transition-colors duration-150 ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              } ${!value && interactive && !ended ? 'hover:bg-[#e9f0fb]/70' : ''}`}
            >
              {showGhost && (
                <svg
                  viewBox="0 0 100 100"
                  className="pointer-events-none absolute"
                  style={{ left: '14%', top: '14%', width: '72%', height: '72%', opacity: 0.25 }}
                  fill="none"
                  stroke={current === 'x' ? '#2b4bd8' : '#e04444'}
                  strokeWidth={MARK_STROKE[current]}
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  {markPaths(current).map((d, k) => (
                    <path key={k} d={d} />
                  ))}
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
