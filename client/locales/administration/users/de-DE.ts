import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Schließen',
  nav: { users: 'Benutzerverwaltung' },
  assignment: {
    saved: 'Berechtigungen für „{{name}}“ aktualisiert',
    inspect: 'Wirksame Berechtigungen prüfen',
    keepEditing: 'Weiter bearbeiten',
    discardChanges: 'Änderungen verwerfen',
    showMore: 'Mehr anzeigen',
    title: 'Berechtigungszuweisungen',
    description:
      'Verwalten Sie Berechtigungen, die diesem Benutzer direkt zugewiesen sind. Änderungen werden beim Speichern wirksam.',
    search: 'Namen oder Beschreibungen durchsuchen',
    selectedOnly: 'Nur ausgewählte',
    selected: '{{count}} ausgewählt',
    changes: '{{added}} hinzugefügt, {{removed}} entfernt',
    noChanges: 'Keine Änderungen',
    empty: 'Keine passenden Optionen',
    protected:
      'Diese Zuweisung ist geschützt und kann hier nicht geändert werden',
    failed: 'Speichern nicht möglich. Versuchen Sie es erneut.',
    discard: 'Nicht gespeicherte Änderungen verwerfen?',
  },
  sessions: {
    title: 'Sitzungen von „{{name}}“ widerrufen?',
    description: 'Der Benutzer muss sich auf jedem Gerät erneut anmelden.',
    confirm: 'Widerrufen',
    success: 'Sitzungen von „{{name}}“ widerrufen',
  },
  page: {
    noMatches: 'Keine Benutzer entsprechen Ihren Filtern.',
    clearFilters: 'Filter zurücksetzen',
    emptyDescription:
      'Erstellen Sie hier Benutzer oder bitten Sie einen Administrator, ein Konto hinzuzufügen.',
    retry: 'Erneut versuchen',
    loading: 'Wird geladen',
    title: 'Benutzer',
    description:
      'Konten, Berechtigungszuweisungen und aktive Sitzungen verwalten.',
    add: 'Benutzer hinzufügen',
    search: 'Nach Name, Benutzername oder E-Mail suchen',
    allStatuses: 'Alle Status',
    allRoles: 'Alle Berechtigungssätze',
    enabled: 'Aktiv',
    disabled: 'Gesperrt',
    noUsers: 'Keine Benutzer gefunden.',
    total: '{{count}} Benutzer',
    previous: 'Zurück',
    next: 'Weiter',
    selectRole: 'Berechtigungssatz auswählen',
    roles: 'Berechtigungssätze',
    systemAdministrator: 'Systemadministrator',
    noDirectRoles: 'Nicht direkt zugewiesen',
    protectedRole: 'Geschützte Zuweisung',
    authenticatedDefaultAccess:
      'Hier werden nur direkte Zuweisungen angezeigt. Berechtigungen über alle angemeldeten Benutzer, Teams oder andere Subjekte werden nicht aufgeführt.',
    columns: { user: 'Benutzer', status: 'Status', actions: 'Aktionen' },
    actions: {
      menuFor: 'Aktionen für {{name}}',
      edit: 'Bearbeiten',
      resetPassword: 'Passwort zurücksetzen',
      revokeSessions: 'Sitzungen widerrufen',
      enable: 'Konto aktivieren',
      delete: 'Löschen',
      disable: 'Konto sperren',
    },
  },
  form: {
    roleRequired: 'Wählen Sie einen Wert für {{name}}.',
    nameRequired: 'Geben Sie einen Namen ein.',
    emailInvalid: 'Geben Sie eine gültige E-Mail-Adresse ein.',
    passwordRequired: 'Geben Sie ein Passwort ein.',
    saved: 'Benutzer „{{name}}“ gespeichert',
    addTitle: 'Benutzer hinzufügen',
    editTitle: 'Benutzer bearbeiten',
    addDescription: 'Konto erstellen und Berechtigungen zuweisen.',
    editDescription: 'Kontoprofil aktualisieren.',
    name: 'Name',
    username: 'Benutzername',
    email: 'E-Mail',
    password: 'Passwort',
    cancel: 'Abbrechen',
    save: 'Speichern',
    create: 'Erstellen',
  },
  password: {
    saved: 'Passwort für „{{name}}“ zurücksetzen',
    title: 'Passwort zurücksetzen',
    description:
      'Legen Sie ein neues Passwort für {{name}} fest. Alle Sitzungen werden widerrufen.',
    newPassword: 'Neues Passwort',
    submit: 'Passwort zurücksetzen',
  },
  state: {
    enabled: 'Konto „{{name}}“ aktiviert',
    disabled: 'Konto „{{name}}“ gesperrt',
    enableTitle: 'Konto „{{name}}“ aktivieren?',
    disableTitle: 'Konto „{{name}}“ sperren?',
    enableDescription:
      'Die Anmeldesperre für {{name}} wird aufgehoben. Bestehende Zugriffsregeln gelten weiterhin.',
    disableDescription:
      '{{name}} kann sich nicht mehr anmelden und wird auf allen Geräten abgemeldet. Die Autorisierungskonfiguration bleibt erhalten; eine Sperrung bedeutet keinen Austritt.',
    enable: 'Konto aktivieren',
    disable: 'Konto sperren',
  },
  deletion: {
    title: 'Benutzer „{{name}}“ löschen?',
    description:
      'Alle Sitzungen und API-Schlüssel von {{name}} werden widerrufen. Frühere Aktivitäten bleiben erhalten. Diese Aktion kann nicht rückgängig gemacht werden.',
    success: 'Benutzer „{{name}}“ gelöscht',
  },
  invite: {
    open: 'Benutzer einladen',
    title: 'Benutzer einladen',
    description:
      'Jede Adresse ohne Konto erhält eine E-Mail mit einem Link zur Kontoerstellung.',
    emails: 'E-Mail-Adressen',
    emailsHint:
      'Eine pro Zeile oder durch Kommas oder Leerzeichen getrennt. Bis zu 50 gleichzeitig.',
    emailsRequired: 'Geben Sie mindestens eine E-Mail-Adresse ein.',
    emailsInvalid: 'Ungültige E-Mail-Adressen: {{emails}}',
    emailsTooMany: 'Laden Sie höchstens 50 Adressen gleichzeitig ein.',
    roles: 'Berechtigungen nach dem Beitritt',
    send: 'Einladungen senden',
    sent: 'Einladungen gesendet.',
    done: 'Fertig',
    link: 'Einladungslink',
    copy: 'Link kopieren',
    copied: 'Kopiert',
    copyFailed: 'Der Link konnte nicht kopiert werden.',
    outcome: {
      sent: 'E-Mail gesendet',
      notSent: 'E-Mail nicht gesendet: Kopieren Sie den Link unten',
      existingUser: 'Hat bereits ein Konto',
    },
  },
  invitations: {
    title: 'Ausstehende Einladungen',
    empty: 'Keine ausstehenden Einladungen.',
    email: 'E-Mail',
    invitedBy: 'Eingeladen von',
    expires: 'Läuft ab',
    status: 'Status',
    pending: 'Ausstehend',
    expired: 'Abgelaufen',
    notSent: 'Nicht gesendet',
    resend: 'Erneut senden',
    revoke: 'Widerrufen',
    actionsFor: 'Aktionen für die Einladung an {{email}}',
    resent: 'Einladung erneut gesendet.',
    revoked: 'Einladung widerrufen.',
    revokeTitle: 'Einladung für „{{email}}“ widerrufen?',
    revokeDescription:
      'Der an {{email}} gesendete Link funktioniert danach nicht mehr.',
  },
  accept: {
    title: 'Einladung annehmen',
    description: '{{inviter}} hat Sie eingeladen.',
    summary: 'Sie treten außerdem bei: {{items}}',
    loading: 'Einladung wird geladen…',
    email: 'E-Mail',
    name: 'Name',
    password: 'Passwort',
    nameRequired: 'Geben Sie Ihren Namen ein.',
    passwordTooShort: 'Das Passwort benötigt mindestens {{min}} Zeichen.',
    submit: 'Konto erstellen und beitreten',
    submitting: 'Beitritt läuft…',
    signedIn:
      'Sie sind als {{name}} angemeldet. Melden Sie sich ab, um diese Einladung mit einem neuen Konto anzunehmen.',
    signOut: 'Abmelden',
    signOutFailed: 'Abmeldung nicht möglich.',
    existingAccount:
      'Diese Adresse hat bereits ein Konto. Melden Sie sich damit an, um fortzufahren.',
    goToLogin: 'Zur Anmeldung',
    errors: {
      notFound: 'Dieser Einladungslink ist ungültig.',
      expired: 'Diese Einladung ist abgelaufen. Bitten Sie um eine neue.',
      accepted: 'Diese Einladung wurde bereits angenommen.',
      revoked: 'Diese Einladung wurde widerrufen.',
      password: 'Das Passwort erfüllt die Anforderungen nicht.',
      accountConflict:
        'Ein Konto mit dieser Adresse kann nicht erstellt werden.',
      failed: 'Ein Fehler ist aufgetreten. Versuchen Sie es erneut.',
    },
  },
  errors: {
    loadFailed:
      'Benutzer konnten nicht geladen werden. Versuchen Sie es erneut.',
    loadForbidden:
      'Sie können Benutzer nicht mehr anzeigen. Wenden Sie sich an einen Administrator.',
    loadNotFound:
      'Die Benutzerverwaltung ist nicht verfügbar. Kehren Sie zum Arbeitsplatz zurück.',
    SELF_DELETE_NOT_ALLOWED: 'Sie können Ihr eigenes Konto nicht löschen.',
    LAST_ASSIGNMENT:
      'Dieser Benutzer ist die letzte Person mit einem Berechtigungssatz, der zugewiesen bleiben muss.',
    USER_HAS_APPS:
      'Übertragen oder löschen Sie die Anwendungen dieses Benutzers, bevor Sie ihn löschen.',
    HUB_ADMIN_REQUIRED: 'Nur ein Plattformadministrator kann Benutzer löschen.',
    PROTECTED_ROLE_ASSIGNMENT:
      'Diese Rolle kann in der Benutzerverwaltung weder zugewiesen noch entfernt werden.',
    USER_NOT_FOUND: 'Der Benutzer ist nicht mehr vorhanden.',
    USER_DELETION_NOT_CONFIGURED:
      'Das Löschen von Benutzern ist für diese Anwendung nicht konfiguriert.',
    USER_EMAIL_CONFLICT:
      'Ein Benutzer mit dieser E-Mail-Adresse ist bereits vorhanden.',
    USER_USERNAME_CONFLICT:
      'Ein Benutzer mit diesem Benutzernamen ist bereits vorhanden.',
    USER_IDENTITY_CONFLICT:
      'Ein Benutzer mit dieser E-Mail-Adresse oder diesem Benutzernamen ist bereits vorhanden.',
    PASSWORD_TOO_SHORT: 'Das Passwort ist zu kurz.',
    PASSWORD_TOO_LONG: 'Das Passwort ist zu lang.',
    operationFailed: 'Der Benutzervorgang ist fehlgeschlagen.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
