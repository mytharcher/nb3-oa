import { resolveLocalesContribution } from '@nocobase/i18n';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import filePlugin from '@nocobase/app-plugin-file/client';
import {
  BusinessAttachmentList,
  type BusinessAttachment,
} from '../../client/components/business-attachment-list.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const plugin = filePlugin();
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      plugin.locales!,
    ),
  },
});
const files: BusinessAttachment[] = [
  {
    id: 'text',
    filename: 'notes',
    ext: 'txt',
    mimeType: 'text/plain',
    contentUrl: '/custom/guarded/notes.txt',
    size: 5,
  },
  {
    id: 'image',
    filename: 'photo.png',
    ext: 'png',
    mimeType: 'image/png',
    contentUrl: '/custom/guarded/photo.png',
    size: 20,
  },
];
function content(value = files, onSubmit = vi.fn()) {
  return (
    <TestI18nProvider runtime={runtime}>
      <form onSubmit={onSubmit}>
        <BusinessAttachmentList files={value} />
      </form>
    </TestI18nProvider>
  );
}
afterEach(() => vi.unstubAllGlobals());

it('opens the clicked record after image grouping, uses private content URLs, and does not submit the form', async () => {
  const user = userEvent.setup();
  const fetcher = vi.fn().mockResolvedValue(new Response('private notes'));
  vi.stubGlobal('fetch', fetcher);
  const submit = vi.fn();
  render(content(files, submit));
  const trigger = screen.getByRole('button', { name: 'Preview notes.txt' });
  await user.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'notes.txt' });
  expect(await within(dialog).findByText('private notes')).toBeVisible();
  expect(fetcher).toHaveBeenCalledWith(
    '/custom/guarded/notes.txt',
    expect.objectContaining({
      credentials: 'same-origin',
      signal: expect.any(AbortSignal),
    }),
  );
  await user.click(within(dialog).getByRole('button', { name: 'Next file' }));
  expect(
    await screen.findByRole('dialog', { name: 'photo.png' }),
  ).toBeVisible();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(trigger).toHaveFocus();
  expect(submit).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Download notes.txt' }),
  ).toHaveAttribute('href', '/custom/guarded/notes.txt');
  expect(screen.queryByText('photo.png.png')).toBeNull();
});

it('closes and aborts the old preview when the authorized files are removed', async () => {
  const user = userEvent.setup();
  const fetcher = vi.fn().mockImplementation(() => new Promise(() => {}));
  vi.stubGlobal('fetch', fetcher);
  const view = render(content());
  await user.click(screen.getByRole('button', { name: 'Preview notes.txt' }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
  const signal = (fetcher.mock.calls[0]![1] as RequestInit).signal!;
  view.rerender(content([]));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole('link')).toBeNull();
});

it('keeps unsafe file names visible without rendering active links or thumbnails', () => {
  const unsafe = [
    'javascript:alert(1)',
    'data:image/png;base64,AA',
    'blob:untrusted',
  ];
  const value = unsafe.map((url, index) => ({
    ...files[1]!,
    id: String(index),
    filename: `unsafe-${index}.png`,
    contentUrl: url,
  }));
  const { container } = render(content(value));
  expect(screen.getByText(/unsafe-0.png/)).toBeVisible();
  expect(container.querySelector('img, a, button')).toBeNull();
});

it('does not classify XML images as safe thumbnails', () => {
  const { container } = render(
    content([{ ...files[1]!, mimeType: 'image/example+xml' }]),
  );
  expect(container.querySelector('img')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Preview photo.png' }),
  ).toBeVisible();
});

it('shows an authorized preview error instead of redirecting after a denied content request', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('', { status: 403 })),
  );
  render(content());
  await userEvent.click(
    screen.getByRole('button', { name: 'Preview notes.txt' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'notes.txt' });
  await waitFor(() => expect(within(dialog).getByRole('alert')).toBeVisible());
});

it('uses Chinese labels and preserves the returned deployment path', async () => {
  const chinese = await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: 'nb3-oa', resources: zhCN },
    namespaces: {
      '@nocobase/app-plugin-file': await resolveLocalesContribution(
        plugin.locales!,
      ),
    },
  });
  render(
    <TestI18nProvider runtime={chinese}>
      <BusinessAttachmentList files={files} />
    </TestI18nProvider>,
  );
  expect(screen.getByRole('button', { name: '预览 notes.txt' })).toBeVisible();
  expect(
    screen.getByRole('button', { name: '下载 notes.txt' }),
  ).toHaveAttribute('href', '/custom/guarded/notes.txt');
});

it('removes the exact grouped image or file without opening a preview or submitting', async () => {
  const remove = vi.fn();
  const submit = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <form onSubmit={submit}>
        <BusinessAttachmentList files={files} onRemove={remove} />
      </form>
    </TestI18nProvider>,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Remove photo.png' }),
  );
  expect(remove).toHaveBeenLastCalledWith('image');
  await userEvent.click(
    screen.getByRole('button', { name: 'Remove notes.txt' }),
  );
  expect(remove).toHaveBeenLastCalledWith('text');
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('keeps read-only attachments free of removal actions', () => {
  render(content());
  expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
});

it('places download beside the title and keeps navigation and close on the right', async () => {
  render(content());
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Preview photo.png' }));
  const dialog = await screen.findByRole('dialog', { name: 'photo.png' });
  const actions = dialog.querySelector('[data-slot="file-preview-actions"]')!;
  for (const name of ['Previous file', 'Next file', 'Close']) {
    expect(actions).toContainElement(
      within(dialog).getByRole('button', { name }),
    );
  }
  const download = within(dialog).getByRole('button', {
    name: 'Download: photo.png',
  });
  expect(
    dialog.querySelector('[data-slot="file-preview-title"]'),
  ).toContainElement(download);
  expect(actions).not.toContainElement(download);
  expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(
    1,
  );
  await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(
    screen.getByRole('button', { name: 'Preview photo.png' }),
  ).toHaveFocus();
});
