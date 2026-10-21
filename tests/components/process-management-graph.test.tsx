import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import type { FlowDiagramProps } from '../../client/components/flow-diagram.js';
import { ProcessGraph } from '../../client/pages/process-management/graph.js';
let activeNode: string | undefined;
vi.mock('../../client/components/flow-diagram.js', () => ({
  FlowDiagram: ({
    nodes,
    edges,
    revealEdges,
    renderNode,
    onNodeClick,
  }: FlowDiagramProps) => (
    <div>
      {nodes.map((node) => (
        <div
          data-testid={`node:${node.id}`}
          key={node.id}
          data-visited={node.visited}
          data-current={node.highlighted}
          className={node.className}
          data-height={node.height}
          onClick={() => onNodeClick?.(node)}
        >
          {renderNode?.(node, { active: node.id === activeNode }) ?? node.label}
        </div>
      ))}
      {revealEdges?.map((edge) => (
        <span
          key={edge.id}
          data-testid={`reveal:${edge.source}:${edge.target}`}
        >
          {edge.label}
        </span>
      ))}
      {edges.map((edge) => (
        <span
          key={edge.id}
          data-testid={`edge:${edge.source}:${edge.target}`}
          title={edge.title}
          data-visited={edge.visited}
        >
          {edge.source} → {edge.target}: {edge.label}
        </span>
      ))}
    </div>
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const states = ['draft', 'manager', 'revision', 'approved'].map((name) => ({
  name,
  final: name === 'approved',
}));
const edges = [
  { from: 'draft', to: 'manager', name: 'submit' },
  { from: 'approved', to: 'manager', name: 'gmReturned' },
  { from: 'manager', to: 'manager', name: 'reviewEdit' },
  {
    from: 'manager',
    to: 'approved',
    name: 'managerApproved',
    conditional: true,
    condition: 'leave_headApproved_approved',
  },
  { from: 'manager', to: 'revision', name: 'returned' },
  { from: 'draft', to: 'revision', name: 'edit' },
  { from: 'draft', to: 'draft', name: 'edit' },
];
function setup(definition = true) {
  render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        definition={definition}
        states={states}
        edges={edges}
        initial='draft'
      />
    </TestI18nProvider>,
  );
}
it('shows the main business path with conditions without alternate diagram controls', () => {
  setup();
  expect(screen.getByTestId('edge:draft:manager')).toHaveAttribute(
    'title',
    'Submit',
  );
  expect(screen.getByTestId('edge:draft:manager')).toHaveTextContent(
    'draft → manager:',
  );
  expect(screen.getByTestId('edge:manager:approved')).toHaveAttribute(
    'title',
    'Approval passed · The leave type does not require HR and days are below the frozen HR limit',
  );
  expect(screen.getByTestId('edge:manager:approved')).toHaveTextContent(
    'The leave type does not require HR and days are below the frozen HR limit',
  );
  expect(screen.queryByText(/manager → revision:/)).toBeNull();
  expect(screen.queryByText(/draft → revision:/)).toBeNull();
  expect(screen.queryByText(/approved → manager:/)).toBeNull();
  expect(screen.queryByText(/manager → manager:/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'All transitions' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Stage table' })).toBeNull();
});
it('reveals only transitions between drawn states of a definition', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        definition
        states={states}
        edges={[...edges, { from: 'manager', to: 'draft', name: 'returned' }]}
        initial='draft'
      />
    </TestI18nProvider>,
  );
  // Returns and self-transitions between drawn states are revealed, not laid out.
  expect(screen.getByTestId('reveal:manager:draft')).toHaveTextContent(
    'Return for revision',
  );
  expect(screen.getByTestId('reveal:approved:manager')).toBeInTheDocument();
  expect(screen.getByTestId('reveal:manager:manager')).toHaveTextContent(
    'Action: reviewEdit',
  );
  expect(screen.queryByTestId('edge:manager:draft')).toBeNull();
  // Transitions to undrawn states stay hidden.
  expect(screen.queryByTestId('reveal:manager:revision')).toBeNull();
  expect(screen.queryByTestId('node:revision')).toBeNull();
});

it('lists exits to undrawn states beside a hovered step and explains each', async () => {
  activeNode = 'head';
  render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        definition
        states={[
          'draft',
          'manager',
          'head',
          'approved',
          'revision',
          'rejected',
        ].map((name) => ({
          name,
          final: ['approved', 'rejected'].includes(name),
        }))}
        edges={[
          { from: 'draft', to: 'manager', name: 'submit' },
          { from: 'manager', to: 'head', name: 'managerApproved' },
          { from: 'head', to: 'approved', name: 'headApproved' },
          ...['manager', 'head'].flatMap((from) => [
            { from, to: 'revision', name: 'returned' },
            { from, to: 'rejected', name: 'rejected' },
          ]),
          { from: 'revision', to: 'manager', name: 'submit' },
        ]}
        initial='draft'
      />
    </TestI18nProvider>,
  );
  activeNode = undefined;
  // Only the hovered step shows its exits, and nothing is drawn by default elsewhere.
  expect(screen.getAllByRole('list', { name: 'Other exits' })).toHaveLength(1);
  const exits = within(screen.getByTestId('node:head')).getByRole('list', {
    name: 'Other exits',
  });
  const [revision, rejected] = within(exits).getAllByRole('listitem');
  const { default: userEvent } = await import('@testing-library/user-event');
  // A revision explains how it rejoins the drawn flow.
  await userEvent.hover(revision.firstElementChild!);
  const resubmit = await screen.findByText('Then it can:');
  expect(resubmit.parentElement).toHaveTextContent(/Submit → Manager/);
  await userEvent.unhover(revision.firstElementChild!);
  // A final outcome says the process ends there.
  await userEvent.hover(rejected.firstElementChild!);
  expect(await screen.findByText('The process ends here.')).toBeVisible();
});

it('keeps return transitions visible in actual execution history', () => {
  setup(false);
  expect(screen.getByTestId('edge:manager:revision')).toHaveAttribute(
    'title',
    'Return for revision',
  );
  expect(screen.getByTestId('edge:draft:revision')).toHaveAttribute(
    'title',
    'Edit content',
  );
  expect(screen.getByTestId('edge:manager:revision')).toBeVisible();
  expect(screen.getByTestId('edge:draft:revision')).toBeVisible();
  expect(screen.getByText(/approved → manager:/)).toBeVisible();
  expect(screen.getByText(/manager → manager:/)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'All transitions' })).toBeNull();
});

