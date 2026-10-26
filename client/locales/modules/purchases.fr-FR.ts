export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Chaque article d’achat nécessite un nom, une unité et une quantité positive. Vérifiez les doublons.',
      PURCHASE_INVALID_DATE:
        'Sélectionnez une date de réception prévue valide.',
      PURCHASE_INVALID_PRICE:
        'Saisissez un prix réel positif, sélectionnez un fournisseur et joignez son devis justificatif.',
      PURCHASE_INVALID_QUOTES:
        'Un fichier de devis ne peut pas être réutilisé pour différents fournisseurs. Sélectionnez des justificatifs distincts.',
      PURCHASE_QUOTES_REQUIRED:
        'Ce montant nécessite les devis de trois fournisseurs distincts, chacun avec une pièce jointe.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Révisez le budget estimé au prix confirmé par devis avant de soumettre à nouveau.',
      PURCHASE_INVALID_INPUT:
        'Ajoutez des articles et un objet, puis saisissez un montant estimé positif.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'Le demandeur doit avoir un service principal actif. Demandez aux RH de mettre à jour le dossier de l’employé.',
      INVALID_RECEIPT:
        'Sélectionnez la date de réception effective et saisissez un motif de confirmation de réception.',
    },

    discardThenNavigate:
      'Abandonner ces modifications non enregistrées ? Après confirmation, sélectionnez à nouveau votre destination.',
    localInputsRetained:
      'Dernière version chargée. Vos saisies sont conservées ; vérifiez-les avant d’enregistrer à nouveau.',
    chooseForceMode: 'Choisir un mode de traitement',
    confirmForceClose: 'Clôturer l’achat {{name}} ?',
    confirmPricing: 'Confirmer le devis de {{name}} ?',
    confirmCancelOrder: 'Annuler la commande {{name}} ?',
    priceWillReturn:
      'Le prix dépasse l’estimation de plus de 20 %. La demande est renvoyée au demandeur pour confirmation avant l’examen financier.',
    pricingSubmitConsequence:
      'La soumission fige ce devis pour l’étape d’approbation suivante et ajuste la réservation budgétaire.',

    new: 'Nouvel achat',
    edit: 'Modifier l’achat',
    saved: 'Achat enregistré',
    formDescription:
      'Décrivez les articles, l’objet et l’estimation. La soumission réserve le budget du service principal pour l’année calendaire actuelle de l’entreprise.',
    primaryDepartment: 'Service principal : {{department}}',
    yearHint:
      'L’année de soumission suit le calendrier de l’entreprise ({{timeZone}}).',
    departmentMissing: 'Aucun service principal',
    department: 'Service',
    departmentPending: 'Déterminé à la soumission',
    departmentUnavailable: 'Service indisponible',
    budgetYear: 'Année budgétaire',
    purpose: 'Objet',
    subject: 'Poste budgétaire',
    selectSubject: 'Sélectionner un poste budgétaire',
    estimated: 'Montant estimé',
    actual: 'Prix réel',
    actualAmount: 'Prix réel (yuans)',
    yuan: 'yuans',
    expectedDate: 'Date de livraison prévue',
    suggestedVendor: 'Fournisseur suggéré',
    selectedVendor: 'Fournisseur sélectionné',
    vendor: 'Fournisseur',
    vendorUnavailable: 'Fournisseur indisponible',
    noSuggestedVendor: 'Aucun fournisseur suggéré',
    vendorInactive: 'Choisir un fournisseur actif',
    subjectInactive: 'Choisir un poste budgétaire actif',
    disabled: 'Désactivée',
    inactive: 'Inactif',
    fieldInvalid: 'Vérifiez ce champ',
    amountInvalid:
      'Saisissez un montant positif avec au maximum deux décimales',
    amountHint: 'Utilisez au maximum deux décimales.',
    dateInvalid: 'Choisissez une date valide',
    items: 'Articles d’achat',
    itemName: 'Nom de l’article',
    itemNumber: 'Article {{number}}',
    specification: 'Spécification',
    quantity: 'Quantité',
    unit: 'Unité',
    quantityInvalid:
      'Saisissez une quantité positive ; les décimales sont prises en charge',
    quantityHint:
      'Les quantités décimales sont prises en charge, par exemple 1,5 kg.',
    addItem: 'Ajouter un article',
    removeItem: 'Retirer l’article',
    reserveHint:
      'Les brouillons ne réservent pas de budget. La soumission crée la réservation.',
    loadLatest: 'Charger la dernière demande',
    unknownCreate:
      'Le résultat de l’enregistrement est incertain. Toute autre création est bloquée. Cherchez le brouillon dans le centre de tâches.',
    unknownEdit:
      'Le résultat de l’enregistrement est incertain. Chargez la dernière demande avant de continuer.',
    unknownPricing:
      'Le résultat est incertain et le formulaire verrouillé. Réessayer envoie le contenu et l’identifiant de requête identiques.',
    quotes: 'Justificatif de devis',
    quoteEvidence: 'Devis justificatif du fournisseur',
    quoteEvidenceDescription:
      'Téléversez un justificatif pour chaque fournisseur. Les justificatifs existants peuvent être réutilisés si les exigences sont inchangées. Au-delà du seuil figé de devis, les justificatifs de trois fournisseurs distincts sont requis.',
    addQuote: 'Ajouter un devis fournisseur',
    removeQuote: 'Retirer la sélection du devis',
    threeQuotesRequired:
      'Au-delà du seuil de devis, fournissez les devis joints de trois fournisseurs distincts.',
    selectExistingQuote: 'Sélectionner un devis existant : {{filename}}',
    refreshQuotes: 'Actualiser les devis existants',
    completePricing: 'Terminer la tarification',
    forcePricing: 'Action administrative d’achat',
    forceMode: 'Mode d’action',
    forcePriced: 'Soumettre les résultats complets pour approbation financière',
    forceClose: 'Forcer la clôture sans commande',
    forceCloseDescription:
      'La clôture forcée libère la réservation budgétaire et enregistre le motif administratif. Elle ne déclare pas l’achat ou la réception terminé et ne crée aucune commande.',
    priceConfirmationDescription:
      'Les prix supérieurs à 120 % de l’estimation sont renvoyés au demandeur pour confirmation. Les autres résultats passent en approbation financière.',
    confirmPriceHint:
      'Le prix dépasse 120 % de l’estimation. Vérifiez-le et soumettez à nouveau pour confirmer.',
    handler: 'Responsable des achats',
    forcedClosedHint:
      'Un administrateur a forcé la clôture de cette demande. La réservation est libérée et aucune commande ni réception n’a été créée.',
    actualHold: 'Réservation budgétaire actuelle',
    holdHint:
      'L’approbation conserve la réservation budgétaire. Le budget est réglé lorsque le demandeur confirme la réception.',
    order: 'Commande d’achat',
    orderHint:
      'La commande fige le prix approuvé, le fournisseur et les articles. La réception et le paiement sont suivis séparément.',
    openOrder: 'Ouvrir la commande',
    mergedTitle: 'Approbations adjacentes fusionnées',
    merged:
      '{{name}} a personnellement terminé l’étape adjacente ; l’approbation par la même personne a été fusionnée.',
    authz: {
      orderScope: 'Commandes d’achats que cet utilisateur peut lire',
      resource: 'Achats',
      submit: 'Soumettre des achats',
      view: 'Consulter les achats',
      orders: 'Consulter les commandes d’achat',
      accept: 'Confirmer la réception',
    },
    errors: {
      insufficient:
        'Le budget disponible est insuffisant. Contactez le responsable du budget.',
      inactive: 'Le demandeur est inactif.',
      configuration:
        'La configuration d’approbation n’est pas prise en charge. Contactez un administrateur.',
      invalid: 'Vérifiez les champs surlignés.',
    },
    states: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Approbation du service',
      purchasing: 'Traitement des achats',
      exception: 'Exception d’achat',
      finance: 'Approbation financière',
      executive: 'Approbation de la direction',
      gm: 'Approbation de la direction générale',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      forcedClosed: 'Clôturé de force',
    },
    stages: {
      draft: 'Brouillon',
      revision: 'Révision',
      head: 'Approbation du service',
      purchasing: 'Traitement des achats',
      exception: 'Exception d’achat',
      finance: 'Approbation financière',
      executive: 'Approbation de la direction',
      gm: 'Approbation de la direction générale',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      withdrawn: 'Retiré',
      terminated: 'Clôturé',
      forcedClosed: 'Clôturé de force',
    },
    actions: {
      claim: 'Prendre en charge',
      release: 'Libérer la prise en charge',
      complete: 'Terminer la tarification',
      unable: 'Impossible d’acheter',
      forceComplete: 'Action administrative',
      cc: 'Mettre en copie',
    },
    ledgerTitle: 'Registre des commandes d’achat',
    ledgerDescription:
      'Examinez les commandes d’achat approuvées, le statut des réceptions et les paiements enregistrés. La réception règle le budget ; les paiements sont enregistrés séparément.',
    orderNumber: 'Numéro de commande',
    emptyOrders: 'Aucune commande d’achat dans votre périmètre',
    pendingPayments: 'Paiements en attente (yuans)',
    paidPayments: 'Montant payé (yuans)',
    receiptDate: 'Date de réception',
    acceptedBy: 'Réception confirmée par',
    receiptReason: 'Notes de réception',
    confirmReceipt: 'Confirmer la réception',
    cancelOrder: 'Annuler la commande',
    orderSaved: 'Commande mise à jour',
    unknownOrderAction:
      'Le résultat est incertain. Le formulaire est verrouillé ; réessayer envoie le contenu et l’identifiant de requête identiques.',
    receiptSettlementHint:
      'La confirmation règle la réservation budgétaire de la commande. Elle ne signifie pas que le fournisseur a été payé. La réception confirmée est immuable.',
    cancelOrderHint:
      'Seuls les administrateurs des approbations peuvent annuler une commande non reçue sans montant en attente ou payé. L’annulation libère la réservation budgétaire et enregistre le motif.',
    orderStates: {
      awaitingReceipt: 'En attente de réception',
      accepted: 'Reçu',
      cancelled: 'Annulé',
    },
    actionTitle: '{{action}} l’achat « {{name}} »',
    completed: '{{action}} terminé pour l’achat « {{name}} »',
    quoteBasisChanged:
      'Les exigences d’achat ont changé. Vos saisies du brouillon sont conservées, mais les devis justificatifs doivent correspondre aux dernières exigences.',
    frozenRules: 'Règles appliquées à la soumission',
    frozenRulesHint:
      'Seuls les montants strictement supérieurs à ces seuils nécessitent les devis justificatifs ou étapes d’approbation correspondants. Les modifications de règles ultérieures ne changent pas cette soumission.',
    ruleLabels: {
      purchase_quotes: 'Seuil des devis de trois fournisseurs',
      spend_vp: 'Seuil d’approbation de la direction',
      spend_gm: 'Seuil d’approbation de la direction générale',
    },
    staleQuoteUpload:
      'La version de traitement a changé. Actualisez la demande avant de téléverser des devis justificatifs.',
    ordersTitle: 'Commandes d’achat',
  },
};
