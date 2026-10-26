export default {
  wecomAttendance: {
    title: 'Source de présence WeCom',
    description:
      'Importez les pointages des employés associés et consultez les 30 dernières exécutions de synchronisation.',
    sync: 'Synchroniser',
    refresh: 'Actualiser',
    runs: 'Exécutions de synchronisation',
    retry: 'Réessayer',
    counts: 'Enregistrements validés : {{records}} · Lots : {{batches}}',
    runFailed:
      'Certains enregistrements n’ont pas pu être importés. Vérifiez les associations d’employés, les horaires attribués et l’accès à la source avant de réessayer. Les lots terminés sont conservés.',
    denied: 'Vous n’avez pas accès à la synchronisation de présence.',
    disabled:
      'La source est désactivée. Demandez à un administrateur de configurer l’application de présence dédiée.',
    unconfigured:
      'La source nécessite des identifiants et des associations explicites d’employés avant la synchronisation.',
    ready_one: 'Prêt à synchroniser {{count}} employé associé.',
    ready_other: 'Prêt à synchroniser {{count}} employés associés.',
    startedAt: 'Démarré {{time}}',
    empty: 'Aucune exécution de synchronisation.',
    rangeHint:
      'Sélectionnez jusqu’à sept jours calendaires locaux de l’entreprise terminés. Les enregistrements sources répétés ne sont pas dupliqués.',
    start: 'Date de début',
    end: 'Date de fin',
    reason: 'Motif',
    cancel: 'Annuler',
    syncing: 'Synchronisation…',
    states: {
      running: 'En cours',
      completed: 'Terminé',
      failed: 'Attention requise',
    },
  },
};
