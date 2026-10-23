// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';
import { writeTaskSummary } from '../../../server/providers/task-center/summary.js';

for (const fixture of ['legacy-summary-schema', 'summary-schema']) {
  describeMigration('202610220004_complete_task_center_summaries', {
    sources: [
      {
        packageName: `summary-upgrade-${fixture}`,
        directory: path.resolve(
          import.meta.dirname,
          `../../fixtures/task-center/${fixture}`,
        ),
      },
    ],
    reversible: false,
    async up({ connection, expectCollection }) {
      await expectCollection('oaTaskCenterSummaries').toHaveField('number', {
        nullable: true,
      });
      await expectCollection('oaTaskCenterSummaries').toHaveField('createdAt', {
        nullable: true,
      });
      const summaries = connection.repository('oaTaskCenterSummaries');
      if (fixture === 'legacy-summary-schema')
        expect(
          await summaries.findOne({ filter: { recordId: 'existing' } }),
        ).toMatchObject({
          applicantId: 'applicant',
          status: 'draft',
          number: null,
          createdAt: null,
        });
      const record = {
        id: 'existing',
        status: 'manager',
        number: 'LEAVE-202610-0001',
        createdAt: new Date('2026-10-22T12:00:00Z'),
      };
      await writeTaskSummary(connection, 'oa.leave', record, 'applicant');
      expect(await summaries.count()).toBe(1);
      expect(
        await summaries.findOne({ filter: { recordId: 'existing' } }),
      ).toMatchObject({ number: record.number, status: 'manager' });
      await expect(
        connection.transaction(async (tx) => {
          await writeTaskSummary(
            tx,
            'oa.leave',
            { ...record, number: 'rolled-back' },
            'applicant',
          );
          throw new Error('business failure');
        }),
      ).rejects.toThrow('business failure');
      expect(
        await summaries.findOne({ filter: { recordId: 'existing' } }),
      ).toMatchObject({ number: record.number });
    },
  });
}
