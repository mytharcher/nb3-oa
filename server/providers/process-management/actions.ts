import {
  allActivePeople,
  appointAction as sdkAppoint,
  reassignAction as sdkReassign,
  defineApprovalAction,
} from '@nocobase/app-plugin-approval/server';

// The SDK interventions validate actual assignment on execution but do not expose
// a people picker. Add a read-only candidate surface using the same public eligibility
// check. No override is offered by the management center.
const active = allActivePeople();
export const reassignAction = defineApprovalAction({
  ...sdkReassign,
  async people(context, query) {
    const page = await active.search(context, query);
    return {
      ...page,
      people: page.people.filter(
        (person) =>
          context.eligible(person, { replacing: true, via: 'reassign' }).ok,
      ),
    };
  },
});
export const appointAction = defineApprovalAction({
  ...sdkAppoint,
  async people(context, query) {
    const page = await active.search(context, query);
    return {
      ...page,
      people: page.people.filter(
        (person) =>
          context.eligible(person, {
            replacing: false,
            kind: 'decide',
            role: 'member',
            via: 'assign',
          }).ok,
      ),
    };
  },
});
