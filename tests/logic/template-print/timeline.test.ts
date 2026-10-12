// @vitest-environment node
import { expect, test } from 'vitest';
import type { ApprovalTimeline } from '@nocobase/app-plugin-approval/client';
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate';
import { projectPrintTimeline } from '../../../server/providers/template-print/timeline.js';
import { sourceFields } from '../../../server/providers/template-print/sources.js';
import { validateDocx } from '../../../server/providers/template-print/validation.js';
import { renderValidatedDocx } from '../../../server/providers/template-print/renderer.js';

function fixture() {
  // Public SDK facts with deliberately private payloads: none are printable.
  return {
    runs: [
      {
        run: { id: 'first' },
        entries: [
          {
            type: 'system',
            event: {
              id: 'start',
              kind: 'run.started',
              actorId: 'applicant',
              at: '2026-10-11T01:00:00Z',
              stage: null,
              message: 'private bank',
              data: { salary: 99 },
            },
          },
        ],
        stages: [
          {
            entries: [
              {
                type: 'action',
                action: {
                  id: 'transfer',
                  name: 'transfer',
                  actorId: 'reviewer',
                  onBehalfOf: 'delegate',
                  stage: 'manager',
                  taskId: null,
                  at: '2026-10-11T01:01:00Z',
                  comment: '转办 & <safe>',
                  input: { bank: 'private' },
                  summary: { pay: 99 },
                  effects: [{ secret: true }],
                },
                events: [],
              },
              {
                type: 'action',
                action: {
                  id: 'return',
                  name: 'return',
                  actorId: 'reviewer',
                  stage: 'manager',
                  at: '2026-10-11T01:02:00Z',
                  comment: '补充说明',
                },
                events: [],
              },
            ],
          },
        ],
      },
      {
        run: { id: 'second' },
        entries: [
          {
            type: 'action',
            action: {
              id: 'terminate',
              name: 'terminate',
              actorId: 'admin',
              stage: '',
              at: '2026-10-11T01:03:00Z',
              comment: '结束',
            },
            events: [],
          },
        ],
        stages: [],
      },
    ],
  } as unknown as ApprovalTimeline;
}
function project(timeline = fixture()) {
  return projectPrintTimeline({
    timeline,
    runs: [],
    person: (id) => (typeof id === 'string' ? `Person ${id}` : ''),
    label: (_, value) => value,
    formatDate: (at) => at,
  });
}
test('prints every authorized action and system fact across runs without private SDK payloads or fabricated opinions', () => {
  const timeline = project();
  expect(timeline.map((entry) => entry.entryId)).toEqual([
    'start',
    'transfer',
    'return',
    'terminate',
  ]);
  expect(timeline[1]).toMatchObject({
    type: 'action',
    assignee: 'Person delegate',
    opinion: '转办 & <safe>',
    runId: 'first',
  });
  expect(timeline[0]?.opinion).toBe('');
  expect(JSON.stringify(timeline)).not.toMatch(
    /private|salary|secret|input|summary|effects/,
  );
  expect(project({ runs: [] })).toEqual([]);
  const repeated = fixture();
  const first = repeated.runs[0]!;
  const entry = first.stages[0]!.entries[0]!;
  if (entry.type !== 'action') throw new Error('fixture');
  const reused = {
    ...entry,
    events: [
      {
        id: 'reuse',
        kind: 'task.reused',
        actorId: 'reviewer',
        actionId: 'transfer',
        at: entry.action.at,
        stage: 'manager',
        data: { content: 'private snapshot' },
      },
    ],
  } as unknown as typeof entry;
  const enriched = project({
    runs: [
      {
        ...first,
        entries: [...first.entries, reused],
        stages: [{ ...first.stages[0]!, entries: [reused] }],
      },
    ],
  });
  expect(enriched.map((fact) => fact.entryId)).toEqual([
    'start',
    'transfer',
    'reuse',
  ]);
  expect(enriched[2]).toMatchObject({
    actionValue: 'task.reused',
    parentActionId: 'transfer',
    opinion: '',
  });
  expect(JSON.stringify(enriched)).not.toContain('private');
  const excessive = fixture();
  const run = excessive.runs[0]!;
  expect(() =>
    project({
      runs: [
        {
          ...run,
          entries: Array.from({ length: 2001 }, () => run.entries[0]!),
        },
      ],
    }),
  ).toThrowError('PRINT_DATA_LIMIT');
});
test('validates and renders the explicit timeline protocol through actual DOCX worker', async () => {
  const template = zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i].type} {d.timeline[i].actionValue} {d.timeline[i].opinion}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i+1].type} {d.timeline[i+1].actionValue} {d.timeline[i+1].opinion}</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
    ),
  });
  validateDocx(template, Object.keys(sourceFields.leave));
  const output = await renderValidatedDocx({
    template,
    data: { timeline: project() },
    locale: 'zh-CN',
    timeZone: 'Asia/Singapore',
  });
  const xml = strFromU8(unzipSync(output.bytes)['word/document.xml']!);
  expect(xml).toContain('system run.started');
  expect(xml).toContain('action transfer');
  expect(xml).toContain('action return');
  expect(xml).toContain('action terminate');
  expect(xml).toContain('&amp; &lt;safe&gt;');
  expect(xml).not.toContain('{d.');
  expect(xml).not.toMatch(/private|salary|secret/);
});
