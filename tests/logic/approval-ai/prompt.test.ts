// @vitest-environment node
import { expect, it } from 'vitest';
import { z } from 'zod';
import type { ReviewDefinition } from '../../../server/providers/approval-ai/contract.js';
import {
  InvalidOutputError,
  validateDefinition,
  render,
  parseOutput,
} from '../../../server/providers/approval-ai/prompt.js';
import { definition, output } from './fixture.js';
it('validates stages, freeze fields, basis slots, duplicate checks and extension collisions', () => {
  const def = definition();
  expect(() => validateDefinition(def)).not.toThrow();
  for (const changed of [
    { stages: ['unknown'] },
    { fields: ['private'] },
    { checks: [...def.checks, ...def.checks] },
    { checks: [{ ...def.checks[0], basis: ['unknown'] }] },
    { findingExtension: z.object({ summary: z.string() }) },
  ])
    expect(() =>
      validateDefinition({ ...def, ...changed } as ReviewDefinition),
    ).toThrow();
});
it('fingerprints the exact canonical request and rejects invented references, duplicate/missing checks and truncated JSON', () => {
  const def = definition(),
    model = { modelService: 'test', model: 'chat' };
  const a = render(def, { amount: 2, text: 'x' }, [], model),
    b = render(def, { text: 'x', amount: 2 }, [], model);
  expect(a.fingerprint).toBe(b.fingerprint);
  expect(render(def, { amount: 3, text: 'x' }, [], model).fingerprint).not.toBe(
    a.fingerprint,
  );
  const good = output();
  expect(
    parseOutput(
      '```json\n' + JSON.stringify(good) + '\n```',
      def,
      { amount: 2 },
      [],
    ).findings[0].verdict,
  ).toBe('conforms');
  for (const bad of [
    { ...good, findings: [] },
    { ...good, findings: [...good.findings, ...good.findings] },
    {
      ...good,
      findings: [
        { ...good.findings[0], evidence: [{ kind: 'field', ref: 'secret' }] },
      ],
    },
  ])
    expect(() =>
      parseOutput(JSON.stringify(bad), def, { amount: 2 }, []),
    ).toThrow();
  expect(() => parseOutput('{', def, {}, [])).toThrow();
});
it('forces uncovered checks when required basis is unreadable', () => {
  const def = definition();
  def.basis = [{ key: 'policy', required: true, titleKey: 'policy' }];
  def.checks = [{ ...def.checks[0], basis: ['policy'] }];
  expect(
    parseOutput(JSON.stringify(output()), def, { amount: 2 }, [
      {
        kind: 'knowledge',
        slot: 'policy',
        ref: 'policy',
        label: 'policy',
        status: 'missing',
      },
    ]).findings[0],
  ).toMatchObject({ verdict: 'not_covered', evidence: [] });
});

it('classifies invalid output without leaking model values into diagnostics', () => {
  const good = output();
  const secret = 'PRIVATE_MODEL_CONTENT';
  for (const [text, stage] of [
    [secret, 'json'],
    [JSON.stringify({ ...good, basis: { [secret]: secret } }), 'schema'],
    [JSON.stringify({ ...good, findings: [] }), 'checks'],
    [
      JSON.stringify({
        ...good,
        findings: [
          { ...good.findings[0], evidence: [{ kind: 'field', ref: secret }] },
        ],
      }),
      'evidence',
    ],
  ]) {
    try {
      parseOutput(text, definition(), { amount: 2 }, []);
      expect.fail('Invalid output must be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidOutputError);
      expect((error as InvalidOutputError).diagnostics.stage).toBe(stage);
      expect(JSON.stringify(error)).not.toContain(secret);
    }
  }
});

it('discards unsupported conclusions before checking their evidence when required basis is missing', () => {
  const def = definition();
  def.basis = [{ key: 'policy', required: true, titleKey: 'policy' }];
  def.checks = [{ ...def.checks[0], basis: ['policy'] }];
  const response = output();
  response.findings[0].evidence = [{ kind: 'field', ref: 'fields.amount' }];
  expect(
    parseOutput(JSON.stringify(response), def, { amount: 2 }, []).findings[0],
  ).toMatchObject({
    verdict: 'not_covered',
    summary: 'approvalAi.requiredBasisMissing',
    evidence: [],
  });
  expect(() =>
    parseOutput(JSON.stringify(response), def, { amount: 2 }, [
      {
        kind: 'knowledge',
        ref: 'policy-doc',
        slot: 'policy',
        status: 'read',
        label: 'Policy',
        text: 'Rules',
      },
    ]),
  ).toThrow(InvalidOutputError);
});

it('supplies only readable exact evidence pairs and rejects inherited field names', () => {
  const def = definition();
  const rendered = render(
    def,
    { amount: 2 },
    [
      { kind: 'text', ref: 'text-1', status: 'read', label: 'Text' },
      {
        kind: 'knowledge',
        ref: 'missing-doc',
        status: 'missing',
        label: 'Policy',
      },
    ],
    { modelService: 'test', model: 'chat' },
  );
  expect(JSON.parse(rendered.prompt).allowedEvidence).toEqual([
    { kind: 'field', ref: 'amount' },
    { kind: 'text', ref: 'text-1' },
  ]);
  const response = output();
  response.findings[0].evidence = [{ kind: 'field', ref: 'constructor' }];
  expect(() =>
    parseOutput(JSON.stringify(response), def, { amount: 2 }, []),
  ).toThrow(InvalidOutputError);
});
