import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Seitenberechtigungen',
    page: 'Seiten',
    business: 'Geschäftsberechtigungen',
    administration: 'Verwaltung',
    other: 'Sonstige',
  },
  options: {
    defaultAndSharing: 'Standarddatenbereich verwenden',
    actions: {
      assign: 'Zuweisungen verwalten',
      configure: 'Konfigurieren',
      inspect: 'Berechtigungen prüfen',

      read: 'Lesen',
      create: 'Erstellen',
      update: 'Aktualisieren',
      delete: 'Löschen',
      access: 'Zugriff',
    },
    settingsModules: { authorization: 'Autorisierung' },
    pages: {
      all: 'Alle Seiten',
      allDescription:
        'Zugriff auf alle Seiten erlauben, einschließlich später hinzugefügter Seiten.',
    },
    settings: {
      inspector: 'Berechtigungsprüfung',
      'permission-sets': 'Berechtigungssätze',
    },
    subjectTypes: {
      authenticated: 'Alle angemeldeten Benutzer',
      authenticatedDescription:
        'Gilt für jeden Benutzer mit einer gültigen angemeldeten Sitzung.',
      user: 'Benutzer',
    },
    recordAccessPolicies: {
      allRecords: 'Alle Datensätze',
      recordsIOwn: 'Mir gehörende Datensätze',
      recordsICreated: 'Von mir erstellte Datensätze',
      customFilter: 'Benutzerdefinierter Filter',
      customFilterHint:
        'Datensätze anhand einer benutzerdefinierten Filterbedingung auswählen.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
