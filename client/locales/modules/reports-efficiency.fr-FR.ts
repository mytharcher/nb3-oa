export default {
  exported: 'Le téléchargement Excel a commencé.',
  title: 'Temps écoulé des tâches de décision de congé',
  description:
    'Tâches de décision de congé terminées : de la création à la clôture en millisecondes calendaires, attentes et nouvelles soumissions historiques comprises ; regroupées par mois de début de la demande d’origine, hors temps ouvré, SLA, taux de retour ou durée du processus complet.',
  year: 'Année de début',
  month: 'Mois de début (facultatif)',
  clear: 'Effacer les filtres',
  export: 'Exporter en Excel',
  exporting: 'Exportation…',
  refresh: 'Actualiser',
  selectYear:
    'Choisissez l’année de début de la demande d’origine pour charger ce rapport.',
  invalid:
    'Saisissez une année de 1900 à 9998 et un mois facultatif de 1 à 12.',
  forbidden:
    'Les autorisations actuelles sur les congés ou champs ne permettent pas ce rapport. Contactez un administrateur.',
  precondition:
    'La limite des sources ou la vérification des horodatages de tâches a échoué. Réduisez la période année/mois ou demandez à un administrateur de vérifier les horodatages sources.',
  failed: 'Impossible de charger le rapport. Réessayez.',
  retry: 'Réessayer',
  exportFailed: 'L’export Excel a échoué. Réessayez.',
  empty: 'Aucune tâche de décision terminée',
  noResults: 'Aucune tâche ne correspond à ce mois',
  emptyHint:
    'Seules les tâches de décision terminées des demandes de congé actuellement lisibles sont comptées. Choisissez une autre année ou un autre mois de début.',
  total: '{{count}} groupes d’étapes',
  generatedAt: 'Généré {{value}}',
  previous: 'Précédent',
  next: 'Suivant',
  fields: {
    stage: 'Étape',
    completedTaskCount: 'Tâches de décision terminées',
    totalElapsedMs: 'Total du temps calendaire écoulé en ms',
    averageElapsedMs: 'Temps calendaire moyen écoulé en ms',
  },
  stages: { manager: 'Responsable', head: 'Chef de service', hr: 'RH' },
};
