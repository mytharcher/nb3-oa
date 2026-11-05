import type {
  SuggestionMaterial,
  SuggestionMaterialsSource,
} from '@nocobase/app-plugin-approval/server/assistant';
import type { DatabaseManager } from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { KnowledgeService } from '../knowledge/contract.js';
import { KnowledgeError } from '../knowledge/service.js';
import type { ProcessOwner } from '../process-management/owners.js';
import { actorFor, readPolicy } from './service.js';

const LIMIT = 8000;
const unavailable = (ref: string, label: string): SuggestionMaterial => ({
  kind: 'knowledge',
  ref,
  label,
  text: '',
  status: 'missing',
});
/** Manual suggestions read the signed-in principal's policies, never an assignee persona. */
export function createOaSuggestionMaterials(d: {
  db: DatabaseManager;
  authz: AppAuthorization;
  knowledge: KnowledgeService;
  owners: readonly Pick<ProcessOwner, 'kind' | 'zh' | 'en'>[];
}): SuggestionMaterialsSource {
  async function policies(userId: string) {
    const actor = await actorFor(d.authz, userId);
    const docs = await readPolicy(
      actor,
      'oa.knowledgeDocuments',
      'knowledgeDocuments',
    );
    const versions = await readPolicy(
      actor,
      'oa.knowledgeDocuments',
      'knowledgeVersions',
    );
    return docs && versions ? { docs, versions } : null;
  }
  async function read(
    userId: string,
    id: string,
  ): Promise<SuggestionMaterial | null> {
    const policy = await policies(userId);
    if (!policy) return null;
    try {
      const detail = await d.db.transaction((tx) =>
        d.knowledge.detail(id, userId, tx, policy.docs, policy.versions),
      );
      const version = detail.versions.find(
        (item) => item.id === detail.document.latestVersionId,
      );
      if (!version) return null;
      if (version.kind !== 'markdown')
        return {
          kind: 'knowledge',
          ref: id,
          label: detail.document.title,
          text: '',
          version: version.version,
          status: 'not_supported',
        };
      const text = version.markdown ?? '';
      return {
        kind: 'knowledge',
        ref: id,
        label: detail.document.title,
        version: version.version,
        text: text.slice(0, LIMIT),
        status: 'read',
        truncated: text.length > LIMIT,
        range: {
          start: 0,
          end: Math.min(text.length, LIMIT),
          total: text.length,
        },
      };
    } catch (error) {
      if (
        error instanceof KnowledgeError &&
        [
          'ACCESS_DENIED',
          'DOCUMENT_NOT_FOUND',
          'VERSION_NOT_FOUND',
          'NOT_FOUND',
        ].includes(error.code)
      )
        return null;
      throw error;
    }
  }
  return {
    async load(userId, _content, source) {
      const owner = d.owners.find((item) => item.kind === source);
      if (!owner) return [];
      const policy = await policies(userId);
      if (!policy) return [unavailable('knowledge:unavailable', owner.en)];
      // The public knowledge service enforces department/duty visibility and field policies.
      const documents = await d.db.transaction((tx) =>
        d.knowledge.listPage(userId, tx, policy.docs, {
          page: 1,
          pageSize: 5,
          q: owner.zh,
        }),
      );
      const materials: SuggestionMaterial[] = [];
      for (const document of documents.items) {
        const material = await read(userId, document.id);
        if (material) materials.push(material);
      }
      return materials.length
        ? materials
        : [unavailable('knowledge:no-match', owner.en)];
    },
    async validate(userId, materials, source) {
      if (!source || !d.owners.some((item) => item.kind === source))
        return materials.length === 0;
      for (const material of materials) {
        if (material.kind !== 'knowledge') return false;
        if (material.status === 'missing') continue;
        const current = await read(userId, material.ref);
        if (
          !current ||
          current.status !== material.status ||
          current.version !== material.version ||
          current.label !== material.label ||
          current.text !== material.text ||
          !!current.truncated !== !!material.truncated ||
          current.range?.start !== material.range?.start ||
          current.range?.end !== material.range?.end ||
          current.range?.total !== material.range?.total
        )
          return false;
      }
      return true;
    },
  };
}
