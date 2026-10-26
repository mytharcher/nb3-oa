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
  'inbox.title': 'Caixa de entrada',
  'inbox.description': 'Notificações e solicitações enviadas a você.',
  'inbox.views.all': 'Todos',
  'inbox.views.todo': 'A fazer',
  'inbox.kinds.label': 'Tipo',
  'inbox.kinds.all': 'Todos os tipos',
  'inbox.kinds.decision': 'Decisões',
  'inbox.kinds.info': 'Notificações',
  'inbox.tabs.decision': 'Precisa da minha decisão',
  'inbox.tabs.info': 'Notificações',
  'inbox.clearFilter': 'Limpar filtro',
  'inbox.noMatchDescription': 'Limpe o filtro para ver todos os tipos.',
  'inbox.readAll': 'Marcar tudo como lido',
  'inbox.allRead': 'Tudo marcado como lido.',
  'inbox.loading': 'Carregando',
  'inbox.loadFailed': 'Não foi possível carregar a caixa de entrada',
  'inbox.loadFailedDescription': 'Verifique sua conexão e tente novamente.',
  'inbox.retry': 'Tentar novamente',
  'inbox.loadMore': 'Carregar mais',
  'inbox.emptyAll': 'Nada aqui',
  'inbox.empty.todo': 'Nada aguardando você',
  'inbox.empty.decision': 'Nenhuma decisão aguardando você',
  'inbox.empty.info': 'Nenhuma notificação',
  'inbox.emptyDescription':
    'Notificações e solicitações enviadas a você aparecem aqui.',
  'inbox.unread': 'Não lido',
  'inbox.unreadCount': '{{count}} não lidas',
  'inbox.pendingDecisions': '{{count}} aguardando',
  'inbox.resolved': 'Processadas',
  'inbox.outcomes.approved': 'Aprovado',
  'inbox.outcomes.rejected': 'Rejeitado',
  'inbox.outcomes.withdrawn': 'Retirado',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Ações de {{title}}',
  'inbox.actions.read': 'Marcar como lido',
  'inbox.actions.unread': 'Marcar como não lido',
  'inbox.actions.delete': 'Excluir',
  'inbox.deleted': 'Excluído.',
  'inbox.requestFailed': 'A requisição falhou. Tente novamente.',
  'inbox.forbidden': 'Você não tem permissão para fazer isto.',
  'inbox.nothingSelected': 'Selecione um item para visualizá-lo',
  'inbox.back': 'Voltar à lista',
  'inbox.open': 'Abrir',
  'inbox.keyMove': 'Mover',
  'inbox.keyOpen': 'Abrir',
  'inbox.cancel': 'Cancelar',
  'inbox.request.approve': 'Aprovar',
  'inbox.request.reject': 'Rejeitar',
  'inbox.request.commentPlaceholder': 'Escreva algo…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'para enviar',
  'inbox.request.newLine': 'para uma nova linha',
};

export default enUS;
