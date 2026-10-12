import { Inflate, strFromU8, strToU8, zipSync } from 'fflate';
import { validateEvidenceJson } from './evidence-json.js';

export const headers = [
  'userId',
  'date',
  'punchKind',
  'punchedAt',
  'source',
  'sourceKey',
  'sourceData',
] as const;
export interface ImportRow {
  userId: string;
  date: string;
  punchKind: 'in' | 'out';
  punchedAt: string | null;
  source: string;
  sourceKey: string;
  sourceData: Record<string, unknown>;
}
export class WorkbookError extends Error {
  constructor(
    public readonly reason:
      | 'file'
      | 'archive'
      | 'template'
      | 'cell'
      | 'rows'
      | 'identity'
      | 'date'
      | 'evidence',
    public readonly row?: number,
  ) {
    super(reason);
  }
}
const fail = (reason: WorkbookError['reason'], row?: number): never => {
  throw new WorkbookError(reason, row);
};
const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const elements = (parent: Document | Element, name: string) =>
  Array.from(parent.getElementsByTagNameNS(ns, name));
function xml(bytes: Uint8Array | undefined): Document {
  if (!bytes) return fail('template');
  const text = strFromU8(bytes);
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) return fail('archive');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return fail('template');
  return doc;
}
/** Read ZIP central metadata before fflate allocates output. Deliberately excludes ZIP64/encryption and ambiguous paths. */
function preflight(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    view.getUint32(end, true) !== 0x06054b50
  )
    end--;
  if (
    end < 0 ||
    end < bytes.length - 65557 ||
    end + 22 + view.getUint16(end + 20, true) !== bytes.length
  )
    return fail('archive');
  const count = view.getUint16(end + 10, true),
    size = view.getUint32(end + 12, true),
    offset = view.getUint32(end + 16, true);
  if (
    view.getUint16(end + 4, true) ||
    view.getUint16(end + 6, true) ||
    count !== view.getUint16(end + 8, true) ||
    count > 128 ||
    !count ||
    offset + size !== end
  )
    return fail('archive');
  const names = new Set<string>();
  const ranges: { start: number; end: number }[] = [];
  const expected = new Map<
    string,
    { size: number; start: number; packed: number; method: number; crc: number }
  >();
  let at = offset,
    total = 0;
  for (let i = 0; i < count; i++) {
    if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50)
      return fail('archive');
    const flags = view.getUint16(at + 8, true),
      method = view.getUint16(at + 10, true),
      packed = view.getUint32(at + 20, true),
      local = view.getUint32(at + 42, true),
      unpacked = view.getUint32(at + 24, true),
      length = view.getUint16(at + 28, true),
      extra = view.getUint16(at + 30, true),
      comment = view.getUint16(at + 32, true);
    if (
      at + 46 + length + extra + comment > end ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      unpacked > 8 * 1024 * 1024 ||
      packed > bytes.length ||
      (method === 0 && packed !== unpacked) ||
      view.getUint32(at + 42, true) >= offset
    )
      return fail('archive');
    const name = strFromU8(bytes.subarray(at + 46, at + 46 + length));
    if (
      !name ||
      name.startsWith('/') ||
      name.includes('\\') ||
      name.split('/').some((part) => part === '..' || part === '.') ||
      names.has(name) ||
      /vbaProject|externalLinks/i.test(name)
    )
      return fail('archive');
    // Match the actual local record and its full byte extent, including data descriptors.
    if (
      local + 30 > offset ||
      view.getUint32(local, true) !== 0x04034b50 ||
      view.getUint16(local + 6, true) !== flags ||
      view.getUint16(local + 8, true) !== method
    )
      return fail('archive');
    const localNameLength = view.getUint16(local + 26, true),
      localExtraLength = view.getUint16(local + 28, true);
    const dataStart = local + 30 + localNameLength + localExtraLength;
    let dataEnd = dataStart + packed;
    if (
      dataEnd > offset ||
      localNameLength !== length ||
      !bytes
        .subarray(local + 30, local + 30 + localNameLength)
        .every((v, j) => v === bytes[at + 46 + j])
    )
      return fail('archive');
    for (const [extraStart, extraLength] of [
      [at + 46 + length, extra],
      [local + 30 + localNameLength, localExtraLength],
    ]) {
      let cursor = extraStart;
      while (cursor < extraStart + extraLength) {
        if (
          cursor + 4 > extraStart + extraLength ||
          view.getUint16(cursor, true) === 1
        )
          return fail('archive');
        cursor += 4 + view.getUint16(cursor + 2, true);
        if (cursor > extraStart + extraLength) return fail('archive');
      }
    }
    const crc = view.getUint32(at + 16, true);
    if (flags & 8) {
      if (dataEnd + 12 > offset) return fail('archive');
      if (view.getUint32(dataEnd, true) === 0x08074b50) dataEnd += 4;
      if (
        dataEnd + 12 > offset ||
        view.getUint32(dataEnd, true) !== crc ||
        view.getUint32(dataEnd + 4, true) !== packed ||
        view.getUint32(dataEnd + 8, true) !== unpacked
      )
        return fail('archive');
      dataEnd += 12;
      const localPacked = view.getUint32(local + 18, true),
        localUnpacked = view.getUint32(local + 22, true);
      if (
        (localPacked !== 0 && localPacked !== packed) ||
        (localUnpacked !== 0 && localUnpacked !== unpacked)
      )
        return fail('archive');
    } else if (
      view.getUint32(local + 14, true) !== crc ||
      view.getUint32(local + 18, true) !== packed ||
      view.getUint32(local + 22, true) !== unpacked
    )
      return fail('archive');
    if (ranges.some((r) => local < r.end && dataEnd > r.start))
      return fail('archive');
    ranges.push({ start: local, end: dataEnd });
    expected.set(name, {
      size: unpacked,
      start: dataStart,
      packed,
      method,
      crc,
    });
    names.add(name);
    total += unpacked;
    if (total > 16 * 1024 * 1024) return fail('archive');
    at += 46 + length + extra + comment;
  }
  if (at !== end) return fail('archive');
  return expected;
}
function evidence(value: string, row: number): Record<string, unknown> {
  if (strToU8(value).length > 64 * 1024) return fail('evidence', row);
  let parsed: unknown;
  try {
    validateEvidenceJson(value);
    parsed = JSON.parse(value);
  } catch {
    return fail('evidence', row);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    return fail('evidence', row);
  let nodes = 0;
  const visit = (v: unknown, depth: number) => {
    if (
      ++nodes > 10000 ||
      depth > 32 ||
      (typeof v === 'number' && !Number.isFinite(v))
    )
      return fail('evidence', row);
    if (v && typeof v === 'object')
      Object.values(v).forEach((child: unknown) => visit(child, depth + 1));
  };
  visit(parsed, 0);
  return parsed as Record<string, unknown>;
}
export function parseWorkbook(
  bytes: Uint8Array,
  filename: string,
): ImportRow[] {
  if (
    !/\.xlsx$/i.test(filename) ||
    bytes.length > 4 * 1024 * 1024 ||
    bytes.length < 22
  )
    return fail('file');
  const expected = preflight(bytes);
  // Stream actual deflate output: unzipSync's fixed declared-size output can silently truncate.
  // A 256-byte input step bounds transient expansion; stop before retaining excess output.
  const files = Object.create(null) as Record<string, Uint8Array>;
  let actualTotal = 0;
  try {
    for (const [name, entry] of expected) {
      const chunks: Uint8Array[] = [];
      let actual = 0,
        crc = 0xffffffff;
      const accept = (chunk: Uint8Array) => {
        actual += chunk.length;
        actualTotal += chunk.length;
        if (
          actual > entry.size ||
          actual > 8 * 1024 * 1024 ||
          actualTotal > 16 * 1024 * 1024
        )
          return fail('archive');
        for (const byte of chunk) {
          crc ^= byte;
          for (let bit = 0; bit < 8; bit++)
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
        chunks.push(chunk);
      };
      const packed = bytes.subarray(entry.start, entry.start + entry.packed);
      if (entry.method === 0) accept(packed);
      else {
        const inflater = new Inflate(accept);
        if (!packed.length) inflater.push(packed, true);
        for (let at = 0; at < packed.length; at += 256)
          inflater.push(
            packed.subarray(at, at + 256),
            at + 256 >= packed.length,
          );
      }
      if (actual !== entry.size || (crc ^ 0xffffffff) >>> 0 !== entry.crc)
        return fail('archive');
      const output = new Uint8Array(actual);
      let offset = 0;
      for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.length;
      }
      files[name] = output;
    }
  } catch {
    return fail('archive');
  }
  const workbook = xml(files['xl/workbook.xml']);
  const sheets = elements(workbook, 'sheet');
  const rels = xml(files['xl/_rels/workbook.xml.rels']);
  const sheetId = sheets[0]?.getAttributeNS(
    'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'id',
  );
  const relation = Array.from(
    rels.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/package/2006/relationships',
      'Relationship',
    ),
  ).find((r) => r.getAttribute('Id') === sheetId);
  if (
    !relation ||
    !['worksheets/sheet1.xml', '/xl/worksheets/sheet1.xml'].includes(
      relation.getAttribute('Target') ?? '',
    ) ||
    relation.getAttribute('TargetMode') === 'External' ||
    sheets[0]?.getAttribute('state') === 'hidden' ||
    sheets[0]?.getAttribute('state') === 'veryHidden'
  )
    return fail('template');

  if (
    sheets.length !== 1 ||
    !files['xl/worksheets/sheet1.xml'] ||
    Object.keys(files).filter((name) =>
      /^xl\/worksheets\/sheet[^/]*\.xml$/.test(name),
    ).length !== 1 ||
    /macroEnabled/i.test(
      strFromU8(files['[Content_Types].xml'] ?? new Uint8Array()),
    )
  )
    return fail('template');
  const shared = files['xl/sharedStrings.xml']
    ? elements(xml(files['xl/sharedStrings.xml']), 'si').map((si) =>
        elements(si, 't')
          .map((t) => t.textContent ?? '')
          .join(''),
      )
    : [];
  const sheet = xml(files['xl/worksheets/sheet1.xml']);
  const sourceRows = elements(sheet, 'row');
  if (sourceRows.length < 2 || sourceRows.length > 1001) return fail('rows');
  let total = 0;
  const seen = new Set<string>();
  return sourceRows
    .map((r, index) => {
      const number = index + 1;
      if (r.getAttribute('r') !== String(number)) return fail('rows', number);
      const values = Array<string>(7).fill('');
      const columns = new Set<number>();
      for (const c of elements(r, 'c')) {
        const ref = c.getAttribute('r') ?? '';
        const match = /^([A-G])(\d+)$/.exec(ref);
        if (!match || Number(match[2]) !== number || elements(c, 'f').length)
          return fail('cell', number);
        const col = match[1].charCodeAt(0) - 65;
        if (columns.has(col)) return fail('cell', number);
        columns.add(col);
        const type = c.getAttribute('t'),
          v = elements(c, 'v')[0]?.textContent ?? '';
        if (type === 'inlineStr')
          values[col] = elements(c, 't')
            .map((t) => t.textContent ?? '')
            .join('');
        else if (
          type === 's' &&
          /^\d+$/.test(v) &&
          shared[Number(v)] !== undefined
        )
          values[col] = shared[Number(v)];
        else if (v) return fail('cell', number);
      }
      if (index === 0) {
        if (values.some((v, col) => v !== headers[col]))
          return fail('template');
        return undefined;
      }
      const [userId, date, punchKind, punch, source, sourceKey, raw] = values;
      if (
        !userId.trim() ||
        userId !== userId.trim() ||
        userId.length > 64 ||
        !source.trim() ||
        source.length > 64 ||
        !sourceKey.trim() ||
        sourceKey.length > 200
      )
        return fail('identity', number);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
        !['in', 'out'].includes(punchKind)
      )
        return fail('date', number);
      if (
        punch &&
        (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(punch) ||
          !Number.isFinite(Date.parse(punch)) ||
          new Date(punch).toISOString() !==
            (punch.includes('.') ? punch : punch.replace('Z', '.000Z')))
      )
        return fail('date', number);
      const sourceData = evidence(raw, number);
      total += strToU8(JSON.stringify(sourceData)).length;
      const key = JSON.stringify([source, sourceKey]);
      if (total > 8 * 1024 * 1024 || seen.has(key))
        return fail('evidence', number);
      seen.add(key);
      return {
        userId,
        date,
        punchKind: punchKind as 'in' | 'out',
        punchedAt: punch || null,
        source,
        sourceKey,
        sourceData,
      };
    })
    .filter((r): r is ImportRow => !!r);
}
export function createTemplate(): Uint8Array {
  const cells = headers
    .map(
      (h, i) =>
        `<c r="${String.fromCharCode(65 + i)}1" t="inlineStr"><is><t>${h}</t></is></c>`,
    )
    .join('');
  return zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      `<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="attendance" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(
      `<worksheet xmlns="${ns}"><sheetData><row r="1">${cells}</row></sheetData></worksheet>`,
    ),
  });
}
