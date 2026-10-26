export default {
  resourceTitle: 'Règles de restriction',
  navigation: { title: 'Règles de restriction' },
  restrictionRules: {
    noResources:
      'Aucune ressource métier prenant en charge les périmètres d’enregistrements n’a été définie. Demandez à l’IA de définir les autorisations métier et les périmètres d’enregistrements avant de configurer les règles ici.',
    page: {
      title: 'Règles de restriction',
      description:
        'Les règles de restriction réduisent l’accès en limitant les enregistrements accessibles aux utilisateurs sélectionnés, sans accorder elles-mêmes de droits.',
    },
    notice:
      'Les règles de restriction limitent uniquement les accès existants. Elles n’accordent jamais d’autorisations par elles-mêmes.',
    search: 'Rechercher par nom de règle, clé ou ressource',
    create: 'Nouvelle règle de restriction',
    ruleHeader: 'Règle',
    appliesToHeader: 'S’applique à',
    restrictedActionsHeader: 'Actions restreintes',
    allowedScopeHeader: 'Périmètre autorisé',
    emptyNone:
      'Aucune règle de restriction. Créez-en une pour limiter les accès des utilisateurs sélectionnés.',
    emptySearch: 'Aucune règle de restriction ne correspond à votre recherche.',
    pagerLabel: 'Règles de restriction',
    editTitle: 'Modifier la règle de restriction',
    newTitle: 'Nouvelle règle de restriction',
    editorDescription:
      'Limitez le périmètre effectif des enregistrements pour un public.',
    ruleHeading: 'Informations générales',
    ruleDescription:
      'Nommez la règle et choisissez la ressource à restreindre.',
    ruleName: 'Nom de la règle',
    assignmentsHeading: 'S’applique à',
    assignmentsDescription:
      'Choisissez les personnes soumises à cette restriction.',
    reason: 'Description',
    accessHeading: 'Actions et périmètre des enregistrements',
    accessDescription:
      'Définissez indépendamment le périmètre maximal des enregistrements pour chaque action.',
    deleteRule: 'Supprimer la règle',
    save: 'Enregistrer la règle de restriction',
    confirmDeleteTitle: 'Supprimer la règle « {{title}} » ?',
    confirmDeleteBody:
      'Supprimer la règle de restriction « {{title}} ». Les ensembles d’autorisations et règles restants détermineront l’accès.',
  },
};
