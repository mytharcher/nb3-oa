// @vitest-environment node
import { attendanceServiceToken } from '../../../server/providers/attendance/index.ts';
import { calendarServiceToken } from '../../../server/providers/platform/index.ts';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { json } from '../org/helpers.ts';
import {
  attendanceChangeServiceToken,
  type AttendanceChangeRecord,
} from '../../../server/providers/attendance-change/index.ts';
import {
  attendanceChangeAttachmentServiceToken,
  validateAttendanceChangeFile,
} from '../../../server/providers/attendance-change-attachments/index.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';

const test = createEmployeesAppTest();
const bytes = '%PDF-1.7\nattachment-fixture\n%%EOF';
const pdf = () => new File([bytes], 'proof.pdf', { type: 'application/pdf' });
async function upload(
  session: TestSession,
  attendanceChangeId: string,
  file = pdf(),
) {
  const body = new FormData();
  body.append('file', file);
  return session.fetch('/attendanceChangeAttachments/uploadOne', {
    method: 'POST',
    headers: {
      origin: OA_TEST_ORIGIN,
      'x-attendance-change-request-id': attendanceChangeId,
    },
    body,
  });
}
async function record(response: Response): Promise<AttendanceChangeRecord> {
  expect(response.status).toBe(200);
  return (
    (await response.json()) as { data: { record: AttendanceChangeRecord } }
  ).data.record;
}

