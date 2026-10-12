import { organizationServiceToken } from '../../../server/providers/org/index.ts';
// @vitest-environment node
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
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
  travelServiceToken,
  type TravelRecord,
} from '../../../server/providers/travel/index.ts';
import {
  travelAttachmentServiceToken,
  validateTravelFile,
} from '../../../server/providers/travel/index.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';

const test = createEmployeesAppTest();
const form = {
  destination: 'Shanghai',
  reason: 'Meeting',
  international: false,
  startAt: '2026-11-25T01:00:00Z',
  endAt: '2026-11-25T09:00:00Z',
  companionIds: [] as string[],
  attachments: [] as string[],
  transportCents: 0,
  lodgingCents: 0,
  allowanceCents: 0,
  needsLoan: false,
  needsBooking: false,
};
const bytes = '%PDF-1.7\nattachment-fixture\n%%EOF';
const pdf = () => new File([bytes], 'proof.pdf', { type: 'application/pdf' });
async function upload(session: TestSession, travelId: string, file = pdf()) {
  const body = new FormData();
  body.append('file', file);
  return session.fetch('/travelAttachments/uploadOne', {
    method: 'POST',
    headers: { origin: OA_TEST_ORIGIN, 'x-travel-request-id': travelId },
    body,
  });
}
async function record(response: Response): Promise<TravelRecord> {
  expect([200, 201]).toContain(response.status);
  return ((await response.json()) as { data: { record: TravelRecord } }).data
    .record;
}

