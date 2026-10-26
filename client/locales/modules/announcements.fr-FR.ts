export default {
  announcements: {
    authz: {
      title: 'Annonces',
      owned: 'Publié par moi',
      readable: 'Mes publications et annonces reçues',
      view: 'Lire les annonces',
      create: 'Créer des brouillons d’annonces',
      edit: 'Modifier son propre brouillon',
      publish: 'Publier sa propre annonce',
      revoke: 'Retirer sa propre annonce',
      remind: 'Relancer les destinataires non confirmés',
      receipts: 'Consulter la liste de ses propres destinataires',
      confirm: 'Confirmer sa propre réception',
    },
    removeDepartment: 'Retirer le service « {{name}} »',

    confirmTitle: '{{action}} l’annonce « {{name}} » ?',
    discardNamed: 'Abandonner les modifications de l’annonce « {{name}} » ?',

    ownPendingCount: '{{count}} annonces attendent votre confirmation',
    title: 'Annonces',
    description: 'Lisez les annonces actuelles et confirmez leur réception',
    received: 'Reçu',
    mine: 'Publié par moi',
    publisher: 'Auteur de la publication',
    new: 'Nouvelle annonce',
    edit: 'Modifier l’annonce',
    detail: 'Détails de l’annonce',
    search: 'Rechercher dans le titre ou le contenu',
    clear: 'Effacer les filtres',
    refresh: 'Actualiser',
    empty: 'Aucune annonce',
    noMatches: 'Aucune annonce correspondante',
    cancel: 'Annuler',
    save: 'Enregistrer le brouillon',
    saving: 'Enregistrement',
    saved: 'Annonce « {{name}} » enregistrée',
    done: 'Annonce « {{name}} » mise à jour',
    timeZone: 'Fuseau horaire de l’entreprise',
    zoneHint:
      'Saisissez la période de validité dans le fuseau horaire de l’entreprise {{zone}}',
    requiresConfirmation: 'Confirmation requise',
    pinned: 'Épinglé',
    noConfirmation: 'Aucune confirmation requise',
    confirmed: 'Confirmé',
    pending: 'En attente de confirmation',
    publicationStatus: 'Statut de l’annonce',
    noOwnReceipt: 'Aucun accusé de réception ne vous est attribué',
    linkedKnowledge: 'Politique liée : {{title}} (version {{version}})',
    newVersion: 'Une version plus récente de la politique liée est disponible',
    attachments: 'Pièces jointes',
    upload: 'Ajouter une pièce jointe',
    uploading: 'Téléversement de la pièce jointe',
    includeFile: 'Inclure la pièce jointe {{name}}',
    fileLimit:
      'Jusqu’à 10 fichiers de 20 Mo maximum chacun : PDF, PNG, JPEG et TXT',
    saveBeforeUpload:
      'Enregistrez le brouillon, puis modifiez-le pour ajouter des pièces jointes',
    receipts: 'Accusés de réception des destinataires',
    recipient: 'Destinataire',
    receiptStatus: 'Statut de confirmation',
    confirmedAt: 'Date de confirmation',
    frozenRoster:
      'Les destinataires et leurs noms sont figés à la publication ; les changements de personnel ultérieurs préservent cet historique',
    searchRecipients: 'Rechercher un nom de destinataire',
    receiptCounts: 'En attente : {{pending}} · Confirmés : {{confirmed}}',
    noRecipients: 'Aucun destinataire correspondant',
    required: 'Ce champ est obligatoire',
    titleLimit: 'Le titre doit comporter au maximum 200 caractères',
    bodyLimit: 'Le contenu doit comporter au maximum 100000 caractères',
    invalidDate: 'Sélectionnez une date et une heure valides',
    invalidInterval: 'La fin doit suivre le début et se situer dans le futur',
    audienceRequired:
      'Choisissez tout le monde, un service ou un rôle de responsabilité',
    invalidField: 'Vérifiez ce champ',
    freezeHint:
      'La publication fige le contenu, le public, les pièces jointes et la liste des destinataires',
    allEmployees: 'Tout le monde',
    departments: 'Services, y compris leurs descendants actifs',
    selectedDepartment: 'Service sélectionné',
    remove: 'Retirer',
    dutyRoles: 'Rôles de responsabilité',
    rolesUnavailable:
      'Les options des rôles de responsabilité sont restreintes ; les sélections existantes sont conservées',
    knowledge: 'Document de politique lié',
    none: 'Aucun',
    knowledgeLimit: 'Affichage des 100 premiers documents lisibles',
    knowledgeRetained:
      'Les documents de politique sont restreints ; la référence existante est conservée et revérifiée lors de l’enregistrement et de la publication',
    unavailable:
      'Cette opération est indisponible ; fermez-la et actualisez les détails',
    failed: 'La requête a échoué ; réessayez plus tard',
    denied: 'L’accès est restreint ; revenez à la page source',
    missing:
      'L’enregistrement est introuvable ou n’est plus visible ; revenez à la liste',
    conflict:
      'L’enregistrement a changé ; chargez son contenu le plus récent avant de réessayer',
    back: 'Retour à la source',
    retry: 'Réessayer',
    loading: 'Chargement',
    loadLatest: 'Charger la dernière version',
    replaceDraft:
      'Le rechargement abandonnera votre saisie actuelle. Continuer ?',
    discard: 'Abandonner les modifications',
    discardDescription:
      'La fermeture abandonne les modifications non enregistrées',
    fields: {
      title: 'Titre',
      body: 'Contenu',
      status: 'Statut',
      validFrom: 'Début',
      validUntil: 'Fin',
      publishedAt: 'Date de publication',
    },
    status: {
      all: 'Tous les statuts',
      draft: 'Brouillon',
      scheduled: 'Planifié',
      published: 'Publié',
      revoked: 'Révoqué',
    },
    actions: {
      edit: 'Modifier',
      publish: 'Publier',
      revoke: 'Révoquer',
      remind: 'Relancer',
      confirm: 'Confirmer la réception',
    },
    consequence: {
      publish:
        'La publication fige le contenu, le public, les pièces jointes et les destinataires. Une date de début future planifie l’annonce.',
      revoke:
        'La révocation arrête la visibilité du public, les confirmations et les rappels tout en conservant les accusés de réception historiques.',
      remind:
        'Relancez uniquement les destinataires actuels admissibles n’ayant pas confirmé, en conservant la liste figée.',
      confirm: 'Confirmez avoir lu cette annonce.',
    },
    notice: {
      scheduled:
        'Cette annonce est planifiée ; les confirmations et rappels commenceront après son activation.',
      revoked:
        'Cette annonce est révoquée ; les accusés de réception historiques sont conservés.',
      expired:
        'Cette annonce est hors de sa période de validité ; les confirmations et rappels sont indisponibles.',
    },
    receipt: {
      all: 'Tous les accusés de réception',
      pending: 'En attente',
      confirmed: 'Confirmé',
    },
  },
};
