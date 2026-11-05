import { z } from 'zod';
// Identifiers only: the server reloads the authorized result for every tool call.
export const reviewReferenceSchema = z.object({
  lifecycle: z.string().min(1).max(128),
  recordId: z.string().min(1).max(128),
  taskId: z.string().min(1).max(128),
  generatedAt: z.string().min(1).max(64),
});
export type ReviewReference = z.infer<typeof reviewReferenceSchema>;
export const findingSchema = z.object({
  checkId: z.string(),
  verdict: z.enum([
    'conforms',
    'nonconforming',
    'needs_verification',
    'not_covered',
  ]),
  summary: z.string().min(1).max(4000),
  evidence: z
    .array(
      z.object({
        kind: z.enum(['field', 'attachment', 'text', 'knowledge', 'record']),
        ref: z.string(),
        location: z.string().max(500).optional(),
        quote: z.string().max(4000).optional(),
      }),
    )
    .max(30),
});
export const reviewOutputSchema = z.object({
  findings: z.array(findingSchema).max(100),
  basis: z.string().max(4000),
});
export type Finding = z.infer<typeof findingSchema>;
export interface Material {
  kind: 'attachment' | 'text' | 'record' | 'aggregate' | 'knowledge';
  ref: string;
  label: string;
  status: 'read' | 'not_supported' | 'missing';
  text?: string;
  version?: number;
  slot?: string;
}
export const settingsInput = z.object({
  enabled: z.boolean(),
  modelService: z.string().max(128).nullable(),
  model: z.string().max(255).nullable(),
  basis: z.record(z.string(), z.string().max(128).nullable()),
  timeoutSeconds: z.number().int().min(10).max(600),
  expectedVersion: z.number().int().min(0),
});
export type SettingsInput = z.infer<typeof settingsInput>;
export interface ReviewSettings {
  definitionId: string;
  enabled: boolean;
  modelService: string | null;
  model: string | null;
  basis: Record<string, string | null>;
  timeoutSeconds: number;
  version: number;
}
export interface ReviewView {
  taskId: string;
  via: 'assignee' | 'delegate';
  definitionId: string;
  title: string;
  stage: string;
  taskOpen: boolean;
  status:
    | 'none'
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'skipped'
    | 'cancelled';
  errorCode: string | null;
  canGenerate: boolean;
  canCancel?: boolean;
  versions?: ReviewVersion[];
  generatedAt: string | null;
  model: { modelService: string; model: string } | null;
  findings: (Finding & { title: string })[] | null;
  coverage: Omit<Material, 'text'>[];
  basis: string | null;
}
export interface DefinitionView {
  id: string;
  title: string;
  stages: readonly string[];
  checks: { id: string; title: string }[];
  basis: { key: string; title: string; required: boolean }[];
  settings: ReviewSettings;
}

export type ReviewVersion = Pick<
  ReviewView,
  'generatedAt' | 'model' | 'findings' | 'coverage' | 'basis'
> & { id: string };

/** Native plugin report/status; the host adds only the authorized task identity. */
export type ApprovalSuggestionView = Omit<
  import('@nocobase/app-plugin-approval/server/assistant').ApprovalSuggestionState,
  'advice'
> & {
  taskId: string;
  title: string;
  stage: string;
  advice: {
    report: import('@nocobase/app-plugin-approval/server/assistant').SuggestionReport;
    diagnostics?: import('@nocobase/app-plugin-approval/server/assistant').SuggestionDiagnostics;
  } | null;
};
