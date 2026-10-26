import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  authorization: { title: 'Planifications', read: 'Lire' },
  nav: { automation: 'Automatisation', schedules: 'Tâches planifiées' },
  page: {
    refresh: 'Actualiser',
    retry: 'Réessayer',
    clearFilters: 'Effacer les filtres',
    saved: 'Planification « {{name}} » mise à jour',
    limitNotice: 'Seuls les {{count}} derniers déclenchements sont affichés.',
    scheduleNames: {
      annualLeave: 'Acquisition automatique des congés annuels',
      assetBorrow: 'Rappels de retour des biens empruntés',
      departure: 'Exécution du départ',
      probation: 'Rappels de fin de période d’essai',
      sealReturn: 'Rappels de restitution des sceaux',
      vendorQualification:
        'Rappels d’expiration des qualifications fournisseurs',
      expenseAuthorization:
        'Libérer les autorisations de dépenses approuvées expirées',
      loan: 'Rappels de remboursement des avances',
    },
    title: 'Tâches planifiées',
    description:
      'Surveillez les tâches planifiées et gérez leurs horaires d’exécution.',
    filters: {
      searchLabel: 'Rechercher des planifications',
      searchPlaceholder:
        'Rechercher un nom, un type de cible ou une planification…',
      statusLabel: 'Filtrer par statut',
      targetLabel: 'Filtrer par type de cible',
      allStatuses: 'Tous les statuts',
      allTargets: 'Tous les types de cibles',
    },
    statuses: {
      active: 'Active',
      paused: 'En pause',
      inactive: 'Inactif',
      targetIssue: 'Problème de cible',
    },
    actions: { enable: 'Activer', disable: 'Désactiver' },
    columns: {
      name: 'Nom',
      scheduleTimezone: 'Planification / fuseau horaire',
      triggered: 'Déclenché',
      nextRun: 'Prochain déclenchement',
      target: 'Cible',
      status: 'Statut',
    },
    targets: {
      workflow: 'Processus',
    },
    targetStates: {
      ready: 'Prêt',
      disabled: 'Désactivée',
      missing: 'Manquant',
      invalid: 'Invalide',
    },
    pagination: {
      previous: 'Précédent',
      next: 'Suivant',
      summary: 'Page {{page}} sur {{total}}',
    },
    loading: 'Chargement des tâches planifiées…',
    empty: 'Aucune tâche planifiée définie.',
    noMatches: 'Aucune tâche planifiée ne correspond à ces filtres.',
    details: {
      back: 'Retour aux tâches planifiées',
      loading: 'Chargement des détails de la planification…',
      notFound: 'La tâche planifiée est introuvable.',
      overview: 'Vue d’ensemble',
      triggers: 'Historique d’exécution',
      schedule: 'Planification',
      frequency: 'Fréquence',
      timezone: 'Fuseau horaire',
      nextRun: 'Prochaine exécution',
      lastTrigger: 'Dernier déclenchement',
      triggerCount: 'Nombre de déclenchements',
      inactiveReason: 'Motif d’inactivité',
      target: 'Cible d’exécution',
      targetName: 'Cible',
      targetType: 'Type de cible',
      description: 'Description',
      targetIssueTitle: 'La cible d’exécution est indisponible',
      targetIssueBody:
        'Cette planification définie dans le code ne peut pas se déclencher tant que sa cible n’est pas à nouveau disponible.',
    },
    triggersLoading: 'Chargement des déclenchements…',
    triggersEmpty: 'Aucun déclenchement n’a commencé.',
    triggerColumns: {
      startedAt: 'Heure d’exécution',
      duration: 'Durée',
      status: 'Statut',
      target: 'Cible d’exécution',
    },
    triggerStatuses: {
      pending: 'En attente',
      running: 'En cours d’exécution',
      waiting: 'En attente de la cible',
      succeeded: 'Réussi',
      triggered: 'Déclenché (résultat inconnu)',
      skipped: 'Ignoré',
      failed: 'Échec',
      cancelled: 'Annulé',
      timed_out: 'Délai dépassé',
    },
    reasons: {
      definition_removed: 'La définition de la planification a été supprimée',
      'target-not-found': 'La cible d’exécution est introuvable',
      'target-disabled': 'La cible d’exécution est désactivée',
      'target-missing': 'La cible d’exécution est manquante',
      'target-invalid': 'La cible d’exécution est invalide',
      'target-unavailable': 'La cible d’exécution est indisponible',
      'invalid-config': 'Configuration de cible invalide',
      'invalid-input': 'Entrée de processus invalide',
      'artifact-unavailable': 'L’artefact de processus est indisponible',
      'dispatch-failed': 'Impossible de distribuer l’exécution',
      'execution-timeout': 'Le délai d’exécution a été dépassé',
      'execution-cancelled': 'L’exécution a été annulée',
      'execution-failed': 'L’exécution a échoué',
      'reference-type-mismatch':
        'Le type de référence d’exécution ne correspond pas',
      'run-not-found': 'L’enregistrement d’exécution est introuvable',
      'observer-failed': 'Impossible d’observer le résultat de l’exécution',
      'observer-unavailable':
        'L’observateur du résultat d’exécution est indisponible',
    },
    inProgress: 'En cours',
    viewTarget: 'Consulter',
    invalidSchedule: 'Planification invalide',
    unavailable: '—',
  },
  errors: {
    forbidden: 'L’accès a été supprimé. Contactez un administrateur.',
    notFound:
      'Ces enregistrements sont indisponibles. Revenez à votre espace de travail.',
    toggleFailed:
      'Impossible de modifier la planification. Veuillez réessayer.',
    loadSchedules: 'Impossible de charger les tâches planifiées.',
    loadOccurrences: 'Impossible de charger les déclenchements.',
  },
};

/** English is the source of truth for this plugin's locale shape. */
export type SchedulerResource = LocaleResource<typeof enUS>;

export default enUS;
