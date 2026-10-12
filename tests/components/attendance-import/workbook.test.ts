import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  createTemplate,
  headers,
  parseWorkbook,
  WorkbookError,
} from '../../../client/pages/attendance-import/workbook.js';
export async function workbook(values: unknown[][], shared = true) {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('attendance').addRows([Array.from(headers), ...values]);
  return new Uint8Array(
    await book.xlsx.writeBuffer({ useSharedStrings: shared }),
  );
}
const row = [
  'person-1',
  '2035-01-02',
  'in',
  '2035-01-02T01:00:00Z',
  'device',
  'key-1',
  '{"original":"原证据","amount":0,"nested":[true,null]}',
];
function edit(
  bytes: Uint8Array,
  transform: (entries: Record<string, Uint8Array>) => void,
) {
  const files = unzipSync(bytes);
  transform(files);
  return zipSync(files);
}
describe('controlled attendance xlsx parser', () => {
  it('reads real ExcelJS shared/inline strings without altering evidence and missing punch', async () => {
    for (const shared of [true, false]) {
      const rows = parseWorkbook(
        await workbook(
          [row, ['person-2', '2035-01-02', 'out', '', 'device', 'key-2', '{}']],
          shared,
        ),
        'evidence.xlsx',
      );
      expect(rows).toEqual([
        {
          userId: 'person-1',
          date: '2035-01-02',
          punchKind: 'in',
          punchedAt: '2035-01-02T01:00:00Z',
          source: 'device',
          sourceKey: 'key-1',
          sourceData: { original: '原证据', amount: 0, nested: [true, null] },
        },
        {
          userId: 'person-2',
          date: '2035-01-02',
          punchKind: 'out',
          punchedAt: null,
          source: 'device',
          sourceKey: 'key-2',
          sourceData: {},
        },
      ]);
    }
    const template = new ExcelJS.Workbook();
    await template.xlsx.load(createTemplate());
    expect(template.worksheets[0].getRow(1).values).toEqual([
      undefined,
      ...headers,
    ]);
  });
  it('rejects formula, numerical identities, invalid ISO dates, JSON, duplicate keys and row limit', async () => {
    const cases: unknown[][][] = [
      [[42, ...row.slice(1)]],
      [[...row.slice(0, 3), { formula: 'NOW()', result: 1 }, ...row.slice(4)]],
      [[row[0], '2035-02-30', ...row.slice(2)]],
      [[...row.slice(0, 3), '2035-02-30T01:00:00Z', ...row.slice(4)]],
      [[...row.slice(0, 6), '[]']],
      [[...row.slice(0, 6), '1e999']],
      [row, row],
      Array.from({ length: 1001 }, () => row),
    ];
    for (const rows of cases) {
      const bytes = await workbook(rows);
      expect(() => parseWorkbook(bytes, 'file.xlsx')).toThrow(WorkbookError);
    }
  });
  it('rejects changed headers, extra worksheets, DTD, external links and macros', async () => {
    const bytes = await workbook([row]);
    const mutations = [
      (f: Record<string, Uint8Array>) => {
        f['xl/sharedStrings.xml'] = strToU8(
          strFromU8(f['xl/sharedStrings.xml']).replace(
            'userId',
            'employeeName',
          ),
        );
      },
      (f: Record<string, Uint8Array>) => {
        f['xl/worksheets/sheet2.xml'] = f['xl/worksheets/sheet1.xml'];
      },
      (f: Record<string, Uint8Array>) => {
        f['xl/workbook.xml'] = strToU8(
          '<!DOCTYPE x><!ENTITY x "bad">' + strFromU8(f['xl/workbook.xml']),
        );
      },
      (f: Record<string, Uint8Array>) => {
        f['xl/externalLinks/externalLink1.xml'] = strToU8('<x/>');
      },
      (f: Record<string, Uint8Array>) => {
        f['xl/vbaProject.bin'] = new Uint8Array([1]);
      },
    ];
    for (const mutate of mutations)
      expect(() => parseWorkbook(edit(bytes, mutate), 'file.xlsx')).toThrow(
        WorkbookError,
      );
  });
  it('checks ZIP limits before decompression including count, flags, sizes, path and duplicate names', async () => {
    const bytes = await workbook([row]);
    const central = bytes.findIndex(
      (_, i) =>
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 1 &&
        bytes[i + 3] === 2,
    );
    for (const [offset, value, size] of [
      [8, 1, 2],
      [24, 0xffffffff, 4],
      [42, 0xffffffff, 4],
    ] as const) {
      const changed = bytes.slice(),
        view = new DataView(changed.buffer);
      if (size === 2) view.setUint16(central + offset, value, true);
      else view.setUint32(central + offset, value, true);
      expect(() => parseWorkbook(changed, 'file.xlsx')).toThrow(WorkbookError);
    }
    expect(() =>
      parseWorkbook(
        edit(bytes, (f) => {
          f['../escape.xml'] = strToU8('x');
        }),
        'file.xlsx',
      ),
    ).toThrow(WorkbookError);
    expect(() =>
      parseWorkbook(
        edit(bytes, (f) => {
          for (let i = 0; i < 129; i++) f[`extra${i}`] = new Uint8Array();
        }),
        'file.xlsx',
      ),
    ).toThrow(WorkbookError);
    expect(() =>
      parseWorkbook(new Uint8Array(4 * 1024 * 1024 + 1), 'file.xlsx'),
    ).toThrow(WorkbookError);
    const repeated = edit(bytes, (f) => {
      f['different'] = strToU8('x');
      f['duplicate'] = strToU8('x');
    });
    const name = strToU8('different');
    let replaced = false;
    for (let at = 0; at < repeated.length - name.length; at++)
      if (name.every((b, i) => repeated[at + i] === b)) {
        repeated.set(strToU8('duplicate'), at);
        replaced = true;
      }
    const tooLargeTotal = bytes.slice(),
      metadata = new DataView(tooLargeTotal.buffer);
    let centralAt = central;
    for (let i = 0; i < 3; i++) {
      metadata.setUint32(centralAt + 24, 7 * 1024 * 1024, true);
      centralAt +=
        46 +
        metadata.getUint16(centralAt + 28, true) +
        metadata.getUint16(centralAt + 30, true) +
        metadata.getUint16(centralAt + 32, true);
    }
    expect(() => parseWorkbook(tooLargeTotal, 'file.xlsx')).toThrow(
      WorkbookError,
    );
    expect(replaced).toBe(true);
    expect(() => parseWorkbook(repeated, 'file.xlsx')).toThrow(WorkbookError);
  });
});