describe('restricted attendanceChange file repository', () => {
  it('validates byte signature, extension, MIME and size together', async () => {
    await expect(validateAttendanceChangeFile(pdf())).resolves.toBeUndefined();
    await expect(
      validateAttendanceChangeFile(
        new File(['<script>'], 'proof.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_FILE_TYPE' });
    await expect(
      validateAttendanceChangeFile(
        new File([bytes], 'proof.svg', { type: 'image/svg+xml' }),
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_FILE_TYPE' });
    await expect(
      validateAttendanceChangeFile(
        new File([], 'proof.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_FILE_SIZE' });
  });
  test('guards metadata and bytes, prevents cross-request links, and freezes selected attachments at submit', async ({
    testApp,
    request,
  }) => {
    const manager = await createEmployee(testApp, 'Attachment Manager');
    const owner = await createEmployee(testApp, 'Attachment Owner', {
      managerId: manager.employeeId,
    });
    const stranger = await createEmployee(testApp, 'Attachment Stranger');
    const ownSession = await owner.session();
    const managerSession = await manager.session();
    const otherSession = await stranger.session();
    const calendar =
      testApp.application.container.resolve(calendarServiceToken);
    const time = new Date(Date.now() - 60_000);
    const date = calendar.localDate(time);
    const original = await testApp.application.container
      .resolve(attendanceServiceToken)
      .ingest(
        {
          userId: owner.userId,
          date,
          punchKind: 'in',
          punchedAt: null,
          source: 'test',
          sourceKey: randomUUID(),
          sourceData: { device: 'fixture' },
        },
        { actorId: manager.userId },
      );
    const form = {
      date,
      originalAttendanceId: original.id,
      originalVersion: original.version,
      correctionAt: time.toISOString(),
      reason: 'Device missing punch',
      proof: '',
      attachments: [] as string[],
    };
    const draft = await record(
      await ownSession.fetch('/attendanceChangeRequests', json(form)),
    );
    const other = await record(
      await ownSession.fetch('/attendanceChangeRequests', json(form)),
    );
    const swaggerResponse = await ownSession.fetch('/swagger');
    expect(swaggerResponse.status).toBe(200);
    const swagger = (await swaggerResponse.json()) as {
      paths: Record<
        string,
        {
          post?: {
            operationId?: string;
            parameters?: Array<{ in: string; name: string }>;
          };
        }
      >;
    };
    const uploadDoc = Object.entries(swagger.paths).find(([path]) =>
      path.endsWith('/attendanceChangeAttachments/uploadOne'),
    )?.[1].post;
    expect(uploadDoc?.operationId).toBe('attendanceChangeAttachmentsUploadOne');
    expect(uploadDoc?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'header',
          name: 'x-attendance-change-request-id',
        }),
      ]),
    );
    expect(
      (await request('/attendanceChangeAttachments/findMany', json({}))).status,
    ).toBe(401);
    expect((await upload(otherSession, draft.id)).status).toBe(403);
    const bad = await upload(
      ownSession,
      draft.id,
      new File(['fake'], 'proof.pdf', { type: 'application/pdf' }),
    );
    expect(bad.status).toBe(400);
    expect(
      await testApp.database
        .repository('attendanceChangeAttachmentFiles')
        .count(),
    ).toBe(0);
    const uploaded = await upload(ownSession, draft.id);
    expect(uploaded.status).toBe(201);
    const first = (
      (await uploaded.json()) as {
        data: { record: { id: string; contentUrl: string } };
      }
    ).data.record;
    const audit = testApp.application.container.resolve(auditServiceToken);
    const failedAudit = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Fixture audit failure'));
    try {
      const rolledBack = await upload(ownSession, draft.id);
      expect(rolledBack.status).toBe(500);
      expect(
        await testApp.database
          .repository('attendanceChangeAttachmentFiles')
          .count(),
      ).toBe(1);
    } finally {
      failedAudit.mockRestore();
    }
    const secondResponse = await upload(ownSession, draft.id);
    expect(secondResponse.status).toBe(201);
    const second = (
      (await secondResponse.json()) as {
        data: { record: { id: string; contentUrl: string } };
      }
    ).data.record;
    const url = new URL(first.contentUrl, OA_TEST_ORIGIN).href;
    expect((await testApp.fetch(new Request(url))).status).toBe(401);
    expect((await otherSession.fetch(url)).status).toBe(403);
    const download = await ownSession.fetch(url);
    expect(download.status).toBe(200);
    expect(await download.text()).toBe(bytes);
    expect(download.headers.get('cache-control')).toBe('private, no-store');
    const metadata = await ownSession.fetch(
      '/attendanceChangeAttachments/findMany',
      {
        ...json({ limit: 10 }),
        headers: {
          ...json({}).headers,
          'x-attendance-change-request-id': draft.id,
        },
      },
    );
    expect(metadata.status).toBe(200);
    const envelope = (await metadata.json()) as {
      data: Array<Record<string, unknown>>;
    };
    expect(envelope.data).toHaveLength(2);
    expect(envelope.data[0]).not.toHaveProperty('key');
    expect(envelope.data[0]).toHaveProperty('contentUrl');
    const selectedMetadata = await ownSession.fetch(
      '/attendanceChangeAttachments/findMany',
      {
        ...json({
          limit: 10,
          filter: {
            kind: 'filter',
            version: 1,
            root: {
              kind: 'group',
              logic: 'or',
              items: [second.id].map((id) => ({
                kind: 'condition',
                path: ['id'],
                operator: '$eq',
                value: id,
              })),
            },
          },
        }),
        headers: {
          ...json({}).headers,
          'x-attendance-change-request-id': draft.id,
        },
      },
    );
    expect(selectedMetadata.status).toBe(200);
    const selectedEnvelope = (await selectedMetadata.json()) as {
      data: Array<{ id: string }>;
    };
    expect(selectedEnvelope.data.map((file) => file.id)).toEqual([second.id]);
    const unsupportedIn = await ownSession.fetch(
      '/attendanceChangeAttachments/findMany',
      {
        ...json({ limit: 10, filter: { id: { $in: [second.id] } } }),
        headers: {
          ...json({}).headers,
          'x-attendance-change-request-id': draft.id,
        },
      },
    );
    expect(unsupportedIn.status).toBe(400);
    const files = testApp.application.container.resolve(
      attendanceChangeAttachmentServiceToken,
    );
    await expect(
      files.authorize(
        draft.id,
        owner.userId,
        {
          read: {
            scope: true,
            fields: ['id', 'applicantId', 'createdById', 'status'],
          },
          create: false,
          update: false,
          delete: false,
        },
        false,
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_ATTACHMENT_DENIED' });
    await expect(
      testApp.database.transaction((tx) =>
        files.assertLinked(tx, other.id, [first.id]),
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_ATTACHMENT_INVALID' });
    await expect(
      testApp.database.transaction((tx) =>
        files.assertLinked(tx, draft.id, [first.id, first.id]),
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_ATTACHMENT_INVALID' });
    const cross = await ownSession.fetch(
      `/attendanceChangeRequests/${other.id}/transition`,
      json({
        transition: 'edit',
        version: other.lifecycleVersion,
        requestId: randomUUID(),
        input: { ...form, attachments: [first.id] },
      }),
    );
    expect(cross.status).toBe(400);
    const edited = await record(
      await ownSession.fetch(
        `/attendanceChangeRequests/${draft.id}/transition`,
        json({
          transition: 'edit',
          version: draft.lifecycleVersion,
          requestId: randomUUID(),
          input: { ...form, attachments: [first.id] },
        }),
      ),
    );
    const stale = testApp.application.container
      .resolve(serverFileRepositoryManagerToken)
      .repository('attendanceChangeAttachmentFiles', {
        disk: 'local',
        accessPath: '/uploads/attendanceChange',
        policy: {
          read: true,
          create: {
            scope: true,
            defaults: {
              attendanceChangeId: draft.id,
              ownerId: owner.userId,
              uploadVersion: draft.lifecycleVersion,
            },
          },
          update: false,
          delete: false,
        },
      });
    await expect(stale.uploadOne({ file: pdf() })).rejects.toMatchObject({
      code: 'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
    });
    expect(
      await testApp.database
        .repository('attendanceChangeAttachmentFiles')
        .count({ filter: { attendanceChangeId: draft.id } }),
    ).toBe(2);
    await record(
      await ownSession.fetch(
        `/attendanceChangeRequests/${draft.id}/transition`,
        json({
          transition: 'submit',
          version: edited.lifecycleVersion,
          requestId: randomUUID(),
          input: {},
        }),
      ),
    );
    expect((await upload(ownSession, draft.id)).status).toBe(403);
    const review = await managerSession.fetch(url);
    expect(review.status).toBe(200);
    expect(await review.text()).toBe(bytes);
    expect(
      (await ownSession.fetch(new URL(second.contentUrl, OA_TEST_ORIGIN).href))
        .status,
    ).toBe(403);
    expect((await otherSession.fetch(url)).status).toBe(403);
    expect(
      await testApp.database.repository('auditLogs').count({
        filter: {
          targetId: draft.id,
          action: 'attendanceChangeAttachment.upload',
        },
      }),
    ).toBe(2);
    // A replayed upload authorization with an old lifecycle version cannot commit metadata.
    const direct = testApp.application.container
      .resolve(serverFileRepositoryManagerToken)
      .repository('attendanceChangeAttachmentFiles', {
        disk: 'local',
        accessPath: '/uploads/attendanceChange',
        policy: {
          read: true,
          create: {
            scope: true,
            defaults: {
              attendanceChangeId: draft.id,
              ownerId: owner.userId,
              uploadVersion: draft.lifecycleVersion,
            },
          },
          update: false,
          delete: false,
        },
      });
    await expect(direct.uploadOne({ file: pdf() })).rejects.toMatchObject({
      code: 'ATTENDANCE_CHANGE_ATTACHMENT_DENIED',
    });
    expect(
      await testApp.database
        .repository('attendanceChangeAttachmentFiles')
        .count({ filter: { attendanceChangeId: draft.id } }),
    ).toBe(2);
    expect(
      (
        await testApp.application.container
          .resolve(attendanceChangeServiceToken)
          .detail(draft.id, owner.userId)
      ).record.status,
    ).toBe('manager');
  });
});
