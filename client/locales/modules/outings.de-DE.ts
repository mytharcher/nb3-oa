export default {
  outings: {
    authz: { resource: 'Außendienstanträge' },
    navigation: 'Außendienstanträge',
    new: 'Neuer Außendienstantrag',
    edit: 'Außendienstantrag bearbeiten',
    formDescription:
      'Prüfen Sie den Zeitraum und reichen Sie den Antrag zur Prüfung ein oder speichern Sie einen Entwurf.',
    description:
      'Erfassen Sie Zeitraum, Ort und Zweck eines Außentermins zur Prüfung durch Ihre Führungskraft.',
    startAt: 'Startzeit',
    endAt: 'Endzeit',
    location: 'Ort',
    reason: 'Zweck',
    timeZone: 'Zeiten werden in {{zone}} erfasst',
    policyHint:
      'Nach Beginn des Außentermins darf nur Ihre Führungskraft ihn mit einer Begründung beenden.',
    nonexistentTime:
      'Diese Ortszeit ist wegen der Zeitumstellung nicht vorhanden. Wählen Sie eine andere Zeit.',
    daylightSavingPolicy:
      'Falls diese Ortszeit durch die Zeitumstellung zweimal auftritt, wird das frühere Vorkommen verwendet.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'Der Antragsteller muss ein aktiver Mitarbeiter sein. Wenden Sie sich zur Prüfung des Datensatzes an die Personalabteilung.',
      OUTING_INVALID_PERIOD:
        'Das Ende muss nach dem Beginn liegen. Prüfen Sie den Außendienstzeitraum.',
      OUTING_REQUIRED_FIELDS: 'Geben Sie einen Ort und einen Zweck an.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'Der Genehmigungsantrag kann nicht eingereicht werden. Wenden Sie sich an einen Administrator, um die Genehmigungsfristen zu prüfen.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Die Anwesenheitsdaten wurden geändert. Aktualisieren Sie die Ansicht, um sie zu prüfen.',
    },
  },
};
