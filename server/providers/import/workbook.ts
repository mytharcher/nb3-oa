import ExcelJS from 'exceljs';

import { KIND_SPECS, type ColumnSpec, type KindSpec } from './columns.js';
import { MAX_ROWS, type ImportKind } from './constants.js';
import type { ImportRowError } from './types.js';

/** A cell as the validators read it: text (trimmed), a number, a boolean, a date, or nothing. */
export type RawCell = string | number | boolean | Date | null;

export interface SheetRow {
  /** The Excel row number, as the user sees it. */
  readonly row: number;
  /** Values of the columns present in the header, by column key. */
  readonly cells: ReadonlyMap<string, RawCell>;
}

export interface ParsedSheet {
  /** The columns the header names; a column the header leaves out is left unchanged on existing records. */
  readonly columns: readonly ColumnSpec[];
  readonly rows: readonly SheetRow[];
  /** File-level problems: unreadable workbook, missing or repeated headers, too many rows. */
  readonly errors: readonly ImportRowError[];
}

function normalizeHeader(value: string): string {
  return value.replace(/\s+/gu, '').replace(/[*＊]/gu, '').toLowerCase();
}

/** The plain value of an ExcelJS cell: rich text joined, formulas by their cached result, hyperlinks by their text. */
function plain(value: ExcelJS.CellValue): RawCell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('richText' in value)
      return plain(value.richText.map((part) => part.text).join(''));
    if ('formula' in value || 'sharedFormula' in value)
      return plain((value as ExcelJS.CellFormulaValue).result ?? null);
    if ('hyperlink' in value && 'text' in value) return plain(value.text);
    if ('error' in value) return null;
  }
  return null;
}

/** Reads the first worksheet of an `.xlsx` workbook against a kind's columns. */
export async function readSheet(
  kind: ImportKind,
  bytes: Uint8Array,
): Promise<ParsedSheet> {
  const spec = KIND_SPECS[kind];
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(
      bytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
  } catch {
    return fileError('FILE_UNREADABLE');
  }
  // The template's data sheet when it is there, otherwise the first sheet that is not the instructions.
  const sheet =
    workbook.getWorksheet(spec.sheet) ??
    workbook.worksheets.find((candidate) => candidate.name !== '说明');
  if (!sheet || sheet.actualRowCount === 0) return fileError('SHEET_EMPTY');

  const byHeader = new Map<string, ColumnSpec>();
  for (const column of spec.columns) {
    byHeader.set(normalizeHeader(column.header), column);
    byHeader.set(normalizeHeader(column.key), column);
  }
  const headerRow = sheet.getRow(1);
  const positions = new Map<number, ColumnSpec>();
  const seen = new Set<string>();
  const errors: ImportRowError[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, index) => {
    const text = plain(cell.value);
    if (typeof text !== 'string') return;
    const column = byHeader.get(normalizeHeader(text));
    // Columns the kind does not know (a note column, a helper formula) are ignored.
    if (!column) return;
    if (seen.has(column.key)) {
      errors.push({
        row: 1,
        column: column.key,
        header: column.header,
        code: 'HEADER_DUPLICATE',
      });
      return;
    }
    seen.add(column.key);
    positions.set(index, column);
  });
  for (const column of spec.columns)
    if (column.required && !seen.has(column.key))
      errors.push({
        row: 1,
        column: column.key,
        header: column.header,
        code: 'HEADER_MISSING',
      });

  const rows: SheetRow[] = [];
  const last = sheet.actualRowCount === 0 ? 1 : sheet.rowCount;
  for (let number = 2; number <= last; number += 1) {
    const row = sheet.getRow(number);
    const cells = new Map<string, RawCell>();
    let filled = false;
    for (const [index, column] of positions) {
      const value = plain(row.getCell(index).value);
      if (value !== null) filled = true;
      cells.set(column.key, value);
    }
    if (!filled) continue;
    rows.push({ row: number, cells });
    if (rows.length > MAX_ROWS) {
      errors.push({
        row: null,
        column: null,
        header: null,
        code: 'TOO_MANY_ROWS',
        params: { max: MAX_ROWS },
      });
      break;
    }
  }
  if (!errors.length && !rows.length)
    errors.push({ row: null, column: null, header: null, code: 'SHEET_EMPTY' });
  return {
    columns: spec.columns.filter((column) => seen.has(column.key)),
    rows,
    errors,
  };
}

function fileError(code: 'FILE_UNREADABLE' | 'SHEET_EMPTY'): ParsedSheet {
  return {
    columns: [],
    rows: [],
    errors: [{ row: null, column: null, header: null, code }],
  };
}

const GENERAL_RULES: readonly string[] = [
  '在第一个工作表中按表头填写数据，从第 2 行开始，一行一条；表头文字请勿修改，可以删除非必填的列，也可以调整列的顺序。',
  '每行按“匹配依据”查找已有记录：找到则更新，找不到则新建。没有出现在表头中的列，已有记录的该项保持不变；出现在表头中但单元格留空，表示该项为空。',
  '导入前先“检查”：系统校验整个文件并列出每一行的问题（行号、列、原因）。只要有一行有问题，就不会写入任何数据。',
  '检查通过后“确认导入”。整个文件在一个事务中写入，中途出错会全部撤销。每次导入都会保留原文件并记入导入历史和审计日志。',
  '导入不会创建登录账号。表中引用的账号（用户名或邮箱）必须已经存在且已启用，否则该行报错。',
  '编码类单元格请设置为“文本”格式，避免以 0 开头的工号、编码被 Excel 去掉前导零。',
];

/** A workbook with the kind's header row and an instructions sheet (in Chinese, like the headers). */
export async function buildTemplate(
  kind: ImportKind,
): Promise<Uint8Array<ArrayBuffer>> {
  const spec: KindSpec = KIND_SPECS[kind];
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OA';

  const data = workbook.addWorksheet(spec.sheet, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  data.columns = spec.columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.max(12, column.header.length * 2 + 6),
    // Text format keeps leading zeros of codes and stops Excel from turning them into numbers.
    style:
      column.type === 'integer' || column.type === 'date'
        ? {}
        : { numFmt: '@' },
  }));
  const header = data.getRow(1);
  header.font = { bold: true };
  spec.columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.value = column.header;
    cell.numFmt = 'General';
    if (column.required)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' },
      };
    if (column.note) cell.note = column.note;
  });

  const guide = workbook.addWorksheet('说明');
  guide.columns = [{ width: 20 }, { width: 10 }, { width: 90 }];
  guide.addRow([`${spec.title}导入模板`]).font = { bold: true, size: 14 };
  guide.addRow([]);
  guide.addRow(['导入规则']).font = { bold: true };
  GENERAL_RULES.forEach((rule, index) =>
    guide.addRow([`${index + 1}.`, '', rule]),
  );
  guide.addRow(['匹配依据', '', spec.matchedBy]);
  guide.addRow([]);
  guide.addRow(['列名', '必填', '说明']).font = { bold: true };
  for (const column of spec.columns)
    guide.addRow([column.header, column.required ? '是' : '', column.note]);
  guide.addRow([]);
  guide.addRow(['示例（请在第一个工作表中填写，不要填在这里）']).font = {
    bold: true,
  };
  guide.addRow(spec.columns.map((column) => column.header)).font = {
    bold: true,
  };
  for (const example of spec.example) guide.addRow([...example]);
  guide.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
