import type { ReactNode } from 'react';
export type ReviewStatus =
  'none' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type ReviewVerdict =
  'nonconforming' | 'needs_verification' | 'not_covered' | 'conforms';
export interface ReviewEvidence {
  kind: 'field' | 'attachment' | 'text' | 'knowledge' | 'record';
  ref: string;
  location?: string;
  quote?: string;
}
export interface ReviewFinding {
  checkId: string;
  title: string;
  verdict: ReviewVerdict;
  summary: string;
  evidence: readonly ReviewEvidence[];
}
export interface ReviewMaterial {
  kind: ReviewEvidence['kind'] | 'aggregate';
  ref: string;
  label: string;
  status: 'read' | 'partial_read' | 'not_supported' | 'missing';
  version?: number;
  slot?: string;
}
export interface ReviewReportData {
  /** Validated overall recommendation; absent on older saved reports. */
  nextStep?: string | null;
  status: ReviewStatus;
  findings: readonly ReviewFinding[] | null;
  coverage: readonly ReviewMaterial[];
  basis: string | null;
}
export interface ReviewSnapshot extends ReviewReportData {
  generatedAt: string | null;
  model: { modelService: string; model: string } | null;
  taskOpen: boolean;
}
export interface ReviewVersion {
  model?: ReviewSnapshot['model'];
  id: string;
  generatedAt: string | null;
}
export interface ReviewReportProps {
  review: ReviewReportData;
  renderEvidence?: (evidence: ReviewEvidence, label: string) => ReactNode;
  evidenceLabel?: (evidence: ReviewEvidence) => string | undefined;
  notice?: ReactNode;
  children?: ReactNode;
}

/** A generation request, distinct from its optional successful report. */
export interface ReviewAttempt {
  id: string;
  status: 'generating' | 'succeeded' | 'failed' | 'cancelled' | 'unavailable';
  createdAt: string | null;
  finishedAt: string | null;
  errorCode: string | null;
  startedAt?: string | null;
  deadlineAt?: string | null;
  diagnostics?: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    durationMs?: number;
    validationCode?: string;
  };
}
