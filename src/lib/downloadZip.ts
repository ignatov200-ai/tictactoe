import JSZip from 'jszip';

export type ZipStatus = 'idle' | 'working' | 'done' | 'error';

/**
 * Собирает ТЕКУЩУЮ запущенную сборку игры в ZIP и скачивает его.
 * Работает прямо в браузере: берёт HTML открытой страницы,
 * находит подключённые стили и скрипты, скачивает их и архивирует.
 * Получившийся архив можно вручную загрузить на хостинг VK Mini Apps.
 */
export async function downloadBuildZip(): Promise<void> {
  const zip = new JSZip();

  /* 1. HTML открытой страницы */
  const html = await fetch(window.location.href, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error('Не удалось прочитать страницу');
    return r.text();
  });

  /* 2. Все подключённые ассеты (css, js, modulepreload) */
  const assetUrls = new Set<string>();
  const patterns: RegExp[] = [
    /<link[^>]+href="([^"]+\.css[^"]*)"/gi,
    /<script[^>]+src="([^"]+)"/gi,
    /<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) assetUrls.add(m[1]);
  }

  /* 3. Скачиваем ассеты и кладём в архив с относительными путями */
  for (const url of assetUrls) {
    const abs = new URL(url, window.location.origin);
    if (abs.origin !== window.location.origin) continue; // внешнее (шрифты) не трогаем
    const res = await fetch(abs.href, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Не удалось скачать ${abs.pathname}`);
    zip.file(abs.pathname.replace(/^\//, ''), await res.blob());
  }

  zip.file('index.html', html);

  /* 4. Отдаём файл пользователю */
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 7 },
  });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'krestiki-noliki-vk.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 5000);
}
