import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Notificações',
    logs: 'Registros de notificações',
  },
  logs: {
    retry: 'Tentar novamente',
    limitNotice:
      'Somente as {{count}} notificações mais recentes são exibidas; os totais abrangem esses registros.',
    deliveryOperations: 'Operações de entrega',
    recipeDescription:
      'Rastreie cada envio ao canal e cada tentativa do provedor.',
    redacted:
      'Corpos das mensagens, destinatários e tokens de concessão são ocultados.',
    providerAttempts: 'Tentativas do provedor',

    eyebrow: 'Notificações',
    title: 'Registros de notificações',
    description:
      'Rastreie a entrega das notificações e cada tentativa do provedor. Corpos das mensagens, destinatários e tokens de concessão são ocultados.',
    refreshing: 'Atualizando…',
    refresh: 'Atualizar',
    deliveriesShown: 'Entregas exibidas',
    needAttention: 'Precisam de atenção',
    unavailable: 'Registros indisponíveis',
    recent: 'Notificações recentes',
    loading: 'Carregando histórico de entregas…',
    emptyTitle: 'Nenhuma entrega ainda',
    emptyDescription:
      'Os registros de entrega aparecerão aqui após o envio de notificações.',
    expand: 'Expandir notificação',
    collapse: 'Recolher notificação',
    noDeliveries: 'Nenhuma entrega registrada.',
    noAttempts: 'Nenhuma tentativa registrada.',
    columns: {
      source: 'Origem',
      notificationId: 'ID da notificação',
      status: 'Status',
      deliveries: 'Entregas',
      created: 'Criado',
      channel: 'Canal',
      provider: 'Provedor',
      attempts: 'Tentativas',
      updated: 'Atualizado',
    },
  },
  status: {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    partial: 'Parcial',
    failed: 'Falhou',
    unknown: 'Desconhecido',
    preparing: 'Preparando',
    submitting: 'Enviando',
    retrying: 'Tentando novamente',
    accepted: 'Aceito',
  },
  errors: {
    forbidden: 'O acesso foi removido. Entre em contato com um administrador.',
    notFound: 'Estes registros estão indisponíveis. Volte à área de trabalho.',
    providerFailed:
      'A entrega falhou. Revise as configurações do canal ou entre em contato com um administrador.',
    requestFailed: 'A requisição de notificação falhou.',
    inAppRecipientNotFound: 'O destinatário da notificação interna não existe.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
