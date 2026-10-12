// @vitest-environment node
import { expect, it } from 'vitest';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  DOCX_MIME,
  createDocxRenderer,
  renderValidatedDocx,
} from '../../../server/providers/template-print/renderer.js';
function fixture(body: string) {
  return zipSync({
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`,
    ),
  });
}
it('renders actual DOCX Unicode, split-run markers, zero, false, nested labels and repeated approval rows', async () => {
  const template = fixture(
    '<w:p><w:r><w:t>{d.na</w:t></w:r><w:r><w:t>me}</w:t></w:r></w:p><w:p><w:r><w:t>{d.amount} / {d.flag} / {d.status.label}</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i].actor} {d.timeline[i].opinion}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i+1].actor} {d.timeline[i+1].opinion}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
  );
  const result = await renderValidatedDocx({
    template,
    data: {
      name: '张三 & <审批>',
      amount: 0,
      flag: false,
      status: { value: 'approved', label: '已批准' },
      timeline: [
        { actor: '李四', opinion: '同意' },
        { actor: '王五', opinion: '复核' },
      ],
    },
    locale: 'zh-CN',
    timeZone: 'Asia/Shanghai',
  });
  expect(result.mimeType).toBe(DOCX_MIME);
  const archive = unzipSync(result.bytes);
  const xml = strFromU8(archive['word/document.xml']!);
  expect(xml).toContain('张三 &amp; &lt;审批&gt;');
  expect(xml).toContain('0 / false / 已批准');
  expect(xml).toContain('李四 同意');
  expect(xml).toContain('王五 复核');
  expect(xml.match(/<w:tr>/g)).toHaveLength(2);
  expect(xml).not.toContain('{d.');
  expect(archive['_rels/.rels']).toEqual(unzipSync(template)['_rels/.rels']);
});
it.each([0, 1, 3])(
  'renders %i actual approval rows without leaving template markers',
  async (count) => {
    const template = fixture(
      '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i].actor}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i+1].actor}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>',
    );
    const timeline = Array.from({ length: count }, (_, index) => ({
      actor: `审核人${index}`,
    }));
    const result = await renderValidatedDocx({
      template,
      data: { timeline },
      locale: 'zh-CN',
      timeZone: 'Asia/Shanghai',
    });
    const xml = strFromU8(unzipSync(result.bytes)['word/document.xml']!);
    for (const item of timeline) expect(xml).toContain(item.actor);
    expect(xml.match(/<w:tr>/g) ?? []).toHaveLength(count);
    expect(xml).not.toContain('{d.');
  },
);
it('keeps concurrent documents and business values separate', async () => {
  const template = fixture('<w:p><w:r><w:t>{d.name}</w:t></w:r></w:p>');
  const results = await Promise.all(
    ['PRIVATE-A', 'PRIVATE-B'].map((name) =>
      renderValidatedDocx({
        template,
        data: { name },
        locale: 'en-US',
        timeZone: 'Asia/Shanghai',
      }),
    ),
  );
  const xml = results.map((result) =>
    strFromU8(unzipSync(result.bytes)['word/document.xml']!),
  );
  expect(xml[0]).toContain('PRIVATE-A');
  expect(xml[0]).not.toContain('PRIVATE-B');
  expect(xml[1]).toContain('PRIVATE-B');
  expect(xml[1]).not.toContain('PRIVATE-A');
});

it('terminates a timed-out real worker and removes its private temporary files', async () => {
  const { readdir } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const before = new Set(await readdir(tmpdir()));
  await expect(
    createDocxRenderer({ timeoutMs: 1 })({
      template: fixture('<w:p><w:r><w:t>{d.name}</w:t></w:r></w:p>'),
      data: { name: 'PRIVATE' },
      locale: 'en-US',
      timeZone: 'Asia/Shanghai',
    }),
  ).rejects.toThrow('timed out');
  expect(
    (await readdir(tmpdir())).filter(
      (name) => name.startsWith('oa-docx-') && !before.has(name),
    ),
  ).toEqual([]);
});
it('rejects excessive template and data bytes before starting a worker', async () => {
  const base = {
    data: {},
    locale: 'en-US' as const,
    timeZone: 'Asia/Shanghai',
  };
  await expect(
    renderValidatedDocx({
      ...base,
      template: new Uint8Array(5 * 1024 * 1024 + 1),
    }),
  ).rejects.toThrow('template exceeds');
  await expect(
    renderValidatedDocx({
      ...base,
      template: fixture(''),
      data: { text: 'a'.repeat(2 * 1024 * 1024) },
    }),
  ).rejects.toThrow('data exceeds');
});
it('cancels a real worker and a queued render without retaining jobs or temporary files', async () => {
  const renderer = createDocxRenderer();
  const template = fixture('<w:p><w:r><w:t>{d.name}</w:t></w:r></w:p>');
  const request = {
    template,
    data: { name: 'cancel' },
    locale: 'en-US' as const,
    timeZone: 'Asia/Shanghai',
  };
  const first = renderer(request),
    second = renderer(request);
  const queued = new AbortController();
  const cancelled = renderer({ ...request, signal: queued.signal });
  queued.abort();
  await expect(cancelled).rejects.toThrow('cancelled');
  await Promise.all([first, second]);
  const running = new AbortController();
  const job = renderer({ ...request, signal: running.signal });
  running.abort();
  await expect(job).rejects.toThrow('cancelled');
  const result = await renderer(request);
  expect(result.bytes.length).toBeGreaterThan(0);
});
