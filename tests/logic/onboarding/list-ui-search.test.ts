// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createOnboardingService } from '../../../server/providers/onboarding/service.js';
import {
  ONBOARDING_FIELDS,
  type Onboarding,
} from '../../../server/providers/onboarding/contract.js';
import { ListQuery } from '../../../server/routes/onboarding/schemas.js';
import { ListQuery as RecruitmentQuery } from '../../../server/routes/recruitment/schemas.js';

it('filters authorized onboarding names before pagination and resolves only visible user ids', async () => {
  const row = (id: string, userId: string): Onboarding =>
    ({
      ...Object.fromEntries(ONBOARDING_FIELDS.map((field) => [field, null])),
      id,
      userId,
      status: 'handling',
    }) as Onboarding;
  const permittedRows = [
    row('first', 'user-a'),
    row('second', 'user-b'),
    row('third', 'user-c'),
  ];
  const users = vi.fn().mockResolvedValue({
    items: [
      { id: 'user-a', name: 'Alice' },
      { id: 'user-b', name: 'Bob' },
      { id: 'user-c', name: 'ALICIA' },
    ],
  });
  const scoped = {
    count: vi.fn().mockResolvedValue(3),
    findMany: vi.fn().mockResolvedValue(permittedRows),
  };
  const withPolicy = vi.fn().mockReturnValue(scoped);
  const repository = vi.fn().mockReturnValue({ withPolicy });
  const connection = { repository } as unknown as DatabaseConnection;
  const policy = {} as RepositoryPolicy;
  const service = createOnboardingService({
    users: { withConnection: () => ({ list: users }) },
  } as unknown as Parameters<typeof createOnboardingService>[0]);
  const result = await service.list(
    { page: 2, pageSize: 1, q: 'ali' },
    connection,
    policy,
  );
  expect(withPolicy).toHaveBeenCalledWith(policy);
  expect(users).toHaveBeenCalledWith({
    userIds: ['user-a', 'user-b', 'user-c'],
    pageSize: 100,
    kind: 'all',
  });
  expect(result.total).toBe(2);
  expect(result.items.map((item) => item.id)).toEqual(['third']);
  expect(scoped.findMany.mock.calls[0]?.[0]).not.toHaveProperty('limit');
});

it('validates supported UI search and sort queries without allowing arbitrary sort fields', () => {
  expect(ListQuery.parse({ q: ' Alice ', desc: 'false' })).toMatchObject({
    q: 'Alice',
    desc: false,
  });
  expect(ListQuery.safeParse({ q: 'a'.repeat(101) }).success).toBe(false);
  expect(RecruitmentQuery.parse({ orderBy: 'quantity' }).orderBy).toBe(
    'quantity',
  );
  expect(RecruitmentQuery.safeParse({ orderBy: 'privateSalary' }).success).toBe(
    false,
  );
});
