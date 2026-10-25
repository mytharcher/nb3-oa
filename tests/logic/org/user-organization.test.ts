// @vitest-environment node
import { expect, it } from 'vitest';
import { organizationOf } from '../../../server/routes/org/user-organization.js';
import {
  userDetailLink,
  legacyUserLink,
  userListParams,
} from '../../../client/pages/access/user-url.js';
const node = (id: string, parentId: string | null = null, active = true) => ({
  id,
  title: id,
  parentId,
  active,
  code: null,
  managerId: null,
  executiveId: null,
  sortOrder: 0,
});
it('distinguishes primary membership, inactive ancestry, missing nodes and cycles', () => {
  const primary = [{ departmentId: 'leaf', primary: true }];
  expect(
    organizationOf([{ departmentId: 'leaf', primary: false }], [node('leaf')])
      .state,
  ).toBe('unassigned');
  const valid = organizationOf(primary, [node('root'), node('leaf', 'root')]);
  expect(valid.state).toBe('active');
  expect(valid.primaryDepartment?.path.map((entry) => entry.id)).toEqual([
    'root',
    'leaf',
  ]);
  const inactive = organizationOf(primary, [
    node('root', null, false),
    node('leaf', 'root'),
  ]);
  expect(inactive.state).toBe('inactive-chain');
  expect(inactive.inactiveDepartmentIds).toEqual(['root']);
  for (const tree of [
    [node('leaf', 'missing')],
    [node('leaf', 'root'), node('root', 'leaf')],
    [],
  ]) {
    expect(organizationOf(primary, tree).state).toBe('invalid-chain');
    expect(organizationOf(primary, tree).primaryDepartment?.path).toEqual([]);
  }
  expect(
    organizationOf(
      [...primary, { departmentId: 'root', primary: true }],
      [node('root')],
    ).primaryDepartment,
  ).toBeNull();
});
it.each([
  ['/users/u/permissions', 'permissions'],
  ['/users/u/permissions/assign', 'permissions'],
  ['/users/u/permissions/duty-roles', 'information'],
  ['/access/people/u', 'permissions'],
  ['/access/people/u/sources', 'permissions'],
  ['/access/people/u/personal', 'permissions'],
  ['/access/people/u/sources/assign', 'permissions'],
  ['/access/people/u/personal/assign', 'permissions'],
])('maps %s directly and retains only validated list state', (path, tab) => {
  expect(
    legacyUserLink(
      path,
      new URLSearchParams(
        'search=Alice&status=disabled&role=hr&page=2&edit=roles&tab=bad&accessModule=finance',
      ),
      'u/a',
    ),
  ).toBe(`/users/u%2Fa?search=Alice&status=disabled&role=hr&page=2&tab=${tab}`);
});
it('maps people root and rejects invalid list parameters', () => {
  expect(
    legacyUserLink(
      '/access/people',
      new URLSearchParams('status=no&page=-1&tab=roles'),
    ),
  ).toBe('/users');
  expect(
    userListParams(new URLSearchParams('page=Infinity&role=all&search= ')).size,
  ).toBe(0);
});

// The information page now owns both former detail sections.
it.each(['roles', 'organization'])(
  'maps the former %s tab to basic information',
  (tab) => {
    expect(
      userDetailLink('u', new URLSearchParams('search=Alice&page=2'), tab),
    ).toBe('/users/u?search=Alice&page=2&tab=information');
  },
);
