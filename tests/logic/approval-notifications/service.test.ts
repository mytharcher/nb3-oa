import type { AdministratedUser } from '@nocobase/app-plugin-authentication';
import type {
  ApprovalDirectory,
  TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type {
  NotificationConfig,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
import { I18nRuntime } from '@nocobase/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import locales from '../../../server/locales/index.ts';
import { createApprovalNotificationService } from '../../../server/providers/approval-notifications/service.ts';

describe('OA approval notifications', () => {
  const send = vi.fn<NotificationService['send']>();
  const users = new Map<string, AdministratedUser>();
  let i18n: I18nRuntime;
  const task = {
    id: 'task1',
    recordId: 'leave/1',
    source: 'oa.leave',
    kind: 'decide',
    assigneeId: 'reviewer',
    via: 'plan',
    createdAt: '2026-10-10T01:00:00Z',
  } as TaskRow;
  const channels: NotificationConfig['channels'] = {
    inbox: { provider: 'in-app' },
    email: { provider: 'smtp' },
    alarm: { provider: 'feishu-webhook' },
    unrelated: { provider: 'smtp' },
  };
  function service(
    extra: Partial<
      Parameters<typeof createApprovalNotificationService>[0]
    > = {},
  ) {
    return createApprovalNotificationService({
      notification: { send } as unknown as NotificationService,
      users: { get: async (id) => users.get(id) },
      i18n,
      channels,
      config: {
        inbox: 'inbox',
        email: 'email',
        alarm: 'alarm',
        administrators: ['reviewer'],
      },
      publicOrigin: 'https://oa.example.com',
      basePath: '/main',
      localeOf: async (id) => (id === 'proxy' ? 'zh-CN' : 'en-US'),
      ...extra,
    });
  }
  beforeEach(async () => {
    send.mockReset();
    users.clear();
    for (const id of ['reviewer', 'proxy', 'applicant']) {
      users.set(id, {
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: true,
        kind: 'person',
        description: null,
        disabledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    i18n = new I18nRuntime({ defaultLocale: 'en-US' });
    i18n.registerApplicationNamespace('nb3-oa', locales);
    await i18n.init();
  });

  it('notifies the principal and direct proxy in their own languages without email for assignment', async () => {
    const delegateOf = vi.fn(() => ({ to: 'proxy', mode: 'proxy' as const }));
    const directory: ApprovalDirectory = {
      isActive: () => true,
      managerOf: () => undefined,
      hasRole: () => false,
      delegateOf,
    };
    await service().task({
      task,
      reason: 'assigned',
      directory,
      applicantId: 'applicant',
      kind: 'leave',
      at: '2026-10-11T01:00:00Z',
    });
    expect(delegateOf).toHaveBeenCalledWith(
      'reviewer',
      'leave',
      '2026-10-11T01:00:00Z',
      task.createdAt,
    );
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      idempotencyKey: 'oa.approvals:task:task1:assigned:reviewer',
      messages: {
        inbox: {
          to: 'reviewer',
          body: 'You have an approval to process.',
          target: { type: 'route', path: '/approvals/mine/leave/leave%2F1' },
        },
      },
    });
    expect(send.mock.calls[1]?.[0].messages).toEqual({
      inbox: expect.objectContaining({ to: 'proxy', title: '审批动态' }),
    });
  });

  it('copies never create delegated decision notifications', async () => {
    const delegateOf = vi.fn(() => ({ to: 'proxy' }));
    await service().task({
      task: { ...task, kind: 'copy' },
      reason: 'assigned',
      directory: {
        isActive: () => true,
        managerOf: () => undefined,
        hasRole: () => false,
        delegateOf,
      },
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(delegateOf).not.toHaveBeenCalled();
  });

  it('never notifies the applicant as a proxy, or disabled/service accounts', async () => {
    const directory: ApprovalDirectory = {
      isActive: () => true,
      managerOf: () => undefined,
      hasRole: () => false,
      delegateOf: () => ({ to: 'applicant' }),
    };
    await service().task({
      task,
      reason: 'assigned',
      directory,
      applicantId: 'applicant',
    });
    expect(send).toHaveBeenCalledTimes(1);
    send.mockClear();
    users.set('reviewer', {
      ...users.get('reviewer')!,
      disabledAt: new Date(),
    });
    await service().task({ task, reason: 'reminder' });
    users.set('reviewer', {
      ...users.get('reviewer')!,
      disabledAt: null,
      kind: 'service',
    });
    await service().task({ task, reason: 'reminder' });
    expect(send).not.toHaveBeenCalled();
  });

  it('sends result email with a public URL and a stable event identity', async () => {
    await service().result({
      recordId: 'leave/1',
      applicantId: 'applicant',
      state: 'approved',
      transitionId: 'transition1',
    });
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      idempotencyKey: 'oa.approvals:result:transition1:applicant',
      messages: {
        email: {
          to: 'applicant@example.com',
          text: 'Your application has been approved.\nhttps://oa.example.com/main/approvals/mine/leave/leave%2F1',
        },
      },
    });
    expect(Object.keys(send.mock.calls[0]![0].messages)).toEqual([
      'inbox',
      'email',
    ]);
  });

  it('does not send through disabled or mismatched channels and preserves provider failures', async () => {
    await service({
      channels: {
        inbox: { provider: 'in-app', enabled: false },
        email: { provider: 'feishu-webhook' },
      },
    }).result({
      recordId: '1',
      applicantId: 'applicant',
      state: 'approved',
      transitionId: '1',
    });
    expect(send).not.toHaveBeenCalled();
    send.mockRejectedValueOnce(new Error('dispatch failed'));
    await expect(
      service().result({
        recordId: '1',
        applicantId: 'applicant',
        state: 'approved',
        transitionId: '1',
      }),
    ).rejects.toThrow('dispatch failed');
  });

  it('alarms target explicit administrators once and use a recipientless webhook without private business data', async () => {
    await service().alarm({
      recordId: '1',
      recipients: ['reviewer', 'reviewer'],
      eventId: 'held1',
      reason: 'private reason',
    });
    expect(send).toHaveBeenCalledTimes(2);
    const webhook = send.mock.calls[1]![0];
    expect(webhook.idempotencyKey).toBe('oa.approvals:alarm:held1:webhook');
    expect(webhook.messages).toEqual({
      alarm: {
        text: 'An approval needs administrator attention.',
        target: {
          type: 'url',
          url: 'https://oa.example.com/main/approvals/mine/leave/1',
        },
      },
    });
    expect(JSON.stringify(send.mock.calls)).not.toContain('private reason');
  });

  it('only escalation sends task email, and no external URL is invented without a public origin', async () => {
    await service().task({
      task: { ...task, via: 'escalate' },
      reason: 'assigned',
    });
    expect(send.mock.calls[0]![0].messages.email).toBeDefined();
    send.mockClear();
    await service({ publicOrigin: undefined }).result({
      recordId: '1',
      applicantId: 'applicant',
      state: 'revision',
      transitionId: '1',
    });
    expect(Object.keys(send.mock.calls[0]![0].messages)).toEqual(['inbox']);
  });
});
