import { useState } from 'react';
import type { BoardState, BoardSize, Player } from '../game/logic';
import { GridLines, InkO, InkX, StrikeLine } from './decor';

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

export function BoardView({ board, size, current, interactive, ended, line, onTapCell }: BoardProps) {
  const [hover, setHover] = useState<number | null>(null);
  const cols = size === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5 grid-rows-5';
  const inset = size === 3 ? 'inset-[13%]' : 'inset-[11%]';
  const winInset = size === 3 ? 'inset-[7%]' : 'inset-[4%]';
  const radius = size === 3 ? 'rounded-2xl' : 'rounded-xl';

  return (
    <div className="relative aspect-square w-full">
      <GridLines size={size} className="absolute inset-0 h-full w-full text-[#8ba0c4]" />

      <div className={`absolute inset-0 grid ${cols}`}>
        {board.map((value, i) => {
          const inWin = line?.includes(i) ?? false;
          const showGhost = !value && interactive && !ended && hover === i;
          const clickable = (!value && interactive) || ended;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTapCell(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              aria-label={`Клетка ${i + 1}${
                value ? (value === 'x' ? ', крестик' : ', нолик') : ', свободно'
              }`}
              className={`relative touch-manipulation ${radius} transition-colors duration-150 ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              } ${!value && interactive && !ended ? 'hover:bg-[#e9f0fb]/70' : ''}`}
            >
              {inWin && (
                <span className={`anim-pop absolute ${winInset} rounded-xl bg-hl/60`} />
              )}
              {value === 'x' && <InkX className={`absolute ${inset} text-ink`} />}
              {value === 'o' && <InkO className={`absolute ${inset} text-pen`} />}
              {showGhost &&
                (current === 'x' ? (
                  <InkX still className={`absolute ${inset} text-ink opacity-25`} />
                ) : (
                  <InkO still className={`absolute ${inset} text-pen opacity-25`} />
                ))}
            </button>
          );
        })}
      </div>

      {line && (
        <StrikeLine
          line={line}
          size={size}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full text-pen"
        />
      )}
    </div>
  );
}
