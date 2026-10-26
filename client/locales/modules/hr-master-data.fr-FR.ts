export default {
  hrMasterData: {
    mappingSearch:
      'Trouver un enregistrement associé par identifiant externe exact (100 derniers affichés sans filtre)',
    title: 'Synchronisation RH',
    description:
      'Recevez les données de référence de l’organisation et des employés depuis une passerelle d’intégration approuvée. Des liaisons de comptes existantes sont requises ; la synchronisation n’active pas la connexion.',
    read: 'Consulter la synchronisation',
    sync: 'Synchroniser et rejouer',
    manage: 'Gérer les sources et la propriété',
    addSource: 'Ajouter une source',
    editSource: 'Modifier la source',
    sourceCode: 'Code source (lettres minuscules, chiffres et traits d’union)',
    sourceName: 'Nom de la source',
    principal: 'Compte d’intégration autorisé',
    enabled: 'Activé',
    disabled: 'Désactivée',
    noSources: 'Aucune source RH n’est configurée pour votre compte.',
    recent: 'Synchronisation récente',
    latest: 'Affichage des 50 derniers lots de cette source.',
    items_one: '{{count}} enregistrement',
    items_other: '{{count}} enregistrements',
    actions: 'Actions',
    replay: 'Réessayer le lot d’origine',
    refresh: 'Actualiser',
    noRuns: 'Aucun lot reçu pour le moment.',
    mappings: 'Enregistrements associés',
    revision: 'Révision {{revision}}',
    reclaim: 'Rétablir la propriété externe',
    reclaimHelp:
      'Les modifications locales sont protégées. Le rétablissement de la propriété permet à la source externe de remplacer ces champs à la prochaine mise à jour valide. Examinez d’abord l’enregistrement local et expliquez votre décision.',
    confirmReclaim: 'Confirmer la propriété externe',
    reason: 'Motif',
    cancel: 'Annuler',
    save: 'Enregistrer',
    failed:
      'L’opération a échoué. Vérifiez vos autorisations et les paramètres source, puis réessayez.',
    localConflict:
      'Cet enregistrement a été modifié localement. Les RH doivent l’examiner et rétablir explicitement la propriété externe avant de réessayer.',
    businessConflict:
      'Un enregistrement n’a pas pu être appliqué. Corrigez les données sources ou résolvez la restriction métier, puis réessayez le lot d’origine.',
    states: { pending: 'En attente', completed: 'Terminé', failed: 'Échec' },
    entities: {
      department: 'Service',
      grade: 'Grade',
      employee: 'Employé',
    },
  },
};
