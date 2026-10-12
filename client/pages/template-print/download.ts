import type { ApiClient, ApiRequestOptions } from '@nocobase/app-client';
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export class DownloadError extends Error {
  constructor(public readonly reason: 'invalidDocument' | 'documentTooLarge') {
    super(reason);
  }
}
export function documentName(name: string, revision?: number) {
  const safe = [...name]
    .map((c) =>
      c.charCodeAt(0) < 32 ||
      c.charCodeAt(0) === 127 ||
      /[/\\<>:"|?*\u202a-\u202e\u2066-\u2069]/.test(c)
        ? '_'
        : c,
    )
    .join('')
    .slice(0, 140)
    .trim();
  return `${safe || 'document'}${revision === undefined ? '' : `-${revision}`}.docx`;
}
/** Use the exact injected client. Its public stream API intentionally exposes no filename headers. */
export async function downloadDocx(
  api: Pick<ApiClient, 'stream'>,
  options: ApiRequestOptions,
  filename: string,
) {
  const stream = await api.stream({
    ...options,
    headers: { Accept: DOCX_MIME },
  });
  const reader = stream.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let length = 0;
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      if (options.signal?.aborted)
        throw new DOMException('Aborted', 'AbortError');
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > 32 * 1024 * 1024)
        throw new DownloadError('documentTooLarge');
      chunks.push(new Uint8Array(result.value));
    }
    if (options.signal?.aborted)
      throw new DOMException('Aborted', 'AbortError');
    const bytes = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    if (
      bytes.length < 4 ||
      bytes[0] !== 80 ||
      bytes[1] !== 75 ||
      bytes[2] !== 3 ||
      bytes[3] !== 4
    )
      throw new DownloadError('invalidDocument');
    const url = URL.createObjectURL(new Blob([bytes], { type: DOCX_MIME }));
    const link = document.createElement('a');
    try {
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}
