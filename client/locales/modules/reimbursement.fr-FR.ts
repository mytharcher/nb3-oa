import actionCopy from './reimbursement-actions.fr-FR.js';
import formCopy from './reimbursement-forms.fr-FR.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Enregistrement associé indisponible',
    categoryUnavailable: 'Catégorie indisponible',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Chaque ligne de frais doit avoir un montant positif dans la plage prise en charge.',
      REIMBURSEMENT_INVALID_LINE_DATE:
        'Sélectionnez une date de dépense valide pour chaque ligne.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Saisissez le numéro du justificatif avant de confirmer le paiement.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Saisissez un motif et confirmez le total exact du remboursement, la compensation d’avance et le paiement en espèces.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Indiquez pourquoi le paiement n’a pas pu être effectué.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'Le compte de paiement a changé. Chargez sa dernière version avant de le corriger.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'L’enveloppe approuvée a changé. Actualisez-la et vérifiez le total du remboursement.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Les justificatifs de facture ont changé. Actualisez la demande et sélectionnez à nouveau les factures disponibles.',
      REIMBURSEMENT_LOAN_CHANGED:
        'La compensation d’avance a changé. Actualisez l’avance et confirmez le montant compensé.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'Le total des frais dépasse le montant pris en charge. Réduisez le total ou divisez la demande.',
      REIMBURSEMENT_FILE_SIZE:
        'Sélectionnez une pièce jointe non vide de 5 Mo maximum.',
      REIMBURSEMENT_FILE_TYPE:
        'Téléversez un fichier PDF, JPEG, PNG ou WebP dont le type correspond.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Remboursements de frais',
    description:
      'Vérifiez les justificatifs de frais et suivez les approbations des lignes et le traitement du paiement.',
    new: 'Nouveau remboursement',
    edit: 'Modifier le remboursement',
    details: 'Consulter les détails',
    number: 'Nombre',
    reason: 'Motif',
    gross: 'Remboursement brut',
    offset: 'Compensation d’avance',
    net: 'Net en espèces',
    search: 'Rechercher par numéro, motif ou demandeur',
    view: 'Vue de l’enregistrement',
    allStatuses: 'Tous les statuts',
    refresh: 'Actualiser les remboursements',
    clearFilters: 'Effacer les filtres',
    emptyTitle: 'Aucun remboursement',
    emptyDescription:
      'Créez un brouillon, puis ajoutez des lignes de frais et justificatifs.',
    noResults: 'Aucun remboursement correspondant. Ajustez les filtres.',
    rowActions: 'Actions pour {{name}}',
    views: {
      mine: 'Les miens',
      pending: 'En attente',
      done: 'Terminé',
      copied: 'Copié',
    },
    statuses: {
      draft: 'Brouillon',
      revision: 'Révision',
      manager: 'Examen du responsable',
      head: 'Examen du service',
      finance: 'Examen des finances',
      executive: 'Examen de la direction',
      gm: 'Examen de la direction générale',
      cashier: 'Traitement de caisse',
      exception: 'Exception de traitement',
      paid: 'Payé',
      forcedPaid: 'Règlement enregistré administrativement',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    errors: {
      invoiceDuplicate:
        'Les numéros de facture doivent être uniques dans ce remboursement. Vérifiez chaque ligne de frais.',
      overrunReasonRequired:
        'Les demandes cumulées dépassent l’enveloppe approuvée liée de plus de 20 %. Saisissez une explication du dépassement.',
      invoiceUnavailable:
        'La facture est réservée ou utilisée par un autre remboursement. Vérifiez le numéro de facture et la demande.',
      paymentAccountRequired:
        'Le compte de paiement de l’employé est incomplet. Demandez aux RH de compléter la banque, le numéro de compte et le titulaire avant de soumettre.',
      employeeInactive:
        'Le demandeur doit avoir un profil d’employé actif. Contactez les RH pour vérifier.',
      departmentRequired:
        'Le demandeur n’a pas de service principal actif. Demandez aux RH ou à un administrateur de l’organisation d’en attribuer un.',
      categoryInvalid:
        'Une catégorie de dépense est inactive ou indisponible. Choisissez une catégorie active pour chaque ligne.',
      sourceInvalid:
        'L’enveloppe liée est indisponible, non approuvée ou appartient à un autre demandeur. Vérifiez la demande liée.',
      sourceRebind:
        'Un remboursement soumis ne peut pas changer d’enveloppe ou d’avance liée. Conservez les liens d’origine.',
      loanRequired:
        'Sélectionnez une avance pour le montant compensé, ou saisissez 0 si aucune avance n’est compensée.',
      loanInvalid:
        'L’avance sélectionnée est indisponible ou appartient à un autre demandeur. Choisissez une autre avance.',
      loanInsufficient:
        'Le solde disponible de l’avance est insuffisant. Réduisez la compensation et vérifiez le solde.',
      invalidOffset:
        'La compensation d’avance ne peut pas dépasser le total du remboursement. Vérifiez les montants.',
      attachmentInvalid:
        'Certains justificatifs sont indisponibles ou appartiennent à un autre remboursement. Sélectionnez ou téléversez des justificatifs pour cette demande.',
      slaConfiguration:
        'Les délais d’approbation ne sont pas pris en charge. Contactez l’administrateur des processus.',
      inputInvalid:
        'Saisissez un motif de remboursement et complétez des lignes de frais distinctes avec des justificatifs.',
      configuration:
        'La structure des données de remboursement est incomplète. Demandez à l’administrateur système de la réparer avant de réessayer.',
      forbidden: 'Vous ne pouvez pas accéder à ce remboursement.',
      notFound: 'Ce remboursement n’existe plus.',
      conflict:
        'Ce remboursement a changé. Rechargez et vérifiez avant d’agir à nouveau.',
      standardReason:
        'Expliquez chaque ligne d’une journée dépassant le barème approuvé.',
      standardCategoryChanged:
        'Cette catégorie est hors de la politique d’origine. Créez une nouvelle demande pour utiliser la politique actuelle.',
      standardConfiguration:
        'Le barème de déplacement approuvé est incomplet. Demandez à un administrateur de vérifier la configuration.',
      invalid:
        'Vérifiez le contenu du remboursement et les justificatifs requis.',
      failed: 'La requête n’a pas abouti. Réessayez.',
    },
    standard: {
      title: 'Politique de frais figée',
      unsubmitted: 'La politique est figée à la première soumission.',
      frozenHint:
        'Ces classifications enregistrées et plafonds approuvés de déplacement restent inchangés lors d’une correction. Les montants quotidiens sont regroupés par type de barème.',
      gradeCode: 'Grade de déplacement',
      gradeRank: 'Rang du grade',
      lodging: 'Hébergement par nuit (yuans)',
      allowance: 'Indemnité par jour (yuans)',
      notApplicable:
        'Aucun barème de déplacement approuvé ne s’applique à cette demande.',
      kinds: {
        none: 'Aucun plafond quotidien de déplacement',
        lodging: 'Plafond quotidien d’hébergement',
        allowance: 'Plafond quotidien d’indemnité',
      },
    },
    detail: {
      lines: 'Lignes de frais',
      failure: 'Échec du traitement',
      voucher: 'Justificatif de paiement',
      forcedReason: 'Motif de règlement administratif',
      noLines: 'Aucune ligne de frais pour le moment.',
      line: 'Ligne de frais {{number}}',
      financeResult: 'Résultat financier',
      lineStates: {
        approved: 'Approuvé',
        returned: 'Renvoyé pour correction',
        pending: 'En attente d’examen',
      },
    },
    bank: {
      title: 'Compte de paiement privé',
      bankName: 'Banque',
      bankAccount: 'Compte bancaire',
      bankAccountName: 'Titulaire du compte',
      missing: 'Aucun compte de paiement enregistré.',
      correct: 'Corriger le compte de paiement',
      saved: 'Compte de paiement corrigé',
      denied: 'L’accès au compte de paiement est refusé.',
      unavailable:
        'La correction du compte est indisponible. Rechargez ce remboursement et vérifiez son compte enregistré.',
    },
    authz: {
      resource: 'Remboursements de frais',
      submit: 'Créer et soumettre mes remboursements',
      delegate: 'Créer des remboursements pour les employés',
      view: 'Consulter les remboursements',
      paymentAccount: 'Lire et corriger les comptes de paiement autorisés',
    },
  },
};
