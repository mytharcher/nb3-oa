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
  'inbox.title': 'Bandeja de entrada',
  'inbox.description': 'Notificaciones y solicitudes enviadas a ti.',
  'inbox.views.all': 'Todas',
  'inbox.views.todo': 'Pendientes',
  'inbox.kinds.label': 'Tipo',
  'inbox.kinds.all': 'Todos los tipos',
  'inbox.kinds.decision': 'Decisiones',
  'inbox.kinds.info': 'Notificaciones',
  'inbox.tabs.decision': 'Requieren mi decisión',
  'inbox.tabs.info': 'Notificaciones',
  'inbox.clearFilter': 'Borrar filtro',
  'inbox.noMatchDescription': 'Borra el filtro para ver todos los tipos.',
  'inbox.readAll': 'Marcar todo como leído',
  'inbox.allRead': 'Todo marcado como leído.',
  'inbox.loading': 'Cargando',
  'inbox.loadFailed': 'No se ha podido cargar la bandeja de entrada',
  'inbox.loadFailedDescription': 'Comprueba tu conexión y vuelve a intentarlo.',
  'inbox.retry': 'Reintentar',
  'inbox.loadMore': 'Cargar más',
  'inbox.emptyAll': 'No hay nada aquí',
  'inbox.empty.todo': 'No tienes nada pendiente',
  'inbox.empty.decision': 'No hay decisiones pendientes',
  'inbox.empty.info': 'No hay notificaciones',
  'inbox.emptyDescription':
    'Aquí aparecen las notificaciones y solicitudes que recibes.',
  'inbox.unread': 'Sin leer',
  'inbox.unreadCount': '{{count}} sin leer',
  'inbox.pendingDecisions': '{{count}} pendientes',
  'inbox.resolved': 'Gestionado',
  'inbox.outcomes.approved': 'Aprobado',
  'inbox.outcomes.rejected': 'Rechazado',
  'inbox.outcomes.withdrawn': 'Retirado',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Acciones para {{title}}',
  'inbox.actions.read': 'Marcar como leído',
  'inbox.actions.unread': 'Marcar como no leído',
  'inbox.actions.delete': 'Eliminar',
  'inbox.deleted': 'Eliminado.',
  'inbox.requestFailed': 'La solicitud ha fallado. Vuelve a intentarlo.',
  'inbox.forbidden': 'No tienes permiso para hacer esto.',
  'inbox.nothingSelected': 'Selecciona un elemento para verlo',
  'inbox.back': 'Volver a la lista',
  'inbox.open': 'Abrir',
  'inbox.keyMove': 'Mover',
  'inbox.keyOpen': 'Abrir',
  'inbox.cancel': 'Cancelar',
  'inbox.request.approve': 'Aprobar',
  'inbox.request.reject': 'Rechazar',
  'inbox.request.commentPlaceholder': 'Escribe algo…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'para enviar',
  'inbox.request.newLine': 'para una nueva línea',
};

export default enUS;