it('overlays actual progress on the complete business flow and preserves historical returns', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        states={states}
        edges={edges}
        initial='draft'
        current='manager'
        history={[
          { from: 'draft', to: 'manager', name: 'submit' },
          { from: 'manager', to: 'revision', name: 'returned' },
          { from: 'revision', to: 'manager', name: 'submit' },
        ]}
      />
    </TestI18nProvider>,
  );
  expect(screen.getByTestId('edge:draft:manager')).toHaveAttribute(
    'data-visited',
    'true',
  );
  expect(screen.getByText(/manager → approved:/)).toHaveAttribute(
    'data-visited',
    'false',
  );
  expect(screen.getByTestId('edge:manager:revision')).toHaveAttribute(
    'data-visited',
    'true',
  );
  expect(screen.getByTestId('edge:revision:manager')).toHaveAttribute(
    'data-visited',
    'true',
  );
  expect(screen.queryByText(/approved → manager:/)).toBeNull();
  expect(screen.queryByText(/manager → manager:/)).toBeNull();
  expect(screen.getByTestId('node:approved')).toHaveAttribute(
    'data-visited',
    'false',
  );
  expect(screen.getByTestId('node:manager')).toHaveAttribute(
    'data-current',
    'true',
  );
});

it('opens settings only for explicitly configured definition nodes', async () => {
  const configure = vi.fn();
  const { rerender } = render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        definition
        states={states}
        edges={edges}
        initial='draft'
        configurableNodes={new Set(['manager'])}
        onConfigure={configure}
      />
    </TestI18nProvider>,
  );
  const { default: userEvent } = await import('@testing-library/user-event');
  await userEvent.click(
    screen.getByRole('button', { name: 'Edit parameters for Manager' }),
  );
  expect(configure).toHaveBeenCalledWith('manager');
  await userEvent.click(screen.getByTestId('node:approved'));
  expect(configure).toHaveBeenCalledOnce();
  rerender(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        states={states}
        edges={edges}
        initial='draft'
        configurableNodes={new Set(['manager'])}
        onConfigure={configure}
      />
    </TestI18nProvider>,
  );
  await userEvent.click(screen.getByTestId('node:manager'));
  expect(configure).toHaveBeenCalledOnce();
});

it('distinguishes an actual termination outcome from normal process nodes', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <ProcessGraph
        states={[...states, { name: 'terminated', final: true }]}
        edges={edges}
        initial='draft'
        current='terminated'
        history={[
          { from: 'draft', to: 'manager', name: 'submit' },
          { from: 'manager', to: 'terminated', name: 'terminate' },
        ]}
      />
    </TestI18nProvider>,
  );
  const terminated = screen.getByTestId('node:terminated');
  expect(terminated.firstElementChild).toHaveClass(
    'border-dashed',
    'rounded-full',
    'text-destructive',
  );
  expect(terminated).toHaveAttribute('data-current', 'true');
  expect(terminated).toHaveAttribute('data-height', '44');
  expect(screen.getByTestId('edge:manager:terminated')).toBeVisible();
  expect(screen.getByTestId('edge:manager:terminated')).toHaveAttribute(
    'title',
    'Terminate',
  );
  expect(screen.getByTestId('node:manager')).not.toHaveClass(
    'text-destructive',
  );
});
