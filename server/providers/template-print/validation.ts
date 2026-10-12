import { createHash } from 'node:crypto';
import { inflateSync } from 'fflate';
import { SaxesParser, type SaxesTagNS } from 'saxes';

export class TemplatePrintError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
const bad = (): never => {
  throw new TemplatePrintError('PRINT_TEMPLATE_INVALID');
};
const decoder = new TextDecoder('utf-8', { fatal: true });
const WORD = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const TYPES = 'http://schemas.openxmlformats.org/package/2006/content-types';
const DOCUMENT =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml';
const MAX_TOTAL = 32 * 1024 * 1024;
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}
function validPath(name: string) {
  return (
    name.length > 0 &&
    name.length <= 255 &&
    !/[\\:%?#]/.test(name) &&
    ![...name].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) &&
    !name.startsWith('/') &&
    name.split('/').every((p) => p !== '.' && p !== '..' && p !== '')
  );
}
/** Central-directory limits are checked before any expansion. No ZIP64, descriptors, or archive ambiguity. */
export function readBoundedDocx(input: Uint8Array): Map<string, Uint8Array> {
  if (!input.length || input.length > 5 * 1024 * 1024) bad();
  const b = Buffer.from(input);
  const end = b.length - 22;
  if (
    end < 0 ||
    b.readUInt32LE(end) !== 0x06054b50 ||
    b.readUInt16LE(end + 20) !== 0 ||
    b.readUInt16LE(end + 4) ||
    b.readUInt16LE(end + 6)
  )
    bad();
  const count = b.readUInt16LE(end + 10),
    directorySize = b.readUInt32LE(end + 12),
    directoryStart = b.readUInt32LE(end + 16);
  if (
    !count ||
    count > 1000 ||
    b.readUInt16LE(end + 8) !== count ||
    directoryStart + directorySize !== end
  )
    bad();
  const entries: {
    name: string;
    offset: number;
    size: number;
    compressed: number;
    method: number;
    crc: number;
    flags: number;
    nameBytes: Buffer;
  }[] = [];
  let cursor = directoryStart,
    expanded = 0;
  const names = new Set<string>();
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || b.readUInt32LE(cursor) !== 0x02014b50) bad();
    const flags = b.readUInt16LE(cursor + 8),
      method = b.readUInt16LE(cursor + 10),
      crc = b.readUInt32LE(cursor + 16),
      compressed = b.readUInt32LE(cursor + 20),
      size = b.readUInt32LE(cursor + 24);
    const nameLength = b.readUInt16LE(cursor + 28),
      extraLength = b.readUInt16LE(cursor + 30),
      commentLength = b.readUInt16LE(cursor + 32),
      offset = b.readUInt32LE(cursor + 42);
    if (
      flags & ~0x800 ||
      ![0, 8].includes(method) ||
      b.readUInt16LE(cursor + 34) ||
      size > 8 * 1024 * 1024 ||
      compressed > b.length ||
      offset >= directoryStart ||
      cursor + 46 + nameLength + extraLength + commentLength > end
    )
      bad();
    // ZIP extras are unnecessary for this format subset and may carry ZIP64 or alternate path metadata.
    if (extraLength || commentLength) bad();
    const nameBytes = b.subarray(cursor + 46, cursor + 46 + nameLength);
    let name: string;
    try {
      name = decoder.decode(nameBytes);
    } catch {
      return bad();
    }
    if (!validPath(name) || names.has(name.toLowerCase())) bad();
    names.add(name.toLowerCase());
    expanded += size;
    if (expanded > MAX_TOTAL) bad();
    entries.push({
      name,
      offset,
      size,
      compressed,
      method,
      crc,
      flags,
      nameBytes,
    });
    cursor += 46 + nameLength;
  }
  if (cursor !== end) bad();
  const result = new Map<string, Uint8Array>();
  let previousEnd = 0;
  for (const e of entries.sort((a, b) => a.offset - b.offset)) {
    const at = e.offset;
    if (
      at !== previousEnd ||
      at + 30 > directoryStart ||
      b.readUInt32LE(at) !== 0x04034b50 ||
      b.readUInt16LE(at + 6) !== e.flags ||
      b.readUInt16LE(at + 8) !== e.method ||
      b.readUInt32LE(at + 14) !== e.crc ||
      b.readUInt32LE(at + 18) !== e.compressed ||
      b.readUInt32LE(at + 22) !== e.size ||
      b.readUInt16LE(at + 26) !== e.nameBytes.length ||
      b.readUInt16LE(at + 28)
    )
      bad();
    const start = at + 30 + e.nameBytes.length,
      finish = start + e.compressed;
    if (
      finish > directoryStart ||
      !b.subarray(at + 30, start).equals(e.nameBytes)
    )
      bad();
    const compressed = b.subarray(start, finish);
    let output: Uint8Array;
    try {
      // Explicit destination bounds inflation; a forged declared size cannot allocate an unbounded result.
      output =
        e.method === 0
          ? new Uint8Array(compressed)
          : inflateSync(compressed, { out: new Uint8Array(e.size) });
    } catch {
      return bad();
    }
    if (
      output.length !== e.size ||
      crc32(output) !== e.crc ||
      (e.method === 0 && e.size !== e.compressed)
    )
      bad();
    result.set(e.name, output);
    previousEnd = finish;
  }
  if (previousEnd !== directoryStart) bad();
  return result;
}
export interface ValidatedDocx {
  hash: string;
  paths: string[];
}
/** Plain scalar and indexed-row expressions only. No aliases, custom formatters, dynamic images, or engine options. */
export function validateDocx(
  bytes: Uint8Array,
  allowedPaths: readonly string[],
): ValidatedDocx {
  const archive = readBoundedDocx(bytes);
  if (
    !archive.has('[Content_Types].xml') ||
    !archive.has('_rels/.rels') ||
    !archive.has('word/document.xml')
  )
    bad();
  const allowed = new Set(allowedPaths),
    paths = new Set<string>();
  let hasContentType = false,
    hasRootRelationship = false,
    hasDocument = false;
  for (const [name, content] of archive) {
    if (
      /(?:vba|activeX|embeddings|customXml|externalLinks|oleObject)/i.test(name)
    )
      bad();
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) {
      if (!/^word\/media\/[A-Za-z0-9_.-]+\.(png|jpe?g)$/i.test(name)) bad();
      const png =
        content.length >= 8 &&
        Buffer.from(content.subarray(0, 8)).equals(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        );
      const jpeg =
        content.length >= 3 &&
        content[0] === 255 &&
        content[1] === 216 &&
        content[2] === 255;
      if (!png && !jpeg) bad();
      continue;
    }
    let xml: string;
    try {
      xml = decoder.decode(content);
    } catch {
      return bad();
    }
    if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml)) bad();
    const parser = new SaxesParser({ xmlns: true });
    let depth = 0,
      nodes = 0,
      paragraph: string | undefined,
      inText = false;
    const attr = (tag: SaxesTagNS, key: string) =>
      Object.values(tag.attributes).find((a) => a.local === key)?.value;
    const markers = (text: string) => {
      // Unrecognized braces are rejected deliberately: templates are a constrained source of expressions.
      for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
        const expression = match[1];
        if (
          !/^d\.[A-Za-z][A-Za-z0-9]*(?:\[(?:i|i\+1|\d{1,3})\])?(?:\.[A-Za-z][A-Za-z0-9]*(?:\[(?:i|i\+1|\d{1,3})\])?)*$/.test(
            expression,
          )
        )
          bad();
        const path = expression
          .slice(2)
          .replace(/\[(?:i|i\+1|\d{1,3})\]/g, '[]');
        if (
          !allowed.has(path) ||
          /(?:^|\.)(?:constructor|prototype|__proto__)(?:\.|$)/.test(path)
        )
          bad();
        paths.add(path);
      }
      if (
        text.replace(/\{[^{}]*\}/g, '').includes('{') ||
        text.replace(/\{[^{}]*\}/g, '').includes('}')
      )
        bad();
    };
    parser.on('error', bad);
    parser.on('doctype', bad);
    parser.on('opentag', (tag) => {
      if (++depth > 64 || ++nodes > 100000) bad();
      if (Object.keys(tag.attributes).length > 64) bad();
      if (
        [
          'altChunk',
          'object',
          'oleObject',
          'control',
          'instrText',
          'fldSimple',
          'fldChar',
        ].includes(tag.local)
      )
        bad();
      for (const a of Object.values(tag.attributes))
        if (/[{}]/.test(a.value)) bad();
      if (tag.uri === REL && tag.local === 'Relationship') {
        const target = attr(tag, 'Target') ?? '',
          type = attr(tag, 'Type') ?? '';
        if (
          attr(tag, 'TargetMode') ||
          /^(?:[a-z]+:|\/|\\)/i.test(target) ||
          /(?:externalLink|oleObject|attachedTemplate|aFChunk|vba|activeX|control)/i.test(
            type,
          )
        )
          bad();
        // Reject traversal even when Office might resolve it to another valid archive entry.
        if (!validPath(target)) bad();
        const relationOwner = name.match(/^(.*\/)?_rels\/(?:[^/]+)?\.rels$/);
        if (
          !relationOwner ||
          !archive.has(`${relationOwner[1] ?? ''}${target}`)
        )
          bad();
        if (
          name === '_rels/.rels' &&
          type ===
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument' &&
          target === 'word/document.xml'
        )
          hasRootRelationship = true;
      }
      if (
        name === '[Content_Types].xml' &&
        tag.uri === TYPES &&
        tag.local === 'Override' &&
        attr(tag, 'PartName') === '/word/document.xml' &&
        attr(tag, 'ContentType') === DOCUMENT
      )
        hasContentType = true;
      if (
        name === '[Content_Types].xml' &&
        /(?:macroEnabled|vba|oleObject|activeX)/i.test(
          attr(tag, 'ContentType') ?? '',
        )
      )
        bad();
      if (
        name === 'word/document.xml' &&
        depth === 1 &&
        tag.uri === WORD &&
        tag.local === 'document'
      )
        hasDocument = true;
      if (tag.uri === WORD && tag.local === 'p') paragraph = '';
      if (tag.uri === WORD && tag.local === 't') inText = true;
    });
    parser.on('text', (text) => {
      if (inText && paragraph !== undefined) paragraph += text;
      else if (/[{}]/.test(text)) bad();
    });
    parser.on('closetag', (tag) => {
      if (tag.uri === WORD && tag.local === 't') inText = false;
      if (tag.uri === WORD && tag.local === 'p') {
        markers(paragraph ?? '');
        paragraph = undefined;
      }
      depth--;
    });
    try {
      parser.write(xml).close();
    } catch {
      return bad();
    }
  }
  if (!hasContentType || !hasRootRelationship || !hasDocument || !paths.size)
    bad();
  return {
    hash: createHash('sha256').update(bytes).digest('hex'),
    paths: [...paths].sort(),
  };
}
