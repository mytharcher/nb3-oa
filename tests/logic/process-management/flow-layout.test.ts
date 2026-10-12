// @vitest-environment node
import { expect, it } from 'vitest';
import {
  flowLabelLines,
  layoutFlowDiagram,
} from '../../../client/components/flow-layout.js';

it('compacts vertical spacing while preserving routed edges and labels', async () => {
  const graph = {
    nodes: ['draft', 'review', 'done'].map((id) => ({ id, label: id })),
    edges: [
      { id: 'submit', source: 'draft', target: 'review', label: 'Submit' },
      { id: 'approve', source: 'review', target: 'done', label: 'Approve' },
    ],
  };
  const regular = await layoutFlowDiagram(graph, 'DOWN');
  const compact = await layoutFlowDiagram(graph, 'DOWN', true);
  expect(compact.height).toBeLessThan(regular.height);
  expect(compact.edges).toHaveLength(2);
  for (const edge of compact.edges) {
    expect(edge.points.length).toBeGreaterThanOrEqual(2);
    expect(edge.labelPosition).toBeDefined();
  }
});

it('wraps concrete Chinese and English conditions without losing words', () => {
  for (const text of [
    '境外出差，或申请金额大于提交时冻结规则中的分管副总金额门槛',
    'International travel or the amount exceeds the executive limit frozen at submission',
  ]) {
    const lines = flowLabelLines(text);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('').replace(/ /g, '')).toBe(text.replace(/ /g, ''));
    for (const line of lines)
      expect(
        [...line].reduce(
          (n, char) => n + (char.charCodeAt(0) > 255 ? 14 : 7),
          0,
        ),
      ).toBeLessThanOrEqual(252);
  }
});
