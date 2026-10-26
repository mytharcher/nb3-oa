export default {
  financeAssignments: {
    create: 'Erstellen',

    saved: 'Buchhalterzuweisung für „{{name}}“ gespeichert',
    saveFailed:
      'Die Zuweisung konnte nicht gespeichert werden. Prüfen Sie die Eingabe und versuchen Sie es erneut.',
    disableTitle: 'Zuweisung für „{{name}}“ deaktivieren?',

    loadLatest: 'Neueste Zuweisung laden',
    latestSummary:
      'Aktuell: {{name}} / {{status}}. Ihre Formularwerte bleiben unverändert.',
    adoptVersion: 'Diese Version mit meinen Änderungen verwenden',
    uncertain:
      'Das Erstellungsergebnis ist ungewiss. Prüfen Sie diese Abteilung vor einem erneuten Versuch.',
    checkExisting: 'Abteilungszuweisung prüfen',
    viewExisting: 'Vorhandene Zuweisung öffnen',
    required: 'Dieses Feld ist erforderlich.',
    title: 'Abteilungsbuchhalter',
    description:
      'Weisen Sie jeder Abteilung einen Finanzprüfer zu. Bei fehlenden oder inaktiven Zuweisungen wird die nächstgelegene aktive übergeordnete Zuweisung verwendet, danach die Finanzleitung.',
    new: 'Buchhalter zuweisen',
    edit: 'Zuweisung bearbeiten',
    view: 'Zuweisungsdetails',
    department: 'Abteilung',
    accountant: 'Buchhalter',
    status: 'Status',
    active: 'Aktiv',
    inactive: 'Deaktiviert',
    updatedAt: 'Aktualisiert',
    refresh: 'Aktualisieren',
    clear: 'Filter zurücksetzen',
    rowActions: 'Aktionen für {{name}}',
    save: 'Speichern',
    cancel: 'Abbrechen',
    loading: 'Zuweisungen werden geladen',
    retry: 'Erneut versuchen',
    accountantPlaceholder: 'Geeignete Buchhalter suchen',
    noAccountants: 'Keine aktiven Mitglieder mit Finanzfunktion',
    reason: 'Begründung',
    formDescription:
      'Nur aktive Mitglieder mit Finanzfunktion können zugewiesen werden. Änderungen werden protokolliert.',
    departmentPermission:
      'Zur Auswahl einer Abteilung ist die Leseberechtigung für Abteilungen erforderlich. Bitten Sie einen Administrator, sie zu erteilen.',
    conflictAdvice:
      'Bewahren Sie Ihre Änderungen als Referenz auf. Schließen und öffnen Sie dieses Formular erneut, um die neueste Zuweisung vor einem erneuten Versuch zu prüfen.',
    disable: 'Zuweisung deaktivieren',
    disableDescription:
      'Künftige Genehmigungen verwenden die nächstgelegene aktive übergeordnete Zuweisung, danach die Finanzleitung. Bestehende Genehmigungsaufgaben bleiben ihren erfassten Prüfern zugewiesen.',
    authz: {
      title: 'Abteilungsbuchhalter',
      read: 'Zuweisungen lesen',
      update: 'Zuweisungen verwalten',
      permissionSet: 'Buchhalterkonfiguration durch die Finanzleitung',
    },
    empty: {
      accountsTitle: 'Keine Buchhalter zugewiesen',
      accountsDescription:
        'Weisen Sie einer Abteilung einen Buchhalter zu, um Finanzprüfungen weiterzuleiten.',
      readonlyTitle: 'Keine Zuweisungen',
      readonlyDescription:
        'Die Finanzleitung kann Abteilungsbuchhalter konfigurieren.',
      filteredTitle: 'Keine passenden Zuweisungen',
      filteredDescription:
        'Setzen Sie den Abteilungsfilter zurück, um alle Zuweisungen zu sehen.',
    },
    error: {
      forbidden:
        'Sie sind nicht berechtigt, auf diese Zuweisungen zuzugreifen.',
      missing: 'Diese Zuweisung ist nicht mehr vorhanden.',
      invalid: 'Prüfen Sie die Formularwerte.',
      failed:
        'Zuweisungen konnten nicht geladen werden. Versuchen Sie es erneut.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Diese Zuweisung ist nicht mehr vorhanden.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Diese Zuweisung wurde geändert. Öffnen Sie das Formular erneut, um die neueste Version zu prüfen.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Diese Abteilung hat bereits eine Zuweisung. Bearbeiten Sie diese Zuweisung.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT:
        'Wählen Sie eine aktive Abteilung.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Wählen Sie ein aktives Mitglied mit Finanzfunktion.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND:
        'Ein Bearbeiter und eine Begründung sind erforderlich.',
    },
  },
};
