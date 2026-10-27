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
    'You assist a human approval handler. Never decide approvals. Review each check exactly once. Missing required basis means not_covered. Cite only supplied references. Return only JSON matching this schema. ' +
    (d.instructions ?? '') +
    '\n' +
    JSON.stringify(z.toJSONSchema(outputSchema(d)));
  const prompt = canonical({
    checks: d.checks.map((c) => ({
      id: c.id,
      instruction: c.instruction,
      basis: c.basis,
    })),
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
export function parseOutput(
  text: string,
  d: ReviewDefinition,
  content: Record<string, unknown>,
  materials: Material[],
) {
  const output = outputSchema(d).parse(
    JSON.parse(
      text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, ''),
    ),
  ) as { findings: (Finding & Record<string, unknown>)[]; basis: string };
  const ids = output.findings.map((f) => f.checkId);
  if (
    ids.length !== d.checks.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !d.checks.some((c) => c.id === id))
  )
    throw new Error('invalid_output');
  for (const f of output.findings) {
    for (const e of f.evidence)
      if (
        e.kind === 'field'
          ? !(e.ref in content)
          : !materials.some(
              (m) =>
                m.ref === e.ref && m.status === 'read' && m.kind === e.kind,
            )
      )
        throw new Error('invalid_output');
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
    }
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
