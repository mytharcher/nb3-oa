export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Ein tatsächlicher Nachweis über die abgeschlossene Siegelung ist erforderlich.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Dieser Siegelnachweis gehört zu anderen Vertragsdaten.',
      CONTRACT_ACCESS_DENIED:
        'Dieser Vertrag liegt außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Diese Aktion ist für den Vertrag nicht verfügbar.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Der Vertragsbetrag darf nicht niedriger als die Summe aus bezahlten und reservierten Zahlungen sein.',
      CONTRACT_ATTACHMENT_DENIED:
        'Das Vertragsanhangsfeld oder der Datensatz liegt außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_ATTACHMENT_INVALID:
        'Wählen Sie gültige Anhänge, die zu diesem Vertragsantrag gehören.',
      CONTRACT_CANDIDATE_REMOVED:
        'Dieser unveröffentlichte Vertragsentwurf wurde entfernt. Erstellen Sie einen neuen Antrag.',
      CONTRACT_CATEGORY_INACTIVE: 'Wählen Sie eine aktive Vertragsart.',
      CONTRACT_CORRUPT_BALANCE:
        'Die Zahlungssummen des Vertrags sind inkonsistent. Wenden Sie sich an einen Administrator.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Ein aktiver Mitarbeiter mit einer Hauptabteilung ist erforderlich.',
      CONTRACT_FIELDS_RESTRICTED:
        'Die erforderlichen Vertragsfelder liegen außerhalb Ihrer Zugriffsberechtigung.',
      CONTRACT_FILE_SIZE:
        'Wählen Sie eine nicht leere Vertragsdatei mit höchstens 5 MiB.',
      CONTRACT_FILE_TYPE:
        'Der Vertragstext muss eine PDF sein; Nachweise können PDF, JPEG, PNG oder WebP mit passendem Dateiinhalt sein.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Dieser Anfrageschlüssel wurde bereits mit anderen Details verwendet. Aktualisieren Sie die Ansicht vor einer erneuten Einreichung.',
      CONTRACT_INACTIVE_SOURCE:
        'Wählen Sie eine wirksame genehmigte Vertragsquelle.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Vervollständigen Sie die Vertragsbegründung, die Zahlungsbedingungen und die unveränderliche Textversion.',
      CONTRACT_INPUT_INVALID:
        'Prüfen Sie die deklarierten Vertragseingabefelder.',
      CONTRACT_INVALID_AMOUNT:
        'Geben Sie einen nicht negativen Betrag in exakten ganzzahligen Cent innerhalb des unterstützten Bereichs ein.',
      CONTRACT_INVALID_ID:
        'Eine gültige Identität innerhalb der zulässigen Grenzen ist erforderlich.',
      CONTRACT_INVALID_TIME: 'Der Vertragszeitstempel ist ungültig.',
      CONTRACT_LIMIT_EXCEEDED:
        'Die ausstehenden und bezahlten Beträge überschreiten die Vertragsgrenze.',
      CONTRACT_NOT_CANDIDATE:
        'Nur der unveröffentlichte Vertragsentwurf dieses Antrags darf entfernt werden.',
      CONTRACT_NOT_FOUND: 'Die Vertragsquelle wurde nicht gefunden.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Geben Sie ausstehende Zahlungen frei, bevor Sie den Vertrag beenden.',
      CONTRACT_REASON_REQUIRED:
        'Geben Sie eine Begründung innerhalb der unterstützten Länge ein.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Nur der Antragsteller darf die Basisversion einer zurückgegebenen Änderung ausdrücklich aktualisieren.',
      CONTRACT_REQUEST_KEY_REQUIRED:
        'Ein beständiger Anfrageschlüssel ist erforderlich.',
      CONTRACT_RESERVATION_CLOSED:
        'Die Zahlungsreservierung wurde bereits geschlossen.',
      CONTRACT_RULE_INVALID:
        'Die Vertragsgenehmigungsrichtlinie fehlt oder ist ungültig. Wenden Sie sich an einen Administrator.',
      CONTRACT_SLA_UNSUPPORTED:
        'Der installierte Genehmigungsadapter unterstützt nur die konfigurierte Frist von 24/48 Stunden.',
      CONTRACT_SOURCE_CONFLICT:
        'Diese Referenz gehört zu einer anderen Vertragsquelle.',
      CONTRACT_STORED_ID_INVALID:
        'Eine gespeicherte Vertragsidentität ist ungültig. Wenden Sie sich an einen Administrator.',
      CONTRACT_SUPPLIER_INVALID:
        'Der Lieferant muss aktiv sein und eine genehmigte Qualifizierung haben. Aktualisieren Sie seine Qualifizierung vor der Genehmigung.',
      CONTRACT_TARGET_MISMATCH:
        'Das Genehmigungsziel gehört zu einem anderen Vertragsantrag.',
      CONTRACT_TEXT_INVALID:
        'Wählen Sie eine unveränderliche PDF-Textversion, die zu diesem Antrag gehört.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Vertragstextversionen dürfen nur an eigene Entwürfe oder zurückgegebene Revisionen angehängt werden.',
      CONTRACT_TEXT_REQUIRED:
        'Wählen Sie eine gültige unveränderliche Vertragstextversion.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Verwenden Sie den vorgesehenen geschützten Vertragsvorgang.',
      CONTRACT_VERSION_CONFLICT:
        'Der genehmigte Vertrag wurde geändert. Geben Sie den Antrag zurück, aktualisieren Sie seine Basisversion ausdrücklich und reichen Sie ihn erneut zur Prüfung ein.',
    },
    authz: {
      resource: 'Verträge und Änderungen',
      view: 'Vertragsanträge anzeigen',
      submit: 'Eigene Vertragsanträge erstellen und bearbeiten',
      ledger:
        'Genehmigtes Vertragsverzeichnis und unveränderliche Versionen lesen',
      historicalEntry:
        'Historischen Vertrag mit geprüftem Rechtsnachweis erfassen',
    },
  },
};
