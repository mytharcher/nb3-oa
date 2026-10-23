// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';
import { writeTaskSummary } from '../../../server/providers/task-center/summary.js';

describeMigration('202610220003_task_center_summaries', {
  sources: [
    {
      packageName: 'task-center-summary-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../fixtures/task-center/summary-schema',
      ),
    },
  ],
  async up({ connection, expectCollection }) {
    await expectCollection('oaTaskCenterSummaries').toHaveIndex(
      ['subject', 'recordId'],
      { unique: true },
    );
    await expectCollection('oaTaskCenterSummaries').toHaveField('dueAt', {
      nullable: true,
    });
    const row = {
      id: 'record',
      status: 'draft',
      number: 'REQ-1',
      createdAt: new Date('2026-10-22T00:00:00Z'),
    };
    await writeTaskSummary(connection, 'oa.leave', row, 'applicant');
    await writeTaskSummary(
      connection,
      'oa.leave',
      { ...row, status: 'revision' },
      'applicant',
    );
    const repository = connection.repository('oaTaskCenterSummaries');
    expect(await repository.count()).toBe(1);
    expect(
      await repository.findOne({
        filter: { subject: 'oa.leave', recordId: 'record' },
      }),
    ).toMatchObject({ applicantId: 'applicant', category: 'revisions' });
    await expect(
      connection.transaction(async (tx) => {
        await writeTaskSummary(
          tx,
          'oa.leave',
          { ...row, status: 'manager' },
          'applicant',
        );
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
    expect(
      await repository.findOne({
        filter: { subject: 'oa.leave', recordId: 'record' },
      }),
    ).toMatchObject({ category: 'revisions' });
  },
});
