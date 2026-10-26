export default {
  authz: {
    ownedScope: 'Eigene Anlagenanträge',
    resource: 'Anlagenanträge',
    view: 'Anlagenanträge lesen',
    viewValue: 'Anschaffungswerte von Anlagen lesen',
    create: 'Eigene Anlagenanträge erstellen',
    edit: 'Eigene Anlagenanträge bearbeiten',
    operate:
      'Autorisierte Genehmigungs- und Bearbeitungsaktionen für Anlagen ausführen',
    returnIssued:
      'Tatsächliche Rückgabe ausgegebener Nutzungsanlagen bestätigen',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED:
      'Geben Sie die Begründung für den tatsächlichen Empfang ein.',
    ASSET_ACCESS_DENIED: 'Sie können auf diesen Anlagenantrag nicht zugreifen.',
    ASSET_ACTION_INVALID: 'Diese Aktion ist für den Antrag nicht verfügbar.',
    ASSET_REQUEST_NOT_FOUND: 'Anlagenantrag nicht gefunden.',
    ASSET_INVALID_COMMAND:
      'Geben Sie eine beständige Anfragekennung und die erforderliche Begründung ein.',
    ASSET_REQUEST_REUSED:
      'Diese Anfragekennung ist mit einem anderen Vorgang verknüpft.',
    ASSET_REQUIRED_FIELDS:
      'Vervollständigen Sie den Zweck, die Menge und die Anlagenauswahl.',
    ASSET_CATEGORY_INACTIVE: 'Wählen Sie eine aktive Anlagenkategorie.',
    ASSET_EMPLOYEE_INACTIVE:
      'Der Antragsteller muss einen aktiven Mitarbeiterdatensatz haben.',
    ASSET_DEPARTMENT_MISSING:
      'Der Antragsteller benötigt eine aktive Hauptabteilung.',
    ASSET_HEAD_MISSING:
      'Die Abteilung benötigt eine aktive Abteilungsleitung als Genehmiger.',
    ASSET_BORROW_DATE_INVALID:
      'Wählen Sie ein gültiges zukünftiges Rückgabedatum in der Unternehmenszeitzone.',
    ASSET_SCRAP_REQUIRED:
      'Wählen Sie eine Anlage, geben Sie den Verschrottungsgrund ein und fügen Sie ein Foto hinzu.',
    ASSET_SCRAP_INELIGIBLE:
      'Nur eine geeignete zugewiesene Anlage oder ein vom Administrator verwalteter Lagerartikel kann verschrottet werden.',
    ASSET_PHOTO_DENIED: 'Der Antrag oder sein Fotofeld ist nicht zugänglich.',
    ASSET_PHOTO_INVALID:
      'Wählen Sie höchstens zehn gültige Fotos, die mit diesem Antrag verknüpft sind.',
    ASSET_PHOTO_SIZE: 'Jedes Foto darf höchstens 5 MiB groß sein.',
    ASSET_PHOTO_TYPE: 'Laden Sie ein gültiges JPEG-, PNG- oder WebP-Bild hoch.',
    ASSET_STOCK_SHORTAGE:
      'Für diesen vollständigen Antrag sind nicht genügend Einheiten verfügbar.',
    ASSET_INVALID_QUANTITY:
      'Bestätigen Sie eine ganzzahlige Menge zwischen 1 und 100.',
    ASSET_INVALID_AMOUNT:
      'Der gespeicherte Anlagenwert liegt außerhalb des unterstützten exakten Wertebereichs.',
    ASSET_NOT_FOUND: 'Eine Anlage in diesem Antrag wurde nicht gefunden.',
    ASSET_INVALID_VERSION: 'Laden Sie die aktuelle Anlagenversion.',
    ASSET_VERSION_CONFLICT:
      'Die Anlage wurde geändert. Laden Sie sie vor der Bestätigung neu.',
    ASSET_ALREADY_RESERVED:
      'Eine Anlage ist durch einen anderen Antrag reserviert.',
    ASSET_EXISTING_HOLD:
      'Klären Sie die bestehende Reservierung, bevor Sie den Bestand ändern.',
    ASSET_HOLD_MISMATCH:
      'Die tatsächliche Reservierung stimmt nicht mit diesem Antrag überein.',
    ASSET_BASELINE_CONFLICT:
      'Die Anlagendaten wurden nach der Genehmigung geändert. Geben Sie den Antrag vor der Ausführung zur Prüfung zurück.',
    ASSET_UNITS_INCOMPLETE:
      'Bestätigen Sie jede zugeteilte Einheit und ihre tatsächliche Seriennummer.',
    ASSET_SERIAL_MISMATCH:
      'Die Seriennummer weicht von der tatsächlichen Anlage ab.',
    ASSET_RETURN_MISMATCH:
      'Die zurückgegebenen Gegenstände stimmen nicht mit der tatsächlich ausgegebenen Zuordnung überein.',
    ASSET_ALREADY_RETURNED: 'Diese Anlage wurde bereits zurückgegeben.',
    ASSET_RETURN_FORBIDDEN:
      'Ein aktiver Anlagenverwalter muss die tatsächliche Rückgabe bestätigen.',
    ASSET_RETURN_INELIGIBLE:
      'Dieser Antrag ist kein geeigneter ausgeführter Nutzungsantrag.',
    ASSET_ALLOCATION_MISSING: 'Die vollständige tatsächliche Zuteilung fehlt.',
    ASSET_SOURCE_UNAVAILABLE:
      'Die Quelle des Anlagenantrags ist nicht verfügbar.',
    ASSET_SOURCE_MISSING:
      'Der zugehörige Anlagenantrag ist nicht mehr vorhanden.',
    ASSET_SOURCE_FORBIDDEN:
      'Die Quelle hat diesen Bestandsvorgang nicht autorisiert.',
    ASSET_SOURCE_MISMATCH:
      'Die Bestandsquelle stimmt nicht mit dem tatsächlichen Antrag überein.',
    ASSET_TARGET_MISMATCH:
      'Das Genehmigungsziel gehört zu einem anderen Antrag.',
    ASSET_DIRECTORY_UNAVAILABLE:
      'Ein aktuelles Genehmigungsverzeichnis ist erforderlich.',
    ASSET_SLA_UNSUPPORTED:
      'Diese Version unterstützt nur die standardmäßigen Genehmigungsfristen von 24/48 Arbeitsstunden.',
  },
  schedule: {
    title: 'Erinnerungen an die Rückgabe ausgeliehener Anlagen',
    description:
      'Tägliche Fälligkeitserinnerungen in der Unternehmenszeitzone und wöchentliche Erinnerungen bei Überfälligkeit. Eine ausstehende Zustellung wird als fehlgeschlagene Ausführung gemeldet.',
  },
  reminders: {
    before:
      'Anlagenantrag {{number}}: {{quantity}} ausgeliehene Gegenstände sind am {{date}} zurückzugeben. Veranlassen Sie bitte die tatsächliche Rückgabe.',
    overdue:
      'Anlagenantrag {{number}}: {{quantity}} ausgeliehene Gegenstände waren am {{date}} fällig und wurden noch nicht zurückgegeben.',
  },
};
