export default {
  announcements: {
    authz: {
      title: 'Mitteilungen',
      owned: 'Von mir veröffentlicht',
      readable: 'Meine Veröffentlichungen und empfangenen Mitteilungen',
      view: 'Mitteilungen lesen',
      create: 'Mitteilungsentwürfe erstellen',
      edit: 'Eigenen Entwurf bearbeiten',
      publish: 'Eigene Mitteilung veröffentlichen',
      revoke: 'Eigene Mitteilung zurückziehen',
      remind: 'Empfänger ohne Bestätigung erinnern',
      receipts: 'Eigene Empfängerliste lesen',
      confirm: 'Eigenen Empfang bestätigen',
    },
    removeDepartment: 'Abteilung „{{name}}“ entfernen',

    confirmTitle: 'Mitteilung „{{name}}“: {{action}}?',
    discardNamed: 'Änderungen an Mitteilung „{{name}}“ verwerfen?',

    ownPendingCount: '{{count}} Mitteilungen warten auf Ihre Bestätigung',
    title: 'Mitteilungen',
    description:
      'Aktuelle Mitteilungen lesen und den eigenen Empfang bestätigen',
    received: 'Empfangen',
    mine: 'Von mir veröffentlicht',
    publisher: 'Herausgeber',
    new: 'Neue Mitteilung',
    edit: 'Mitteilung bearbeiten',
    detail: 'Mitteilungsdetails',
    search: 'Titel oder Inhalt durchsuchen',
    clear: 'Filter zurücksetzen',
    refresh: 'Aktualisieren',
    empty: 'Keine Mitteilungen',
    noMatches: 'Keine passenden Mitteilungen',
    cancel: 'Abbrechen',
    save: 'Entwurf speichern',
    saving: 'Wird gespeichert',
    saved: 'Mitteilung „{{name}}“ gespeichert',
    done: 'Mitteilung „{{name}}“ aktualisiert',
    timeZone: 'Unternehmenszeitzone',
    zoneHint:
      'Geben Sie den Gültigkeitszeitraum in der Unternehmenszeitzone {{zone}} ein',
    requiresConfirmation: 'Bestätigung erforderlich',
    pinned: 'Angeheftet',
    noConfirmation: 'Keine Bestätigung erforderlich',
    confirmed: 'Bestätigt',
    pending: 'Bestätigung ausstehend',
    publicationStatus: 'Mitteilungsstatus',
    noOwnReceipt: 'Ihnen ist keine Empfangsbestätigung zugewiesen',
    linkedKnowledge: 'Verknüpfte Richtlinie: {{title}} (Version {{version}})',
    newVersion: 'Eine neuere Version der verknüpften Richtlinie ist verfügbar',
    attachments: 'Anhänge',
    upload: 'Anhang hochladen',
    uploading: 'Anhang wird hochgeladen',
    includeFile: 'Anhang {{name}} einschließen',
    fileLimit:
      'Bis zu 10 Dateien mit jeweils höchstens 20 MB: PDF, PNG, JPEG und TXT',
    saveBeforeUpload:
      'Speichern Sie den Entwurf und bearbeiten Sie ihn anschließend, um Anhänge hochzuladen',
    receipts: 'Empfangsbestätigungen',
    recipient: 'Empfänger',
    receiptStatus: 'Bestätigungsstatus',
    confirmedAt: 'Bestätigt am',
    frozenRoster:
      'Empfänger und Namen werden bei der Veröffentlichung festgeschrieben; spätere Personaländerungen behalten diesen Verlauf bei',
    searchRecipients: 'Empfängername suchen',
    receiptCounts: 'Ausstehend: {{pending}} · Bestätigt: {{confirmed}}',
    noRecipients: 'Keine passenden Empfänger',
    required: 'Dieses Feld ist erforderlich',
    titleLimit: 'Der Titel darf höchstens 200 Zeichen umfassen',
    bodyLimit: 'Der Inhalt darf höchstens 100000 Zeichen umfassen',
    invalidDate: 'Wählen Sie ein gültiges Datum und eine gültige Uhrzeit',
    invalidInterval:
      'Das Ende muss nach dem Beginn liegen und in der Zukunft sein',
    audienceRequired:
      'Wählen Sie alle Mitarbeiter, eine Abteilung oder eine Funktionsrolle',
    invalidField: 'Prüfen Sie dieses Feld',
    freezeHint:
      'Die Veröffentlichung schreibt Inhalt, Zielgruppe, Anhänge und Empfängerliste fest',
    allEmployees: 'Alle Mitarbeiter',
    departments: 'Abteilungen einschließlich aktiver Unterabteilungen',
    selectedDepartment: 'Ausgewählte Abteilung',
    remove: 'Entfernen',
    dutyRoles: 'Funktionsrollen',
    rolesUnavailable:
      'Funktionsrollenoptionen sind eingeschränkt; bestehende Auswahlen bleiben erhalten',
    knowledge: 'Verknüpftes Richtliniendokument',
    none: 'Keine',
    knowledgeLimit: 'Die ersten 100 lesbaren Dokumente werden angezeigt',
    knowledgeRetained:
      'Richtliniendokumente sind eingeschränkt; die vorhandene Referenz bleibt erhalten und wird beim Speichern und Veröffentlichen erneut geprüft',
    unavailable:
      'Dieser Vorgang ist nicht verfügbar; schließen Sie die Ansicht und aktualisieren Sie die Details',
    failed: 'Die Anfrage ist fehlgeschlagen; versuchen Sie es später erneut',
    denied:
      'Der Zugriff ist eingeschränkt; kehren Sie zur Ursprungsseite zurück',
    missing:
      'Der Datensatz fehlt oder ist nicht mehr sichtbar; kehren Sie zur Liste zurück',
    conflict:
      'Der Datensatz wurde geändert; laden Sie vor einem erneuten Versuch den neuesten Inhalt',
    back: 'Zurück zur Quelle',
    retry: 'Erneut versuchen',
    loading: 'Wird geladen',
    loadLatest: 'Neueste Version laden',
    replaceDraft:
      'Beim Neuladen werden Ihre aktuellen Eingaben verworfen. Fortfahren?',
    discard: 'Änderungen verwerfen',
    discardDescription:
      'Beim Schließen werden nicht gespeicherte Änderungen verworfen',
    fields: {
      title: 'Titel',
      body: 'Inhalt',
      status: 'Status',
      validFrom: 'Beginn',
      validUntil: 'Ende',
      publishedAt: 'Veröffentlicht am',
    },
    status: {
      all: 'Alle Status',
      draft: 'Entwurf',
      scheduled: 'Geplant',
      published: 'Veröffentlicht',
      revoked: 'Widerrufen',
    },
    actions: {
      edit: 'Bearbeiten',
      publish: 'Veröffentlichen',
      revoke: 'Widerrufen',
      remind: 'Erinnern',
      confirm: 'Empfang bestätigen',
    },
    consequence: {
      publish:
        'Die Veröffentlichung schreibt Inhalt, Zielgruppe, Anhänge und Empfänger fest. Bei zukünftigem Beginn wird die Mitteilung zeitlich geplant.',
      revoke:
        'Der Widerruf beendet die Sichtbarkeit für die Zielgruppe sowie Bestätigungen und Erinnerungen; frühere Empfangsbestätigungen bleiben erhalten.',
      remind:
        'Nur aktuell berechtigte Empfänger ohne Bestätigung erinnern; die festgeschriebene Liste bleibt erhalten.',
      confirm: 'Bestätigen Sie, dass Sie diese Mitteilung gelesen haben.',
    },
    notice: {
      scheduled:
        'Diese Mitteilung ist geplant; Bestätigungen und Erinnerungen beginnen nach der Aktivierung.',
      revoked:
        'Diese Mitteilung wurde widerrufen; frühere Empfangsbestätigungen bleiben erhalten.',
      expired:
        'Diese Mitteilung liegt außerhalb ihres Gültigkeitszeitraums; Bestätigungen und Erinnerungen sind nicht verfügbar.',
    },
    receipt: {
      all: 'Alle Empfangsbestätigungen',
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
    },
  },
};
