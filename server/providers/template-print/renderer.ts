import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export interface DocxRenderRequest {
  /** The owning template service must authorize and validate the OOXML archive first. */
  template: Uint8Array;
  data: Record<string, unknown>;
  locale: 'zh-CN' | 'en-US';
  timeZone: string;
  signal?: AbortSignal;
}
const workerSource = `
const { parentPort, workerData } = require('node:worker_threads');
const { createRequire } = require('node:module');
const carbone = createRequire(workerData.moduleUrl)('carbone');
carbone.render(workerData.path, workerData.data, workerData.options, (error, bytes) => {
  if (error || !Buffer.isBuffer(bytes) || bytes.byteLength > 32 * 1024 * 1024) parentPort.postMessage({ok: false});
  else parentPort.postMessage({ok: true, bytes});
});
`;

/** Internal same-format renderer. Authorization and OOXML validation remain mandatory upstream. */
export function createDocxRenderer({ timeoutMs = 15_000 } = {}) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async (request: DocxRenderRequest) => {
    if (request.signal?.aborted) throw new Error('DOCX rendering cancelled.');
    new Intl.DateTimeFormat(request.locale, { timeZone: request.timeZone });
    if (request.template.byteLength > 5 * 1024 * 1024)
      throw new Error('DOCX template exceeds the rendering limit.');
    if (Buffer.byteLength(JSON.stringify(request.data)) > 2 * 1024 * 1024)
      throw new Error('DOCX render data exceeds the rendering limit.');
    if (active >= 2) {
      if (waiting.length >= 8) throw new Error('DOCX renderer is busy.');
      await new Promise<void>((resolve, reject) => {
        const ready = () => {
          request.signal?.removeEventListener('abort', abort);
          resolve();
        };
        const abort = () => {
          const index = waiting.indexOf(ready);
          if (index !== -1) waiting.splice(index, 1);
          reject(new Error('DOCX rendering cancelled.'));
        };
        waiting.push(ready);
        request.signal?.addEventListener('abort', abort, { once: true });
        if (request.signal?.aborted) abort();
      });
    } else active++;
    let directory: string | undefined;
    let worker: Worker | undefined;
    try {
      if (request.signal?.aborted) throw new Error('DOCX rendering cancelled.');
      directory = await mkdtemp(join(tmpdir(), 'oa-docx-'));
      const templatePath = join(directory, 'template.docx');
      await writeFile(templatePath, request.template, { mode: 0o600 });
      worker = new Worker(workerSource, {
        eval: true,
        resourceLimits: { maxOldGenerationSizeMb: 64, stackSizeMb: 4 },
        workerData: {
          moduleUrl: import.meta.url,
          path: templatePath,
          data: request.data,
          options: {
            lang: request.locale.toLowerCase(),
            timezone: request.timeZone,
          },
        },
      });
      const running = worker;
      const bytes = await new Promise<Buffer>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('DOCX rendering timed out.')),
          timeoutMs,
        );
        const abort = () => {
          finish();
          reject(new Error('DOCX rendering cancelled.'));
        };
        const finish = () => {
          clearTimeout(timer);
          request.signal?.removeEventListener('abort', abort);
        };
        request.signal?.addEventListener('abort', abort, { once: true });
        if (request.signal?.aborted) abort();
        running.once('error', () => {
          finish();
          reject(new Error('DOCX rendering failed.'));
        });
        running.once('exit', () => {
          finish();
          reject(
            new Error('DOCX renderer exited before returning a document.'),
          );
        });
        running.once(
          'message',
          (message: { ok: boolean; bytes?: Uint8Array }) => {
            finish();
            if (!message.ok || !message.bytes)
              reject(new Error('DOCX rendering failed.'));
            else if (message.bytes.byteLength > 32 * 1024 * 1024)
              reject(new Error('DOCX output exceeds the rendering limit.'));
            else resolve(Buffer.from(message.bytes));
          },
        );
      });
      return { bytes, mimeType: DOCX_MIME };
    } finally {
      // Await actual worker termination before deleting files or releasing the rendering slot.
      try {
        await worker?.terminate();
        if (directory) await rm(directory, { recursive: true, force: true });
      } finally {
        const next = waiting.shift();
        if (next) next();
        else active--;
      }
    }
  };
}
export const renderValidatedDocx = createDocxRenderer();
