// @vitest-environment node
import { expect, it } from 'vitest';
import {
  flowLabelLines,
  layoutFlowDiagram,
  revealRoute,
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

it('routes a revealed return in a lane beside every node it passes', () => {
  const node = (id: string, x: number, y: number, width = 200) => ({
    id,
    label: id,
    x,
    y,
    width,
    height: 40,
  });
  const draft = node('draft', 50, 0, 100);
  const branch = node('branch', 0, 60);
  const review = node('review', 20, 120);
  const nodes = [draft, branch, review, node('later', -100, 300)];
  const inner = revealRoute(nodes, review, draft, 'DOWN');
  // The lane clears the branch at x=0 but ignores states outside the span.
  expect(inner.points).toEqual([
    { x: 20, y: 140 },
    { x: -16, y: 140 },
    { x: -16, y: 20 },
    { x: 50, y: 20 },
  ]);
  // Labels end outside the lane instead of covering the nodes.
  expect(inner.labelPosition).toEqual({ x: -22, y: 80 });
  expect(inner.labelAnchor).toBe('end');
  expect(revealRoute(nodes, review, draft, 'DOWN', 2).points[1].x).toBe(-36);
  // A self-transition loops beside its own node, ignoring wider states in its row.
  expect(revealRoute(nodes, review, review, 'DOWN').points).toEqual([
    { x: 20, y: 132 },
    { x: 4, y: 132 },
    { x: 4, y: 148 },
    { x: 20, y: 148 },
  ]);
  expect(revealRoute(nodes, review, draft, 'RIGHT').points[0]).toEqual({
    x: 120,
    y: 120,
  });
});
