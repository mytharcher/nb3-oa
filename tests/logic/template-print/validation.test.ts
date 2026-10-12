// @vitest-environment node
import { expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import {
  readBoundedDocx,
  validateDocx,
} from '../../../server/providers/template-print/validation.js';
function fixture(
  body = '<w:p><w:r><w:t>{d.na</w:t></w:r><w:r><w:t>me}</w:t></w:r></w:p>',
  extra: Record<string, Uint8Array> = {},
) {
  return zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
        body +
        '</w:body></w:document>',
    ),
    ...extra,
  });
}
it('validates real split-run text and array boundary paths with stable content identity', () => {
  const template = fixture(
    '<w:p><w:r><w:t>{d.na</w:t></w:r><w:r><w:t>me} {d.timeline[i].actor} {d.timeline[i+1].actor}</w:t></w:r></w:p>',
  );
  expect(validateDocx(template, ['name', 'timeline[].actor'])).toEqual({
    hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    paths: ['name', 'timeline[].actor'],
  });
});
it.each([
  '../evil.xml',
  '/evil.xml',
  'word\\evil.xml',
  'word/./evil.xml',
  'word/evil%2f.xml',
])('rejects unsafe archive path %s', (name) => {
  expect(() =>
    validateDocx(fixture(undefined, { [name]: strToU8('x') }), ['name']),
  ).toThrow('PRINT_TEMPLATE_INVALID');
});
it('rejects forged central size before expansion and mismatched local headers', () => {
  const b = Buffer.from(fixture());
  const end = b.length - 22;
  const central = b.readUInt32LE(end + 16);
  const oversized = Buffer.from(b);
  oversized.writeUInt32LE(0xffffffff, central + 24);
  expect(() => readBoundedDocx(oversized)).toThrow();
  const mismatch = Buffer.from(b);
  mismatch.writeUInt32LE(1, 22);
  expect(() => readBoundedDocx(mismatch)).toThrow();
  const encrypted = Buffer.from(b);
  encrypted.writeUInt16LE(1, central + 8);
  expect(() => readBoundedDocx(encrypted)).toThrow();
});
it('rejects duplicate names, trailing bytes, ZIP64 extras and compressed data corruption', () => {
  const b = Buffer.from(fixture());
  const corrupt = Buffer.from(b);
  corrupt[60] = corrupt[60]! ^ 1;
  expect(() => readBoundedDocx(corrupt)).toThrow();
  expect(() =>
    readBoundedDocx(Buffer.concat([b, Buffer.from('suffix')])),
  ).toThrow();
  const extra = Buffer.from(b);
  const directory = b.readUInt32LE(b.length - 6);
  extra.writeUInt16LE(1, directory + 30);
  expect(() => readBoundedDocx(extra)).toThrow();
  expect(() =>
    readBoundedDocx(fixture(undefined, { 'WORD/document.xml': strToU8('x') })),
  ).toThrow();
});
it.each([
  '{d.bankAccount}',
  '{c.name}',
  '{d.name:convPDF}',
  '{d.name:attachment()}',
  '{d.__proto__.secret}',
  '{d.name:html}',
  '{d.name',
])('rejects undeclared or dynamic marker %s', (marker) => {
  expect(() =>
    validateDocx(fixture('<w:p><w:r><w:t>' + marker + '</w:t></w:r></w:p>'), [
      'name',
    ]),
  ).toThrow();
});
it.each([
  '<w:instrText>INCLUDETEXT https://example.test</w:instrText>',
  '<w:altChunk/>',
  '<w:object/>',
  '<!DOCTYPE root [<!ENTITY secret SYSTEM "file:///etc/passwd">]>',
  '<w:broken>',
])('rejects active or malformed XML %s', (body) => {
  expect(() => validateDocx(fixture(body), ['name'])).toThrow();
});
it('rejects external relationships and extreme nesting', () => {
  const rel = strToU8(
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="image" Target="https://example.test/secret" TargetMode="External"/></Relationships>',
  );
  expect(() =>
    validateDocx(fixture(undefined, { 'word/_rels/document.xml.rels': rel }), [
      'name',
    ]),
  ).toThrow();
  expect(() =>
    validateDocx(
      fixture(
        '<w:p>'.repeat(65) +
          '<w:r><w:t>{d.name}</w:t></w:r>' +
          '</w:p>'.repeat(65),
      ),
      ['name'],
    ),
  ).toThrow();
});

it('rejects dangling internal relationships before rendering', () => {
  const template = fixture(undefined, {
    'word/_rels/document.xml.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="missing" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/missing.png"/></Relationships>',
    ),
  });
  expect(() => validateDocx(template, ['name'])).toThrow();
});
