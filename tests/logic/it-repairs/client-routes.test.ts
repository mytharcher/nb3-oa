import { describe, expect, it } from 'vitest';
import { ChartNoAxesCombined } from 'lucide-react';
import routes from '../../../client/route-modules/it-repairs.js';

describe('IT repair query entry points', () => {
  it('keeps report permission independent and filters ahead of record routes', () => {
    const report = routes.routes.find(
      (route) => route.name === 'it-repair-reports',
    )!;
    expect(report.parent).toBe('oa-office');
    expect(report.authz).toEqual({
      resource: { type: 'composite', id: 'oa.itRepairs' },
      action: 'reports',
    });
    expect(report.navigation?.icon).toBe(ChartNoAxesCombined);
    expect(report.children?.map((route) => route.path)).toEqual(['filters']);
    const list = routes.routes.find((route) => route.name === 'it-repairs')!;
    expect(list.children?.map((route) => route.path)).toEqual([
      'filters',
      'new',
      ':repairId',
    ]);
  });
});
