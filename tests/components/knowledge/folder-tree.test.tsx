import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/modules/knowledge.en-US.js';
import zhCN from '../../../client/locales/modules/knowledge.zh-CN.js';
import { KnowledgeFolderTree } from '../../../client/pages/knowledge/folder-tree.js';
import type { Folder } from '../../../client/pages/knowledge/types.js';

const viewport = vi.hoisted(() => ({ mobile: false }));
vi.mock('../../../client/hooks/use-mobile.js', () => ({
  useIsMobile: () => viewport.mobile,
}));
const folders: Folder[] = [
  { id: 'policies', title: 'Company policies', parentId: null, version: 1 },
  { id: 'hr', title: 'HR policies', parentId: 'policies', version: 1 },
  { id: 'leave', title: 'Leave rules', parentId: 'hr', version: 1 },
  { id: 'forms', title: 'Forms', parentId: null, version: 1 },
  { id: 'readable', title: 'Readable child', parentId: 'hidden', version: 1 },
];
async function mount(
  selected = '',
  data = folders,
  mobile = false,
  chinese = false,
) {
  viewport.mobile = mobile;
  const choose = vi.fn();
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: chinese ? zhCN : enUS },
  });
  render(
    <TestI18nProvider runtime={runtime} namespace='nb3-oa'>
      <KnowledgeFolderTree folders={data} selected={selected} choose={choose} />
    </TestI18nProvider>,
  );
  return { choose, user: userEvent.setup() };
}

it('selects parent folders directly while expanding independently; preserves selection', async () => {
  const { choose, user } = await mount('policies');
  const parent = screen.getByRole('button', {
    name: 'Company policies',
    exact: true,
  });
  expect(parent).toHaveAttribute('aria-pressed', 'true');
  await user.click(parent);
  expect(choose).toHaveBeenLastCalledWith('policies');
  choose.mockClear();
  await user.click(
    screen.getByRole('button', { name: 'Collapse Company policies' }),
  );
  expect(choose).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('button', { name: 'Leave rules' }),
  ).not.toBeInTheDocument();
  expect(parent).toHaveAttribute('aria-pressed', 'true');
  const expand = screen.getByRole('button', {
    name: 'Expand Company policies',
  });
  expand.focus();
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('button', { name: 'Leave rules' }));
  expect(choose).toHaveBeenLastCalledWith('leave');
});

it('keeps readable children reachable when the parent is outside the folder scope', async () => {
  const { choose, user } = await mount('readable');
  const nav = screen.getByRole('navigation', { name: 'Folders' });
  expect(
    within(nav).getByRole('button', { name: 'Readable child' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await user.click(within(nav).getByRole('button', { name: 'Unfiled' }));
  expect(choose).toHaveBeenLastCalledWith('root');
  await user.click(within(nav).getByRole('button', { name: 'All folders' }));
  expect(choose).toHaveBeenLastCalledWith('');
});

it('starts collapsed on phones and retains the Chinese empty state and default filters', async () => {
  const { choose, user } = await mount('', [], true, true);
  expect(screen.getByRole('heading', { name: '文件夹' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '展开文件夹' }));
  expect(screen.getByText('暂无文件夹。')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '全部文件夹' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(screen.getByRole('button', { name: '未归档' }));
  expect(choose).toHaveBeenLastCalledWith('root');
});
