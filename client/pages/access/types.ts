import type {
  AuthorizationOptions,
  PermissionSet,
  PermissionSetAssignment,
  ResourceOption,
  AuthorizationSubject,
} from '../administration/authorization/authorization-client.js';
export type {
  AuthorizationOptions,
  PermissionSet,
  PermissionSetAssignment,
  ResourceOption,
  AuthorizationSubject,
};
export interface AccessSnapshot {
  revisionScope?: 'subject';
  subject?: { type: string; id: string };
  role?: { title: string | { key: string; ns?: string }; memberCount?: number };
  rules?: {
    kind: string;
    resource: { type: string; id: string };
    count: number;
  }[];
  revision: string;
  sets: PermissionSet[];
  assignments: PermissionSetAssignment[];
}
export interface DefinitionSnapshot {
  revision: string;
  definition: PermissionSet;
  assignments: PermissionSetAssignment[];
}
export interface SubjectRow {
  type: string;
  id: string;
  title: string;
  description?: string;
  active?: boolean;
  memberCount?: number;
}
export interface ActionRow {
  sourceKeys?: string[];
  targetKeys?: string[];
  targetKey?: string;
  id: string;
  resource: ResourceOption;
  action: string;
  label: string;
  scopes: Record<string, string>;
  enabled: boolean;
  custom: boolean;
}
