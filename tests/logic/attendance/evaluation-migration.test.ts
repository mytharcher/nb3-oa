// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610105001_create_attendance_evaluations', {
  sources: [
    {
      packageName: 'oa-main',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('attendanceEvaluations').toHaveField(
      'currentRevisionId',
      { nullable: false },
    );
    await expectCollection('attendanceEvaluations').toHaveField('date', {
      nullable: false,
    });
    await expectCollection('attendanceEvaluationRevisions').toHaveField(
      'snapshot',
      { nullable: false },
    );
    await expectCollection('attendanceEvaluationRevisions').toHaveField(
      'result',
      { nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('attendanceEvaluationRevisions').not.toExist();
    await expectCollection('attendanceEvaluations').not.toExist();
  },
});
