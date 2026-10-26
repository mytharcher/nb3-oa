export default {
  loanRequests: {
    relatedUnavailable: 'Enregistrement associé indisponible',
    rowActions: 'Actions pour {{name}}',
    description:
      'Gérez les demandes d’avances, leurs paiements et remboursements.',

    saved: 'Demande d’avance « {{name}} » enregistrée',
    submitted: 'Demande d’avance « {{name}} » soumise',
    cashRecorded: 'Remboursement en espèces de « {{name}} » enregistré',
    repaymentConfirmed: 'Remboursement « {{receipt}} » confirmé',
    repaymentCancelled: 'Remboursement « {{receipt}} » annulé',
    confirmRepaymentTitle: 'Confirmer le remboursement « {{receipt}} » ?',
    cancelRepaymentTitle: 'Annuler le remboursement « {{receipt}} » ?',

    businessErrors: {
      LOAN_REQUEST_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
      LOAN_REQUEST_INVALID_DATE:
        'La date limite de remboursement doit être aujourd’hui ou ultérieure selon le fuseau horaire de l’entreprise.',
      LOAN_REQUEST_INVALID_TRAVEL:
        'Sélectionnez votre propre déplacement approuvé en vigueur.',
      LOAN_REQUEST_INVALID_INPUT:
        'Saisissez un motif d’avance et un montant positif.',
      LOAN_REQUEST_NOT_PAID:
        'Cette avance n’a pas été payée. Un remboursement ne peut être enregistré qu’après le paiement.',
      LOAN_REQUEST_REPAYMENT_INPUT_INVALID:
        'Saisissez le reçu de remboursement et le motif.',
    },

    loadLatest: 'Charger les dernières données',
    latestFacts:
      'Version {{version}} · {{amount}} yuans · échéance {{date}} · objet : {{reason}}',
    adoptVersion: 'Conserver ma saisie et utiliser cette version',
    noLongerEditable: 'Cette demande ne peut plus être modifiée.',
    invalidDate:
      'Choisissez une date actuelle ou future du calendrier de l’entreprise.',
    number: 'Référence',
    more: 'Autres actions',
    confirm: 'Confirmer',
    operationLabels: {
      complete: 'Terminer le paiement',
      unable: 'Échec du paiement',
      retryCash: 'Réessayer le paiement',
      claim: 'Prendre en charge le traitement',
      release: 'Libérer le traitement',
      assign: 'Attribuer un responsable',
    },
    confirmRetry:
      'Actualisez vos coordonnées bancaires et renvoyez cette demande approuvée au caissier.',
    confirmPayment:
      'Confirmez que le paiement a réellement été effectué avec cette pièce justificative. Cette action crée la dette de l’emprunteur.',
    confirmUnable:
      'Enregistrez l’exception de paiement et son motif. Le montant approuvé reste réservé.',
    receipt: 'Référence du reçu',
    actions: 'Actions',
    bank: 'Compte de paiement protégé',
    hideBank: 'Masquer le compte de paiement',
    showBank: 'Afficher le compte de paiement',
    bankRestricted:
      'Seuls l’emprunteur et les rôles financiers explicitement autorisés peuvent lire le compte de paiement.',
    bankName: 'Banque',
    bankHolder: 'Titulaire du compte',
    bankAccount: 'Numéro de compte bancaire',
    loadingBank: 'Chargement du compte de paiement…',
    bankNotSnapshot: 'Aucun compte de paiement n’a encore été enregistré.',
    recordCash: 'Enregistrer un remboursement en espèces',
    invalidRepaymentAmount:
      'Impossible de lire les montants remboursés. Contactez les finances pour vérifier cet enregistrement.',
    noRepayments: 'Aucun remboursement enregistré',
    loading: 'Chargement…',
    confirmRepayment: 'Confirmer le remboursement',
    cancelRepayment: 'Annuler le reçu en attente',
    confirmReason: 'Remboursement en espèces confirmé par l’emprunteur',
    cancelReason: 'Reçu en espèces en attente annulé par le caissier',
    confirmCashWarning:
      'Confirmer le reçu {{receipt}} de {{amount}} yuans. Cette action réduit votre dette et est irréversible.',
    cancelCashWarning:
      'Annuler le reçu {{receipt}} de {{amount}} yuans. Votre dette restante reste inchangée.',
    cashRestricted:
      'Seul un caissier peut enregistrer des remboursements sur une avance payée.',
    repaymentStates: {
      pending: 'En attente de confirmation',
      settled: 'Confirmé',
      cancelled: 'Annulé',
    },
    department: 'Service',
    yuan: 'yuans',
    inflight: 'Réservé sur le plafond d’avance : {{amount}} yuans',
    quotaFact:
      'Données de soumission : dette {{debt}}, autres demandes {{inflight}}, total incluant cette demande {{total}} yuans.',
    principal: 'Capital d’origine',
    repaid: 'Remboursé',
    outstanding: 'Dette restante',
    pendingRepayment: 'Réservations de remboursement en attente',
    pendingHint:
      'Les confirmations d’espèces en attente et compensations de remboursements de frais ne réduisent pas la dette restante.',
    edit: 'Modifier le brouillon d’avance',
    invalidAmount:
      'Saisissez un montant positif avec au maximum deux décimales.',
    invalidTravel:
      'Choisissez votre propre demande de déplacement active et approuvée.',
    readOnly: 'Vous n’avez pas l’autorisation de modifier ce brouillon.',
    bankMissing:
      'Votre compte de paiement est incomplet. Mettez-le à jour avant que le caissier ne puisse terminer le paiement.',
    conflict:
      'La demande a changé. Ouvrez les détails actuels avant de la modifier à nouveau.',
    amountHint:
      'Les montants utilisent des centimes exacts ; deux décimales maximum.',
    companyDate:
      'Date calendaire dans le fuseau horaire de l’entreprise : {{zone}}',
    noTravel: 'Aucun déplacement lié',
    search: 'Numéro, objet ou demandeur',
    allStatuses: 'Tous les statuts',
    view: 'Liste de travail',
    filteredEmpty: 'Aucune demande d’avance correspondante',
    empty: 'Aucune demande d’avance',
    emptyHint:
      'Créez une demande d’avance pour financer des besoins professionnels approuvés.',
    clear: 'Effacer les filtres',
    states: {
      draft: 'Brouillon',
      revision: 'Renvoyé pour correction',
      manager: 'Examen du responsable',
      head: 'Examen du chef de service',
      finance: 'Examen des finances',
      executive: 'Examen du vice-président',
      gm: 'Examen de la direction générale',
      cashier: 'En attente de paiement',
      exception: 'Exception de paiement',
      paid: 'Payé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    stages: {
      draft: 'Brouillon',
      revision: 'Renvoyé pour correction',
      manager: 'Examen du responsable',
      head: 'Examen du chef de service',
      finance: 'Examen des finances',
      executive: 'Examen du vice-président',
      gm: 'Examen de la direction générale',
      cashier: 'En attente de paiement',
      exception: 'Exception de paiement',
      paid: 'Payé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    errors: {
      inactive: 'Un dossier d’employé actif est requis.',
      configuration:
        'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
      invalid: 'Vérifiez les champs de saisie et réessayez.',
      quota: 'Le plafond personnel d’avance serait dépassé.',
      overdue:
        'Remboursez votre dette en retard avant de demander une autre avance.',
    },
    authz: {
      ownedScope: 'Demandes dont je suis demandeur ou créateur',
      resource: 'Demandes d’avances',
      submit: 'Soumettre ses propres demandes d’avances',
      delegate: 'Créer des demandes d’avances pour les employés',
      view: 'Lire les demandes d’avances',
      payment: 'Lire les coordonnées de paiement protégées des avances',
      cashRepayment: 'Enregistrer et annuler les remboursements en espèces',
      confirmRepayment: 'Confirmer ses propres remboursements en espèces',
      collection: 'Demandes d’avances',
    },
    title: 'Demandes d’avances',
    new: 'Nouvelle demande d’avance',
    reason: 'Objet de l’avance',
    amount: 'Montant de l’avance (yuans)',
    dueDate: 'Date de remboursement',
    travel: 'Demande de déplacement liée',
    status: 'Statut',
    refresh: 'Actualiser',
    loan: 'Solde de l’avance',
    repayment: 'Remboursement en espèces',
    voucher: 'Justificatif de paiement',
  },
};
