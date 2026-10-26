import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/de-DE';
import inboxEnUS from '#extensions/nocobase-inbox/locales/de-DE';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Nachrichten',
  'inbox.loadFailed': 'Nachrichten konnten nicht geladen werden',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Nachrichten',
  'inboxButton.pending': 'Nachrichten, {{count}} ausstehend',
  'inboxButton.unread': 'Nachrichten, {{count}} ungelesen',
  'inboxButton.pendingHint':
    '{{count}} warten auf Sie; die Zahl sinkt, sobald sie bearbeitet werden.',
  'inboxButton.unreadHint': '{{count}} ungelesen; die Zahl sinkt beim Lesen.',
  'auth.welcome': 'Willkommen zurück',
  'auth.loginDescription':
    'Melden Sie sich mit Ihrem Benutzernamen oder Ihrer E-Mail-Adresse und Ihrem Passwort an.',
  'auth.registerTitle': 'Konto erstellen',
  'auth.registerDescription': 'Erstellen Sie ein Konto, um zu beginnen.',
  'auth.forgotTitle': 'Passwort vergessen',
  'auth.forgotDescription':
    'Geben Sie Ihre E-Mail-Adresse ein. Falls das Konto existiert, senden wir einen Link zum Zurücksetzen.',
  'auth.resetDescription': 'Wählen Sie ein neues Passwort für Ihr Konto.',
  'auth.resetTitle': 'Passwort zurücksetzen',
  'auth.identifier': 'Benutzername oder E-Mail',
  'auth.password': 'Passwort',
  'auth.signIn': 'Anmelden',
  'auth.signingIn': 'Anmeldung läuft…',
  'auth.hidePassword': 'Passwort verbergen',
  'auth.showPassword': 'Passwort anzeigen',
  'auth.forgotLink': 'Passwort vergessen?',
  'auth.noAccount': 'Sie haben noch kein Konto?',
  'auth.signUp': 'Registrieren',
  'auth.createAccount': 'Konto erstellen',
  'auth.creatingAccount': 'Konto wird erstellt…',
  'auth.name': 'Name',
  'auth.username': 'Benutzername',
  'auth.email': 'E-Mail',
  'auth.confirmPassword': 'Passwort bestätigen',
  'auth.existingAccount': 'Sie haben bereits ein Konto?',
  'auth.passwordMismatch': 'Die Passwörter stimmen nicht überein.',
  'auth.resetting': 'Wird zurückgesetzt…',
  'auth.newPassword': 'Neues Passwort',
  'auth.confirmNewPassword': 'Neues Passwort bestätigen',
  'auth.invalidResetLink':
    'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.',
  'auth.backToSignIn': 'Zurück zur Anmeldung',
  'auth.sendResetLink': 'Link zum Zurücksetzen senden',
  'auth.sending': 'Wird gesendet…',
  'auth.resetSent':
    'Falls das Konto existiert, wurde ein Link zum Zurücksetzen gesendet.',
  'auth.rememberPassword': 'Sie erinnern sich an Ihr Passwort?',
  'auth.methods': 'Anmeldemethoden',
  'auth.or': 'Oder fortfahren mit',
  'auth.continueWith': 'Mit {provider} fortfahren',
  'auth.about': 'Über diese Anwendung',
  'auth.platform': 'KI-native Anwendungsplattform',
  'auth.marketingTitleFirst': 'Lassen Sie KI frei entwickeln.',
  'auth.marketingTitleSecond': 'NocoBase sorgt für',
  'auth.marketingTitleThird': 'Zuverlässigkeit.',
  'auth.marketingDescription':
    'Geben Sie KI ein flexibles Frontend-Framework zur Gestaltung jedes Erlebnisses, während NocoBase Daten, Berechtigungen und Governance darunter absichert.',
  'auth.frontend': 'KI-natives Frontend',
  'auth.frontendDescription':
    'Oberflächen frei auf einem flexiblen Framework gestalten.',
  'auth.foundation': 'NocoBase-Grundlage',
  'auth.foundationDescription':
    'Zuverlässige Daten, Zugriffskontrolle und Governance.',
  'auth.marketingFooter': 'Oben Freiheit. Darunter Sicherheit.',
  'status.loading': 'Wird geladen',
  'status.loadingPage': 'Seite wird geladen',
  'status.denied': 'Zugriff verweigert',
  'status.pageFailed': 'Seite konnte nicht geladen werden',
  'status.retry': 'Erneut versuchen',
  'navigation.brandHome': 'NocoBase-Startseite',
  'navigation.brandApps': 'NocoBase-Anwendungen',
  'routeOverlay.close': 'Schließen',
  'status.backHome': 'Zurück zum Arbeitsplatz',
  'status.deniedDescription':
    'Sie sind nicht berechtigt, auf diese Seite zuzugreifen.',
  'status.routeFailedDescription':
    'Diese Seite konnte nicht geladen werden. Versuchen Sie es erneut.',
  shell: {
    buildFreely: 'KI entwickelt frei.',
    reliability: '<brand>NocoBase</brand> sorgt für Zuverlässigkeit.',
  },
  home: {
    platform: 'NocoBase · KI-native Anwendungsplattform',
    title: 'Beschreiben Sie es, und Ihr Agent setzt es um',
    description:
      'Diese Anwendung wird im Gespräch mit Ihrem Coding-Agenten entwickelt. Beschreiben Sie in einfachen Worten, was das Unternehmen benötigt, und er erstellt die Seiten, Datenmodelle, APIs und Geschäftsprozesse in diesem Projekt.',
    steps: {
      describe: {
        title: 'Bedarf beschreiben',
        description:
          'Erklären Sie, wer die Anwendung nutzt, welche Daten sie speichert und was geschehen soll.',
      },
      build: {
        title: 'Agenten entwickeln lassen',
        description:
          'Er liest dieses Projekt und seine integrierten Funktionen und schreibt dann den Code.',
      },
      review: {
        title: 'Prüfen und verfeinern',
        description:
          'Aktualisieren Sie die Seite zum Ausprobieren und bitten Sie anschließend auf dieselbe Weise um Änderungen.',
      },
    },
    example: {
      title: 'Versuchen Sie eine Anfrage wie diese',
      text: 'Erstelle eine Anwendung für Bestellungen.\n\nEine Bestellung hat eine Nummer, einen Artikel, einen Antragsteller, einen Betrag und einen Genehmigungsstatus. Antragsteller erstellen Bestellungen und sehen nur ihre eigenen; Prüfer sehen alle ausstehenden Bestellungen und genehmigen oder verwerfen sie.\nBenachrichtige den Antragsteller nach einer Entscheidung im Posteingang mit einem Link zur Bestellung.',
      hint: 'Fügen Sie dies in Claude Code, Codex, Cursor oder einen anderen in diesem Projekt geöffneten Coding-Agenten ein.',
    },
    capabilitiesTitle: 'Integrierte Funktionen',
    capabilitiesDescription:
      'Ihr Agent nutzt diese direkt. Öffnen Sie eine Funktion, um eine bearbeitbare und kopierbare Anweisung zu erhalten.',
    viewPrompts: 'Anweisungen anzeigen ({{count}})',
    prompt: {
      label: 'Anweisung',
      hint: 'Passen Sie die Anweisung vor dem Kopieren an Ihr Unternehmen an. Änderungen werden nach dem Schließen des Dialogs nicht gespeichert.',
      copy: 'Kopieren',
      copiedShort: 'Kopiert',
      copied: 'Anweisung kopiert',
      copyFailed:
        'Kopieren nicht möglich. Markieren Sie den Text und kopieren Sie ihn manuell.',
      reset: 'Standard wiederherstellen',
    },
    capabilities: {
      auth: {
        title: 'Authentifizierung',
        description:
          'Anmeldung, Registrierung, Passwortzurücksetzung und unternehmensweite Einmalanmeldung.',
        prompts: {
          disableSignUp: {
            label: 'Registrierung schließen',
            text: 'Diese Anwendung ist nur für Unternehmensmitarbeiter bestimmt. Administratoren erstellen alle Konten.\nDeaktiviere die Selbstregistrierung und entferne den Registrierungslink von der Anmeldeseite.\nBestehende Mitarbeiter müssen sich weiterhin mit ihren Konten und Passwörtern anmelden können.\nBehalte den Link für vergessene Passwörter bei.',
          },
          passwordRules: {
            label: 'Passwortregeln',
            text: 'Verlange bei der Registrierung oder Passwortzurücksetzung mindestens 12 Zeichen.\nZeige diese Anforderung in beiden Formularen und verwende einheitliche Validierungsmeldungen.\nBestehende Konten müssen sich weiterhin anmelden können, ohne ihr Passwort sofort ändern zu müssen.',
          },
          companySso: {
            label: 'Unternehmens-SSO',
            text: 'Ermögliche Mitarbeitern die Anmeldung über unsere Unternehmensidentitätsplattform mit OIDC.\n\nBehalte die Anmeldung mit Konto und Passwort bei und füge eine Schaltfläche „Unternehmenskonto“ hinzu.\nDie Schaltfläche öffnet die Unternehmensidentitätsplattform. Kehre nach erfolgreicher Anmeldung zur Startseite der Anwendung zurück.\n\nErlaube bei der ersten Anmeldung die Erstellung eines Anwendungskontos, identifiziert durch die beständige Benutzerkennung der Plattform.\nVerknüpfe Konten nicht automatisch anhand übereinstimmender Namen oder E-Mail-Adressen. Neue Konten verwenden die Standardberechtigungen der Anwendung.\n\nListe die erforderlichen Angaben des Administrators der Identitätsplattform und die zu registrierende Rückruf-URL auf.',
          },
        },
      },
      authorization: {
        title: 'Berechtigungen',
        description:
          'Steuern Sie, wer welche Seiten öffnen, welche Aktionen ausführen und welche Datensätze sehen darf.',
        prompts: {
          jobs: {
            label: 'Aufgabenrollen',
            text: 'Erstelle die Aufgabenrollen „Bestellanforderer“ und „Bestellprüfer“ für die Anwendung.\nBestellanforderer können die Bestellseite öffnen und ihre selbst angeforderten Bestellungen anzeigen.\nBestellprüfer können die Bestellseite öffnen, Bestellungen anzeigen und ausstehende Bestellungen genehmigen oder ablehnen.\nNur Anwendungsadministratoren dürfen Berechtigungen und Zuweisungen ändern.\nVerwende die vorhandene Autorisierungsfunktion der Anwendung, damit Administratoren Berechtigungen später anpassen und Personen zuweisen können.',
          },
          dataScopes: {
            label: 'Datenbereiche',
            text: 'Lasse Bestellanforderer nur ihre eigenen Bestellungen anzeigen; verwende das Anfordererfeld der Bestellung zur Bestimmung der Zugehörigkeit.\nBestellprüfer können alle Bestellungen anzeigen und ausstehende Genehmigungen bearbeiten.\nAdministratoren können den Anzeigebereich jeder Aufgabenrolle in ihrem Berechtigungssatz anpassen.',
          },
          sharing: {
            label: 'Freigabe',
            text: 'Gib Bobs Bestellung PO-2026-004 für Alice frei, damit sie diese prüfen kann.\nAlice hat bereits die Berechtigung, Bestellungen anzuzeigen; ergänze den Anzeigezugriff auf diese Bestellung.\nBehalte ihre bisherigen Zuständigkeiten bei. Bestellprüfer bearbeiten weiterhin die Genehmigungen.\nErmögliche Administratoren die Verwaltung dieser Freigaberegel.',
          },
        },
      },
      scheduler: {
        title: 'Geplante Aufgaben',
        description:
          'Geschäftsaufgaben zu festgelegten Zeiten ausführen und die nächste Ausführung sowie ihre Ergebnisse sehen.',
        prompts: {
          reminder: {
            label: 'Tägliche Erinnerung',
            text: 'Füge der vorhandenen Bestellanwendung eine Erinnerung an ausstehende Bestellungen hinzu.\n\nErmittle an jedem Werktag um 09:00 Uhr Pekinger Zeit die auf Genehmigung wartenden Bestellungen, gruppiere sie nach Prüfer und sende jedem Prüfer eine In-App-Benachrichtigung.\nFüge die Anzahl ausstehender Bestellungen und einen Link zur Liste hinzu. Sende nichts, wenn keine Bestellungen ausstehen.\nAdministratoren können Zeitplan und Ausführungsnachweise anzeigen sowie Erinnerungen pausieren oder fortsetzen.',
          },
          weeklyReport: {
            label: 'Wochenbericht',
            text: 'Erstelle jeden Montag um 08:00 Uhr Pekinger Zeit die Verkaufsübersicht der vergangenen Woche und benachrichtige die Vertriebsleitung.\nFüge Umsatzerlöse, Bestellanzahl und regionale Summen hinzu. Administratoren können die Aufgabe und Ausführungsnachweise anzeigen.',
          },
        },
      },
      notification: {
        title: 'Benachrichtigungen',
        description:
          'In-App-Nachrichten, E-Mails oder Gruppenbot-Nachrichten bei Ereignissen senden.',
        prompts: {
          inApp: {
            label: 'In-App-Nachricht',
            text: 'Füge der aktuellen Anwendung eine Bestellgenehmigung hinzu und benachrichtige Antragsteller über In-App-Nachrichten über die Ergebnisse.\n\nBestellungen enthalten Nummer, Name, Antragsteller, Betrag und Genehmigungsstatus.\nAntragsteller können ihre eigenen Bestellungen anzeigen. Prüfer können ausstehende Bestellungen anzeigen und genehmigen oder ablehnen. Verwende vorhandene Bestell- und Genehmigungsfunktionen erneut, falls verfügbar.\n\nSende nach Genehmigung oder Ablehnung eine In-App-Nachricht nur an den Antragsteller der Bestellung.\nDer Titel zeigt an, ob die Bestellung genehmigt oder abgelehnt wurde. Der Inhalt enthält Bestellnummer, Name und Genehmigungsergebnis.\nEin Klick öffnet die zugehörigen Bestelldetails.\nSende nichts bei ausstehender Genehmigung. Benachrichtige für dasselbe Ergebnis nur einmal.\nEin Benachrichtigungsfehler beeinflusst das gespeicherte Genehmigungsergebnis nicht.',
          },
          email: {
            label: 'E-Mail',
            text: 'Ergänze die vorhandenen Bestellgenehmigungsbenachrichtigungen um E-Mails über den konfigurierten E-Mail-Kanal der Anwendung.\n\nSende nach Genehmigung oder Ablehnung das Ergebnis an die Konto-E-Mail-Adresse des Antragstellers.\nFüge die Bestellnummer im Betreff sowie Bestellname und Ergebnis im Inhalt hinzu.\nBehalte bestehende In-App-Nachrichten bei. Falls der Antragsteller keine E-Mail-Adresse hat, sende nur die In-App-Nachricht.\nEin E-Mail-Fehler darf weder das Genehmigungsergebnis noch die In-App-Nachricht beeinflussen.',
          },
        },
      },
      mail: {
        title: 'E-Mail',
        description:
          'Persönliche Postfächer verbinden und anschließend geschäftliche E-Mails lesen, beantworten und senden.',
        prompts: {
          mailCenter: {
            label: 'E-Mail-Zentrale',
            text: 'Füge der Anwendung eine E-Mail-Zentrale und einen Eintrag zur Postfachkontoverwaltung hinzu. Benutzer können eigene Postfächer verbinden, ein Postfach auswählen, eingehende Nachrichten synchronisieren, Nachrichten und Anhänge lesen und antworten.\n\nWenn ein Vertriebsmitarbeiter eine Angebotsanfrage erhält, kann er aus der E-Mail-Zentrale antworten. Behalte den ursprünglichen Betreff und Gesprächskontext bei und adressiere die Antwort an den ursprünglichen Absender. Jeder Benutzer arbeitet mit seinen eigenen verbundenen Postfächern.',
          },
          correspondence: {
            label: 'Kunden-E-Mails',
            text: 'Füge den Kundendetails einen Korrespondenzbereich hinzu. Zeige Nachrichten, deren Absender oder Empfänger den Kontakt-E-Mail-Adressen des aktuellen Kunden entspricht. Vertriebsmitarbeiter können Nachrichten lesen, Anhänge anzeigen und über ihre eigenen verbundenen Postfächer antworten.',
          },
        },
      },
      file: {
        title: 'Dateien',
        description:
          'Dateien hochladen, an Datensätze anhängen und in der Vorschau anzeigen oder herunterladen.',
        prompts: {
          attachments: {
            label: 'Anhänge',
            text: 'Füge meiner vorhandenen Bestellverwaltungsanwendung Bestellanhänge hinzu.\n\nErgänze die Bestelldetails um einen Anhangsbereich. Jede Bestellung kann mehrere Dateien enthalten, einschließlich PDF, Bildern und DOCX.\nZeige Dateinamen und Größen sowie Aktionen für Vorschau, Download und Entfernen von Anhängen.\nErmögliche Benutzern nach dem Hochladen das Speichern der Anhänge an der aktuellen Bestellung. Halte sie beim erneuten Öffnen der Bestellung verfügbar.\nJeder mit Zugriff auf eine Bestellung kann ihre Anhänge anzeigen und herunterladen. Antragsteller und Prüfer können Anhänge hinzufügen oder entfernen.\nDas Entfernen eines Anhangs löst nur die Verknüpfung zur aktuellen Bestellung; die Datei bleibt erhalten.',
          },
          avatar: {
            label: 'Profilbild',
            text: 'Füge jedem Mitarbeiter ein Profilbild hinzu, mit einem Bild pro Mitarbeiter.\nUnterstütze das Hochladen und Ersetzen des Profilbilds und zeige es in Mitarbeiterlisten und -details.\nVerwende nach dem Ersetzen das neue Profilbild und halte es nach der Seitenaktualisierung sichtbar.',
          },
        },
      },
      templatePrint: {
        title: 'Vorlagendruck',
        description:
          'Geschäftsdaten in Word- oder Excel-Vorlagen einfügen und Dateien erzeugen.',
        prompts: {
          approvalForm: {
            label: 'Genehmigungsformular',
            text: 'Füge den Bestelldetails die Aktion „Genehmigungsformular erzeugen“ hinzu.\n\nFülle anhand der bereitgestellten Word-Vorlage Nummer, Bestellanforderung, Antragsteller, Betrag, Genehmigungsergebnis und Bearbeitungszeit der aktuellen Bestellung aus.\nBehalte Überschrift, Tabellenlayout und Unterschriftenbereich der Vorlage bei. Benenne die Ausgabe „Bestellgenehmigung-Bestellnummer“ und biete einen Word-Download an.\nJeder mit Zugriff auf die Bestellung kann ihr Genehmigungsformular erzeugen. Verwende bei der Erzeugung die aktuellen Bestelldaten.',
          },
          pdf: {
            label: 'PDF-Ausgabe',
            text: 'Füge einen PDF-Download für das Bestellgenehmigungsformular hinzu und erhalte Schriftarten, Tabellen und Unterschriftenbereich der Word-Vorlage.',
          },
        },
      },
      i18n: {
        title: 'Sprachen',
        description:
          'Oberflächensprache wechseln, Sprachen hinzufügen und die Standardsprache festlegen.',
        prompts: {
          addLanguage: {
            label: 'Sprache hinzufügen',
            text: 'Füge meiner Anwendung Spanisch hinzu. Übersetze Oberfläche und Servermeldungen und ergänze Spanisch im Sprachmenü.',
          },
          defaultLanguage: {
            label: 'Standardsprache',
            text: 'Verwende vereinfachtes Chinesisch als Standardsprache der Anwendung für Personen ohne eigene Sprachwahl. Halte Englisch im Sprachmenü verfügbar.',
          },
        },
      },
      theme: {
        title: 'Designs',
        description:
          'Farben, Schriftarten und Dichte anpassen sowie zwischen Hell und Dunkel wechseln.',
        prompts: {
          changeTheme: {
            label: 'Design ändern',
            text: 'Aktualisiere das Design „Kompakt“: Verwende Blau als Primärfarbe und vergrößere den Eckenradius leicht. Behalte die aktuellen Schriftarten, Textgrößen und kompakten Abstände bei.',
          },
          newTheme: {
            label: 'Neues Design',
            text: 'Erstelle ein Design „Wald“ mit Grün als Primärfarbe, weichen Hintergründen, mäßig abgerundeten Ecken und dezenten Schatten.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Darstellung',
    mode: 'Farbmodus',
    preset: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    themes: { default: 'Großzügig', compact: 'Kompakt' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    language: 'Sprache',
  },
  notices: {
    serverLocaleFallback:
      'Der Server unterstützt diese Sprache nicht; Servermeldungen werden daher auf Englisch angezeigt.',
    languageChangeFailed:
      'Die Sprachänderung konnte nicht abgeschlossen werden. Versuchen Sie es erneut.',
  },
  account: {
    signOutFailed: 'Abmeldung nicht möglich. Versuchen Sie es erneut.',
    openMenu: 'Kontomenü öffnen',
    fallback: 'Konto',
    signOut: 'Abmelden',
    signingOut: 'Abmeldung läuft…',
  },
  navigation: {
    home: 'Startseite',
    open: 'Navigation öffnen',
    close: 'Navigation schließen',
    expand: 'Navigation aufklappen',
    collapse: 'Navigation zuklappen',
    toggle: 'Navigation auf- oder zuklappen',
    label: 'Anwendungsnavigation',
    description: 'Zu einer Seite dieser Anwendung wechseln.',
    breadcrumb: 'Navigationspfad',
    breadcrumbMore: 'Zwischenebenen anzeigen',
    back: 'Zurück',
  },
  dataTable: {
    emptyDescription:
      'Im aktuellen Bereich sind keine Datensätze verfügbar. Versuchen Sie einen anderen Bereich oder prüfen Sie später erneut.',
    noResults: 'Keine Ergebnisse.',
    sortAscending: 'Aufsteigend',
    sortDescending: 'Absteigend',
    hideColumn: 'Ausblenden',
    view: 'Anzeigen',
    toggleColumns: 'Spalten ein-/ausblenden',
    selectedCount: '{{selected}} von {{total}} Zeile(n) ausgewählt.',
    rowsPerPage: 'Zeilen pro Seite',
    pageOf: 'Seite {{page}} von {{pageCount}}',
    firstPage: 'Zur ersten Seite',
    previousPage: 'Zur vorherigen Seite',
    nextPage: 'Zur nächsten Seite',
    lastPage: 'Zur letzten Seite',
  },
  datePicker: {
    placeholder: 'Datum auswählen',
    rangePlaceholder: 'Zeitraum auswählen',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
