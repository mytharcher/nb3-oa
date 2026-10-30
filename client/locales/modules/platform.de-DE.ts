/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Arbeitskalender',
      dictionaries: 'Wörterbücher',
      rules: 'Regelübersicht und Verlauf',
      sequences: 'Dokumentnummern',
      auditLogs: 'Prüfprotokoll',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'OA-Plattform',
      calendar: 'Arbeitskalender',
      dictionaries: 'Wörterbücher',
      rules: 'Regelübersicht und Verlauf',
      sequences: 'Dokumentnummern',
      auditLogs: 'Prüfprotokoll',
      actions: { read: 'Anzeigen', update: 'Bearbeiten' },
    },
    common: {
      actions: 'Aktionen',
      actionsFor: 'Aktionen für {{name}}',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      refresh: 'Aktualisieren',
      clearFilters: 'Filter zurücksetzen',
      noResults: 'Nichts entspricht den Filtern.',
      forbidden: 'Sie sind nicht berechtigt, dies anzuzeigen.',
      notFound: 'Dieser Datensatz existiert nicht oder wurde gelöscht.',
      loadFailed:
        'Daten konnten nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      writeForbidden: 'Sie sind nicht berechtigt, diese Änderung vorzunehmen.',
      saveFailed:
        'Die Änderung konnte nicht gespeichert werden. Versuchen Sie es erneut.',
    },
    calendar: {
      title: 'Arbeitskalender',
      description:
        'Legen Sie Arbeitszeiten fest und pflegen Sie die gesetzlichen Feiertage und Ausgleichsarbeitstage jedes Jahres.',
      loadFailedTitle: 'Kalendereinstellungen konnten nicht geladen werden',
      kinds: {
        holiday: 'Gesetzlicher Feiertag',
        adjustedWorkday: 'Ausgleichsarbeitstag',
        workday: 'Arbeitstag',
        weekend: 'Freier Tag',
      },
      workHours: {
        title: 'Arbeitszeiten',
        description:
          'Genehmigungserinnerungen und Eskalationen zählen nur diese Stunden an Arbeitstagen.',
        start: 'Beginn',
        end: 'Ende',
        range: '{{start}}–{{end}}',
        invalidTime: 'Geben Sie eine Zeit wie 09:00 ein.',
        endBeforeStart: 'Das Ende muss nach dem Beginn liegen.',
        scheduled: 'Ab {{date}}: {{start}}–{{end}}',
        saved: 'Arbeitszeiten gespeichert',
      },
      timeZone: {
        title: 'Zeitzone',
        description:
          'Die Zeitzone für Kalender und Dokumentnummern. Eine Änderung gilt sofort.',
        label: 'Zeitzone',
        hint: 'Ein IANA-Zeitzonenname, etwa Asia/Shanghai.',
        required: 'Geben Sie eine Zeitzone ein.',
        invalid:
          'Der Server kennt diese Zeitzone nicht. Verwenden Sie einen Namen wie Asia/Shanghai.',
        saved: 'Zeitzone gespeichert',
      },
      days: {
        remove: 'Entfernen',
        title: 'Besondere Tage',
        description:
          'Nicht aufgeführte Tage folgen der Wochenregel: Montag bis Freitag sind Arbeitstage.',
        previousYear: 'Vorjahr',
        nextYear: 'Folgejahr',
        add: 'Tag hinzufügen',
        addTitle: 'Tag hinzufügen',
        addDescription: 'Ein bereits aufgeführtes Datum wird ersetzt.',
        addSubmit: 'Hinzufügen',
        editTitle: '{{date}} bearbeiten',
        import: 'Importieren',
        date: 'Datum',
        weekday: 'Wochentag',
        kind: 'Typ',
        note: 'Hinweis',
        dateRequired: 'Wählen Sie ein Datum.',
        noteTooLong: 'Verwenden Sie höchstens {{max}} Zeichen.',
        emptyTitle: 'Noch keine besonderen Tage im Jahr {{year}}',
        emptyDescription:
          'Importieren Sie die gesetzlichen Feiertage und Ausgleichsarbeitstage des Jahres oder fügen Sie diese einzeln hinzu.',
        emptyReadOnly:
          'Jeder Tag folgt der Wochenregel. Bitten Sie einen Administrator, die Feiertage zu importieren.',
        saved: '„{{date}}“ gespeichert',
        removed: '„{{date}}“ entfernt',
        removeTitle: '„{{date}}“ entfernen?',
        removeDescription: 'Das Datum folgt wieder der Wochenregel.',
        notFound:
          'Dieser Tag ist nicht mehr aufgeführt. Er wurde möglicherweise entfernt.',
      },
      import: {
        title: 'Besondere Tage des Jahres {{year}} importieren',
        description:
          'Fügen Sie einen Tag pro Zeile ein: Datum, Typ und optionaler Hinweis.',
        lines: 'Tage',
        placeholder:
          '{{year}}-10-01,holiday,Nationalfeiertag\n{{year}}-10-10,adjustedWorkday',
        hint: 'Durch Kommas oder Tabulatoren trennen. Typen: holiday, adjustedWorkday, workday, weekend (oder 休 / 班).',
        replace: 'Jahr ersetzen',
        replacePreview:
          'Gemäß aktuellem Kalender fehlen {{count}} bestehende besondere Tage des Jahres {{year}} in diesem Import und werden entfernt. Andere Benutzer können den Kalender vor Ihrem Speichern ändern.',
        previewFailed:
          'Das vollständige Kalenderjahr konnte nicht geladen werden. Versuchen Sie es vor dem Ersetzen erneut.',
        confirmReplaceTitle: 'Besondere Tage des Jahres {{year}} ersetzen?',
        replaceHint:
          'Besondere Tage des Jahres {{year}} entfernen, die nicht in der Liste stehen.',
        submit: 'Importieren',
        emptyText: 'Fügen Sie mindestens einen Tag ein.',
        success:
          'Importiert: {{created}} hinzugefügt, {{updated}} geändert, {{removed}} entfernt',
        problems: {
          format: 'Zeile {{line}} benötigt ein Datum und einen Typ.',
          date: 'Zeile {{line}} hat ein ungültiges Datum.',
          kind: 'Zeile {{line}} hat einen unbekannten Typ.',
          year: 'Zeile {{line}} liegt nicht im Jahr {{year}}.',
          duplicate: 'Zeile {{line}} wiederholt ein Datum.',
        },
      },
    },
    dictionaries: {
      title: 'Wörterbücher',
      description:
        'Pflegen Sie die Optionen der Antragsformulare. Einträge werden deaktiviert, niemals gelöscht.',
      loadFailedTitle: 'Das Wörterbuch konnte nicht geladen werden',
      searchPlaceholder: 'Nach Name oder Code suchen',
      searchLabel: 'Einträge suchen',
      notFound: 'Dieser Eintrag existiert nicht oder wurde entfernt.',
      enable: 'Aktivieren',
      enabled: '„{{name}}“ aktiviert',
      disable: 'Deaktivieren',
      disabled: '„{{name}}“ deaktiviert',
      disableTitle: '„{{name}}“ deaktivieren?',
      disableDescription:
        'Bestehende Anträge zeigen ihn weiter an, aber neue Anträge können ihn nicht mehr auswählen. Sie können ihn wieder aktivieren.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: keine Grenze',
      fields: {
        type: 'Wörterbuchtyp',
        label: 'Name',
        labelZh: 'Name (Chinesisch)',
        labelEn: 'Name (Englisch)',
        code: 'Code',
        extra: 'Attribute',
        sortOrder: 'Reihenfolge',
        status: 'Status',
      },
      status: {
        all: 'Alle Status',
        active: 'Aktiviert',
        inactive: 'Deaktiviert',
      },
      empty: {
        title: 'Noch keine Einträge dieser Art',
        description:
          'Fügen Sie den ersten Eintrag hinzu, damit Formulare ihn anbieten können.',
        readOnly: 'Bitten Sie einen Administrator, Einträge hinzuzufügen.',
      },
      create: {
        action: 'Neuer Eintrag',
        title: 'Neuer Eintrag: {{type}}',
        success: 'Eintrag „{{name}}“ erstellt',
      },
      edit: {
        title: 'Eintrag bearbeiten',
        success: 'Eintrag „{{name}}“ gespeichert',
      },
      form: {
        description:
          'Ein Eintrag von {{type}}. Benennen Sie ihn in mindestens einer Sprache.',
        codeHint:
          'Buchstaben, Ziffern, _ und -, beginnend mit einem Buchstaben. Später nicht änderbar.',
        codeFixed:
          'Datensätze speichern den Code; er kann deshalb nicht geändert werden.',
        codeInvalid:
          'Verwenden Sie Buchstaben, Ziffern, _ und -, beginnend mit einem Buchstaben (höchstens 64).',
        codeTaken:
          'Für diesen Typ besteht bereits ein Eintrag mit diesem Code.',
        labelRequired: 'Geben Sie einen Namen in mindestens einer Sprache ein.',
        labelTooLong: 'Verwenden Sie höchstens {{max}} Zeichen.',
        sortOrderHint: 'Kleinere Zahlen stehen in Formularen zuerst.',
        sortOrderInvalid: 'Geben Sie eine ganze Zahl von 0 bis 1.000.000 ein.',
        numberRequired: 'Geben Sie eine Zahl ein.',
        numberMin: 'Geben Sie eine Zahl von mindestens {{min}} ein.',
        integerMin: 'Geben Sie eine ganze Zahl von mindestens {{min}} ein.',
        blankUnlimited: 'Für keine Begrenzung leer lassen.',
        extraInvalid: 'Dieser Wert wird nicht akzeptiert.',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: 'Ausgabenantragsvorgänge',
        officeItem: 'Büromaterial',
        leaveType: 'Urlaubsarten',
        annualLeaveTier: 'Jahresurlaub nach Dienstzeit',
        paymentMethod: 'Zahlungsmethode',
        expenseCategory: 'Ausgabenkategorien',
        budgetSubject: 'Budgetpositionen',
        sealType: 'Siegelarten',
        contractType: 'Vertragsarten',
        assetCategory: 'Anlagenkategorien',
        supplierCategory: 'Lieferantenkategorien',
        vehicleType: 'Fahrzeugarten',
        departureType: 'Austrittsart',
        resignationReason: 'Kündigungsgründe',
        recruitmentReason: 'Einstellungsgründe',
        certificateType: 'Bescheinigungsarten',
        travelStandard: 'Reisestandards',
      },
      travelStandardKindHelp:
        'Verwenden Sie die jeweilige Kategorie für Übernachtung und Pauschale. Eine Sammelkategorie für Reisen steht für keines davon und hat keinen Tagesstandard.',
      invalidStandardKind: 'Wählen Sie eine gültige Reisestandardzuordnung.',
      extraOptions: {
        travelStandardKind: {
          none: 'Nicht zutreffend',
          lodging: 'Übernachtung pro Nacht',
          allowance: 'Pauschale pro Tag',
        },
      },
      extra: {
        travelStandardKind: 'Reisestandardzuordnung',
        requiresPrintInfo: 'Druckangaben erforderlich',
        deductsBalance: 'Zieht vom Saldo ab',
        requiresAttachment: 'Anhang erforderlich',
        attachmentAboveDays: 'Anhang oberhalb von (Tagen)',
        maxDays: 'Maximale Tage',
        requiresHr: 'Personalgenehmigung',
        minYears: 'Ab Dienstjahren',
        days: 'Tage',
        voluntary: 'Freiwillig',
        replacement: 'Ersetzt einen Austretenden',
        involvesSalary: 'Zeigt Gehalt',
        minRank: 'Ab Gehaltsgruppenrang',
        lodgingPerNight: 'Übernachtung pro Nacht (Yuan)',
        allowancePerDay: 'Pauschale pro Tag (Yuan)',
      },
    },
    rules: {
      relatedFlows: 'Zugehörige Prozesse (am Knoten bearbeiten)',
      editAtNode: 'Am Prozessknoten bearbeiten',
      title: 'Regelübersicht und Verlauf',
      description:
        'Zeigen Sie aktuelle Regeln, geplante Änderungen und Verlauf an. Öffnen Sie einen zugehörigen Prozessknoten zum Bearbeiten; gemeinsame Regeln wirken auf mehrere Prozesse.',
      loadFailedTitle: 'Genehmigungsregeln konnten nicht geladen werden',
      notFound: 'Diese Regel existiert nicht.',
      change: 'Änderung',
      history: 'Verlauf',
      changeTitle: '„{{name}}“ ändern',
      changeDescription:
        'Der neue Wert gilt für Anträge, die ab seinem Wirksamwerden eingereicht werden.',
      changed: '„{{name}}“ geändert',
      historyTitle: 'Verlauf von „{{name}}“',
      currentValue: 'Jetzt: {{value}}',
      scheduledValue: 'Ab {{date}}: {{value}}',
      defaultVersion: 'Standard',
      withdraw: 'Zurückziehen',
      withdrawn: 'Geplante Änderung von „{{name}}“ zurückgezogen',
      withdrawTitle: 'Änderung von „{{name}}“ ab {{date}} zurückziehen?',
      withdrawDescription: 'Der geplante Wert {{value}} wird nicht wirksam.',
      versionStatus: { current: 'Wirksam', scheduled: 'Geplant' },
      fields: {
        rule: 'Regel',
        current: 'Aktueller Wert',
        scheduled: 'Geplant',
        newValue: 'Neuer Wert',
        value: 'Wert',
        note: 'Hinweis',
        effectiveFrom: 'Wird wirksam',
        changedBy: 'Geändert von',
      },
      effective: {
        label: 'Wird wirksam',
        now: 'Sofort',
        fromDate: 'Ab einem Datum',
        dateLabel: 'Wirksamkeitsdatum',
        hint: 'Ab 00:00 Uhr dieses Tages.',
        dateRequired: 'Wählen Sie das Wirksamkeitsdatum.',
        pastError: 'Wählen Sie ein Datum ab morgen.',
      },
      errors: {
        valueRequired: 'Geben Sie einen Wert ein.',
        notANumber: 'Geben Sie eine Zahl ein.',
        minimum: 'Geben Sie mindestens {{min}} ein.',
        percentRange:
          'Geben Sie einen Prozentsatz von {{min}} bis {{max}} ein.',
        integer: 'Geben Sie eine ganze Zahl ein.',
        halfDays: 'Geben Sie Tage in Schritten von 0,5 ein.',
        noteTooLong: 'Verwenden Sie höchstens {{max}} Zeichen.',
        invalidValue: 'Dieser Wert wird nicht akzeptiert.',
        orderViolated:
          'Dieser Wert widerspricht der Reihenfolge einer zugehörigen Regel (etwa ein Schwellenwert der stellvertretenden Geschäftsführung über dem der Geschäftsführung). Ändern Sie zuerst die zugehörige Regel.',
        versionExists:
          'Zu diesem Zeitpunkt wird bereits eine Änderung wirksam. Wählen Sie ein anderes Datum.',
        inEffect:
          'Diese Änderung ist bereits wirksam geworden und gehört nun zum Verlauf.',
      },
      domains: {
        spend: {
          title: 'Ausgaben',
          description:
            'Betragsschwellen der Ausgabenstufen und anderer finanzieller Genehmigungen.',
        },
        leave: {
          title: 'Urlaub',
          description:
            'Urlaubsdauern, die eine Abteilungsleitung oder die Personalabteilung benötigen.',
        },
        attendance: {
          title: 'Anwesenheit',
          description: 'Grenzen für Überstunden und Anwesenheitskorrekturen.',
        },
        hr: {
          title: 'Personalabteilung',
          description:
            'Gehaltsgruppenstufen und Schwellenwerte für Gehaltserhöhungen.',
        },
        sla: {
          title: 'Genehmigungsfristen',
          description:
            'Erinnerungen und Eskalationen, gezählt in Arbeitsstunden.',
        },
        committee: {
          title: 'Prüfungsausschüsse',
          description: 'Standardwerte für Ausschussabstimmungen.',
        },
        calendar: {
          title: 'Arbeitskalender',
          description: 'Arbeitszeiten und Zeitzone.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} Mal',
        integer: '{{value}}',
        days: '{{value}} Tage',
        hours: '{{value}} Stunden',
        workingHours: '{{value}} Arbeitsstunden',
        rank: 'Rang {{value}}',
      },
      unitSuffix: {
        money: 'Yuan',
        count: 'Mal',
        integer: '',
        days: 'Tage',
        hours: 'Stunden',
        workingHours: 'Arbeitsstunden',
        ratio: '%',
        rank: 'Rang',
      },
      keys: {
        itRepair_securityTransfer: {
          label: 'Restricted transfer (0 off, 1 on)',
          description:
            'Enable only after isolation verification; production configuration needs separate authorization.',
        },
        itRepair_acceptanceDays: {
          label: 'Acceptance reminder (working days)',
          description:
            'Frozen on submission; never closes a repair automatically.',
        },
        itRepair_followUpDays: {
          label: 'Follow-up interval (working days)',
          description: 'Frozen interval after a waiting reminder.',
        },
        itRepair_morning: {
          label: 'IT repair morning hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_afternoon: {
          label: 'IT repair afternoon hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_P1_response: {
          label: 'P1 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P1_resolution: {
          label: 'P1 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_response: {
          label: 'P2 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_resolution: {
          label: 'P2 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_response: {
          label: 'P3 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_resolution: {
          label: 'P3 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_response: {
          label: 'P4 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_resolution: {
          label: 'P4 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        leave_annualAccrualEnabled: {
          label: 'Automatische Zuteilung von Jahresurlaub',
          description:
            '0 deaktiviert automatische Gewährungen; 1 aktiviert die tägliche Zuteilung. Tragen Sie vor Aktivierung die Berufseinstiegsdaten der Mitarbeiter ein.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Ablaufmonat für übertragenen Jahresurlaub',
          description:
            'Monat im Folgejahr, in dem ungenutzter Jahresurlaub verfällt (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Ablauftag für übertragenen Jahresurlaub',
          description:
            'Letzter gültiger Tag im Ablaufmonat (1–31); kürzere Monate verwenden ihren letzten Tag.',
        },
        spend_vp: {
          label: 'Schwellenwert der stellvertretenden Geschäftsführung',
          description:
            'Beträge darüber benötigen die zuständige stellvertretende Geschäftsführung.',
        },
        spend_gm: {
          label: 'Schwellenwert der Geschäftsführung',
          description: 'Beträge darüber benötigen die Geschäftsführung.',
        },
        expense_head: {
          label: 'Ausgabenerstattungen ohne Abteilungsleitung',
          description:
            'Erstattungen bis zu diesem Gesamtbetrag werden stattdessen von der direkten Führungskraft genehmigt.',
        },
        loan_head: {
          label: 'Vorschussschwelle der Abteilungsleitung',
          description: 'Vorschüsse darüber benötigen die Abteilungsleitung.',
        },
        loan_personalMax: {
          label: 'Persönliche Vorschussgrenze',
          description:
            'Der höchste Betrag, den eine Person gleichzeitig schulden darf.',
        },
        purchase_quotes: {
          label: 'Drei Angebote erforderlich oberhalb von',
          description:
            'Beschaffungen darüber benötigen drei konkurrierende Angebote.',
        },
        contract_gm: {
          label: 'Vertragsschwelle der Geschäftsführung',
          description: 'Verträge darüber benötigen die Geschäftsführung.',
        },
        asset_scrapGm: {
          label: 'Schwellenwert für Anlagenverschrottung',
          description:
            'Die Verschrottung von Anlagen mit höherem Anschaffungswert benötigt die Geschäftsführung.',
        },
        budget_increaseGm: {
          label: 'Schwellenwert für Budgeterhöhungen',
          description:
            'Budgeterhöhungen darüber benötigen die Geschäftsführung.',
        },
        leave_head: {
          label: 'Urlaub mit Abteilungsleitungsprüfung',
          description:
            'Urlaub ab dieser Tagesanzahl benötigt die Abteilungsleitung.',
        },
        leave_hr: {
          label: 'Urlaub mit Personalprüfung',
          description:
            'Urlaub ab dieser Tagesanzahl benötigt die Personalabteilung.',
        },
        overtime_monthlyHead: {
          label: 'Monatliche Überstunden mit Abteilungsleitungsprüfung',
          description:
            'Überstunden oberhalb dieser monatlichen Stundenzahl benötigen die Abteilungsleitung.',
        },
        attendance_fixPerMonth: {
          label: 'Anwesenheitskorrekturen pro Monat',
          description:
            'Wie viele Korrekturen eine Person pro Monat beantragen darf.',
        },
        grade_managerRank: {
          label: 'Gehaltsgruppenrang für Führungskräfte',
          description:
            'Gehaltsgruppen ab diesem Rang zählen als Führungskräfteebene.',
        },
        grade_directorRank: {
          label: 'Gehaltsgruppenrang für Direktoren',
          description:
            'Gehaltsgruppen ab diesem Rang zählen als Direktorenebene.',
        },
        raise_vp: {
          label:
            'Gehaltserhöhung mit stellvertretender Geschäftsführungsprüfung',
          description:
            'Erhöhungen oberhalb dieses Anteils benötigen die stellvertretende Geschäftsführung.',
        },
        raise_gm: {
          label: 'Gehaltserhöhung mit Geschäftsführungsprüfung',
          description:
            'Erhöhungen oberhalb dieses Anteils benötigen die Geschäftsführung.',
        },
        sla_remindHours: {
          label: 'Erinnerung nach',
          description: 'Genehmiger nach dieser Arbeitszeit erinnern.',
        },
        sla_escalateHours: {
          label: 'Eskalation nach',
          description:
            'Nach dieser Arbeitszeit an die Führungskraft des Genehmigers eskalieren.',
        },
        sla_urgeCooldownHours: {
          label: 'Mindestabstand zwischen Erinnerungen',
          description:
            'Wartezeit des Antragstellers zwischen dringenden Erinnerungen.',
        },
        committee_min: {
          label: 'Zustimmungsstimmen im Ausschuss',
          description:
            'Standardanzahl der erforderlichen Zustimmungsstimmen eines Ausschusses.',
        },
        calendar_workHours: {
          label: 'Arbeitszeiten',
          description: 'Das tägliche Arbeitszeitfenster.',
        },
        calendar_timeZone: {
          label: 'Zeitzone',
          description: 'Die Zeitzone des Kalenders.',
        },
      },
    },
    sequences: {
      title: 'Dokumentnummern',
      description:
        'Die je Dokumentpräfix monatlich vergebenen Nummern. Nummern werden bei der Einreichung vergeben.',
      loadFailedTitle: 'Dokumentnummern konnten nicht geladen werden',
      searchPlaceholder: 'Nach Präfix filtern, etwa LV',
      searchLabel: 'Nach Präfix filtern',
      fields: {
        prefix: 'Präfix',
        period: 'Monat',
        issued: 'Ausgegeben',
        next: 'Nächste Nummer',
      },
      empty: {
        title: 'Noch keine Nummern vergeben',
        description:
          'Nummern erscheinen hier, sobald Anträge eingereicht werden.',
      },
    },
    auditLogs: {
      title: 'Prüfprotokoll',
      description:
        'Ein schreibgeschütztes Protokoll sensibler Änderungen an Organisation, Personal, Regeln und Konfiguration.',
      loadFailedTitle: 'Prüfprotokoll konnte nicht geladen werden',
      system: 'System',
      notFound: 'Dieser Eintrag existiert nicht.',
      detailTitle: 'Prüfprotokolleintrag: {{action}}',
      detailTitleLoading: 'Prüfprotokolleintrag',
      changes: 'Änderungen',
      noChanges: 'Es wurden keine Werte erfasst.',
      changed: 'Geändert',
      wholeValue: 'Wert',
      fields: {
        at: 'Zeit',
        actor: 'Von',
        action: 'Aktion',
        targetType: 'Objekttyp',
        targetId: 'Objekt',
        reason: 'Begründung',
        field: 'Feld',
        before: 'Davor',
        after: 'Danach',
      },
      filters: {
        allTargetTypes: 'Alle Objekttypen',
        allActions: 'Alle Aktionen',
        actor: 'Beliebige Person',
        dateRange: 'Beliebiges Datum',
        presets: 'Schnellauswahl des Zeitraums',
      },
      presets: {
        last7: 'Letzte 7 Tage',
        last30: 'Letzte 30 Tage',
        thisMonth: 'Dieser Monat',
        lastMonth: 'Letzter Monat',
        last90: 'Letzte 90 Tage',
      },
      empty: {
        title: 'Noch keine Prüfprotokolleinträge',
        description:
          'Sensible Änderungen werden hier während ihrer Durchführung erfasst.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
