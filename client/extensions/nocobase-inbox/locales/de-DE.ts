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
  'inbox.title': 'Posteingang',
  'inbox.description': 'An Sie gesendete Benachrichtigungen und Anfragen.',
  'inbox.views.all': 'Alle',
  'inbox.views.todo': 'Zu erledigen',
  'inbox.kinds.label': 'Typ',
  'inbox.kinds.all': 'Alle Arten',
  'inbox.kinds.decision': 'Entscheidungen',
  'inbox.kinds.info': 'Benachrichtigungen',
  'inbox.tabs.decision': 'Meine Entscheidung erforderlich',
  'inbox.tabs.info': 'Benachrichtigungen',
  'inbox.clearFilter': 'Filter zurücksetzen',
  'inbox.noMatchDescription':
    'Setzen Sie den Filter zurück, um alle Arten anzuzeigen.',
  'inbox.readAll': 'Alle als gelesen markieren',
  'inbox.allRead': 'Alle als gelesen markiert.',
  'inbox.loading': 'Wird geladen',
  'inbox.loadFailed': 'Posteingang konnte nicht geladen werden',
  'inbox.loadFailedDescription':
    'Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
  'inbox.retry': 'Erneut versuchen',
  'inbox.loadMore': 'Weitere laden',
  'inbox.emptyAll': 'Keine Einträge',
  'inbox.empty.todo': 'Nichts wartet auf Sie',
  'inbox.empty.decision': 'Keine ausstehenden Entscheidungen für Sie',
  'inbox.empty.info': 'Keine Benachrichtigungen',
  'inbox.emptyDescription':
    'An Sie gesendete Benachrichtigungen und Anfragen werden hier angezeigt.',
  'inbox.unread': 'Ungelesen',
  'inbox.unreadCount': '{{count}} ungelesen',
  'inbox.pendingDecisions': '{{count}} ausstehend',
  'inbox.resolved': 'Bearbeitet',
  'inbox.outcomes.approved': 'Genehmigt',
  'inbox.outcomes.rejected': 'Abgelehnt',
  'inbox.outcomes.withdrawn': 'Zurückgezogen',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Aktionen für {{title}}',
  'inbox.actions.read': 'Als gelesen markieren',
  'inbox.actions.unread': 'Als ungelesen markieren',
  'inbox.actions.delete': 'Löschen',
  'inbox.deleted': 'Gelöscht.',
  'inbox.requestFailed':
    'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
  'inbox.forbidden': 'Sie sind dazu nicht berechtigt.',
  'inbox.nothingSelected': 'Wählen Sie einen Eintrag aus, um ihn anzuzeigen',
  'inbox.back': 'Zurück zur Liste',
  'inbox.open': 'Öffnen',
  'inbox.keyMove': 'Verschieben',
  'inbox.keyOpen': 'Öffnen',
  'inbox.cancel': 'Abbrechen',
  'inbox.request.approve': 'Genehmigen',
  'inbox.request.reject': 'Ablehnen',
  'inbox.request.commentPlaceholder': 'Schreiben Sie etwas…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'zum Senden',
  'inbox.request.newLine': 'für eine neue Zeile',
};

export default enUS;
