import type { LocaleResource } from '@nocobase/i18n';
import approvals from './modules/approvals.en-US.js';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const enUS = {
  approvals,
  // Titles of the seeded duty roles (`org.dutyRoleTitles.<code>`); the organisation searches them in every language.
  org: {
    dutyRoleTitles: {
      gm: 'General manager',
      cfo: 'CFO',
      hr: 'HR specialist',
      hrbp: 'HRBP',
      hrDirector: 'HR director',
      admin: 'Administration',
      sealKeeper: 'Seal keeper',
      finance: 'Accountant',
      financeManager: 'Finance manager',
      cashier: 'Cashier',
      legal: 'Legal',
      purchasing: 'Purchasing',
      it: 'IT',
      committeeTech: 'Review committee (technical seat)',
    },
  },
};

export type AppServerResource = LocaleResource<typeof enUS>;

export default enUS;
