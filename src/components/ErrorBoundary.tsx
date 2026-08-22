import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Страховка от «белого экрана»: если где-то в игре случится
 * непредвиденная ошибка, пользователь увидит понятный экран
 * с кнопкой перезапуска, а не пустую страницу.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[крестики-нолики] ошибка в игре:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="paper-grid"
        style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}
      >
        <div
          style={{
            maxWidth: 380,
            background: '#fffef9',
            border: '1px solid #ccd7e8',
            borderRadius: 14,
            boxShadow: '6px 7px 0 rgba(90,110,160,0.13)',
            padding: '28px 26px',
            textAlign: 'center',
            fontFamily: '"Golos Text", "Segoe UI", system-ui, sans-serif',
            color: '#39445a',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: '"Caveat", "Segoe Print", cursive',
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.05,
              color: '#e04444',
              transform: 'rotate(-1deg)',
            }}
          >
            Ой, клякса!
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 14, color: '#8b95a8', lineHeight: 1.5 }}>
            Что-то пошло не так на листке. Нажми кнопку — и начнём партию заново.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              cursor: 'pointer',
              fontFamily: '"Caveat", "Segoe Print", cursive',
              fontSize: 26,
              fontWeight: 700,
              color: '#f2f5ff',
              background: '#2b4bd8',
              border: '2px solid #1f3aa8',
              borderRadius: 12,
              padding: '8px 30px',
              boxShadow: '4px 5px 0 rgba(43,75,216,0.3)',
            }}
          >
            Перезапустить
          </button>
        </div>
      </div>
    );
  }
}
