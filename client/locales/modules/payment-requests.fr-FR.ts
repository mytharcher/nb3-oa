export default {
  paymentRequests: {
    relatedUnavailable: 'Enregistrement associé indisponible',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Complétez le motif, le bénéficiaire, le montant positif, le numéro de facture et le justificatif de facture.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Complétez le compte bancaire protégé du bénéficiaire avant de soumettre.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'Le compte du bénéficiaire a changé. Chargez sa dernière version avant de le corriger.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
      PAYMENT_REQUEST_METHOD_INVALID: 'Sélectionnez un mode de paiement actif.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Expliquez l’absence d’approbation préalable et effacez la commande d’achat liée.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Sélectionnez une commande d’achat ou un contrat en vigueur et son bénéficiaire d’origine.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'Le document source a changé. Actualisez le paiement et la source avant d’agir à nouveau.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'Le contrat a changé. Actualisez sa version et révisez le paiement avant de soumettre à nouveau.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Saisissez le numéro du justificatif de paiement et téléversez ou sélectionnez un justificatif.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Confirmez le montant exact approuvé avant de forcer la clôture du paiement.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Indiquez pourquoi le paiement n’a pas pu être effectué.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Ce paiement est déjà réglé. Actualisez-le pour voir le résultat enregistré.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Enregistrez le paiement effectif du contrat avant de terminer cette opération.',
      PAYMENT_FILE_SIZE:
        'Sélectionnez une pièce jointe non vide de 5 Mo maximum.',
      PAYMENT_FILE_TYPE:
        'Téléversez un fichier PDF, JPEG, PNG ou WebP dont le type correspond.',
      PAYMENT_ATTACHMENT_INVALID:
        'Sélectionnez un justificatif téléversé pour cette demande de paiement.',
    },

    title: 'Demandes de paiement',
    description:
      'Examinez les demandes de paiement, les données source figées et le traitement de caisse.',
    new: 'Nouvelle demande de paiement',
    edit: 'Modifier',
    details: 'Consulter les détails',
    number: 'Nombre',
    reason: 'Motif',
    vendor: 'Bénéficiaire',
    amount: 'Montant du paiement (yuans)',
    search: 'Rechercher par numéro, motif, demandeur ou bénéficiaire',
    view: 'Vue de l’enregistrement',
    allStatuses: 'Tous les statuts',
    refresh: 'Actualiser',
    clearFilters: 'Effacer les filtres',
    emptyTitle: 'Aucune demande de paiement',
    emptyDescription:
      'Créez un brouillon pour demander un paiement et joignez le justificatif de facture.',
    noResults:
      'Aucun enregistrement correspondant. Effacez ou ajustez les filtres.',
    rowActions: 'Actions pour {{name}}',
    yes: 'Oui',
    no: 'Non',
    frozenHint:
      'La source, le bénéficiaire, le montant et la facture sont figés à la soumission.',
    sourceModes: {
      contract: 'Contrat',
      purchase: 'Commande d’achat',
      none: 'Sans approbation préalable',
    },
    views: {
      mine: 'Les miens',
      pending: 'En attente',
      done: 'Terminé',
      copied: 'Copié',
    },
    statuses: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Examen du service',
      finance: 'Examen des finances',
      executive: 'Examen de la direction',
      gm: 'Examen de la direction générale',
      cashier: 'Traitement de caisse',
      exception: 'Exception de traitement',
      paid: 'Payé',
      forcedPaid: 'Paiement forcé enregistré',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
    },
    errors: {
      forbidden:
        'Vous n’avez pas accès. Demandez à un administrateur de vérifier votre autorisation.',
      notFound:
        'Cet enregistrement n’existe plus ou est indisponible. Revenez à la page source.',
      conflict:
        'Ce paiement a changé. Lisez le dernier enregistrement avant d’agir à nouveau.',
      invalid: 'Vérifiez le contenu du paiement et les justificatifs requis.',
      failed: 'La requête n’a pas abouti. Réessayez.',
    },
    detail: {
      creator: 'Créé par',
      sourceMode: 'Source',
      order: 'Commande d’achat',
      noPriorReason: 'Motif d’absence d’approbation préalable',
      invoice: 'Numéro de facture',
      method: 'Mode de paiement',
      failure: 'Échec du traitement',
      voucher: 'Justificatif de paiement',
      forcedReason: 'Motif du paiement forcé',
      paidAt: 'Payé le',
      sourceFacts: 'Données source figées',
      cumulativeHint:
        'Les paiements cumulés soumis incluent les paiements en attente. La réservation de la demande actuelle est affichée séparément et ne doit pas être ajoutée à nouveau. Le paiement ne confirme ni livraison ni réception.',
      sourceApproved: 'Montant de commande approuvé (yuans)',
      sourceCumulative: 'Montant cumulé soumis (yuans)',
      sourceHeld: 'Réservation source actuelle (yuans)',
      fullApproval: 'Approbation complète requise',
      attachments: 'Justificatif de facture',
      voucherAttachments: 'Justificatif de paiement',
      notSubmitted: 'Les règles sont figées à la soumission.',
    },
    rules: {
      spend_vp: 'Seuil de la direction (yuans)',
      spend_gm: 'Seuil de la direction générale (yuans)',
      sla_remindHours: 'Heures ouvrées avant rappel',
      sla_escalateHours: 'Heures ouvrées avant escalade',
      sla_urgeCooldownHours: 'Délai entre rappels en heures',
    },
    authz: {
      voucherEvidence: 'Téléverser les justificatifs de paiement',
      ownScope: 'Paiements dont je suis propriétaire ou créateur',
      resource: 'Demandes de paiement',
      view: 'Consulter les demandes de paiement',
      submit: 'Créer et soumettre mes paiements',
      delegate: 'Créer des paiements pour les employés',
      paymentAccount: 'Lire et corriger les comptes de paiement autorisés',
    },
  },
};
