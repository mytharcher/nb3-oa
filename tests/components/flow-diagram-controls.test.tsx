import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { FlowDiagram } from '../../client/components/flow-diagram.js';

vi.mock('../../client/components/flow-layout.js', () => ({
  flowLabelLines: (label: string) => [label],
  layoutFlowDiagram: async () => ({
    nodes: [],
    edges: [],
    width: 100,
    height: 100,
  }),
}));
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({
    children,
    proOptions,
    fitViewOptions,
    maxZoom,
  }: {
    children: ReactNode;
    proOptions?: { hideAttribution: boolean };
    fitViewOptions: { maxZoom: number };
    maxZoom: number;
  }) => (
    <div
      data-testid='canvas'
      data-fit-max-zoom={fitViewOptions.maxZoom}
      data-max-zoom={maxZoom}
      data-hide-attribution={proOptions?.hideAttribution}
    >
      {children}
    </div>
  ),
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Controls: ({
    children,
    fitViewOptions,
  }: {
    children: ReactNode;
    fitViewOptions: { maxZoom: number };
  }) => (
    <div data-testid='controls' data-fit-max-zoom={fitViewOptions.maxZoom}>
      {children}
    </div>
  ),
  ControlButton: (props: React.ComponentProps<'button'>) => (
    <button {...props} />
  ),
  MiniMap: ({ ariaLabel }: { ariaLabel: string }) => (
    <div aria-label={ariaLabel} />
  ),
  BaseEdge: () => null,
  Handle: () => null,
  MarkerType: {},
  Position: {},
}));

it('shows minimap only in fullscreen and hides it after button or Escape exit', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: enUS },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <FlowDiagram
        controls
        ariaLabel='Process graph'
        nodes={[{ id: 'draft', label: 'Draft' }]}
        edges={[]}
      />
    </TestI18nProvider>,
  );
  expect(await screen.findByTestId('canvas')).toHaveAttribute(
    'data-hide-attribution',
    'true',
  );
  expect(screen.queryByLabelText('Minimap')).not.toBeInTheDocument();
  const canvas = () => screen.getByLabelText('Process graph');
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  expect(canvas()).toHaveClass('fixed');
  expect(screen.getByLabelText('Minimap')).toBeInTheDocument();
  expect(canvas().parentElement).toBe(document.body);
  expect(screen.getByText('Press Esc to exit')).toBeVisible();
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Exit fullscreen' })[1],
  );
  expect(canvas()).not.toHaveClass('fixed');
  expect(screen.queryByLabelText('Minimap')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(canvas()).not.toHaveClass('fixed');
  expect(screen.queryByLabelText('Minimap')).not.toBeInTheDocument();
});

it('caps automatic and button fitting at the default scale while allowing manual enlargement', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: enUS },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <FlowDiagram
        controls
        ariaLabel='Process graph'
        nodes={[{ id: 'draft', label: 'Draft' }]}
        edges={[]}
      />
    </TestI18nProvider>,
  );
  const canvas = await screen.findByTestId('canvas');
  expect(canvas).toHaveAttribute('data-fit-max-zoom', '1');
  expect(canvas).toHaveAttribute('data-max-zoom', '2');
  expect(screen.getByTestId('controls')).toHaveAttribute(
    'data-fit-max-zoom',
    '1',
  );
});
