/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Aktualisieren',
    personal: {
      title: 'Persönliche Akte',
      description:
        'Sehen Sie Ihre Mitarbeiterdaten ein; wenden Sie sich für Korrekturen an die Personalabteilung.',
      identity: '{{name}} · {{code}}',
      basic: 'Grundinformationen',
      profile: 'Persönliche Angaben',
      bank: 'Zahlungskonto',
      emptyTitle: 'Noch keine Mitarbeiterakte',
      emptyDescription:
        'Bitten Sie die Personalabteilung, für Ihr Konto eine Mitarbeiterakte anzulegen.',
      profileMissing:
        'Persönliche Angaben nicht gefunden; bitten Sie die Personalabteilung, Ihre Akte zu prüfen.',
      forbidden:
        'Kein Zugriff auf Ihre Akte; bitten Sie einen Administrator, den Zugriff zu prüfen.',
      refresh: 'Aktualisieren',
    },
    authz: {
      section: 'Mitarbeiter',
      settings: 'Mitarbeiteraktenseite',
      settingsRead: 'Öffnen',
      collections: {
        employees: 'Mitarbeiterakten',
        employeeProfiles: 'Geschützte Mitarbeiterinformationen',
        employeeCompensation: 'Mitarbeitervergütung',
      },
      archive: {
        title: 'Mitarbeiterakte',
        view: 'Anzeigen',
        manage: 'Erstellen und bearbeiten',
        correctStatus: 'Status korrigieren',
      },
      profile: {
        title: 'Geschützte Mitarbeiterinformationen',
        view: 'Alle anzeigen',
        viewBank: 'Bankkonto anzeigen',
        update: 'Bearbeiten',
      },
      compensation: {
        title: 'Mitarbeitervergütung',
        view: 'Anzeigen',
      },
      directory: {
        title: 'Verzeichnis',
        view: 'Personen anzeigen',
        viewContact: 'Telefon und E-Mail anzeigen',
      },
      scopes: {
        reports: 'Meine unterstellten Mitarbeiter (alle Ebenen)',
        selfAndReports: 'Ich und meine unterstellten Mitarbeiter',
        reportsHint:
          'Personen unterhalb des Betrachters in der Führungslinie auf jeder Ebene; eine inaktive Führungskraft dazwischen unterbricht diese nicht.',
      },
      subjects: {
        position: 'Positionen',
        reportingManager: 'Direkte Führungskräfte',
      },
    },
    permissionSets: {
      hr: 'Personalabteilung: Mitarbeiterakten',
      compensation: 'Mitarbeitervergütung (Geschäftsführung, Finanzvorstand)',
      bank: 'Mitarbeiterbankkonten (Finanzen)',
      manager: 'Direkte Führungskraft: Akten unterstellter Mitarbeiter',
      head: 'Abteilungsleitung: Abteilungsakten',
      admin: 'Datenkorrektur der Mitarbeiterakte',
      directory: 'Verzeichnis',
    },
    navigation: {
      archive: 'Mitarbeiter',
      directory: 'Verzeichnis',
    },
    title: 'Mitarbeiter',
    description:
      'Pflegen Sie Konto, Führungslinie, Position und geschützte Informationen jedes Mitarbeiters.',
    fields: {
      name: 'Name',
      code: 'Mitarbeitercode',
      user: 'Konto',
      primaryDepartment: 'Hauptabteilung',
      position: 'Position',
      grade: 'Gehaltsgruppe',
      manager: 'Direkte Führungskraft',
      status: 'Status',
      careerStartDate: 'Datum des ersten Beschäftigungsbeginns',
      hireDate: 'Eintrittsdatum',
      probationEndDate: 'Probezeitende',
      lastWorkingDay: 'Letzter Arbeitstag',
      phone: 'Telefon',
      email: 'E-Mail',
      workLocation: 'Arbeitsort',
      emergencyContact: 'Notfallkontakt',
      active: 'Aktiv',
      updatedAt: 'Aktualisiert',
      idType: 'Ausweisart',
      idNumber: 'Ausweisnummer',
      birthDate: 'Geburtsdatum',
      address: 'Adresse',
      education: 'Ausbildung',
      school: 'Bildungseinrichtung',
      major: 'Fachrichtung',
      bankName: 'Bank',
      bankAccount: 'Bankkonto',
      bankAccountName: 'Kontoinhaber',
      effectiveFrom: 'Gültig ab',
      baseSalary: 'Grundgehalt',
      sourceApplication: 'Quellantrag',
      note: 'Hinweis',
      kind: 'Änderung',
      effectiveAt: 'Wirksamkeitsdatum',
      changes: 'Änderungen',
    },
    status: {
      probation: 'In Probezeit',
      regular: 'Festangestellt',
      leaving: 'Im Austritt',
      left: 'Ausgetreten',
    },
    historyKind: {
      hire: 'Eintritt',
      regularization: 'Übernahme in Festanstellung',
      transfer: 'Versetzen',
      salaryChange: 'Gehaltsänderung',
      departure: 'Austritt',
      correction: 'Datenkorrektur',
    },
    boolean: {
      yes: 'Ja',
      no: 'Nein',
    },
    search: {
      placeholder: 'Nach Name oder Mitarbeitercode suchen',
      label: 'Mitarbeiter suchen',
    },
    filters: {
      department: 'Abteilung',
      allDepartments: 'Alle Abteilungen',
      status: 'Status',
      allStatuses: 'Alle Status',
      clear: 'Filter zurücksetzen',
    },
    empty: {
      title: 'Noch keine Mitarbeiterakten',
      description:
        'Erstellen Sie eine Akte, um Konto, Führungslinie und Position zu verknüpfen.',
      descriptionReadOnly:
        'Für Sie ist noch keine Akte sichtbar. Wenden Sie sich bei Bedarf an die Personalabteilung.',
      noResults: 'Keine Mitarbeiter entsprechen den Filtern.',
    },
    error: {
      title: 'Mitarbeiter konnten nicht geladen werden',
      requestFailed:
        'Die Anfrage ist fehlgeschlagen. Prüfen Sie die Verbindung und versuchen Sie es erneut.',
      forbidden: 'Sie sind nicht berechtigt, dies anzuzeigen.',
      notFound:
        'Diese Mitarbeiterakte ist nicht vorhanden oder wurde gelöscht.',
      tabForbidden: 'Sie sind nicht berechtigt, diesen Bereich anzuzeigen.',
    },
    actions: {
      label: 'Aktionen',
      more: 'Aktionen für {{name}}',
      edit: 'Bearbeiten',
      correctStatus: 'Status korrigieren',
      editProfile: 'Bearbeiten',
      moreActions: 'Weitere Aktionen',
    },
    create: {
      action: 'Neuer Mitarbeiter',
      title: 'Neuer Mitarbeiter',
      description: 'Verknüpfen Sie ein Konto und füllen Sie die Akte aus.',
      submit: 'Erstellen',
      success: 'Mitarbeiter „{{name}}“ erstellt',
    },
    edit: {
      title: 'Mitarbeiter bearbeiten',
      success: 'Mitarbeiter „{{name}}“ gespeichert',
    },
    form: {
      basicSection: 'Grundinformationen',
      contactSection: 'Kontakt',
      nameRequired: 'Geben Sie einen Namen ein.',
      codeRequired: 'Geben Sie einen Mitarbeitercode ein.',
      userRequired: 'Wählen Sie das zu verknüpfende Konto.',
      careerStartInvalid:
        'Wählen Sie ein gültiges Datum des ersten Beschäftigungsbeginns.',
      careerStartFuture:
        'Der erste Beschäftigungsbeginn darf nicht in der Zukunft liegen.',
      careerStartAfterHire:
        'Der erste Beschäftigungsbeginn darf nicht nach dem Eintrittsdatum liegen.',
      hireDateRequired: 'Wählen Sie das Eintrittsdatum.',
      tooLong: 'Verwenden Sie höchstens {{max}} Zeichen.',
      emailInvalid: 'Das E-Mail-Format ist ungültig.',
      userTaken: 'Dieses Konto hat bereits eine Akte.',
      codeTaken: 'Dieser Mitarbeitercode wird bereits verwendet.',
      userInvalid: 'Dieses Konto ist nicht vorhanden oder deaktiviert.',
      managerInvalid:
        'Wählen Sie einen aktiven Mitarbeiter, der diesem nicht unterstellt ist.',
      positionInvalid: 'Diese Position ist nicht vorhanden oder deaktiviert.',
      gradeInvalid: 'Diese Gehaltsgruppe ist nicht vorhanden oder deaktiviert.',
      initialStatus: 'Anfangsstatus',
      managerPlaceholder: 'Nach Name oder Mitarbeitercode suchen',
      managerEmpty: 'Kein passender Mitarbeiter',
      none: 'Keine',
      positionPlaceholder: 'Position auswählen',
      gradePlaceholder: 'Gehaltsgruppe auswählen',
      optionsFailed: 'Die Optionen konnten nicht geladen werden.',
      userPlaceholder: 'Konten nach Name oder E-Mail suchen',
    },
    page: {
      title: 'Mitarbeiter',
      tabsLabel: 'Mitarbeiterbereiche',
    },
    tabs: {
      basic: 'Grundinformationen',
      profile: 'Geschützte Informationen',
      compensation: 'Vergütung',
      history: 'Änderungsverlauf',
    },
    profile: {
      title: 'Geschützte Informationen',
      description:
        'Identität, Adresse, Ausbildung und Bankkonto; nur für autorisierte Rollen sichtbar.',
      bankOnly: 'Sie können nur das Bankkonto sehen.',
      editTitle: 'Geschützte Informationen bearbeiten',
      success: 'Geschützte Informationen von „{{name}}“ gespeichert',
      identitySection: 'Identität',
      educationSection: 'Ausbildung',
      bankSection: 'Bankkonto',
    },
    compensation: {
      title: 'Vergütung',
      description:
        'Jede Übernahme in Festanstellung und Gehaltsänderung fügt eine Zeile hinzu; Zeilen werden nie bearbeitet.',
      empty: 'Noch keine Vergütungseinträge.',
    },
    history: {
      referenceNotice:
        'Referenznamen verwenden das aktuelle Verzeichnis; Namen zum Änderungszeitpunkt wurden nicht gespeichert.',
      sources: {
        onboarding: 'Eintritt',
        departure: 'Austritt',
        transfer: 'Personaländerung',
        probation: 'Übernahme in Festanstellung',
        other: 'Anderer Geschäftsvorgang',
      },
      referenceUnavailable: 'Historische Referenz nicht verfügbar',
      personUnavailable: 'Historische Person nicht verfügbar',
      otherField: 'Andere Änderung',
      title: 'Änderungsverlauf',
      description:
        'Eintritte, Festanstellungen, Versetzungen, Austritte und Datenkorrekturen.',
      empty: 'Noch keine Änderungen erfasst.',
    },
    correction: {
      title: 'Status korrigieren',
      description:
        'Eine Datenkorrektur außerhalb der Genehmigungsprozesse. Sie wird mit Ihrer Begründung protokolliert.',
      reason: 'Begründung',
      reasonPlaceholder: 'Warum der erfasste Status falsch ist',
      reasonRequired: 'Geben Sie den Korrekturgrund ein.',
      submit: 'Korrigieren',
      unchanged: 'Die Korrektur ändert nichts.',
      success: 'Status von „{{name}}“ korrigiert',
    },
    directory: {
      title: 'Verzeichnis',
      description:
        'Finden Sie Kollegen nach Abteilung oder Name einschließlich ihrer Kontaktdaten.',
      searchPlaceholder: 'Nach Name oder Mitarbeitercode suchen',
      searchLabel: 'Verzeichnis durchsuchen',
      contactHidden: 'Nicht sichtbar',
      emptyTitle: 'Das Verzeichnis ist leer',
      emptyDescription:
        'Personen erscheinen hier, sobald die Personalabteilung ihre Akten erstellt.',
      noResults: 'Keine Kollegen entsprechen den Filtern.',
      errorTitle: 'Verzeichnis konnte nicht geladen werden',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
