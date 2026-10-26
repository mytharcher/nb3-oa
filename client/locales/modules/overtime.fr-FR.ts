export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE:
        'Sélectionnez une date d’heures supplémentaires valide.',
    },

    authz: { resource: 'Demandes d’heures supplémentaires' },
    navigation: 'Demandes d’heures supplémentaires',
    description:
      'Demandez des heures supplémentaires et suivez leur approbation et leur règlement.',
    new: 'Nouvelle demande d’heures supplémentaires',
    edit: 'Modifier la demande d’heures supplémentaires',
    date: 'Date des heures supplémentaires',
    minutes: 'Durée (minutes)',
    monthlyMinutes: 'Total mensuel (minutes)',
    settlement: 'Règlement',
    compensatory: 'Congé de récupération',
    pay: 'Paiement des heures supplémentaires',
    durationInvalid: 'Saisissez un entier compris entre 1 et 1 440 minutes.',
    formDescription:
      'Vérifiez la demande et soumettez-la, ou enregistrez un brouillon.',
    policyHint:
      'Une demande par date. Les demandes tardives nécessitent un examen RH. Le congé de récupération est crédité après l’approbation finale.',
    emptyDescription:
      'Complétez une demande d’heures supplémentaires et soumettez-la, ou enregistrez un brouillon.',
    uncertainCreate:
      'Le résultat de l’enregistrement est incertain. Fermez ce formulaire et consultez Mes demandes avant de créer un autre brouillon.',
    duplicate:
      'Une demande d’heures supplémentaires active ou approuvée existe déjà pour cette date.',
    inactive: 'Le demandeur doit être un employé actif.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    invalid:
      'Vérifiez la date, la durée, le règlement et le motif des heures supplémentaires.',
    schemaUnavailable:
      'Le schéma de base de données des heures supplémentaires doit être mis à jour. Cette opération ne peut pas encore être effectuée. Contactez un administrateur.',
  },
};
