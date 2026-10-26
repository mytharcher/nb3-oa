export default {
  electronicSignatures: {
    archivedHint:
      'Der Signaturdienst hat den Abschluss bestätigt. Die geprüfte signierte PDF wurde mit diesem Antrag archiviert.',
    reference: 'Signaturreferenz: {{value}}',
    completedAction: 'Elektronische Signatur archiviert',
    title: 'Elektronische Unterzeichnung',
    readPermission: 'Signierte Dokumente anzeigen',
    sendPermission: 'Unterzeichnung senden und wiederherstellen',
    channel: 'Ausführungskanal',
    physical: 'Physisches Siegel',
    electronic: 'Elektronische Signatur',
    channelHint:
      'Wählen Sie den Kanal vor der Genehmigung. Die elektronische Unterzeichnung erfordert genau eine genehmigte PDF; eine Anzahl von Papierexemplaren entfällt.',
    hint: 'Die genehmigte PDF wird an den eingerichteten Signaturdienst gesendet. Der Abschluss wird erst bestätigt, wenn das signierte Dokument geprüft und archiviert ist.',
    notConfigured:
      'Die elektronische Unterzeichnung ist nicht angebunden. Wenden Sie sich an Ihren Administrator.',
    notEligible:
      'Die Unterzeichnung erfordert ein genehmigtes, aktuelles Dokument im PDF-Format. Anträge für elektronische Siegel müssen genau eine PDF enthalten.',
    loadFailed:
      'Der Signaturstatus konnte nicht geladen werden oder Sie dürfen ihn nicht anzeigen.',
    actionFailed:
      'Die Aktion konnte nicht abgeschlossen werden. Aktualisieren Sie den Status vor einem erneuten Versuch.',
    retry: 'Erneut versuchen',
    send: 'Zur Unterzeichnung senden',
    refresh: 'Status prüfen / wiederherstellen',
    open: 'Unterzeichnung fortsetzen',
    download: 'Signierte PDF herunterladen',
    recovery:
      'Das externe Ergebnis oder Archiv muss bestätigt werden. Prüfen Sie den Status, um denselben Signaturantrag wiederherzustellen.',
    signedAt: 'Unterzeichnet {{at}}',
    confirmTitle: 'Diese genehmigte PDF zur Unterzeichnung senden?',
    confirmHint:
      'Der eingerichtete Signaturdienst erhält das genehmigte Dokument. Ein erneuter Versuch verwendet denselben Signaturantrag.',
    cancel: 'Abbrechen',
    states: {
      not_sent: 'Nicht gesendet',
      pending: 'Einreichung ausstehend',
      sending: 'Wird gesendet',
      accepted: 'Vom Signaturdienst angenommen',
      signing: 'Signaturen ausstehend',
      unknown: 'Ergebnisbestätigung ausstehend',
      archivePending: 'Unterzeichnet — Archiv muss wiederhergestellt werden',
      archived: 'Signiertes Dokument archiviert',
      rejected: 'Vom Signaturdienst abgelehnt',
      cancelled: 'Vom Signaturdienst abgebrochen',
    },
  },
};