it('rejects stored ZIP entries lying about output bytes before allocation', async () => {
  const original = await workbook([row]);
  const bytes = zipSync(unzipSync(original), { level: 0 });
  const view = new DataView(bytes.buffer);
  const at = bytes.findIndex(
    (_, i) =>
      view.getUint8(i) === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 1 &&
      bytes[i + 3] === 2,
  );
  view.setUint32(at + 24, 0, true);
  expect(() => parseWorkbook(bytes, 'file.xlsx')).toThrow(WorkbookError);
});
it('rejects JSON rounding and duplicate decoded keys while treating JSON-like strings as strings', async () => {
  for (const raw of [
    '{"n":9007199254740993}',
    '{"n":1,"n":2}',
    '{"n":1,"\\u006e":2}',
    '{"n":0.10000000000000001}',
    '{"n":1e999}',
  ]) {
    const bytes = await workbook([[...row.slice(0, 6), raw]]);
    expect(() => parseWorkbook(bytes, 'file.xlsx')).toThrow(WorkbookError);
  }
  const safe = await workbook([
    [
      ...row.slice(0, 6),
      '{"text":"9007199254740993 and duplicate n:n","n":0.1,"exponent":1e3}',
    ],
  ]);
  expect(parseWorkbook(safe, 'file.xlsx')[0].sourceData).toEqual({
    text: '9007199254740993 and duplicate n:n',
    n: 0.1,
    exponent: 1000,
  });
});

it('rejects a valid local header embedded inside another stored entry instead of allocating overlapping records', async () => {
  const original = await workbook([row]),
    files = unzipSync(original);
  const inner = zipSync({ 'inner.bin': strToU8('payload') }, { level: 0 });
  files['outer.bin'] = inner;
  files['inner.bin'] = strToU8('payload');
  const bytes = zipSync(files, { level: 0 }),
    view = new DataView(bytes.buffer);
  let innerCentral = -1,
    outerLocal = -1;
  for (let at = 0; at + 46 < bytes.length; at++)
    if (view.getUint32(at, true) === 0x02014b50) {
      const name = strFromU8(
        bytes.subarray(at + 46, at + 46 + view.getUint16(at + 28, true)),
      );
      if (name === 'inner.bin') innerCentral = at;
      if (name === 'outer.bin') outerLocal = view.getUint32(at + 42, true);
    }
  expect(innerCentral).toBeGreaterThan(0);
  expect(outerLocal).toBeGreaterThan(0);
  const embedded =
    outerLocal +
    30 +
    view.getUint16(outerLocal + 26, true) +
    view.getUint16(outerLocal + 28, true);
  view.setUint32(innerCentral + 42, embedded, true);
  expect(() => parseWorkbook(bytes, 'file.xlsx')).toThrow(WorkbookError);
});

it('rejects deflate output exceeding matching local/central declarations and corrupt CRC', async () => {
  const files = unzipSync(await workbook([row]));
  files['unused.bin'] = strToU8('ABCDEF'.repeat(100000));
  const original = zipSync(files);
  for (const corruptLength of [true, false]) {
    const bytes = original.slice(),
      view = new DataView(bytes.buffer);
    let found = false;
    for (let at = 0; at + 46 < bytes.length; at++) {
      if (view.getUint32(at, true) !== 0x02014b50) continue;
      const name = strFromU8(
        bytes.subarray(at + 46, at + 46 + view.getUint16(at + 28, true)),
      );
      if (name !== 'unused.bin') continue;
      const local = view.getUint32(at + 42, true);
      if (corruptLength) {
        view.setUint32(at + 24, 3, true);
        view.setUint32(local + 22, 3, true);
      } else {
        view.setUint32(at + 16, 0, true);
        view.setUint32(local + 14, 0, true);
      }
      found = true;
    }
    expect(found).toBe(true);
    expect(() => parseWorkbook(bytes, 'file.xlsx')).toThrow(WorkbookError);
  }
});
