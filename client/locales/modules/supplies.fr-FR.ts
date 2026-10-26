export default {
  supplies: {
    namedRowActions: 'Actions pour {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS:
        'Ajoutez au moins un article et indiquez son objet.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Un article sélectionné est indisponible. Sélectionnez à nouveau un article actif.',
      SUPPLY_CONTENT_CHANGED:
        'Les articles approuvés ont changé. Actualisez la demande avant d’enregistrer la remise.',
    },

    rowActions: 'Enregistrer les actions',
    number: 'Numéro de demande de fournitures',
    unknownEdit:
      'Le résultat de l’enregistrement est incertain. Chargez la dernière demande avant de la modifier à nouveau.',
    emptyCatalog:
      'Aucun article de bureau actif n’est configuré. Contactez l’administration.',
    ledgerDetail: 'Enregistrement de remise',
    ledgerDescription:
      'Quantités enregistrées et clôtures administratives. Les quantités non confirmées ne prouvent pas la livraison.',
    entryMissing: 'Cet enregistrement de remise est indisponible.',
    authz: {
      resource: 'Demandes de fournitures',
      ledger: 'Lire le registre de remise des fournitures',
    },
    navigation: 'Registre des fournitures',
    new: 'Nouvelle demande de fournitures',
    edit: 'Modifier la demande de fournitures',
    formDescription:
      'Choisissez les articles et quantités. Votre responsable approuve la demande avant la remise par l’administration.',
    purpose: 'Objet',
    item: 'Article',
    items: 'Articles demandés',
    quantity: 'Quantité',
    quantityValue: 'Quantité : {{quantity}}',
    chooseItem: 'Choisir un article',
    line: 'Article {{number}}',
    remove: 'Retirer l’article {{number}}',
    addItem: 'Ajouter un article',
    quantityInvalid: 'Saisissez une quantité entière de 1 à 100 000.',
    duplicate: 'Choisissez chaque article une seule fois.',
    emailInvalid: 'Saisissez une adresse e-mail valide.',
    printRequired:
      'Complétez les informations requises pour l’impression des cartes de visite.',
    print: {
      name: 'Nom',
      title: 'Intitulé du poste',
      phone: 'Téléphone',
      email: 'E-mail',
      address: 'Adresse',
      department: 'Service (facultatif)',
    },
    approvedAt: 'Heure d’approbation du responsable',
    issuingStage: 'Remise administrative',
    resubmitHint:
      'Soumettre à nouveau des articles et un objet inchangés renvoie à l’administration. Leur modification nécessite à nouveau l’approbation du responsable. L’approbation précédente reste dans l’historique.',
    forcedHint:
      'Un administrateur des approbations a clôturé cette demande sans confirmer la remise physique. Les quantités réelles ne sont pas confirmées.',
    uncertainCreate:
      'Le résultat de l’enregistrement est incertain. Fermez et consultez Mes demandes avant de créer un autre brouillon.',
    invalid:
      'Vérifiez l’objet, les articles choisis et les quantités entières.',
    itemUnavailable:
      'Un article est désactivé ou absent. Actualisez avant de soumettre un contenu modifié.',
    inactive: 'Un dossier d’employé actif est requis.',
    configuration:
      'Impossible de soumettre l’approbation. Contactez un administrateur pour vérifier les délais d’approbation.',
    contentChanged:
      'Le contenu ne correspond plus à la demande approuvée. Chargez la dernière version.',
    reasonRequired: 'Indiquez un motif.',
    actions: {
      claim: 'Prendre en charge la remise',
      release: 'Libérer la prise en charge',
      assign: 'Attribuer un responsable',
      complete: 'Confirmer la délivrance',
      unable: 'Impossible à délivrer',
      forceComplete: 'Forcer la clôture',
    },
    actionHints: {
      complete:
        'Confirmez que chaque article demandé a été physiquement remis dans la quantité totale demandée. Cette action écrit dans le registre des remises.',
      unable:
        'Expliquez le manque de stock ou tout autre motif empêchant la remise. L’approbation du responsable est conservée.',
      release:
        'Libérez cette prise en charge pour permettre à un autre responsable administratif de la reprendre.',
      forceComplete:
        'Clôturer par décision administrative sans confirmer la livraison. Les quantités réelles seront enregistrées comme non confirmées. Un motif est requis.',
    },
    states: {
      issuing: 'En attente de remise',
      exception: 'Exception de délivrance',
      issued: 'Remis',
      forcedClosed: 'Clôturé administrativement',
    },
    ledgerTitle: 'Registre de remise des fournitures',
    requestedQuantity: 'Quantité demandée',
    actualQuantity: 'Quantité réelle',
    outcome: 'Résultat',
    recipient: 'Destinataire',
    issuer: 'Responsable du traitement',
    unconfirmed: 'Non confirmé',
    reason: 'Motif',
    emptyLedger: 'Aucun enregistrement de remise',
    viewRequest: 'Consulter la demande de fournitures',
  },
};
