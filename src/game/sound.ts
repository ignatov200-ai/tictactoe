/* Крошечный синтезатор на WebAudio: короткие «чернильные» звуки без файлов. */

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('xn-o-muted') === '1';
} catch {
  /* приватный режим — играем со звуком */
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  return ctx;
}

interface ToneOpts {
  f: number;
  to?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
}

function tone({ f, to, type = 'sine', dur = 0.12, gain = 0.12, delay = 0 }: ToneOpts) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    const t0 = c.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* звук — не повод падать */
  }
}

export const sfx = {
  isMuted(): boolean {
    return muted;
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem('xn-o-muted', m ? '1' : '0');
    } catch {
      /* ок */
    }
  },
  /** крестик — звонкий росчерк */
  placeX() {
    tone({ f: 640, to: 920, type: 'triangle', dur: 0.09, gain: 0.15 });
  },
  /** нолик — мягкий округлый тон */
  placeO() {
    tone({ f: 430, to: 300, type: 'sine', dur: 0.14, gain: 0.17 });
  },
  click() {
    tone({ f: 900, to: 680, type: 'square', dur: 0.05, gain: 0.05 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ f, type: 'triangle', dur: 0.15, gain: 0.14, delay: i * 0.09 }),
    );
  },
  lose() {
    tone({ f: 392, to: 220, type: 'sawtooth', dur: 0.42, gain: 0.07 });
    tone({ f: 196, to: 150, type: 'sawtooth', dur: 0.32, gain: 0.07, delay: 0.14 });
  },
  draw() {
    tone({ f: 440, type: 'triangle', dur: 0.1, gain: 0.11 });
    tone({ f: 415, type: 'triangle', dur: 0.14, gain: 0.11, delay: 0.15 });
  },
};
