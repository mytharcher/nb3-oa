// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createOaSuggestionMaterials } from '../../../server/providers/approval-ai/materials.js';
function fixture() {
  let allowed = true;
  const version = {
    id: 'version',
    version: 3,
    kind: 'markdown',
    markdown: 'Approved company review rule',
    fileId: null,
  };
  const doc = { id: 'policy', title: 'Leave rule', latestVersionId: 'version' };
  const detail = vi.fn(async () => ({ document: doc, versions: [version] }));
  const listPage = vi.fn(async () => ({ items: [doc], total: 1 }));
  const dependencies = {
    db: {
      transaction: async (work: (tx: object) => Promise<unknown>) => work({}),
    },
    authz: {
      subjects: { resolveFor: async () => [] },
      for: () => ({
        authorize: async () => ({
          effect: allowed ? 'allow' : 'deny',
          conditions: {
            database: { knowledgeDocuments: {}, knowledgeVersions: {} },
          },
        }),
      }),
    },
    knowledge: { detail, listPage },
    owners: [{ kind: 'oa.leave', zh: '请假', en: 'Leave' }],
  };
  return {
    source: createOaSuggestionMaterials(
      dependencies as unknown as Parameters<
        typeof createOaSuggestionMaterials
      >[0],
    ),
    version,
    doc,
    detail,
    listPage,
    deny: () => {
      allowed = false;
    },
  };
}
describe('OA authorized knowledge adapter', () => {
  it('loads bounded policy text using the real reader and business source', async () => {
    const f = fixture();
    f.version.markdown = '文'.repeat(9000);
    const result = await f.source.load('real-user', {}, 'oa.leave');
    expect(f.listPage).toHaveBeenCalledWith(
      'real-user',
      {},
      {},
      { page: 1, pageSize: 5, q: '请假' },
    );
    expect(f.detail).toHaveBeenCalledWith('policy', 'real-user', {}, {}, {});
    expect(result[0]).toMatchObject({
      text: '文'.repeat(8000),
      version: 3,
      truncated: true,
      range: { start: 0, end: 8000, total: 9000 },
    });
    expect(await f.source.validate('real-user', result, 'oa.leave')).toBe(true);
    // PostgreSQL JSONB does not preserve object key insertion order.
    const material = Object.fromEntries(Object.entries(result[0]).reverse());
    expect(
      await f.source.validate(
        'real-user',
        [material] as typeof result,
        'oa.leave',
      ),
    ).toBe(true);
  });
  it('invalidates saved reports after authorization, content or version changes', async () => {
    for (const change of ['permission', 'text', 'version', 'title']) {
      const f = fixture();
      const materials = await f.source.load('reader', {}, 'oa.leave');
      if (change === 'permission') f.deny();
      if (change === 'text') f.version.markdown += ' updated';
      if (change === 'version') f.version.version++;
      if (change === 'title') f.doc.title = 'Changed title';
      expect(await f.source.validate('reader', materials, 'oa.leave')).toBe(
        false,
      );
    }
  });
  it('does not borrow another business adapter or infer access when source is absent', async () => {
    const f = fixture();
    expect(await f.source.load('reader', {}, 'unknown')).toEqual([]);
    expect(f.listPage).not.toHaveBeenCalled();
    const materials = await f.source.load('reader', {}, 'oa.leave');
    expect(await f.source.validate('reader', materials)).toBe(false);
    expect(await f.source.validate('reader', materials, 'unknown')).toBe(false);
  });
  it('keeps missing and unsupported knowledge explicit', async () => {
    const f = fixture();
    f.deny();
    expect(await f.source.load('reader', {}, 'oa.leave')).toMatchObject([
      { status: 'missing', text: '' },
    ]);
    expect(f.listPage).not.toHaveBeenCalled();
  });
});
