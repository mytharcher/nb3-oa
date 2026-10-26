export default {
  expensePlans: {
    relatedUnavailable: 'Enregistrement associé indisponible',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
      EXPENSE_PLAN_INVALID_DATE:
        'Sélectionnez une date de dépense prévue valide.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Sélectionnez un type d’activité et un poste budgétaire actifs.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Saisissez un montant positif, les participants et le motif de dépense.',
    },

    new: 'Nouvelle autorisation préalable de dépenses',
    edit: 'Modifier l’autorisation préalable de dépenses',
    formDescription:
      'Planifiez une réception, une activité d’équipe ou un événement avant d’engager des dépenses.',
    matterType: 'Type d’activité',
    subject: 'Poste budgétaire',
    amount: 'Dépense estimée (yuans)',
    yuan: 'yuans',
    participants: 'Participants',
    eventDate: 'Date de l’événement',
    budgetYear: 'Année budgétaire soumise',
    department: 'Service principal soumis',
    primaryDepartment:
      'Service principal actuel : {{department}}. Il sera vérifié à nouveau lors de la soumission.',
    departmentMissing: 'Non configuré',
    departmentPending: 'Déterminé à la soumission',
    departmentUnavailable: 'Service actuellement indisponible',
    year: 'Année budgétaire : {{year}} · calendrier de l’entreprise : {{timeZone}}',
    amountHint:
      'Saisissez des yuans décimaux ; les montants sont stockés en centimes entiers exacts.',
    amountInvalid:
      'Saisissez un montant positif avec au maximum deux décimales, dans la limite sûre.',
    participantsInvalid: 'Saisissez un entier compris entre 1 et 100000.',
    dateInvalid: 'Choisissez une date valide.',
    disabled: 'Désactivée',
    subjectInactive:
      'Choisissez un type d’activité et un poste budgétaire actifs.',
    optionsEmpty:
      'Un type d’activité et un poste budgétaire actifs doivent être configurés avant l’enregistrement.',
    reserveHint:
      'La soumission réserve le budget. L’approbation finale accorde une enveloppe pour remboursement.',
    revisionHold:
      'La réservation budgétaire d’origine est conservée pendant la correction. Elle ne change qu’à la nouvelle soumission.',
    retainedHold:
      'Réservation d’origine : {{subject}} · {{amount}} yuans. Elle est distincte de la proposition révisée.',
    actualHold: 'Réservation à l’approbation',
    holdFactHint:
      'Il s’agit de la réservation source, et non du solde restant après les remboursements ultérieurs.',
    frozenThreshold:
      'Seuils soumis : direction > {{vp}} yuans ; direction générale > {{gm}} yuans.',
    applied:
      'Une enveloppe approuvée a été émise. Cela n’indique ni remboursement ni paiement.',
    reserved:
      'Le budget est réservé pendant que cette demande attend l’approbation.',
    awaitingEffect:
      'Aucune enveloppe approuvée n’a été émise pour cette demande.',
    uncertainCreate:
      'Le résultat de l’enregistrement est incertain. Fermez et consultez Mes demandes avant de créer un autre brouillon.',
    unknownEdit:
      'Le résultat de l’enregistrement est incertain. Votre saisie est verrouillée jusqu’au chargement du dernier enregistrement.',
    authorization: 'Enveloppe approuvée',
    quotaId: 'Référence de l’enveloppe',
    grantedAmount: 'Montant accordé',
    quotaState: 'Statut de l’enveloppe',
    deadline: 'Date d’expiration',
    quotaHint:
      'Les remboursements soldent cette enveloppe. Sa clôture ou son expiration n’annule pas cette approbation.',
    mergedTitle: 'Fusion pour la même personne',
    quotaStates: { open: 'Ouvrir', closed: 'Clos', expired: 'Expirée' },
    createdBy: 'Créé par',
    authz: {
      resource: 'Autorisation préalable de dépenses',
      submit: 'Soumettre une autorisation préalable de dépenses',
      delegate:
        'Soumettre une autorisation préalable de dépenses pour un employé',
      view: 'Lire les autorisations préalables de dépenses',
    },
    stages: {
      head: 'Chef de service',
      finance: 'Finances',
      executive: 'Membre de la direction responsable',
      gm: 'Directeur général',
    },
    states: { approved: 'Enveloppe approuvée émise' },
    merged:
      'Direction et direction générale fusionnées : la même personne a approuvé en son nom propre.',
    errors: {
      invalid:
        'Vérifiez la date, les participants, le montant, le type d’activité et le poste.',
      department: 'Le demandeur doit avoir un service principal actif.',
      insufficient:
        'Les fonds disponibles de ce compte budgétaire sont insuffisants.',
      inactive: 'Le demandeur doit posséder un dossier d’employé actif.',
      configuration:
        'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    },
  },
};
