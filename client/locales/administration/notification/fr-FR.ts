import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Notifications',
    logs: 'Journaux de notifications',
  },
  logs: {
    retry: 'Réessayer',
    limitNotice:
      'Seules les {{count}} dernières notifications sont affichées ; les totaux portent sur ces enregistrements.',
    deliveryOperations: 'Opérations de distribution',
    recipeDescription:
      'Suivez chaque transmission à un canal et chaque tentative du fournisseur.',
    redacted:
      'Le contenu des messages, les destinataires et les jetons de réservation sont masqués.',
    providerAttempts: 'Tentatives des fournisseurs',

    eyebrow: 'Notifications',
    title: 'Journaux de notifications',
    description:
      'Suivez la distribution des notifications et chaque tentative du fournisseur. Le contenu des messages, les destinataires et les jetons de réservation sont masqués.',
    refreshing: 'Actualisation…',
    refresh: 'Actualiser',
    deliveriesShown: 'Distributions affichées',
    needAttention: 'À surveiller',
    unavailable: 'Journaux indisponibles',
    recent: 'Notifications récentes',
    loading: 'Chargement de l’historique de distribution…',
    emptyTitle: 'Aucune distribution',
    emptyDescription:
      'Les enregistrements de distribution apparaîtront ici après l’envoi des notifications.',
    expand: 'Développer la notification',
    collapse: 'Réduire la notification',
    noDeliveries: 'Aucune distribution enregistrée.',
    noAttempts: 'Aucune tentative enregistrée.',
    columns: {
      source: 'Source',
      notificationId: 'Identifiant de notification',
      status: 'Statut',
      deliveries: 'Distributions',
      created: 'Créé',
      channel: 'Canal',
      provider: 'Fournisseur',
      attempts: 'Tentatives',
      updated: 'Mis à jour',
    },
  },
  status: {
    pending: 'En attente',
    processing: 'Traitement en cours',
    completed: 'Terminé',
    partial: 'Partiel',
    failed: 'Échec',
    unknown: 'Inconnu',
    preparing: 'Préparation',
    submitting: 'Envoi en cours',
    retrying: 'Nouvelle tentative',
    accepted: 'Accepté',
  },
  errors: {
    forbidden: 'L’accès a été supprimé. Contactez un administrateur.',
    notFound:
      'Ces enregistrements sont indisponibles. Revenez à votre espace de travail.',
    providerFailed:
      'La distribution a échoué. Vérifiez les paramètres du canal ou contactez un administrateur.',
    requestFailed: 'La demande de notification a échoué.',
    inAppRecipientNotFound:
      'Le destinataire de la notification interne n’existe pas.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
