import {
  dataScopeTarget,
  type AuthorizationTitle,
} from '@nocobase/authorization/core';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';

type Text = string | { key: string; ns?: string; defaultValue?: string };
interface Resource {
  type: string;
  id: string;
  title: Text;
  group?: string;
  actions: { name: string; title: Text }[];
  dataScopes?: Record<
    string,
    {
      key: string;
      title: Text;
      collection: string;
      fields: string[];
      recordAccess: string[];
      defaultValue?: string;
    }[]
  >;
}
export interface AccessCatalog {
  sections: {
    name: string;
    title: Text;
    order: number;
    subsections: {
      name: string;
      title: Text;
      resources: Resource[];
      recordType?: { type: string; actions: { name: string; title: Text }[] };
    }[];
  }[];
  resourceGroups: {
    name: string;
    title: Text;
    parent?: string;
    order?: number;
  }[];
  subjectTypes: {
    type: string;
    title: Text;
    selection: { type: 'fixed'; id: string } | { type: 'collection' };
  }[];
  recordAccess: {
    key: string;
    title: Text;
    description?: AuthorizationTitle;
    collections: readonly string[];
  }[];
  collections: { name: string; fields: string[] }[];
}
/** Matrix metadata only: no collection descriptions, raw fields, memberships or scope evaluation. */
export function accessCatalog(authz: AppAuthorization): AccessCatalog {
  const composites = new Map(
    authz.compositeResources.list().map((entry) => [entry.name, entry]),
  );
  const placed = new Map<string, { resource: Resource; order: number }[]>();
  for (const type of authz.resourceTypes.list()) {
    if (!['composite', 'settings'].includes(type.type) || !type.items) continue;
    for (const item of type.items.list()) {
      const placement = authz.ui.placementOf({ type: type.type, id: item.id });
      const parent = authz.ui.defaultSectionOf(type.type);
      const section =
        placement && authz.ui.sections.isSubsection(placement.section)
          ? placement.section
          : parent
            ? authz.ui.sections.other(parent)
            : undefined;
      if (!section) continue;
      const resource: Resource = {
        type: type.type,
        id: item.id,
        title: item.title ?? item.id,
        actions: item.actions.map((action) => ({
          name: action.name,
          title: action.title ?? action.name,
        })),
        ...(placement?.group ? { group: placement.group } : {}),
      };
      if (type.type === 'composite') {
        resource.dataScopes = Object.fromEntries(
          (composites.get(item.id)?.actions ?? []).map((action) => [
            action.name,
            (action.dataScopes ?? []).map((scope) => {
              const collection = dataScopeTarget(action, scope.key).id;
              return {
                key: scope.key,
                title: scope.title ?? scope.key,
                collection,
                fields: [],
                recordAccess: [
                  ...(scope.options ??
                    authz.recordAccess
                      .listFor(collection)
                      .map((entry) => entry.key)),
                ],
                ...(scope.defaultValue === undefined
                  ? {}
                  : { defaultValue: scope.defaultValue }),
              };
            }),
          ]),
        );
      }
      const list = placed.get(section) ?? [];
      list.push({ resource, order: placement?.order ?? Infinity });
      placed.set(section, list);
    }
  }
  return {
    sections: authz.ui.sections.tree().map((section) => ({
      name: section.name,
      title: section.title,
      order: section.order,
      subsections: section.subsections.flatMap((subsection) => {
        if (section.name === 'pages' && authz.resourceTypes.has('page'))
          return [
            {
              name: subsection.name,
              title: subsection.title,
              recordType: {
                type: 'page',
                actions: authz.resourceTypes
                  .get('page')
                  .actions.map((action) => ({
                    name: action.name,
                    title: action.title ?? action.name,
                  })),
              },
              resources: [],
            },
          ];
        const resources = (placed.get(subsection.name) ?? [])
          .sort((a, b) =>
            a.order === b.order ? 0 : a.order < b.order ? -1 : 1,
          )
          .map((entry) => entry.resource);
        return resources.length
          ? [{ name: subsection.name, title: subsection.title, resources }]
          : [];
      }),
    })),
    resourceGroups: authz.ui.groups.list().map((group) => ({ ...group })),
    subjectTypes: authz.subjects.list().flatMap((type) => {
      const administration = authz.subjects.get(type)?.administration;
      return administration
        ? [
            {
              type,
              title: administration.title,
              selection:
                administration.selection.type === 'fixed'
                  ? { type: 'fixed' as const, id: administration.selection.id }
                  : { type: 'collection' as const },
            },
          ]
        : [];
    }),
    recordAccess: authz.recordAccess.list().map((entry) => ({
      key: entry.key,
      title: entry.title ?? entry.key,
      ...(entry.description ? { description: entry.description } : {}),
      collections: entry.collections,
    })),
    collections: [],
  };
}
