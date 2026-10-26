/** Every key the inbox looks up, so each locale is checked against the same list. */
export interface InboxLocale {
  readonly 'inbox.title': string;
  readonly 'inbox.description': string;
  readonly 'inbox.views.all': string;
  readonly 'inbox.views.todo': string;
  readonly 'inbox.kinds.label': string;
  readonly 'inbox.kinds.all': string;
  readonly 'inbox.kinds.decision': string;
  readonly 'inbox.kinds.info': string;
  readonly 'inbox.tabs.decision': string;
  readonly 'inbox.tabs.info': string;
  readonly 'inbox.clearFilter': string;
  readonly 'inbox.noMatchDescription': string;
  readonly 'inbox.readAll': string;
  readonly 'inbox.allRead': string;
  readonly 'inbox.loading': string;
  readonly 'inbox.loadFailed': string;
  readonly 'inbox.loadFailedDescription': string;
  readonly 'inbox.retry': string;
  readonly 'inbox.loadMore': string;
  readonly 'inbox.emptyAll': string;
  readonly 'inbox.empty.todo': string;
  readonly 'inbox.empty.decision': string;
  readonly 'inbox.empty.info': string;
  readonly 'inbox.emptyDescription': string;
  readonly 'inbox.unread': string;
  readonly 'inbox.unreadCount': string;
  readonly 'inbox.pendingDecisions': string;
  readonly 'inbox.resolved': string;
  readonly 'inbox.outcomes.approved': string;
  readonly 'inbox.outcomes.rejected': string;
  readonly 'inbox.outcomes.withdrawn': string;
  readonly 'inbox.count': string;
  readonly 'inbox.actionsFor': string;
  readonly 'inbox.actions.read': string;
  readonly 'inbox.actions.unread': string;
  readonly 'inbox.actions.delete': string;
  readonly 'inbox.deleted': string;
  readonly 'inbox.requestFailed': string;
  readonly 'inbox.forbidden': string;
  readonly 'inbox.nothingSelected': string;
  readonly 'inbox.back': string;
  readonly 'inbox.open': string;
  readonly 'inbox.keyMove': string;
  readonly 'inbox.keyOpen': string;
  readonly 'inbox.cancel': string;
  readonly 'inbox.request.approve': string;
  readonly 'inbox.request.reject': string;
  readonly 'inbox.request.commentPlaceholder': string;
  readonly 'inbox.request.commentFor': string;
  readonly 'inbox.request.quickSend': string;
  readonly 'inbox.request.newLine': string;
}

const enUS: InboxLocale = {
  'inbox.title': 'Boîte de réception',
  'inbox.description': 'Notifications et demandes qui vous sont adressées.',
  'inbox.views.all': 'Tout',
  'inbox.views.todo': 'À faire',
  'inbox.kinds.label': 'Type',
  'inbox.kinds.all': 'Tous les types',
  'inbox.kinds.decision': 'Décisions',
  'inbox.kinds.info': 'Notifications',
  'inbox.tabs.decision': 'Nécessite ma décision',
  'inbox.tabs.info': 'Notifications',
  'inbox.clearFilter': 'Effacer le filtre',
  'inbox.noMatchDescription': 'Effacez le filtre pour voir tous les types.',
  'inbox.readAll': 'Tout marquer comme lu',
  'inbox.allRead': 'Tous les éléments sont marqués comme lus.',
  'inbox.loading': 'Chargement',
  'inbox.loadFailed': 'Impossible de charger la boîte de réception',
  'inbox.loadFailedDescription': 'Vérifiez votre connexion et réessayez.',
  'inbox.retry': 'Réessayer',
  'inbox.loadMore': 'Charger plus',
  'inbox.emptyAll': 'Aucun élément ici',
  'inbox.empty.todo': 'Rien ne vous attend',
  'inbox.empty.decision': 'Aucune décision ne vous attend',
  'inbox.empty.info': 'Aucune notification',
  'inbox.emptyDescription':
    'Les notifications et demandes qui vous sont adressées apparaissent ici.',
  'inbox.unread': 'Non lu',
  'inbox.unreadCount': '{{count}} non lus',
  'inbox.pendingDecisions': '{{count}} en attente',
  'inbox.resolved': 'Traité',
  'inbox.outcomes.approved': 'Approuvé',
  'inbox.outcomes.rejected': 'Rejeté',
  'inbox.outcomes.withdrawn': 'Retiré',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Actions pour {{title}}',
  'inbox.actions.read': 'Marquer comme lu',
  'inbox.actions.unread': 'Marquer comme non lu',
  'inbox.actions.delete': 'Supprimer',
  'inbox.deleted': 'Supprimé.',
  'inbox.requestFailed': 'La requête a échoué. Réessayez.',
  'inbox.forbidden': 'Vous n’êtes pas autorisé à effectuer cette action.',
  'inbox.nothingSelected': 'Sélectionnez un élément pour le consulter',
  'inbox.back': 'Retour à la liste',
  'inbox.open': 'Ouvrir',
  'inbox.keyMove': 'Déplacer',
  'inbox.keyOpen': 'Ouvrir',
  'inbox.cancel': 'Annuler',
  'inbox.request.approve': 'Approuver',
  'inbox.request.reject': 'Rejeter',
  'inbox.request.commentPlaceholder': 'Écrivez quelque chose…',
  'inbox.request.commentFor': '{{action}} : {{title}}',
  'inbox.request.quickSend': 'pour envoyer',
  'inbox.request.newLine': 'pour un saut de ligne',
};

export default enUS;
