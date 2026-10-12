import { expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadDocx,
  documentName,
  DOCX_MIME,
} from '../../../client/pages/template-print/download.js';
import { ApiClientError } from '@nocobase/app-client';
const create = vi.fn(() => 'blob:print');
const revoke = vi.fn();
let click: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = create;
      static revokeObjectURL = revoke;
    },
  );
  click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  create.mockClear();
  revoke.mockClear();
});
afterEach(() => {
  vi.runAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  click.mockRestore();
});
it('uses the injected stream transport and current request tuple, retaining Unicode in a controlled filename', async () => {
  const stream = vi.fn(
    async () =>
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new Uint8Array([80, 75, 3, 4, 1]));
          c.close();
        },
      }),
  );
  const controller = new AbortController();
  await downloadDocx(
    { stream },
    {
      path: 'printTemplates/t/render',
      method: 'POST',
      json: { recordId: 'owned', revisionId: 'frozen', locale: 'zh-CN' },
      signal: controller.signal,
    },
    documentName('申请/示例'),
  );
  expect(stream).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'printTemplates/t/render',
      method: 'POST',
      json: { recordId: 'owned', revisionId: 'frozen', locale: 'zh-CN' },
      headers: { Accept: DOCX_MIME },
    }),
  );
  expect(click).toHaveBeenCalledOnce();
  expect(create).toHaveBeenCalledOnce();
  expect(revoke).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(revoke).toHaveBeenCalledWith('blob:print');
  expect(document.querySelector('a')).toBeNull();
});
it('rejects successful JSON bytes instead of creating an error download', async () => {
  const stream = vi.fn(
    async () =>
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode('{"error":"private"}'));
          c.close();
        },
      }),
  );
  await expect(
    downloadDocx({ stream }, { path: 'private' }, 'safe.docx'),
  ).rejects.toMatchObject({ reason: 'invalidDocument' });
  expect(create).not.toHaveBeenCalled();
  expect(click).not.toHaveBeenCalled();
});
it('propagates authorized client JSON failures without reading or saving bytes', async () => {
  const error = new ApiClientError('denied', {
    status: 403,
    method: 'POST',
    url: '/main/api/printTemplates/t/render',
  });
  await expect(
    downloadDocx(
      { stream: vi.fn().mockRejectedValue(error) },
      { path: 'printTemplates/t/render' },
      'safe.docx',
    ),
  ).rejects.toBe(error);
  expect(create).not.toHaveBeenCalled();
});
it('cancels an oversized stream and releases its lock', async () => {
  const cancel = vi.fn();
  const value = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array(32 * 1024 * 1024 + 1));
    },
    cancel,
  });
  await expect(
    downloadDocx(
      { stream: async () => value },
      { path: 'oversize' },
      'safe.docx',
    ),
  ).rejects.toMatchObject({ reason: 'documentTooLarge' });
  expect(cancel).toHaveBeenCalledOnce();
  expect(value.locked).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
it('aborts a waiting stream without creating a document and releases the reader', async () => {
  const cancel = vi.fn();
  const value = new ReadableStream<Uint8Array>({ cancel });
  const controller = new AbortController();
  const task = downloadDocx(
    { stream: async () => value },
    { path: 'render', signal: controller.signal },
    'safe.docx',
  );
  await Promise.resolve();
  controller.abort();
  await expect(task).rejects.toMatchObject({ name: 'AbortError' });
  expect(cancel).toHaveBeenCalled();
  expect(value.locked).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
it('sanitizes path separators and controls without relying on unavailable response headers', () => {
  expect(documentName('a\n/b\\c', 12)).toBe('a__b_c-12.docx');
  expect(documentName('')).toBe('document.docx');
  expect(documentName('x'.repeat(200))).toHaveLength(145);
});
