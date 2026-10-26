export default {
  headcounts: {
    authz: {
      title: 'Personalstellenkapazität',
      view: 'Kapazität anzeigen',
      manage: 'Jährliche Kapazität verwalten',
      viewJournal: 'Quellenjournal anzeigen',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Die vollständige Mitarbeiterliste ist nicht lesbar. Bitten Sie einen Administrator, die Leseberechtigungen für Mitarbeiter zu prüfen.',
      HEADCOUNT_ACCESS_DENIED:
        'Sie sind nicht berechtigt, diesen Personalstellenvorgang auszuführen.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Die Felder der Kapazitätsübersicht liegen außerhalb Ihrer Berechtigung.',
      HEADCOUNT_NOT_FOUND: 'Das Personalstellenkonto ist nicht verfügbar.',
      HEADCOUNT_ALREADY_EXISTS:
        'Für diese Abteilung, Position und dieses Jahr besteht bereits ein Konto.',
      HEADCOUNT_NOT_INITIALIZED:
        'Gleichen Sie die vollständige Mitarbeiterliste ab, bevor Sie Kapazität reservieren.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Wählen Sie die vollständige tatsächliche Liste der Mitarbeiter in Probezeit, der regulär Beschäftigten und der austretenden Mitarbeiter.',
      HEADCOUNT_ROSTER_DRIFT:
        'Die tatsächliche Mitarbeiterliste wurde geändert. Gleichen Sie die Quelldaten ab, bevor Sie fortfahren.',
      HEADCOUNT_VERSION_CONFLICT:
        'Das Konto wurde geändert. Aktualisieren Sie es vor dem Speichern.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Diese Anfragekennung gehört bereits zu einem anderen Vorgang.',
      HEADCOUNT_INSUFFICIENT:
        'Die Jahresgrenze deckt die tatsächlich besetzten und reservierten Personalstellen nicht ab.',
      HEADCOUNT_INVALID_NUMBER:
        'Geben Sie eine ganzzahlige Personenzahl innerhalb der zulässigen Grenzen ein.',
      HEADCOUNT_INVALID_ACCOUNT:
        'Wählen Sie eine tatsächliche Abteilung, Position und ein Jahr.',
      HEADCOUNT_INVALID_IDENTITY:
        'Wählen Sie eine aktive Organisationsabteilung und Position.',
      HEADCOUNT_INVALID_COMMAND:
        'Ein Bearbeiter, eine Anfragekennung und eine Begründung sind erforderlich.',
      HEADCOUNT_INVALID_SOURCE:
        'Ein tatsächlicher Quelltyp und eine Kennung sind erforderlich.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Jede Ersatzstelle benötigt einen anderen austretenden Mitarbeiter.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Die Ersatzquelle muss einer tatsächlichen bevorstehenden oder abgeschlossenen Austrittsbelegung entsprechen.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Diese Ersatzbelegung fehlt oder wurde bereits beansprucht.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Der wiederhergestellte Quellmitarbeiter blockiert diesen Ersatz.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND:
        'Der Mitarbeiterdatensatz ist nicht verfügbar.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Der tatsächliche Mitarbeiter entspricht nicht der zugeteilten Abteilung und Position.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Dieser Mitarbeiter belegt dieses Jahreskonto bereits.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Verknüpfen Sie vor der Nutzung ausdrücklich mit dem aktuellen Unternehmensjahr neu.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Die Kapazitätsquelle ist nicht verfügbar.',
      HEADCOUNT_SOURCE_EXISTS:
        'Für diese Quelle besteht bereits eine Reservierung.',
      HEADCOUNT_SOURCE_STATE: 'Der Quellstatus erlaubt diesen Vorgang nicht.',
      HEADCOUNT_SOURCE_CLOSED: 'Die Kapazitätsquelle ist bereits geschlossen.',
      HEADCOUNT_SEAT_STATE: 'Die reservierte Stelle ist nicht ausstehend.',
      HEADCOUNT_STATE_CONFLICT: 'Die reservierte Stelle wurde geändert.',
      HEADCOUNT_NO_ALLOCATION:
        'Es ist keine genehmigte verfügbare Stelle mehr vorhanden.',
      HEADCOUNT_NOT_LEFT:
        'Vor der Freigabe besetzter Kapazität muss der tatsächliche Austritt erfolgt sein.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Eine tatsächliche nicht freigegebene Mitarbeiterbelegung ist erforderlich.',
      HEADCOUNT_NOT_RESTORED:
        'Vor der Sperrung künftiger Ersatzbelegungen ist eine tatsächliche Wiederherstellung erforderlich.',
      HEADCOUNT_INVALID_REBIND:
        'Bei der jährlichen Neuverknüpfung müssen Abteilung und Position erhalten bleiben und das Jahr muss voranschreiten.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Ersatzgutschriften erfordern ausdrückliche Quellen im Zieljahr.',
      HEADCOUNT_INVALID_TRANSFER:
        'Eine gesonderte genehmigte Zielreservierung ist erforderlich.',
      HEADCOUNT_INVALID_PAGE: 'Wählen Sie eine Seitengröße zwischen 1 und 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Der Transaktionsschutz für die Kapazität ist nicht verfügbar.',
    },
  },
};
