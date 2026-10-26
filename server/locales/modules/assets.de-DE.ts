export default {
  authz: {
    returnHeld:
      'Tatsächliche Rückgabe von zuvor zugewiesenen Anlagen bestätigen',
    resource: 'Anlagenverzeichnis',
    view: 'Anlagenverzeichnis und Anschaffungswert lesen',
    viewHeld: 'Mir zugewiesene Anlagen lesen',
    manage: 'Anlagenbeschreibungen erfassen und korrigieren',
    heldScope: 'Mir zugewiesene Anlagen',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Ein aktiver Anlagenverwalter muss die tatsächliche Rückgabe bestätigen.',
    ASSET_REQUEST_REUSED:
      'Dieser Schlüssel des Rückgabeantrags bezeichnet bereits einen anderen Beleg.',
    ASSET_RETURN_INELIGIBLE:
      'Bestätigen Sie den tatsächlich zugewiesenen Gegenstand, den Mitarbeiter und die Seriennummer.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Bearbeiten Sie diese Anlage über ihren tatsächlichen Antrag, bevor Sie die Rückgabe bestätigen.',

    ASSET_ACCESS_DENIED: 'Sie sind für diesen Anlagenvorgang nicht berechtigt.',
    ASSET_NOT_FOUND: 'Anlage nicht gefunden.',
    ASSET_INVALID_INPUT:
      'Geben Sie einen Anlagencode, einen Namen und einen exakten, nicht negativen Wert in Cent ein.',
    ASSET_CATEGORY_INACTIVE: 'Wählen Sie eine aktive Anlagenkategorie.',
    ASSET_INVALID_COMMAND:
      'Ein Bearbeiter und eine Korrekturbegründung sind erforderlich.',
    ASSET_INVALID_VERSION: 'Geben Sie die aktuelle Anlagenversion ein.',
    ASSET_VERSION_CONFLICT:
      'Diese Anlage wurde geändert. Laden Sie die neueste Version.',
    ASSET_CODE_EXISTS: 'Dieser Anlagencode ist bereits vorhanden.',
    ASSET_INVALID_STORED_AMOUNT:
      'Der gespeicherte Anlagenwert liegt außerhalb des unterstützten exakten Wertebereichs.',
    ASSET_WRITE_UNCONFIRMED:
      'Das Speichern der Anlage konnte nicht bestätigt werden.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Zugewiesene, ausgeliehene oder reservierte Anlagen müssen vor der Austrittsfreigabe zurückgegeben werden.',
  },
};
