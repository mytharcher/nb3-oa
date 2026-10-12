// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  processDirectorySnapshot,
  withProcessManagement,
} from '../../../server/providers/process-management/context.js';
import type {
  ApprovalDirectoryService,
  OaApprovalDirectory,
} from '../../../server/providers/approval-directory/contract.js';
const snapshot = {
  hasRole: () => false,
  roleMembers: () => ['global-admin'],
} as unknown as OaApprovalDirectory;
const directory = {
  snapshot: async () => snapshot,
} as ApprovalDirectoryService;
describe('scoped management directory', () => {
  it('limits the overlay to the actor and owner without changing role membership or retaining privilege', async () => {
    const verify = vi.fn();
    let retained: OaApprovalDirectory | undefined;
    await withProcessManagement(
      { actorId: 'manager', kind: 'oa.leave', verify },
      async () => {
        retained = await processDirectorySnapshot(directory, 'oa.leave');
        expect(retained.hasRole('manager', 'approval.admin')).toBe(true);
        expect(retained.hasRole('other', 'approval.admin')).toBe(false);
        expect(retained.hasRole('manager', 'hr')).toBe(false);
        expect(retained.roleMembers('approval.admin')).toEqual([
          'global-admin',
        ]);
        expect(
          (await processDirectorySnapshot(directory, 'oa.overtime')).hasRole(
            'manager',
            'approval.admin',
          ),
        ).toBe(false);
      },
    );
    expect(verify).toHaveBeenCalledOnce();
    expect(retained!.hasRole('manager', 'approval.admin')).toBe(false);
  });
  it('rechecks fresh authorization and does not leak privilege into asynchronous descendants after completion', async () => {
    let allowed = true,
      release!: () => void,
      child!: Promise<boolean>;
    await withProcessManagement(
      {
        actorId: 'manager',
        kind: 'oa.leave',
        verify: async () => {
          if (!allowed) throw new Error('revoked');
        },
      },
      async () => {
        const retained = await processDirectorySnapshot(directory, 'oa.leave');
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        child = gate.then(() => retained.hasRole('manager', 'approval.admin'));
        allowed = false;
        await expect(
          processDirectorySnapshot(directory, 'oa.leave'),
        ).rejects.toThrow('revoked');
      },
    );
    release();
    expect(await child).toBe(false);
  });
});
