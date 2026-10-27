import type {
  Approval,
  TaskRow,
  RunRow,
} from '@nocobase/app-plugin-approval/server';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type { z } from 'zod';
import type { Material } from '../../../shared/approval-ai.js';
export interface AiActor {
  userId: string;
  authz: AuthorizationContext;
}
export interface ReviewDefinition {
  id: string;
  version: number;
  titleKey: string;
  approval: Approval<never>;
  stages: readonly string[];
  fields: readonly string[];
  basis: readonly { key: string; titleKey: string; required: boolean }[];
  checks: readonly {
    id: string;
    titleKey: string;
    instruction: string;
    basis: readonly string[];
  }[];
  instructions?: string;
  maxOutputTokens?: number;
  findingExtension?: z.ZodObject;
  host: {
    task(taskId: string, recordId?: string): Promise<TaskRow | null>;
    tasks(recordId: string): Promise<TaskRow[]>;
    openTasks(limit: number): Promise<TaskRow[]>;
    run(task: TaskRow): Promise<RunRow | null>;
    canRead(actor: AiActor, recordId: string): Promise<boolean>;
    content(
      actor: AiActor,
      task: TaskRow,
      content: Readonly<Record<string, unknown>>,
    ): Promise<Record<string, unknown>>;
    gather(context: {
      actor: AiActor;
      task: TaskRow;
      content: Readonly<Record<string, unknown>>;
      tx: DatabaseConnection;
    }): Promise<Material[]>;
  };
}
export interface ApprovalAiRegistry {
  register(definition: ReviewDefinition): Promise<void>;
  taskAssigned(task: TaskRow): Promise<void>;
}
export const approvalAiRegistryToken = createServiceToken<ApprovalAiRegistry>(
  'oa/approval-ai-registry',
);
