export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Sélectionnez un service actif et une année budgétaire valide.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Saisissez un montant d’ajustement positif et un motif.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT:
        'Sélectionnez un poste budgétaire actif.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Pour un transfert, utilisez des postes source et cible distincts. Pour une augmentation, effacez le poste source.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'Le chef de service est indisponible. Demandez à un administrateur de mettre à jour l’affectation du service.',
    },

    authz: {
      resource: 'Ajustements budgétaires',
      submit: 'Soumettre un ajustement budgétaire',
      delegate: 'Soumettre un ajustement budgétaire pour un employé',
      view: 'Lire les ajustements budgétaires',
    },
    new: 'Nouvel ajustement budgétaire',
    edit: 'Modifier l’ajustement budgétaire',
    formDescription:
      'Proposez un transfert entre postes ou un budget supplémentaire.',
    department: 'Service budgétaire',
    yearInvalid: 'Saisissez une année entière comprise entre 1900 et 9999.',
    year: 'Année budgétaire',
    type: 'Type d’ajustement',
    transfer: 'Transfert entre postes',
    increase: 'Budget supplémentaire',
    targetSubject: 'Poste cible',
    sourceSubject: 'Poste source',
    amount: 'Montant (yuans)',
    yuan: 'yuans',
    reason: 'Motif',
    amountInvalid:
      'Saisissez un montant décimal positif avec au maximum deux décimales, dans la limite sûre.',
    sourceInvalid: 'Choisissez des postes source et cible distincts.',
    amountHint:
      'Utilisez des yuans décimaux. Les montants sont stockés en centimes entiers exacts.',
    reserveHint:
      'La soumission réserve les fonds source pour un transfert. Le budget ne prend effet qu’après l’approbation finale.',
    revisionHold:
      'La réservation d’origine reste en place pendant le retour pour correction. La modification de la proposition ne la libère et ne la remplace qu’à la nouvelle soumission.',
    retainedHold:
      'Réservation d’origine actuelle : {{subject}} · {{amount}} yuans. Elle est distincte de la proposition révisée.',
    actualHold: 'Réservation actuelle à la source',
    frozenThreshold:
      'Seuil soumis pour l’examen de la direction générale en cas d’augmentation : {{amount}} yuans (uniquement si strictement supérieur).',
    applied: 'L’approbation finale a appliqué cet ajustement budgétaire.',
    reserved:
      'Les fonds source sont réservés ; cet ajustement n’a pas encore pris effet.',
    awaitingEffect:
      'Cette proposition n’a pas pris effet. Le budget supplémentaire n’est appliqué qu’après l’approbation finale.',
    insufficient:
      'Le budget source ne dispose pas de fonds suffisants. Vérifiez le montant et la source ; votre saisie est conservée.',
    subjectInactive:
      'Ce poste est désactivé. Choisissez un poste actif avant de soumettre.',
    disabled: 'Désactivée',
    inactive: 'Le demandeur doit être un employé actif.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    invalid:
      'Vérifiez le compte, le type d’ajustement, le montant et le motif.',
    uncertainCreate:
      'Le résultat de l’enregistrement est incertain. Fermez et consultez Mes demandes avant de créer un autre brouillon.',
    stages: {
      head: 'Chef de service',
      finance: 'Responsable financier',
      cfo: 'Directeur financier',
      gm: 'Directeur général',
    },
  },
};
