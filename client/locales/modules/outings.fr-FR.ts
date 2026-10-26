export default {
  outings: {
    authz: { resource: 'Demandes de sortie professionnelle' },
    navigation: 'Demandes de sortie professionnelle',
    new: 'Nouvelle demande de sortie',
    edit: 'Modifier la demande de sortie',
    formDescription:
      'Vérifiez la période et soumettez pour examen, ou enregistrez un brouillon.',
    description:
      'Enregistrez la période, le lieu et l’objet d’une sortie pour examen par votre responsable.',
    startAt: 'Heure de début',
    endAt: 'Heure de fin',
    location: 'Emplacement',
    reason: 'Objet',
    timeZone: 'Les horaires sont enregistrés dans {{zone}}',
    policyHint:
      'Après le début de la sortie, seul votre supérieur peut y mettre fin avec un motif.',
    nonexistentTime:
      'Cette heure locale n’existe pas en raison du changement d’heure. Choisissez une autre heure.',
    daylightSavingPolicy:
      'Si un changement d’heure répète cette heure locale, la première occurrence est utilisée.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'Le demandeur doit être un employé actif. Contactez les RH pour vérifier le dossier.',
      OUTING_INVALID_PERIOD:
        'La fin doit suivre le début. Vérifiez la période de sortie.',
      OUTING_REQUIRED_FIELDS: 'Indiquez un lieu et un objet.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Les données de présence ont changé. Actualisez pour les examiner.',
    },
  },
};
