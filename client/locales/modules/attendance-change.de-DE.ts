export default {
  attendanceChange: {
    authz: { resource: 'Zeitbuchungskorrekturen' },
    navigation: 'Zeitbuchungskorrekturen',
    new: 'Neue Zeitbuchungskorrektur',
    edit: 'Zeitbuchungskorrektur bearbeiten',
    emptyMissing:
      'Keine geeigneten fehlenden Zeitbuchungen. Wenden Sie sich an die Personalabteilung, falls die importierten Anwesenheitsnachweise fehlerhaft sind.',
    uploadAfterDraft:
      'Speichern Sie den Entwurf und öffnen Sie dann „Bearbeiten“, um Nachweise hochzuladen.',
    formDescription:
      'Prüfen Sie die Nachweise und reichen Sie den Antrag zur Prüfung ein oder speichern Sie einen Entwurf.',
    description:
      'Geben Sie die fehlende Buchungszeit und Nachweise zur Prüfung durch Ihre Führungskraft an.',
    date: 'Datum der fehlenden Zeitbuchung',
    original: 'Ursprünglich fehlende Zeitbuchung',
    correctionAt: 'Korrigierte Buchungszeit',
    proof: 'Nachweiserklärung',
    attachments: 'Nachweisanhänge',
    punchKinds: { in: 'Kommen buchen', out: 'Gehen buchen' },
    missing: 'Fehlende Zeitbuchung auswählen',
    policyHint:
      'Die fehlende Zeitbuchung muss innerhalb der letzten sieben Kalendertage liegen. Ausstehende und genehmigte Anträge zählen zur Monatsgrenze.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'Der Datensatz der fehlenden Zeitbuchung wurde geändert. Aktualisieren Sie die Ansicht und wählen Sie ihn erneut aus.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Nur fehlende Zeitbuchungen innerhalb von sieben Kalendertagen können eingereicht werden. Wenden Sie sich bei älteren Einträgen an die Personalabteilung.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'Die Korrektur muss auf das Datum der fehlenden Zeitbuchung fallen und darf nicht in der Zukunft liegen.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Ausstehende und genehmigte Korrekturen haben die Monatsgrenze erreicht.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Für diese fehlende Zeitbuchung besteht bereits eine ausstehende oder genehmigte Korrektur.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Geben Sie eine Nachweiserklärung an oder laden Sie Nachweise hoch.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'Der Antragsteller muss ein aktiver Mitarbeiter sein. Wenden Sie sich zur Prüfung des Datensatzes an die Personalabteilung.',
      ATTENDANCE_CHANGE_REASON_REQUIRED:
        'Geben Sie eine Begründung für die Korrektur an.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Anhänge dürfen nicht leer und höchstens 5 MB groß sein.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Verwenden Sie PDF-, JPEG-, PNG- oder WebP-Dateien mit übereinstimmendem Inhalt und Format.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'Sie sind nicht berechtigt, diesen Nachweis anzuzeigen oder hochzuladen.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'Die Anhangverknüpfung ist ungültig. Wählen Sie Nachweise, die zu diesem Entwurf hochgeladen wurden.',
      ATTENDANCE_BASELINE_CHANGED:
        'Die ursprünglichen Anwesenheitsnachweise wurden geändert. Die Genehmigung wurde zurückgesetzt; aktualisieren Sie die Ansicht zur Prüfung.',
    },
  },
};
