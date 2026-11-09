import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  findingSchema,
  type Material,
  type Finding,
} from '../../../shared/approval-ai.js';
import type { ReviewDefinition } from './contract.js';
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value) ?? 'null';
}
export function outputSchema(d: ReviewDefinition) {
  return z.object({
    findings: z.array(
      d.findingExtension
        ? findingSchema.extend(d.findingExtension.shape)
        : findingSchema,
    ),
    basis: z.string().max(4000),
  });
}
export function validateDefinition(d: ReviewDefinition) {
  if (
    !d.id ||
    !Number.isInteger(d.version) ||
    d.version < 1 ||
    !d.stages.length ||
    !d.checks.length
  )
    throw new Error('Invalid approval AI definition: ' + d.id);
  for (const stage of d.stages)
    if (!d.approval.isStage(stage))
      throw new Error('Unknown AI stage: ' + stage);
  for (const field of d.fields)
    if (!d.approval.options.freeze?.includes(field))
      throw new Error('AI field is not frozen: ' + field);
  for (const list of [d.checks.map((c) => c.id), d.basis.map((b) => b.key)])
    if (new Set(list).size !== list.length)
      throw new Error('Duplicate AI check or basis slot');
  for (const c of d.checks)
    for (const key of c.basis)
      if (!d.basis.some((b) => b.key === key))
        throw new Error('Unknown AI basis slot: ' + key);
  for (const key of Object.keys(d.findingExtension?.shape ?? {}))
    if (key in findingSchema.shape)
      throw new Error('AI extension overrides field: ' + key);
  z.toJSONSchema(outputSchema(d));
}
export function render(
  d: ReviewDefinition,
  content: Record<string, unknown>,
  materials: Material[],
  model: { modelService: string; model: string },
) {
  const system =
    'You assist a human approval handler. Never decide approvals. Review each check exactly once. Missing required basis means not_covered. Cite only exact kind/ref pairs from allowedEvidence. For field evidence ref is the bare field name, never a JSON path or field value. Never cite missing/unreadable materials. When required basis is missing, return not_covered with empty evidence. Return only JSON matching this schema. ' +
    (d.instructions ?? '') +
    '\n' +
    JSON.stringify(z.toJSONSchema(outputSchema(d)));
  const prompt = canonical({
    checks: d.checks.map((c) => ({
      id: c.id,
      instruction: c.instruction,
      basis: c.basis,
    })),
    allowedEvidence: [
      ...Object.keys(content)
        .sort()
        .map((ref) => ({ kind: 'field', ref })),
      ...materials
        .filter((m) => m.status === 'read' && m.kind !== 'aggregate')
        .map(({ kind, ref }) => ({ kind, ref })),
    ],
    fields: content,
    materials,
  });
  const fingerprint = createHash('sha256')
    .update(
      canonical({
        definitionId: d.id,
        definitionVersion: d.version,
        promptVersion: 1,
        model,
        system,
        prompt,
        maxOutputTokens: d.maxOutputTokens ?? 4000,
      }),
    )
    .digest('hex');
  return { system, prompt, fingerprint };
}
/** Diagnostics contain only bounded codes and schema paths, never model text. */
export class InvalidOutputError extends Error {
  constructor(
    public readonly diagnostics: {
      stage: 'json' | 'schema' | 'checks' | 'evidence';
      issues?: { code: string; path: (string | number)[] }[];
      findingIndex?: number;
      evidenceIndex?: number;
    },
  ) {
    super('invalid_output');
  }
}
export function parseOutput(
  text: string,
  d: ReviewDefinition,
  content: Record<string, unknown>,
  materials: Material[],
) {
  let value: unknown;
  try {
    value = JSON.parse(
      text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, ''),
    );
  } catch {
    throw new InvalidOutputError({ stage: 'json' });
  }
  const parsed = outputSchema(d).safeParse(value);
  if (!parsed.success) {
    const safeKeys = new Set([
      'findings',
      'basis',
      'checkId',
      'verdict',
      'summary',
      'evidence',
      'kind',
      'ref',
      'location',
      'quote',
      ...Object.keys(d.findingExtension?.shape ?? {}),
    ]);
    throw new InvalidOutputError({
      stage: 'schema',
      issues: parsed.error.issues.slice(0, 10).map((issue) => ({
        code: issue.code,
        path: issue.path
          .slice(0, 8)
          .map((key) =>
            typeof key === 'number'
              ? key
              : safeKeys.has(String(key))
                ? String(key)
                : '[key]',
          ),
      })),
    });
  }
  const output = parsed.data as {
    findings: (Finding & Record<string, unknown>)[];
    basis: string;
  };
  const ids = output.findings.map((f) => f.checkId);
  if (
    ids.length !== d.checks.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !d.checks.some((c) => c.id === id))
  )
    throw new InvalidOutputError({ stage: 'checks' });
  for (const [findingIndex, f] of output.findings.entries()) {
    const check = d.checks.find((c) => c.id === f.checkId)!;
    if (
      check.basis.some(
        (slot) =>
          d.basis.find((b) => b.key === slot)?.required &&
          !materials.some((m) => m.slot === slot && m.status === 'read'),
      )
    ) {
      f.verdict = 'not_covered';
      f.summary = 'approvalAi.requiredBasisMissing';
      f.evidence = [];
      continue;
    }
    for (const [evidenceIndex, e] of f.evidence.entries())
      if (
        e.kind === 'field'
          ? !Object.hasOwn(content, e.ref)
          : !materials.some(
              (m) =>
                m.ref === e.ref && m.status === 'read' && m.kind === e.kind,
            )
      )
        throw new InvalidOutputError({
          stage: 'evidence',
          findingIndex,
          evidenceIndex,
        });
  }
  return output;
}
export function modelError(error: unknown, timedOut: boolean): string {
  if (timedOut) return 'timeout';
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
  return (
    (
      {
        config: 'model_config',
        auth: 'model_config',
        quota: 'quota',
        rateLimit: 'rate_limited',
        network: 'network',
        contextOverflow: 'context_overflow',
        filtered: 'filtered',
        badResponse: 'bad_request',
      } as Record<string, string>
    )[code] ?? 'unknown'
  );
}
