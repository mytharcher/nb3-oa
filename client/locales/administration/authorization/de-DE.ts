import optionMessages from './options/de-DE.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  navigation: {
    authorization: 'Autorisierung',
    permissionSets: 'Berechtigungssätze',
    inspector: 'Berechtigungsprüfung',
  },
  feedback: {
    saved: '„{{name}}“ gespeichert',
    deleted: '„{{name}}“ gelöscht',
    assigned: 'Berechtigungen aus „{{name}}“ zugewiesen',
    revoked: 'Berechtigungen aus „{{name}}“ widerrufen',
  },
  common: {
    actionsFor: 'Aktionen für „{{name}}“',
    clearFilters: 'Filter zurücksetzen',
    all: 'Alle',
    allFields: 'Alle Felder',
    cancel: 'Abbrechen',
    close: 'Schließen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    key: 'Schlüssel',
    keyHint: 'Beständige Kennung für APIs.',
    loading: 'Wird geladen…',
    noFields: 'Keine Felder',
    remove: 'Entfernen',
    removeNamed: '{{label}} entfernen',
    resource: 'Ressource',
    retry: 'Erneut versuchen',
    ruleSections: 'Regelabschnitte',
    search: 'Suchen',
    selectNamed: '{{label}} auswählen',
    signedInUsers: 'Alle angemeldeten Benutzer',
    type: 'Typ',
    view: 'Anzeigen',
  },
  page: {
    loadFailed: 'Diese Seite konnte nicht geladen werden.',
  },
  pagination: {
    navLabel: 'Seitennavigation für {{label}}',
    next: 'Nächste Seite',
    page: 'Seite {{number}}',
    previous: 'Vorherige Seite',
    range: '{{first}}–{{last}} von {{total}}',
    empty: '0 von 0',
  },
  filters: {
    clear: 'Filter zurücksetzen',
    clearSearch: '{{label}} zurücksetzen',
  },
  errors: {
    requestFailed: 'Autorisierungsanfrage fehlgeschlagen.',
    lastAssignment:
      'Dieser Berechtigungssatz muss einen aktiven Inhaber behalten. Weisen Sie ihn einem anderen aktivierten Konto zu, bevor Sie diese Zuweisung entfernen.',
    protectedSet:
      'Dieser Berechtigungssatz wird von der Anwendung gepflegt und kann hier nicht geändert werden.',
    subjectNotAllowed:
      'Dieser Berechtigungssatz unterstützt den ausgewählten Subjekttyp nicht. Wählen Sie einen von der Anwendung zugelassenen Typ.',
    completePermissions:
      'Vervollständigen Sie vor dem Speichern jede Berechtigung.',
    completeRule: 'Vervollständigen Sie die Regel vor dem Speichern.',
    selectAnAction: 'Wählen Sie mindestens eine Aktion.',
  },
  marks: {
    labels: {
      all: 'Vollzugriff',
      scoped: 'Begrenzter Zugriff',
      none: 'Kein Zugriff',
      bypass: 'Uneingeschränkt',
    },
    descriptions: {
      all: 'Vollzugriff',
      scoped: 'Begrenzter Zugriff',
      none: 'Kein Zugriff',
      bypass: 'Uneingeschränkt: Gewährungen werden nicht geprüft',
    },
  },
  filterEditor: {
    logic: 'Gruppenlogik',
    all: 'Alle Bedingungen (UND)',
    any: 'Eine beliebige Bedingung (ODER)',
    addGroup: 'Gruppe hinzufügen',
    removeGroup: 'Gruppe entfernen',
    valueType: 'Werttyp',
    text: 'Text',
    number: 'Nummer',
    boolean: 'Boolesch',
    unsupported:
      'Diese Bedingung bleibt erhalten, kann jedoch nicht visuell bearbeitet werden.',
    invalid:
      'Kein bearbeitbarer Filterknoten gefunden. Ein Neustart ersetzt den bestehenden Filter.',
    start: 'Bedingungen einrichten',
  },
  filterOperators: {
    $includes: 'Enthält',
    $notIncludes: 'Enthält nicht',
    $startsWith: 'Beginnt mit',
    $endsWith: 'Endet mit',
    $empty: 'Ist leer',
    $notEmpty: 'Ist nicht leer',
    $isTruly: 'Ist wahr',
    $isFalsy: 'Ist falsch',

    $eq: 'Ist gleich',
    $ne: 'Ist ungleich',
    $in: 'In',
    $notIn: 'Nicht in',
    $gt: 'Größer als',
    $gte: 'Mindestens',
    $lt: 'Kleiner als',
    $lte: 'Höchstens',
  },
  labels: {
    allRecords: 'Alle Datensätze',
    selectedRecords: '{{count}} ausgewählte Datensätze',
    unknownScope: 'Unbekannter Bereich',
    actionScope: '{{action}}: {{scope}}',
  },
  subjects: {
    matchAny: 'Gilt, wenn ein beliebiges ausgewähltes Subjekt übereinstimmt.',
    search: 'Subjekte suchen',
    empty: 'Keine passenden Subjekte',
    previous: 'Zurück',
    next: 'Weiter',
    selected: 'Ausgewählte Subjekte · {{count}}',
    unresolved: '{{id}} (nicht aufgelöst)',
    none: 'Keine Subjekte ausgewählt',
  },
  editors: {
    resourceGroup: 'Ressourcengruppe',
    actions: 'Aktionen',
    addCondition: 'Bedingung hinzufügen',
    assignments: 'Zuweisungen',
    assignmentsSelected: {
      one: '{{count}} Zuweisung ausgewählt',
      other: '{{count}} Zuweisungen ausgewählt',
    },
    audienceHint:
      'Gilt für jeden Benutzer mit einer gültigen angemeldeten Sitzung.',
    filterConditions: 'Filterbedingungen',
    records: 'Datensätze',
    recordsSelected: {
      one: '{{count}} Datensatz ausgewählt',
      other: '{{count}} Datensätze ausgewählt',
    },
    recordAccessPolicy: 'Datensatzzugriffsrichtlinie',
    recordScope: 'Datensatzbereich',
    resource: 'Ressource',
    resourceType: 'Ressourcentyp',
    searchPeople: 'Personen suchen',
    searchPeoplePlaceholder: 'Nach Name, Benutzername oder E-Mail suchen',
    searchRecords: 'Datensätze suchen',
    selectUser: 'Benutzer auswählen',
    specificRecordIds: 'Bestimmte Datensatz-IDs',
    specificUser: 'Bestimmter Benutzer',
    user: 'Benutzer',
    who: 'Wer',
  },
  permissionWorkspace: {
    businessModules: 'Geschäftsmodule',
    allModules: 'Alle',
    otherModules: 'Sonstige',
    clearFilters: 'Filter zurücksetzen',
    noModuleMatches: 'Keine passenden Berechtigungen in diesem Modul',
    moduleCount:
      '{{module}}: {{configured}} konfiguriert / {{total}} Ressourcen',

    pageAccessHint:
      'Seitenzugriff steuert den Einstieg. Geschäftsberechtigungen steuern Datenvorgänge.',
    specifyScope: 'Bereich festlegen: {{scope}}',
    inheritScope:
      'Falls nicht festgelegt, gelten weiterhin konfigurierte Standardbereiche sowie Freigabe- und Einschränkungsregeln.',
    configurePermission: 'Berechtigung konfigurieren',
    noOperationGrant:
      'Dieser Berechtigungssatz gewährt diesen Vorgang nicht. Wählen Sie „Berechtigung konfigurieren“, um den Datenbereich festzulegen.',
    features: 'Funktionsberechtigungen',
    dataScope: 'Datenbereich',
    dataScopeHelp:
      'Filtert die Berechtigungen aus diesem Berechtigungssatz einschließlich freigegebener Datensätze. Ohne Einschränkung wird kein Filter hinzugefügt und werden keine Datensätze gewährt.',
    appliesTo: 'Gilt für',
    moduleGranted: 'Vollzugriff',
    modulePartial: 'Begrenzter Zugriff',
    moduleNotGranted: 'Kein Zugriff',

    selectAll: 'Alle auswählen',
    selectFiltered: 'Passende Ressourcen auswählen',
    selectGroup: 'Alle in {{group}} auswählen',

    expandSets: 'Berechtigungssätze aufklappen',
    collapseSets: 'Berechtigungssätze zuklappen',
    userAssignments: 'Zugewiesene Personen',
    chooseSet: 'Wählen Sie einen Berechtigungssatz oder erstellen Sie einen.',
    clickScope: 'Klicken Sie auf ein Bereichssymbol, um den Zugriff zu ändern.',
    mode: {
      none: 'Kein Zugriff',
      all: 'Vollzugriff',
      custom: 'Benutzerdefinierter Bereich',
    },
    unavailableSet:
      'Dieser Berechtigungssatz fehlt oder kann nicht bearbeitet werden.',
    description:
      'Konfigurieren Sie Ressourcen in diesem Berechtigungssatz. Änderungen werden beim Speichern wirksam.',
    sections: 'Berechtigungssatzabschnitte',
    permissions: 'Berechtigungen',
    details: 'Grundinformationen',
    unsaved: 'Nicht gespeicherte Änderungen',
    showMore: 'Mehr anzeigen',
    development: {
      pages:
        'Es wurden keine Seiten mit Autorisierungspflicht definiert. Bitten Sie die KI, Seitenzugriffsberechtigungen für Ihre Geschäftsseiten hinzuzufügen, und konfigurieren Sie sie dann hier.',
      business:
        'Es wurden keine Geschäftsberechtigungen definiert. Bitten Sie die KI, Vorgänge, Felder und Datensatzbereiche für Ihr Unternehmen zu entwerfen, und konfigurieren Sie sie dann hier.',
    },
    configuredOnly: 'Nur konfigurierte Ressourcen',
    configured: 'In diesem Satz konfiguriert',
    backResources: 'Zurück zu den Ressourcen',
    discardTitle: 'Nicht gespeicherte Änderungen verwerfen?',
    discard: 'Änderungen verwerfen',
    discardBody: 'Ihre Berechtigungsänderungen wurden nicht gespeichert.',
    configureScope: 'Datensatzbereich konfigurieren',
  },
  databasePolicy: {
    addCondition: 'Bedingung hinzufügen',
    filterField: 'Filterfeld',
    filterOperator: 'Filteroperator',
    filterValue: 'Filterwert',
    removeCondition: 'Bedingung entfernen',
    conditionRequired: 'Fügen Sie mindestens eine Bedingung hinzu.',
  },
  inspector: {
    summary: {
      all: 'Dieser Vorgang ist zulässig.',
      scoped:
        'Dieser Vorgang ist nur innerhalb der geltenden Datensatz- und Feldgrenzen zulässig.',
      none: 'Dieser Vorgang ist nicht zulässig. Die Gewährung von Datensätzen allein gewährt nicht den Vorgang.',
      error:
        'Die Prüfung konnte nicht abgeschlossen werden. Dies ist keine Berechtigungsverweigerung.',
      context:
        'Wählen Sie einen bestimmten Benutzer, um diesen Bereich auszuwerten.',
    },
    dataAccess: 'Welche Daten zugänglich sind',
    subjectHint: '„Ich“ bezieht sich auf die geprüfte Person.',
    scopeAndFields: 'Wirksame Bedingungen und Felder anzeigen',
    technicalHint:
      'Unverarbeitetes Autorisierungsergebnis zur Fehlerdiagnose einschließlich zugrunde liegender Seiten- und Tabellenprüfungen.',
    selectedRecords: '{{count}} ausgewählte Datensätze',
    databaseActions: {
      read: 'Lesen',
      create: 'Erstellen',
      update: 'Aktualisieren',
      delete: 'Löschen',
    },

    subjectType: 'Subjekttyp',
    subject: 'Budgetposition',
    selectSubject: 'Budgetposition auswählen',
    searchSubjects: 'Subjekte suchen',
    inheritsFrom: 'Erbt von:',
    grantedVia: 'über {{label}}',
    grantedDirectly: 'direkt zugewiesen',
    inheritedSubject: '{{name}} ({{type}})',
    listSeparator: ', ',
    noRegisteredResources:
      'Für diesen Typ sind noch keine Ressourcen registriert.',
    status: {
      context: 'Benutzerkontext erforderlich',
      all: 'Zulässig',
      scoped: 'Mit Einschränkungen zulässig',
      none: 'Nicht zulässig',
      error: 'Prüfung fehlgeschlagen',
    },
    reasonCodes: {
      NO_MATCHING_GRANT: 'Nichts gewährt diesen Vorgang',
      RESOURCE_ACTION_NOT_SUPPORTED:
        'Diese Ressource bietet diesen Vorgang nicht an',
      USER_CONTEXT_REQUIRED:
        'Dieser Bereich hängt von einem bestimmten Benutzer ab und kann nicht allein aus diesem Subjekt bestimmt werden.',
      GRANT_MATCHED: 'Dieser Vorgang ist gewährt',
      SELECTION_EXPANDED: 'Erweitert zugängliche Datensätze',
      SELECTION_RESTRICTED: 'Begrenzt zugängliche Datensätze',
      NO_OBJECT_PERMISSION: 'Dieser Vorgang wurde nicht gewährt',
      NO_RECORD_ACCESS: 'Kein zugänglicher Datensatzbereich',
      EMPTY_RECORD_ACCESS: 'Der Datensatzbereich entspricht keinen Datensätzen',
      UNRESTRICTED_ACCESS: 'Uneingeschränkter Zugriff',
    },
    inputFields: 'Schreibbare Felder',
    outputFields: 'Zurückgegebene Felder',
    allFields: 'Alle Felder',

    refresh: 'Aktualisieren',
    failed: 'Prüfung fehlgeschlagen',
    noResources: 'Keine passenden Ressourcen',
    recordScope: 'Wirksamer Datensatzbereich',
    fields: 'Zulässige Felder',
    fieldSearch: 'Felder suchen',
    technicalDetails: 'Technische Details',
    allConditions: 'Alle Bedingungen erfüllen',
    anyCondition: 'Eine beliebige Bedingung erfüllen',

    page: {
      title: 'Berechtigungsprüfung',
      description:
        'Gewährten Zugriff eines Autorisierungssubjekts anzeigen und die Gründe prüfen.',
    },
    person: 'Person',
    selectPerson: 'Person auswählen',
    searchPeople: 'Personen suchen',
    searchPeoplePlaceholder: 'Nach Name, Benutzername oder E-Mail suchen',
    action: 'Aktion',
    selectAction: 'Aktion auswählen',
    inspect: 'Prüfen',
    inspecting: 'Wird geprüft…',
    empty:
      'Wählen Sie ein Autorisierungssubjekt, um seine Ressourcenberechtigungen anzuzeigen.',
    decision: 'Entscheidung',
    effects: {
      permit: 'Zulässig',
      deny: 'Verweigert',
      conditional: 'Unter Bedingungen zulässig',
    },
    reasons: 'Gründe',
    noReasons: 'Die Entscheidung enthält keine Gründe.',
    reasonFrom: 'Aus {{plugin}}',
    reasonFromCore: 'Aus dem Autorisierungskern',
    conditions: 'Bedingungen',
    conditionsHint:
      'Die Entscheidung gilt nur für die durch diese Bedingungen ausgewählten Daten, wie sie vom Kern zurückgegeben wurden.',
  },
  permissionSets: {
    builtIn: { root: 'Systemadministrator', member: 'Mitglied' },
    page: {
      title: 'Berechtigungssätze',
      description:
        'Berechtigungssätze gewähren Zugriff: Bündeln Sie benötigte Ressourcen und Aktionen und weisen Sie das Bündel Personen zu.',
    },
    unknownPage: 'Unbekannte Seite',
    assignmentCount: {
      one: '{{count}} Zuweisung',
      other: '{{count}} Zuweisungen',
    },
    list: {
      search: 'Nach Berechtigungssatzname oder Schlüssel suchen',
      create: 'Neuer Berechtigungssatz',
      nameHeader: 'Berechtigungssatz',
      system: 'System',
      custom: 'Benutzerdefiniert',
      emptyNone:
        'Noch keine Berechtigungssätze. Erstellen Sie einen, um benötigte Ressourcen und Aktionen zu bündeln.',
      emptySearch: 'Keine Berechtigungssätze entsprechen Ihrer Suche.',
      pagerLabel: 'Berechtigungssätze',
    },
    detail: {
      untitled: 'Neuer Berechtigungssatz',
      unrestrictedTitle:
        'Dieser Berechtigungssatz gewährt uneingeschränkten Zugriff.',
      unrestrictedBody:
        'Dieser Satz gewährt uneingeschränkten Zugriff, unbeeinflusst von anderen Berechtigungssätzen sowie Freigabe- oder Einschränkungsregeln. Einzelberechtigungen müssen nicht konfiguriert werden. Verwalten Sie die Zuweisungen unter „Zugewiesene Personen“.',
      confirmDeleteTitle: 'Berechtigungssatz „{{title}}“ löschen?',
      confirmDeleteBody:
        '„{{title}}“ und seine Zuweisungen löschen. Andere Berechtigungssätze und Regeln bleiben wirksam.',
      confirmDelete: 'Löschen',
    },
    assignments: {
      search: 'Zuweisungen suchen',
      searchPlaceholder: 'Nach Subjektname oder ID suchen',
      kindLabel: 'Zuweisungsart',
      kindAll: 'Alle Zuweisungen',
      kindUsers: 'Benutzer',
      kindAudiences: 'Zielgruppen',
      revokeSelected: 'Ausgewählte widerrufen ({{count}})',
      add: 'Zuweisungen hinzufügen',
      assignedTo: 'Zugewiesen an',
      subjectType: 'Subjekttyp',
      selectAllVisible: 'Alle sichtbaren Zuweisungen auswählen',
      audience: 'Zielgruppe',
      user: 'Benutzer',
      revoke: 'Widerrufen',
      emptyNone:
        'Noch keine Zuweisungen. Fügen Sie eine hinzu, um jemandem diesen Berechtigungssatz zu geben.',
      emptyFiltered: 'Keine Zuweisungen entsprechen diesen Filtern.',
      pagerLabel: 'Zuweisungen',
      confirmRevokeTitleOne: 'Zuweisung für „{{name}}“ widerrufen?',
      confirmRevokeTitleMany: 'Zuweisungen für „{{name}}“ widerrufen?',
      confirmRevokeBody:
        '{{label}} besitzt diesen Berechtigungssatz danach nicht mehr. Andere Zuweisungen bleiben wirksam und dieser Satz kann erneut zugewiesen werden.',
      confirmRevoke: 'Widerrufen',
      pickerDescription:
        'Wählen Sie Subjekte aus, die diesen Berechtigungssatz erhalten sollen.',
      audienceDescription:
        'Alle mit einer gültigen Sitzung. Dies wird getrennt von einzelnen Benutzern verwaltet.',
      usersHeading: 'Benutzer',
      usersHint: 'Bereits zugewiesene Benutzer sind ausgeblendet.',
      selectedCount: '{{count}} ausgewählt',
      selectAllResults: 'Alle Ergebnisse auswählen',
      userCount: '{{count}} Benutzer',
      noAvailableUsers: 'Keine verfügbaren Benutzer entsprechen Ihrer Suche.',
      assigning: 'Wird zugewiesen…',
    },
    editor: {
      nameRequired: 'Geben Sie einen Berechtigungssatznamen ein.',
      keyRequired: 'Geben Sie einen Berechtigungssatzschlüssel ein.',
      resourceRequired: 'Wählen Sie eine Ressource für diese Berechtigung.',
      actionsRequired: 'Wählen Sie mindestens eine Aktion für diese Ressource.',
      editTitle: 'Berechtigungssatz bearbeiten',
      newTitle: 'Neuer Berechtigungssatz',
      description: 'Zugriff zu einer wiederverwendbaren Zuweisung bündeln.',
      name: 'Name',
      permissions: 'Berechtigungen',
      permissionsHint:
        'Wählen Sie Ressourcen und die von diesem Satz gewährten Aktionen.',
      addPermission: 'Berechtigung hinzufügen',
      searchResources: 'Ressourcen oder Aktionen suchen',
      resourceTypeLabel: 'Berechtigungsressourcentyp',
      allResourceTypes: 'Alle Ressourcentypen',
      visibleCount: '{{visible}} von {{total}} Ressourcen',
      noActions: 'Keine Aktionen',
      unknownPageNotice:
        'Keine Route deklariert diese Seite mehr; diese Berechtigung gewährt daher nichts. Die Seite wurde umbenannt oder entfernt — entfernen Sie die Berechtigung oder fügen Sie eine für die Ersatzseite hinzu.',
      emptyFiltered: 'Keine Berechtigungen entsprechen diesen Filtern.',
      addFirst: 'Erste Berechtigung hinzufügen',
      addFirstHint:
        'Wählen Sie Ressourcen nach Typ und konfigurieren Sie dann ihre Aktionen.',
      saving: 'Wird gespeichert…',
      save: 'Berechtigungssatz speichern',
      confirmRemoveTitle: 'Diese Berechtigung entfernen?',
      confirmRemoveBody:
        '{{resource}} und jede dafür konfigurierte Aktion werden aus diesem Berechtigungssatz entfernt. Nach dem Speichern des Satzes kann dies nicht rückgängig gemacht werden.',
      confirmRemove: 'Berechtigung entfernen',
      thisResource: 'Diese Ressource',
    },
    picker: {
      title: 'Berechtigungen hinzufügen',
      description:
        'Wählen Sie Ressourcen und konfigurieren Sie ihren Zugriff in einem Arbeitsbereich.',
      resourceTypes: 'Ressourcentypen',
      resources: 'Ressourcen',
      selectResourceHint: 'Wählen Sie eine Ressource zur Konfiguration.',
      searchResources: 'Ressourcen suchen',
      added: 'Hinzugefügt',
      noResources: 'Keine Ressourcen entsprechen Ihrer Suche.',
      emptyTitle: 'Ressource zur Konfiguration auswählen',
      emptyHint:
        'Ihre Aktionen und ressourcenspezifischen Zugriffseinstellungen erscheinen hier.',
      readyCount: {
        one: '{{count}} Ressource zum Hinzufügen bereit',
        other: '{{count}} Ressourcen zum Hinzufügen bereit',
      },
      incomplete: ' · Wählen Sie mindestens eine Aktion für jede Ressource',
      add: 'Berechtigungen hinzufügen',
    },
  },
  ruleWorkspace: {
    unset: 'Nicht festgelegt',
    unsetHint:
      'Für diese Aktion wird kein zusätzlicher Datensatzbereich bereitgestellt.',
    clearDefaults: 'Standardkonfiguration entfernen',
    setDefault: 'Standardbereich festlegen',
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
