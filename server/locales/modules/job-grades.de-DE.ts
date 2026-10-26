export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'Die aktuelle Gehaltstabelle wurde geändert. Laden Sie sie vor der Veröffentlichung neu.',
      IDEMPOTENCY_CONFLICT:
        'Der Veröffentlichungsschlüssel wurde bereits mit anderen Inhalten verwendet.',
      TABLE_UNAVAILABLE: 'Die Gehaltstabelle ist nicht initialisiert.',
      GRADE_UNAVAILABLE:
        'Eine erforderliche Gehaltsgruppe ist nicht verfügbar oder inaktiv.',
      INVALID_PUBLICATION: 'Die Veröffentlichungseingabe ist ungültig.',
      STORED_DATA_INVALID:
        'Die gespeicherten Gehaltstabellendaten sind ungültig.',
      INVALID_RANGE:
        'Gehaltsbereiche müssen gültige ganzzahlige Beträge enthalten.',
      DUPLICATE_GRADE: 'Jede Gehaltsgruppe muss genau einmal vorkommen.',
      OUTSIDE_RANGE:
        'Das angebotene Gehalt liegt außerhalb des veröffentlichten Bereichs.',

      ACCESS_DENIED:
        'Dieser Gehaltsgruppenvorgang liegt außerhalb Ihres gewährten Geltungsbereichs.',
      NOT_FOUND: 'Die Gehaltsgruppenrevision ist nicht verfügbar.',
    },
    authz: {
      resource: 'Gehaltsgruppentabellen',
      view: 'Veröffentlichungsverlauf anzeigen',
      viewSalary: 'Gehaltsbereiche lesen',
      manage: 'Gehaltsgruppentabelle veröffentlichen',
    },
  },
};
