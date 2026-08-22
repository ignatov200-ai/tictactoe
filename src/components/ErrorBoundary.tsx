import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Вместо «белого экрана» — стилизованный экран с кнопкой перезапуска. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Крестики-нолики упали:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="paper-grid grid h-[100dvh] place-items-center px-6 font-body text-graphite">
          <div className="relative -rotate-1 rounded-xl border border-[#ccd7e8] bg-card/95 p-8 text-center shadow-[6px_7px_0_rgba(90,110,160,0.13)]">
            <div aria-hidden className="tape absolute -top-3 left-1/2 h-5 w-24 -translate-x-1/2 rotate-2 rounded-[2px]" />
            <p className="font-hand text-5xl font-bold text-pen">Ой, клякса!</p>
            <p className="mt-2 max-w-xs text-sm text-pencil">
              Что-то пошло не так. Давай начнём партию заново — всё получится.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-5 cursor-pointer rounded-xl border-2 border-ink bg-ink px-6 py-2.5 font-hand text-2xl font-bold text-[#f2f5ff] shadow-[4px_5px_0_rgba(43,75,216,0.3)] transition-all hover:-translate-y-0.5 hover:bg-inkdeep active:translate-y-0.5 active:shadow-none"
            >
              Перезапустить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
