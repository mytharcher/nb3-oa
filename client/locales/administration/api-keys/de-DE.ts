import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Schließen',
  nav: { apiKeys: 'API-Schlüssel' },
  page: {
    search: 'Nach Schlüsselname suchen',
    retry: 'Erneut versuchen',
    clear: 'Filter zurücksetzen',
    noResults: 'Keine Schlüssel entsprechen Ihrer Suche.',
    loading: 'Wird geladen',
    title: 'API-Schlüssel',
    description:
      'Erstellen Sie Schlüssel, mit denen Skripte und Integrationen diese Anwendung in Ihrem Namen aufrufen können.',
    add: 'Schlüssel erstellen',
    empty: 'Sie haben noch keine API-Schlüssel.',
    unnamed: 'Unbenannter Schlüssel',
    never: 'Nie',
    unused: 'Noch nie verwendet',
    active: 'Aktiv',
    expired: 'Abgelaufen',
    disabled: 'Deaktiviert',
    columns: {
      name: 'Name',
      key: 'Schlüssel',
      status: 'Status',
      lastUsed: 'Zuletzt verwendet',
      expires: 'Läuft ab',
      actions: 'Aktionen',
    },
    actions: { revoke: 'Widerrufen', menu: 'Aktionen für „{{name}}“' },
  },
  form: {
    title: 'API-Schlüssel erstellen',
    description:
      'Der Schlüssel handelt in Ihrem Namen. Er besitzt genau die Berechtigungen Ihres Kontos.',
    name: 'Name',
    namePlaceholder: 'Nächtlicher Exportauftrag',
    expiry: 'Läuft ab',
    expiryChoices: {
      never: 'Nie',
      '7': 'In 7 Tagen',
      '30': 'In 30 Tagen',
      '90': 'In 90 Tagen',
      '365': 'In 1 Jahr',
    },
    cancel: 'Abbrechen',
    create: 'Erstellen',
  },
  reveal: {
    title: 'Kopieren Sie Ihren Schlüssel jetzt',
    description:
      '„{{name}}“ wurde erstellt. Der Schlüssel wird nur dieses eine Mal angezeigt.',
    usage: 'Senden Sie ihn im Anfrageheader x-api-key.',
    copy: 'Schlüssel kopieren',
    done: 'Fertig',
  },
  revoke: {
    success: 'Schlüssel „{{name}}“ widerrufen',
    title: 'Schlüssel „{{name}}“ widerrufen?',
    description:
      'Anfragen mit „{{name}}“ schlagen sofort fehl. Dies kann nicht rückgängig gemacht werden.',
    cancel: 'Abbrechen',
    confirm: 'Widerrufen',
  },
  errors: {
    forbidden:
      'Sie können Schlüssel nicht mehr anzeigen. Wenden Sie sich an einen Administrator.',
    notFound:
      'Die API-Schlüsselverwaltung ist nicht verfügbar. Kehren Sie zum Arbeitsplatz zurück.',
    nameRequired: 'Geben Sie einen Schlüsselnamen ein.',
    copyFailed:
      'Der Schlüssel konnte nicht kopiert werden. Markieren Sie ihn und kopieren Sie ihn manuell.',
    loadFailed: 'Ihre API-Schlüssel konnten nicht geladen werden.',
    createFailed: 'Der API-Schlüssel konnte nicht erstellt werden.',
    revokeFailed: 'Der API-Schlüssel konnte nicht widerrufen werden.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
