import { businessModuleCount } from '../../../client/pages/access/model.js';
import type { AuthorizationOptions } from '../../../client/pages/access/types.js';
import { expect, it } from 'vitest';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { grantablePages } from '../../../client/pages/administration/authorization/components/page-options.js';

it('uses a named page title when an earlier hidden overlay shares its page grant', () => {
  const authz = {
    resource: { type: 'page', id: 'oa-loan-requests' },
    action: 'access',
  };
  const routes = [
    {
      name: 'hidden-loan-view',
      packageName: 'nb3-oa',
      path: '/workbench/loan',
      componentLoader: () => Promise.resolve({}),
      authz,
    },
    {
      name: 'oa-loan-requests',
      packageName: 'nb3-oa',
      path: '/loanRequests',
      componentLoader: () => Promise.resolve({}),
      authz,
      navigation: { title: 'loanRequests.title' },
    },
  ] as unknown as AppClientRegisteredRoute[];
  expect(grantablePages(routes)).toEqual([
    {
      name: 'oa-loan-requests',
      packageName: 'nb3-oa',
      title: 'loanRequests.title',
    },
  ]);
});

it('counts only configured composite modules, excluding pages, settings and repeated actions', () => {
  const options = {
    sections: [
      {
        value: 'business',
        label: 'Business',
        subsections: [
          {
            value: 'general',
            label: 'General',
            resources: [
              {
                type: 'composite',
                value: 'oa.leave',
                label: 'Leave',
                actions: [
                  { value: 'view', label: 'View' },
                  { value: 'submit', label: 'Submit' },
                ],
              },
              {
                type: 'settings',
                value: 'oa.org.positions',
                label: 'Positions',
                actions: [{ value: 'read', label: 'Read' }],
              },
              { type: 'page', value: 'users', label: 'Users' },
            ],
          },
        ],
      },
    ],
    subjectTypes: [],
    collections: [],
    recordAccess: [],
  } as unknown as AuthorizationOptions;
  const sets = [
    {
      key: 'mixed',
      grants: [
        {
          resource: { type: 'composite', id: 'oa.leave' },
          actions: [{ action: 'view' }, { action: 'submit' }],
        },
        {
          resource: { type: 'settings', id: 'oa.org.positions' },
          actions: [{ action: 'read' }],
        },
        {
          resource: { type: 'page', id: 'users' },
          actions: [{ action: 'access' }],
        },
      ],
    },
  ];
  expect(businessModuleCount(options, sets)).toBe(1);
});
