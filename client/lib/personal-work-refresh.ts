/** Business views publish this after refreshing following a successful action. */
export const PERSONAL_WORK_REFRESH = 'oa:personal-work-refresh';

export function refreshPersonalWork() {
  window.dispatchEvent(new Event(PERSONAL_WORK_REFRESH));
}
