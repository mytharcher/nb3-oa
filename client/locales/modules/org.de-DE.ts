/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Abteilungen',
      positions: 'Positionen',
      grades: 'Gehaltsgruppen',
      dutyRoles: 'Funktionsrollen',
    },
    authz: {
      section: 'Organisation und Personal',
      departments: 'Abteilungen',
      positions: 'Positionen',
      grades: 'Gehaltsgruppen',
      dutyRoles: 'Funktionsrollen',
      read: 'Anzeigen',
      update: 'Verwalten',
    },
    subjects: {
      departments: 'Abteilungen',
      heads: 'Abteilungsleitungen',
      dutyRoles: 'Funktionsrollen',
      disabled: 'Deaktiviert',
    },
    scopes: {
      mine: 'Meine Abteilungen',
      mineHint:
        'Datensätze von Mitgliedern der Abteilungen, denen ich angehöre oder die ich leite.',
      mineAndBelow: 'Meine Abteilungen und Unterabteilungen',
      mineAndBelowHint:
        'Datensätze von Mitgliedern meiner Abteilungen und aller darunterliegenden Abteilungen.',
      headed: 'Von mir geleitete Abteilungen und Unterabteilungen',
      headedHint:
        'Datensätze von Mitgliedern der von mir geleiteten Abteilungen und aller darunterliegenden Abteilungen.',
    },
    dutyRoleTitles: {
      gm: 'Geschäftsführung',
      cfo: 'Finanzvorstand',
      hr: 'Personalreferent',
      hrbp: 'HR-Business-Partner',
      hrDirector: 'Personalleitung',
      admin: 'Verwaltung',
      sealKeeper: 'Siegelverwalter',
      finance: 'Buchhalter',
      financeManager: 'Finanzleitung',
      cashier: 'Kassenverwalter',
      legal: 'Rechtsabteilung',
      purchasing: 'Einkauf',
      it: 'IT',
      committeeTech: 'Prüfungsausschuss (technischer Sitz)',
    },
    common: {
      active: 'Aktiviert',
      inactive: 'Deaktiviert',
      allStatuses: 'Alle Status',
      noResults: 'Nichts entspricht Ihren Filtern.',
      clearFilters: 'Filter zurücksetzen',
      clearSearch: 'Suche zurücksetzen',
      searchByTitleOrCode: 'Nach Name oder Code suchen',
      askAdministrator: 'Bitten Sie einen Administrator, dies einzurichten.',
      fields: {
        title: 'Name',
        code: 'Code',
        status: 'Status',
        name: 'Name',
        email: 'E-Mail',
        user: 'Person',
      },
      actions: {
        label: 'Aktionen',
        more: 'Aktionen für {{name}}',
        edit: 'Bearbeiten',
        enable: 'Aktivieren',
        disable: 'Deaktivieren',
      },
      form: {
        titleRequired: 'Geben Sie einen Namen ein.',
        titleTooLong: 'Verwenden Sie höchstens {{max}} Zeichen.',
        codeRequired: 'Geben Sie einen Code ein.',
        codeFormat:
          'Verwenden Sie Buchstaben, Ziffern, „.“, „_“ und „-“, beginnend mit einem Buchstaben oder einer Ziffer, mit höchstens 64 Zeichen.',
        codeHint: 'Eine beständige Kennung für Importe und andere Systeme.',
        integer: 'Geben Sie eine ganze Zahl ein.',
        userRequired: 'Wählen Sie eine Person.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Nur Abteilungen der obersten Ebene dürfen eine Bereichsleitung bestimmen; Unterabteilungen erben diese.',
      codeTaken:
        'Dieser Code wird bereits verwendet. Wählen Sie einen anderen.',
      parentCycle:
        'Eine Abteilung kann nicht unter sich selbst oder eine ihrer Unterabteilungen verschoben werden.',
      parentNotFound:
        'Die übergeordnete Abteilung ist nicht mehr vorhanden. Wählen Sie eine andere.',
      userNotFound: 'Diese Person existiert nicht oder ist deaktiviert.',
      notFound: 'Dieser Datensatz existiert nicht oder wurde gelöscht.',
      forbidden: 'Sie sind hierzu nicht berechtigt.',
      requestFailed: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
    },
    departmentPicker: {
      placeholder: 'Abteilungen suchen',
      empty: 'Keine passenden Abteilungen',
      loadFailed: 'Abteilungen konnten nicht geladen werden.',
      inactivePath: '{{path}} (deaktiviert)',
    },
    departments: {
      title: 'Abteilungen',
      description:
        'Pflegen Sie Abteilungsbaum, Leitungen und Mitglieder. Die Deaktivierung einer Abteilung deaktiviert alles darunter.',
      create: 'Neue Abteilung',
      createChild: 'Neue Unterabteilung',
      editTitle: 'Abteilung bearbeiten',
      formDescription:
        'Das Ändern der übergeordneten Abteilung verschiebt die Abteilung samt aller untergeordneten Elemente.',
      created: 'Abteilung „{{name}}“ erstellt',
      saved: 'Abteilung „{{name}}“ gespeichert',
      enabled: 'Abteilung „{{name}}“ aktiviert',
      disabled: 'Abteilung „{{name}}“ deaktiviert',
      disableTitle: 'Abteilung „{{name}}“ deaktivieren?',
      disableDescription:
        'Ihre Unterabteilungen zählen ebenfalls nicht mehr, und Mitglieder erben ihre Berechtigungen nicht mehr. Nichts wird gelöscht; Sie können sie jederzeit wieder aktivieren.',
      loadFailed: 'Abteilungen konnten nicht geladen werden',
      emptyTitle: 'Noch keine Abteilungen',
      emptyDescription:
        'Erstellen Sie die oberste Ebene Ihrer Organisation und fügen Sie darunter Abteilungen hinzu.',
      noResults: 'Keine Abteilungen entsprechen Ihrer Suche.',
      searchPlaceholder: 'Nach Abteilungsname oder Code suchen',
      treeLabel: 'Abteilungsbaum',
      choose: 'Wählen Sie links eine Abteilung aus, um ihre Details zu sehen.',
      notFound: 'Diese Abteilung existiert nicht oder wurde gelöscht.',
      backToTree: 'Zurück zum Baum',
      topLevel: 'Abteilung der obersten Ebene',
      inheritedFrom: '(von „{{name}}“ geerbt)',
      inactiveByAncestor: 'Mit „{{name}}“ deaktiviert',
      fields: {
        parent: 'Übergeordnete Abteilung',
        manager: 'Abteilungsleitung',
        executive: 'Zuständige Bereichsleitung',
        sortOrder: 'Sortierreihenfolge',
      },
      form: {
        codeHint:
          'Optional. Importe aktualisieren Abteilungen anhand des Codes.',
        parentPlaceholder: 'Oberste Ebene (keine übergeordnete Abteilung)',
        parentHint: 'Für eine Abteilung der obersten Ebene leer lassen.',
        managerHint:
          'Genehmigungen gehen an diese Person; sie muss kein Mitglied sein. Leer: Leitung der übergeordneten Abteilung.',
        executiveHint:
          'Nur bei Abteilungen der obersten Ebene festlegen. Die Auswahl einer übergeordneten Abteilung leert dieses Feld; Unterabteilungen erben es.',
        sortOrderHint: 'Kleinere Zahlen stehen unter Geschwistern zuerst.',
      },
      members: {
        title: 'Mitglieder ({{count}})',
        description:
          'Direkte Mitglieder. Jede Person hat eine Hauptabteilung, die für Genehmigungen und Budgets verwendet wird.',
        add: 'Mitglied hinzufügen',
        addTitle: 'Mitglied zu „{{name}}“ hinzufügen',
        added: '„{{name}}“ zu „{{department}}“ hinzugefügt',
        primary: 'Abteilungsart',
        primaryBadge: 'Primär',
        secondaryBadge: 'Sekundär',
        makePrimary: 'Als Hauptabteilung festlegen',
        primarySet: '„{{name}}“ hat nun diese Hauptabteilung',
        makePrimaryField: 'Als Hauptabteilung dieser Person festlegen',
        makePrimaryHint:
          'Ersetzt die aktuelle Hauptabteilung. Ohne Auswahl wird dies nur zur Hauptabteilung, wenn bisher keine vorhanden ist.',
        remove: 'Aus Abteilung entfernen',
        removeTitle: '„{{name}}“ aus „{{department}}“ entfernen?',
        removeDescription:
          'Die Person erbt die Berechtigungen dieser Abteilung nicht mehr. War dies ihre Hauptabteilung, hat sie keine mehr, bis eine andere festgelegt wird.',
        removed: '„{{name}}“ aus „{{department}}“ entfernt',
        loadFailed: 'Mitglieder konnten nicht geladen werden',
        emptyTitle: 'Noch keine Mitglieder',
        emptyDescription:
          'Fügen Sie die Personen hinzu, die in dieser Abteilung arbeiten.',
      },
    },
    positions: {
      title: 'Positionen',
      description:
        'Stellenpositionen, auf die Mitarbeiterakten verweisen. Deaktivieren Sie Positionen, statt sie zu löschen.',
      create: 'Neue Position',
      editTitle: 'Position bearbeiten',
      formDescription: 'Der Code bleibt bei Namensänderungen beständig.',
      created: 'Position „{{name}}“ erstellt',
      saved: 'Position „{{name}}“ gespeichert',
      enabled: 'Position „{{name}}“ aktiviert',
      disabled: 'Position „{{name}}“ deaktiviert',
      disableTitle: 'Position „{{name}}“ deaktivieren?',
      disableDescription:
        'Sie wird für neue Zuordnungen nicht mehr angeboten. Mitarbeiter behalten ihre bestehende Position.',
      loadFailed: 'Positionen konnten nicht geladen werden',
      notFound: 'Diese Position existiert nicht oder wurde gelöscht.',
      emptyTitle: 'Noch keine Positionen',
      emptyDescription:
        'Fügen Sie Positionen hinzu, in die Mitarbeiter eingestellt werden, etwa „Einkäufer“.',
      fields: { number: 'Sortierreihenfolge' },
      form: {
        numberRequired: 'Geben Sie eine Sortierreihenfolge ein.',
        numberHint: 'Optional. Kleinere Zahlen stehen zuerst.',
      },
    },
    grades: {
      title: 'Gehaltsgruppen',
      description:
        'Gehaltsgruppen wie P5 oder M2. Der Rang bestimmt die Seniorität bei Reisestandards und Genehmigungsstufen.',
      create: 'Neue Gehaltsgruppe',
      editTitle: 'Gehaltsgruppe bearbeiten',
      formDescription: 'Der Code bleibt bei Namensänderungen beständig.',
      created: 'Gehaltsgruppe „{{name}}“ erstellt',
      saved: 'Gehaltsgruppe „{{name}}“ gespeichert',
      enabled: 'Gehaltsgruppe „{{name}}“ aktiviert',
      disabled: 'Gehaltsgruppe „{{name}}“ deaktiviert',
      disableTitle: 'Gehaltsgruppe „{{name}}“ deaktivieren?',
      disableDescription:
        'Sie wird für neue Zuordnungen nicht mehr angeboten. Mitarbeiter behalten ihre bestehende Position.',
      loadFailed: 'Gehaltsgruppen konnten nicht geladen werden',
      notFound: 'Diese Gehaltsgruppe existiert nicht oder wurde gelöscht.',
      emptyTitle: 'Noch keine Gehaltsgruppen',
      emptyDescription:
        'Fügen Sie Ihre Gehaltsgruppen mit Rang hinzu; höhere Ränge sind höherrangig.',
      fields: { number: 'Rang' },
      form: {
        numberRequired: 'Geben Sie einen Rang ein.',
        numberHint: 'Eine ganze Zahl; höher bedeutet höherrangig.',
      },
    },
    dutyRoles: {
      title: 'Funktionsrollen',
      description:
        'Genehmigungen und Bearbeitungsschritte finden Personen über diese Rollen. Weisen Sie in den Autorisierungseinstellungen zu, was jede Rolle tun darf.',
      viewMembers: 'Mitglieder anzeigen',
      drawerDescription:
        'Personen mit dieser Funktion. An die Rolle zugewiesene Genehmigungsschritte gehen an sie.',
      enabled: 'Funktionsrolle „{{name}}“ aktiviert',
      disabled: 'Funktionsrolle „{{name}}“ deaktiviert',
      disableTitle: 'Funktionsrolle „{{name}}“ deaktivieren?',
      disableDescription:
        'Ihre Mitglieder üben die Rolle nicht mehr aus: Genehmigungsschritte finden niemanden darin und zugewiesene Berechtigungen gelten nicht mehr. Mitglieder bleiben erhalten.',
      loadFailed: 'Funktionsrollen konnten nicht geladen werden',
      detailFailed: 'Die Funktionsrolle konnte nicht geladen werden',
      notFound:
        'Diese Funktionsrolle existiert nicht. Schließen Sie diesen Bereich, um zur Liste zurückzukehren.',
      emptyTitle: 'Keine Funktionsrollen',
      emptyDescription:
        'Funktionsrollen werden mit der Anwendung installiert. Bitten Sie einen Administrator, die Installation zu prüfen.',
      fields: {
        code: 'Code',
        memberCount: 'Mitglieder',
        description: 'Beschreibung',
      },
      members: {
        title: 'Mitglieder ({{count}})',
        add: 'Mitglied hinzufügen',
        addTitle: 'Mitglied zu „{{role}}“ hinzufügen',
        added: '„{{name}}“ zu „{{role}}“ hinzugefügt',
        remove: 'Entfernen',
        removeTitle: '„{{name}}“ aus „{{role}}“ entfernen?',
        removeDescription:
          'Die Person erhält keine Genehmigungen für diese Rolle und keine ihr zugewiesenen Berechtigungen mehr.',
        removed: '„{{name}}“ aus „{{role}}“ entfernt',
        alreadyRemoved: 'Diese Person wurde bereits entfernt.',
        emptyTitle: 'Noch keine Mitglieder',
        emptyDescription:
          'Fügen Sie die Personen mit dieser Funktion hinzu. Zugehörige Genehmigungsschritte warten, bis jemand hinzugefügt wird.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
