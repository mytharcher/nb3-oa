// @vitest-environment node
import { expect } from 'vitest';
import { createEmployeesAppTest, createPerson } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
const test = createEmployeesAppTest();
test('installed personal schedule permissions let employees manage only their own calendar', async ({
  testApp,
}) => {
  const person = await createPerson(testApp, 'Installed schedule employee'),
    other = await createPerson(testApp, 'Other employee');
  const session = await person.session(),
    stranger = await other.session();
  const response = await session.fetch(
    '/personalSchedules',
    write('POST', {
      title: 'Own appointment',
      description: '',
      startAt: '2030-01-01T09:00:00Z',
      endAt: '2030-01-01T10:00:00Z',
    }),
  );
  expect(response.status).toBe(200);
  const row = (await response.json()).data;
  expect((await stranger.fetch(`/personalSchedules/${row.id}`)).status).toBe(
    404,
  );
});
