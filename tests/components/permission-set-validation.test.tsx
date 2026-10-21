import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import authorization from '../../client/locales/administration/authorization/en-US.js';
import { PermissionSetEditor } from '../../client/pages/administration/authorization/pages/permission-sets/editor.js';
import type { Draft } from '../../client/pages/administration/authorization/pages/permission-sets/types.js';
import type { AuthorizationOptions } from '../../client/pages/administration/authorization/authorization-client.js';
const ns = '@nocobase/app-plugin-authorization';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: authorization },
});
const options: AuthorizationOptions = {
  sections: [
    {
      value: 'business',
      label: 'Business',
      order: 1,
      subsections: [
        {
          value: 'records',
          label: 'Records',
          recordType: 'composite',
          actions: [{ value: 'read', label: 'Read' }],
          groups: [],
          resources: [
            { type: 'composite', value: 'employee', label: 'Employee records' },
          ],
        },
      ],
    },
  ],
  subjectTypes: [],
  collections: [],
  recordAccess: [],
};
function mount(initial: Draft) {
  const save = vi.fn();
  function Host() {
    const [draft, setDraft] = useState(initial);
    return (
      <PermissionSetEditor
        options={options}
        draft={draft}
        dirty
        busy={false}
        onChange={setDraft}
        onSave={save}
        onClose={vi.fn()}
      />
    );
  }
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <Host />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  return save;
}
it('validates a permission set name and key beside their inputs before saving', async () => {
  const save = mount({ key: '', title: '', grants: [] });
  await userEvent.click(
    screen.getByRole('button', {
      name: authorization.permissionSets.editor.save,
    }),
  );
  expect(screen.getByRole('textbox', { name: /Name/ })).toHaveFocus();
  expect(
    screen.getByText(authorization.permissionSets.editor.nameRequired),
  ).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'A role');
  await userEvent.click(
    screen.getByRole('button', {
      name: authorization.permissionSets.editor.save,
    }),
  );
  expect(screen.getByRole('textbox', { name: /Key/ })).toHaveFocus();
  expect(
    screen.getByText(authorization.permissionSets.editor.keyRequired),
  ).toBeInTheDocument();
});
it('shows an incomplete custom filter error on the affected resource instead of sending a write', async () => {
  const save = mount({
    originalKey: 'role',
    key: 'role',
    title: 'Role',
    grants: [
      {
        id: 1,
        resource: { type: 'composite', id: 'employee' },
        actions: ['read'],
        policies: {
          read: {
            type: 'composite',
            scopes: { default: { key: 'customFilter', filter: {} } },
          },
        },
      },
    ],
  });
  await userEvent.click(
    screen.getByRole('button', {
      name: authorization.permissionSets.editor.save,
    }),
  );
  expect(save).not.toHaveBeenCalled();
  const row = screen.getByRole('group', { name: 'Employee records' });
  expect(row).toHaveAttribute('aria-invalid', 'true');
  expect(within(row).getByRole('alert')).toHaveTextContent(
    authorization.databasePolicy.conditionRequired,
  );
});
