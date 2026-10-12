import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { validateDocx } from '../../../server/providers/template-print/validation.js';
import { renderValidatedDocx } from '../../../server/providers/template-print/renderer.js';

// Synthetic output for manual Word/WPS acceptance; this does not verify an Office viewer.
const directory = path.resolve('storage/exports/office-acceptance');
const template = zipSync({
  '[Content_Types].xml': strToU8(
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  ),
  '_rels/.rels': strToU8(
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  ),
  'word/document.xml': strToU8(
    '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>OA Office acceptance: {d.title}</w:t></w:r></w:p><w:p><w:r><w:t>{d.na</w:t></w:r><w:r><w:t>me}</w:t></w:r></w:p><w:p><w:r><w:t>{d.amount} / {d.flag} / {d.date}</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="8000"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i].runId} {d.timeline[i].type} {d.timeline[i].actionValue} {d.timeline[i].actor} {d.timeline[i].opinion}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i+1].runId} {d.timeline[i+1].type} {d.timeline[i+1].actionValue} {d.timeline[i+1].actor} {d.timeline[i+1].opinion}</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>',
  ),
});
validateDocx(template, [
  'title',
  'name',
  'amount',
  'flag',
  'date',
  'timeline[].runId',
  'timeline[].type',
  'timeline[].actionValue',
  'timeline[].actor',
  'timeline[].opinion',
]);
await mkdir(directory, { recursive: true });
for (const count of [0, 1, 3, 4]) {
  const result = await renderValidatedDocx({
    template,
    locale: 'zh-CN',
    timeZone: 'Asia/Singapore',
    data: {
      title: `${count} approval rows`,
      name: '示例员工 & <Synthetic>',
      amount: 0,
      flag: false,
      date: '2026-10-11 12:00 Asia/Singapore',
      timeline: Array.from({ length: count }, (_, index) => ({
        runId: index < 2 ? 'original' : 'resubmitted',
        type: index === 2 ? 'system' : 'action',
        actionValue: ['approve', 'returnItem', 'task.reused', 'terminate'][
          index
        ],
        actor: `审核人${index + 1}`,
        opinion: `同意 / Approved ${index + 1}`,
      })),
    },
  });
  const file = path.join(directory, `approval-${count}-rows.docx`);
  await writeFile(file, result.bytes, { mode: 0o600 });
  console.log(`${file} (${result.bytes.byteLength} bytes)`);
}