describe('restricted travel file repository', () => {
  it('validates byte signature, extension, MIME and size together', async () => {
    await expect(validateTravelFile(pdf())).resolves.toBeUndefined();
    await expect(
      validateTravelFile(
        new File(['<script>'], 'proof.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_FILE_TYPE' });
    await expect(
      validateTravelFile(
        new File([bytes], 'proof.svg', { type: 'image/svg+xml' }),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_FILE_TYPE' });
    await expect(
      validateTravelFile(
        new File([], 'proof.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_FILE_SIZE' });
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
    const departmentId = randomUUID();
    await testApp.database
      .repository('departments')
      .createOne({
        values: {
          id: departmentId,
          title: 'Travel attachment department',
          managerId: manager.userId,
          active: true,
        },
      });
    await testApp.application.container
      .resolve(organizationServiceToken)
      .addMember(
        { departmentId, userId: owner.userId, primary: true },
        { actorId: manager.userId },
      );
    const ownSession = await owner.session();
    const managerSession = await manager.session();
    const otherSession = await stranger.session();
    const draft = await record(
      await ownSession.fetch('/travelRequests', json(form)),
    );
    const other = await record(
      await ownSession.fetch('/travelRequests', json(form)),
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
      path.endsWith('/travelAttachments/uploadOne'),
    )?.[1].post;
    expect(uploadDoc?.operationId).toBe('travelAttachmentsUploadOne');
    expect(uploadDoc?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ in: 'header', name: 'x-travel-request-id' }),
      ]),
    );
    expect(
      (await request('/travelAttachments/findMany', json({}))).status,
    ).toBe(401);
    expect((await upload(otherSession, draft.id)).status).toBe(403);
    const bad = await upload(
      ownSession,
      draft.id,
      new File(['fake'], 'proof.pdf', { type: 'application/pdf' }),
    );
    expect(bad.status).toBe(400);
    expect(
      await testApp.database.repository('travelAttachmentFiles').count(),
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
        await testApp.database.repository('travelAttachmentFiles').count(),
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
    // Composite grants currently expose scope selections, not field selections. Inject the
    // narrow decision at the public authorization boundary to exercise both HTTP guards.
    const authorization =
      testApp.application.container.resolve(authorizationToken);
    const originalFor = authorization.for.bind(authorization);
    const narrowDecision = vi
      .spyOn(authorization, 'for')
      .mockImplementation((identity) => {
        const context = originalFor(identity);
        return {
          ...context,
          authorize: async (check) => {
            const decision = await context.authorize(check);
            if (
              check.resource.type === 'composite' &&
              check.resource.id === 'oa.travel' &&
              decision.conditions?.database
            ) {
              const database = decision.conditions.database as Record<
                string,
                {
                  read?: { fields?: readonly string[] };
                  create?: { fields?: readonly string[] };
                }
              >;
              const policy = database.travelRequests;
              return {
                ...decision,
                conditions: {
                  ...decision.conditions,
                  database: {
                    ...database,
                    travelRequests: {
                      ...policy,
                      read: policy.read
                        ? {
                            ...policy.read,
                            fields: [
                              'id',
                              'applicantId',
                              'createdById',
                              'status',
                            ],
                          }
                        : false,
                      create: policy.create
                        ? {
                            ...policy.create,
                            fields: [
                              'id',
                              'applicantId',
                              'createdById',
                              'status',
                            ],
                          }
                        : false,
                    },
                  },
                },
              };
            }
            return decision;
          },
        };
      });
    try {
      expect((await ownSession.fetch(url)).status).toBe(403);
      expect((await upload(ownSession, draft.id)).status).toBe(403);
    } finally {
      narrowDecision.mockRestore();
    }
    const metadata = await ownSession.fetch('/travelAttachments/findMany', {
      ...json({ limit: 10 }),
      headers: { ...json({}).headers, 'x-travel-request-id': draft.id },
    });
    expect(metadata.status).toBe(200);
    const envelope = (await metadata.json()) as {
      data: Array<Record<string, unknown>>;
    };
    expect(envelope.data).toHaveLength(2);
    expect(envelope.data[0]).not.toHaveProperty('key');
    expect(envelope.data[0]).toHaveProperty('contentUrl');
    const selectedMetadata = await ownSession.fetch(
      '/travelAttachments/findMany',
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
        headers: { ...json({}).headers, 'x-travel-request-id': draft.id },
      },
    );
    expect(selectedMetadata.status).toBe(200);
    const selectedEnvelope = (await selectedMetadata.json()) as {
      data: Array<{ id: string }>;
    };
    expect(selectedEnvelope.data.map((file) => file.id)).toEqual([second.id]);
    const unsupportedIn = await ownSession.fetch(
      '/travelAttachments/findMany',
      {
        ...json({ limit: 10, filter: { id: { $in: [second.id] } } }),
        headers: { ...json({}).headers, 'x-travel-request-id': draft.id },
      },
    );
    expect(unsupportedIn.status).toBe(400);
    const files = testApp.application.container.resolve(
      travelAttachmentServiceToken,
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
    ).rejects.toMatchObject({ code: 'TRAVEL_ATTACHMENT_DENIED' });
    await expect(
      testApp.database.transaction((tx) =>
        files.assertLinked(tx, other.id, [first.id]),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_ATTACHMENT_INVALID' });
    await expect(
      testApp.database.transaction((tx) =>
        files.assertLinked(tx, draft.id, [first.id, first.id]),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_ATTACHMENT_INVALID' });
    const cross = await ownSession.fetch(
      `/travelRequests/${other.id}/transition`,
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
        `/travelRequests/${draft.id}/transition`,
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
      .repository('travelAttachmentFiles', {
        disk: 'local',
        accessPath: '/uploads/travel',
        policy: {
          read: true,
          create: {
            scope: true,
            defaults: {
              travelId: draft.id,
              ownerId: owner.userId,
              uploadVersion: draft.lifecycleVersion,
            },
          },
          update: false,
          delete: false,
        },
      });
    await expect(stale.uploadOne({ file: pdf() })).rejects.toMatchObject({
      code: 'TRAVEL_ATTACHMENT_DENIED',
    });
    expect(
      await testApp.database
        .repository('travelAttachmentFiles')
        .count({ filter: { travelId: draft.id } }),
    ).toBe(2);
    await record(
      await ownSession.fetch(
        `/travelRequests/${draft.id}/transition`,
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
        filter: { targetId: draft.id, action: 'travelAttachment.upload' },
      }),
    ).toBe(2);
    // A replayed upload authorization with an old lifecycle version cannot commit metadata.
    const direct = testApp.application.container
      .resolve(serverFileRepositoryManagerToken)
      .repository('travelAttachmentFiles', {
        disk: 'local',
        accessPath: '/uploads/travel',
        policy: {
          read: true,
          create: {
            scope: true,
            defaults: {
              travelId: draft.id,
              ownerId: owner.userId,
              uploadVersion: draft.lifecycleVersion,
            },
          },
          update: false,
          delete: false,
        },
      });
    await expect(direct.uploadOne({ file: pdf() })).rejects.toMatchObject({
      code: 'TRAVEL_ATTACHMENT_DENIED',
    });
    expect(
      await testApp.database
        .repository('travelAttachmentFiles')
        .count({ filter: { travelId: draft.id } }),
    ).toBe(2);
    expect(
      (
        await testApp.application.container
          .resolve(travelServiceToken)
          .detail(draft.id, owner.userId)
      ).record.status,
    ).toBe('manager');
  });
});
