import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RecordDetailDrawer } from '../../client/components/record-detail-drawer.js';
import {
  ApprovalTimeline,
  ApprovalUiProvider,
} from '../../client/extensions/nocobase-approval-ui/index.js';
import {
  createPrintSnapshot,
  printSurface,
} from '../../client/lib/print-surface.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { PrintSurfaceButton } from '../../client/components/print-surface-button.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});

function open(disabled = false) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <RecordDetailDrawer
          title='Leave 42'
          printable
          printDisabled={disabled}
          footer={<button>Approve</button>}
        >
          <p>Approved request</p>
          <textarea aria-label='Reason' defaultValue='Original' />
          <ApprovalUiProvider
            personName={() => 'Alice'}
            formatDateTime={(value) => value}
          >
            <ApprovalTimeline
              lines={[
                {
                  key: '1',
                  kind: 'action',
                  actorId: 'alice',
                  at: '2026-10-11T01:00:00Z',
                  title: 'Approved',
                  comment: 'Agreed',
                  children: [{ key: 'change', label: 'Changed department' }],
                },
                {
                  key: '2',
                  kind: 'event',
                  emphasis: 'muted',
                  actorId: 'alice',
                  at: '2026-10-11T02:00:00Z',
                  title: 'Merged same approver',
                },
                {
                  key: '3',
                  kind: 'event',
                  emphasis: 'muted',
                  actorId: 'alice',
                  at: '2026-10-11T03:00:00Z',
                  title: 'Reused opinion',
                  comment: 'Original agreement',
                },
              ]}
            />
          </ApprovalUiProvider>
        </RecordDetailDrawer>
      ),
    },
  ]);
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}

describe('approval print surface', () => {
  it('prints only the selected request, current unsaved values and full folded history', async () => {
    open();
    const drawer = await screen.findByRole('dialog', { name: 'Leave 42' });
    await userEvent.type(screen.getByRole('textbox'), ' amended');
    expect(
      screen.getByText('Changed department').closest('[data-print-expanded]'),
    ).toHaveClass('hidden');
    expect(
      screen.getByText('Reused opinion').closest('[data-print-expanded]'),
    ).toHaveClass('hidden');
    const copy = createPrintSnapshot(drawer);
    expect(copy.textContent).toContain('Original amended');
    expect(copy.textContent).toContain('Changed department');
    expect(copy.textContent).toContain('Reused opinion');
    expect(copy.textContent).toContain('Original agreement');
    expect(copy.textContent).toContain('2026-10-11T03:00:00Z');
    expect(copy.textContent).not.toContain('Print / Save PDF');
    expect(copy.textContent).not.toContain('ApproveApproved request');
    expect(copy.querySelector('[data-slot=route-overlay-footer]')).toBeNull();
    expect(
      within(drawer).getByRole('button', { name: 'Approve' }),
    ).toBeVisible();
  });
  it('shows the Chinese PDF entry using the application locale', async () => {
    const chinese = await createTestI18nRuntime({
      locale: 'zh-CN',
      application: { namespace: 'nb3-oa', resources: zhCN },
    });
    render(
      <TestI18nProvider runtime={chinese}>
        <PrintSurfaceButton />
      </TestI18nProvider>,
    );
    expect(
      screen.getByRole('button', { name: '打印 / 保存 PDF' }),
    ).toBeVisible();
  });
  it('blocks printing while the current request is unreadable or loading', async () => {
    open(true);
    expect(
      await screen.findByRole('button', { name: 'Print / Save PDF' }),
    ).toBeDisabled();
  });
  it('preserves blank fields and checkbox values without copying active controls or nested overlays', () => {
    const surface = document.createElement('div');
    surface.innerHTML =
      '<label>Empty<input /></label><input type="checkbox" checked /><button role="switch" aria-checked="false"></button><textarea></textarea><div data-slot="route-overlay-content">Other request</div><script>secret()</script>';
    const copy = createPrintSnapshot(surface);
    expect(copy.textContent).toContain('________________');
    expect(copy.textContent).toContain('☑');
    expect(copy.textContent).toContain('☐');
    expect(copy.textContent).not.toContain('Other request');
    expect(copy.querySelector('input, textarea, script')).toBeNull();
  });
  it('invokes native print with an isolated document and cleans up after printing or canceling', async () => {
    const surface = document.createElement('div');
    surface.textContent = 'Authorized content';
    const original = document.body.append.bind(document.body);
    const print = vi.fn();
    const append = vi
      .spyOn(document.body, 'append')
      .mockImplementation((...nodes) => {
        original(...nodes);
        const frame = nodes[0] as HTMLIFrameElement;
        frame.contentWindow!.print = print;
        frame.contentWindow!.focus = vi.fn();
      });
    try {
      await printSurface(surface);
      expect(print).toHaveBeenCalledOnce();
      const frame = document.querySelector('iframe')!;
      expect(frame.contentDocument!.body.textContent).toBe(
        'Authorized content',
      );
      expect(frame.contentDocument!.head.textContent).toContain('size: A4');
      frame.contentWindow!.dispatchEvent(new Event('afterprint'));
      expect(document.querySelector('iframe')).toBeNull();
    } finally {
      append.mockRestore();
    }
  });
});
