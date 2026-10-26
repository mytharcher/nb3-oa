export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Formation et apprentissage',
      submit: 'Soumettre une demande de formation',
      delegate: 'Soumettre au nom d’un employé',
      view: 'Consulter les demandes de formation',
    },
  },
  training: {
    actionForm: {
      title: '{{action}} la demande de formation « {{name}} »',
      completed: '{{action}} terminé pour la demande de formation « {{name}} »',
      saved: 'Demande de formation « {{name}} » enregistrée',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Complétez le nom de la formation, l’organisme et le motif, puis saisissez des coûts positifs ou nuls valides.',
      TRAINING_INVALID_DATE:
        'La fin de la formation doit être postérieure au début. Vérifiez les dates et horaires.',
      TRAINING_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
    },

    cc: 'Ajouter un destinataire en copie',
    authz: {
      resource: 'Formation et apprentissage',
      submit: 'Soumettre une demande de formation',
      delegate: 'Soumettre au nom d’un employé',
      view: 'Consulter les demandes de formation',
    },
    new: 'Nouvelle demande de formation',
    edit: 'Modifier la demande de formation',
    formDescription: 'Demandez une formation ou un apprentissage externe.',
    name: 'Nom de la formation',
    institution: 'Organisme',
    startAt: 'Début',
    endAt: 'Fin',
    usesWorkingTime: 'Utilise du temps de travail',
    amount: 'Coût (yuans)',
    yuan: 'yuans',
    yes: 'Oui',
    no: 'Non',
    timeZone: 'Fuseau horaire de l’entreprise : {{zone}}',
    amountHint:
      'Saisissez des yuans avec au maximum deux décimales. Les frais nuls sont autorisés.',
    amountInvalid:
      'Saisissez un montant positif ou nul avec au maximum deux décimales.',
    dateInvalid: 'Choisissez une plage valide dont la fin suit le début.',
    approvalHint:
      'L’approbation enregistre la présence à la formation si du temps de travail est utilisé. Une formation payante crée une enveloppe approuvée de remboursement ; aucun paiement n’a été effectué.',
    approvedFacts:
      'Cette formation a été approuvée. Les RH reçoivent une copie.',
    attendanceRecorded: 'La présence à la formation a été enregistrée.',
    authorizationIssued:
      'Enveloppe approuvée de remboursement : {{amount}} yuans. Les demandes suivent la politique de l’enveloppe.',
    zeroNoAuthorization:
      'Aucune enveloppe de frais n’est créée pour une formation gratuite.',
    uncertainCreate:
      'Le résultat de l’enregistrement est inconnu. Consultez Mes demandes avant de créer une autre demande.',
    inactive: 'Un dossier d’employé actif est requis.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    invalid:
      'Vérifiez les champs de la demande et rechargez le dernier enregistrement si nécessaire.',
    stages: {
      manager: 'Responsable direct',
      head: 'Chef de service',
      finance: 'Finances',
      executive: 'Direction',
      gm: 'Directeur général',
    },
  },
};
