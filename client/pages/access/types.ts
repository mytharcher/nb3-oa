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
  id: string;
  resource: ResourceOption;
  action: string;
  label: string;
  scopes: Record<string, string>;
  enabled: boolean;
  custom: boolean;
}
