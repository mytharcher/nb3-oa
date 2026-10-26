export default {
  electronicSignatures: {
    archivedHint:
      'O serviço de assinatura confirmou a conclusão. O PDF assinado e verificado foi arquivado com esta solicitação.',
    reference: 'Referência de assinatura: {{value}}',
    completedAction: 'Assinatura eletrônica arquivada',
    title: 'Assinatura eletrônica',
    readPermission: 'Visualizar documentos assinados',
    sendPermission: 'Enviar e recuperar assinatura',
    channel: 'Canal de execução',
    physical: 'Carimbo físico',
    electronic: 'Assinatura eletrônica',
    channelHint:
      'Escolha antes da aprovação. A assinatura eletrônica exige um PDF aprovado e não possui quantidade de cópias em papel.',
    hint: 'O PDF aprovado é enviado ao serviço de assinatura configurado. A conclusão só é confirmada após a verificação e o arquivamento do documento assinado.',
    notConfigured:
      'A assinatura eletrônica não foi conectada. Entre em contato com seu administrador.',
    notEligible:
      'A assinatura precisa de um documento aprovado e atual em PDF. Solicitações de carimbo eletrônico devem conter exatamente um PDF.',
    loadFailed:
      'Não foi possível carregar o status da assinatura ou você não pode visualizá-lo.',
    actionFailed:
      'Não foi possível concluir a ação. Atualize o status antes de tentar novamente.',
    retry: 'Tentar novamente',
    send: 'Enviar para assinatura',
    refresh: 'Verificar status / recuperar',
    open: 'Continuar assinatura',
    download: 'Baixar PDF assinado',
    recovery:
      'O resultado remoto ou o arquivo precisa de confirmação. Verifique o status para recuperar a mesma solicitação de assinatura.',
    signedAt: 'Assinado em {{at}}',
    confirmTitle: 'Enviar este PDF aprovado para assinatura?',
    confirmHint:
      'O serviço de assinatura configurado recebe o documento aprovado. Uma nova tentativa usa a mesma solicitação de assinatura.',
    cancel: 'Cancelar',
    states: {
      not_sent: 'Não enviado',
      pending: 'Envio pendente',
      sending: 'Enviando',
      accepted: 'Aceito pelo serviço de assinatura',
      signing: 'Aguardando assinaturas',
      unknown: 'Resultado aguardando confirmação',
      archivePending: 'Assinado — arquivo precisa de recuperação',
      archived: 'Documento assinado arquivado',
      rejected: 'Rejeitado pelo serviço de assinatura',
      cancelled: 'Cancelado pelo serviço de assinatura',
    },
  },
};
