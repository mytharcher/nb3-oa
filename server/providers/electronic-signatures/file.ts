import type { NocoBaseDriveManager } from '@nocobase/drive';
import { MAX_SIGNATURE_FILE, validPdf } from './gateway.js';
export interface SignatureStoredFile {
  id?: string;
  requestId?: string;
  purpose?: string;
  disk: string;
  key: string;
  filename: string;
  mimeType: string;
}
export async function readSignaturePdf(
  drive: NocoBaseDriveManager,
  file: SignatureStoredFile,
) {
  if (file.mimeType !== 'application/pdf')
    throw new Error('SIGNATURE_PDF_REQUIRED');
  const stream = await drive.use(file.disk).getStream(file.key),
    chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const value of stream) {
      const chunk = Buffer.from(value as Uint8Array);
      size += chunk.length;
      if (size > MAX_SIGNATURE_FILE) throw new Error('SIGNATURE_PDF_REQUIRED');
      chunks.push(chunk);
    }
  } finally {
    stream.destroy();
  }
  const bytes = Buffer.concat(chunks);
  if (!validPdf(bytes)) throw new Error('SIGNATURE_PDF_REQUIRED');
  return bytes;
}
