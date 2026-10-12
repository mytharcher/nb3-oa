import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
const read = defineDatabasePermission((p) =>
  p.collection('departureRequests').read('*'),
);
const work = defineDatabasePermission((p) =>
  p.collection('departureWorkItems').read('*'),
);
export const departureResource = defineCompositeResource('oa.departure', (r) =>
  r
    .title({ key: 'departureRequests.authz.resource', ns: 'nb3-oa' })
    .action('view', (a) =>
      a
        .title({ key: 'departureRequests.authz.view', ns: 'nb3-oa' })
        .grant('departureRequests', read)
        .grant('departureWorkItems', work),
    )
    .action('submit', (a) =>
      a
        .title({ key: 'departureRequests.authz.submit', ns: 'nb3-oa' })
        .grant('departureRequests', read.create('*').update('*')),
    )
    .action('delegate', (a) =>
      a
        .title({ key: 'departureRequests.authz.delegate', ns: 'nb3-oa' })
        .grant('departureRequests', read.create('*').update('*')),
    )
    .action('work', (a) =>
      a
        .title({ key: 'departureRequests.authz.work', ns: 'nb3-oa' })
        .grant('departureRequests', read)
        .grant('departureWorkItems', work.update('*')),
    )
    .action('cancel', (a) =>
      a
        .title({ key: 'departureRequests.authz.cancel', ns: 'nb3-oa' })
        .grant('departureRequests', read.update('*')),
    )
    .action('settle', (a) =>
      a
        .title({ key: 'departureRequests.authz.settle', ns: 'nb3-oa' })
        .grant('departureRequests', read.update('*')),
    ),
);
