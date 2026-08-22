/* Самодостаточная интеграция с ВКонтакте — без внешних зависимостей.
   Реализует минимальный handshake VK Bridge: инициализацию и запрос имени
   пользователя. Вне клиента ВК (например, на GitHub Pages) все вызовы
   безопасно превращаются в no-op. */

const IS_WEB = typeof window !== 'undefined';
const win = IS_WEB ? (window as unknown as Record<string, any>) : null;

const isAndroid = !!win?.AndroidBridge;
const isIOS = !!win?.webkit?.messageHandlers?.VKWebAppClose;
const isIframe = IS_WEB && window.parent !== window;
const isVk = isAndroid || isIOS || isIframe;

let frameId: string | undefined;

function send(method: string, params: Record<string, unknown> = {}): void {
  if (!isVk) return;
  try {
    if (isAndroid) {
      win.AndroidBridge[method]?.(JSON.stringify(params));
    } else if (isIOS) {
      win.webkit.messageHandlers[method]?.postMessage(params);
    } else if (isIframe) {
      window.parent.postMessage(
        {
          handler: method,
          params,
          type: 'vk-connect',
          webFrameId: frameId,
          connectVersion: '3.0.2',
        },
        '*',
      );
    }
  } catch {
    /* вне ВК или без доступа к parent — тихо */
  }
}

/** Инициализация мини-приложения. Безопасна в любом окружении. */
export function initVk(): void {
  if (!isVk) return;
  try {
    window.addEventListener('message', (e) => {
      const data = typeof e.data === 'string' ? tryParse(e.data) : e.data;
      if (data?.type === 'VKWebAppSettings' && data.frameId) frameId = data.frameId;
    });
  } catch {
    /* ок */
  }
  send('VKWebAppInit');
}

/** Запрашивает имя пользователя ВК. Вне ВК или при таймауте — null. */
export function fetchVkName(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isVk || !IS_WEB) {
      resolve(null);
      return;
    }
    const requestId = `userinfo_${Math.random().toString(36).slice(2, 9)}`;
    let done = false;

    const finish = (name: string | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onEvent);
      window.removeEventListener('VKWebAppEvent', onEvent as EventListener);
      resolve(name);
    };

    const onEvent = (e: Event) => {
      try {
        const raw = (e as MessageEvent).data ?? (e as CustomEvent).detail;
        const data = typeof raw === 'string' ? tryParse(raw) : raw;
        if (!data || typeof data !== 'object') return;
        const payload = data.s ?? data;
        const inner = payload?.data ?? payload;
        const rid = payload?.request_id ?? inner?.request_id ?? data.request_id;
        if (rid && rid !== requestId) return;
        const first = inner?.first_name ?? data.first_name;
        if (typeof first === 'string' && first) finish(first);
      } catch {
        /* игнорируем посторонние сообщения */
      }
    };

    window.addEventListener('message', onEvent);
    window.addEventListener('VKWebAppEvent', onEvent as EventListener);
    send('VKWebAppGetUserInfo', { request_id: requestId });
    window.setTimeout(() => finish(null), 1500);
  });
}

function tryParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
