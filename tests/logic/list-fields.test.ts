// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RepositoryPolicy } from '@nocobase/db';
import { readableListFields } from '../../server/providers/list-fields.js';

const fields = ['id', 'title', 'amount'] as const;
const policy = (read: RepositoryPolicy['read']): RepositoryPolicy => ({
  read,
  create: false,
  update: false,
  delete: false,
});

describe('list projection field visibility', () => {
  it('keeps an explicit whitelist for an unrestricted grant', () => {
    expect(readableListFields(fields, policy(true))).toEqual(fields);
  });
  it('does not select a hidden amount or expand to a granted detail payload', () => {
    const grant = policy({ scope: true, fields: ['id', 'title', 'snapshot'] });
    expect(readableListFields(fields, grant)).toEqual(['id', 'title']);
    expect(grant.read).toEqual({
      scope: true,
      fields: ['id', 'title', 'snapshot'],
    });
    expect(fields).toEqual(['id', 'title', 'amount']);
  });
  it('rejects empty whitelists before they can become SELECT *', () => {
    expect(() => readableListFields([], policy(true))).toThrowError(
      expect.objectContaining({ code: 'FIELD_READ_FORBIDDEN' }),
    );
  });
  it('does not synthesize readable fields for denied or disjoint grants', () => {
    for (const read of [
      false,
      { scope: true },
      { scope: true, fields: ['*'] },
      { scope: true, fields: false },
      { scope: true, fields: ['snapshot'] },
    ] as const) {
      expect(() => readableListFields(fields, policy(read))).toThrowError(
        expect.objectContaining({ code: 'FIELD_READ_FORBIDDEN' }),
      );
    }
  });
});
