export default {
  seals: {
    authz: {
      requests: 'Siegelanträge',
      view: 'Anzeigen',
      create: 'Erstellen',
      edit: 'Bearbeiten',
      operate: 'Bearbeiten',
      actualReturn: 'Tatsächliche außerordentliche Rückgabe',
      ledger: 'Siegelverzeichnis',
      instances: 'Siegelexemplare',
      manage: 'Siegelstammdaten verwalten',
      owned: 'Eigene Datensätze',
      readable: 'Eigene und mitbearbeitete Datensätze',
    },
    errors: {
      REVIEWER_REQUIRED:
        'Der tatsächlich zugewiesene Prüfer muss die erforderliche aktive Funktionsrolle weiterhin besitzen.',
      APPROVAL_REFUSED:
        'Die aktuellen Genehmigungs- oder Bearbeitungsregeln verweigern diesen Vorgang.',
      ACCESS_DENIED:
        'Sie können auf diese Siegelseinträge oder Felder nicht zugreifen.',
      ACTIVE_EMPLOYEE_REQUIRED:
        'Ein aktives Mitarbeiterkonto ist erforderlich.',
      ADMIN_KEEPER_REQUIRED:
        'Tatsächliche außerordentliche Rückgaben erfordern sowohl die Administrator- als auch die Siegelverwalterrolle.',
      ADMIN_REQUIRED: 'Eine aktive Verwaltungsfunktionsrolle ist erforderlich.',
      BODY_TOO_LARGE: 'Der Anhang überschreitet die zulässige Uploadgröße.',
      COMMAND_CONFLICT:
        'Dieser Anfrageschlüssel wurde bereits für andere Inhalte verwendet.',
      CONTRACT_ACCESS_DENIED:
        'Sie können den verknüpften Vertrag nicht anzeigen.',
      CONTRACT_NOT_EFFECTIVE: 'Der verknüpfte Vertrag ist nicht wirksam.',
      CONTRACT_VERSION_CONFLICT:
        'Der verknüpfte Vertrag wurde nach der Genehmigung geändert.',
      DEPARTMENT_REQUIRED: 'Der Antragsteller muss eine Hauptabteilung haben.',
      INVALID_COMMAND: 'Ein gültiger Anfrageschlüssel ist erforderlich.',
      INVALID_COPIES:
        'Die Anzahl tatsächlich gesiegelter Exemplare muss positiv sein und darf die genehmigte Menge nicht überschreiten.',
      INVALID_FILE:
        'Der Anhang fehlt, ist unsicher oder gehört nicht zu diesem Antrag.',
      INVALID_INPUT: 'Die Felder des Siegelantrags sind ungültig.',
      INVALID_OUTPUT: 'Das Ergebnis der physischen Bearbeitung ist ungültig.',
      INVALID_RETURN:
        'Die tatsächliche Rückgabe erfordert eine administrativ abgeschlossene externe Ausleihe und eine Begründung.',
      INVALID_SEAL_TYPE:
        'Die Siegelart ist inaktiv oder stimmt nicht mit dem genehmigten Antrag überein.',
      INVALID_TIME:
        'Die tatsächlichen Zeitangaben oder die Rückgabefrist sind ungültig.',
      KEEPER_REQUIRED: 'Eine aktive Siegelverwalterrolle ist erforderlich.',
      OUTSTANDING_CUSTODY:
        'Dieses Siegel befindet sich noch in physischer Verwahrung.',
      PHYSICAL_ALREADY_REGISTERED:
        'Die tatsächliche Nutzung oder Rückgabe wurde bereits erfasst.',
      REQUEST_NOT_FOUND: 'Der Antrag ist nicht verfügbar.',
      SEAL_EVIDENCE_REQUIRED:
        'Ein tatsächlicher unveränderlicher Siegelnachweis ist erforderlich.',
      SEAL_NOT_FOUND: 'Das Siegel ist nicht verfügbar.',
      SEAL_UNAVAILABLE: 'Dieses Siegel ist derzeit ausgeliehen.',
      SLA_UNSUPPORTED:
        'Der konfigurierte Erinnerungszeitplan wird nicht unterstützt.',
      TARGET_MISMATCH: 'Die angebotene Aufgabe gehört nicht zu diesem Antrag.',
      VERSION_CONFLICT:
        'Der Datensatz wurde geändert. Aktualisieren Sie die Ansicht vor einem erneuten Versuch.',
    },
    schedule: {
      title: 'Erinnerungen an die Siegelrückgabe',
      description:
        'Täglich in der Unternehmenszeitzone an ausstehende Siegelrückgaben erinnern.',
    },
    notifications: {
      overdue: 'Die Rückgabe eines ausgeliehenen Siegels ist überfällig.',
    },
  },
};
