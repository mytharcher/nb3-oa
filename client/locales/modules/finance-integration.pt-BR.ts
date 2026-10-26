export default {
  financeIntegration: {
    title: 'Sistema financeiro',
    readPermission: 'Visualizar sincronização financeira',
    sendPermission: 'Enviar e conciliar lançamentos financeiros',
    send: 'Enviar ao sistema financeiro',
    resend: 'Repetir envio',
    lookup: 'Verificar resultado externo',
    reload: 'Atualizar status salvo',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    confirmSend: 'Enviar',
    confirmTitle: 'Enviar esta solicitação paga ao sistema financeiro?',
    confirmDescription:
      'Os dados contábeis aprovados serão enviados ao sistema financeiro conectado. Isto não faz outro pagamento. Uma nova tentativa reutiliza a mesma referência de negócio.',
    notConfigured:
      'Nenhum gateway financeiro foi conectado. Peça ao administrador que conclua a conexão.',
    loadFailed:
      'Não foi possível carregar o status financeiro. Verifique seu acesso ou tente novamente.',
    actionFailed:
      'Não foi possível confirmar a operação. Atualize o status antes de tentar novamente.',
    conflict:
      'Os dados contábeis ou o destino mudaram após o primeiro envio. Concilie o lançamento existente com o financeiro antes de prosseguir.',
    confirmBeforeRetry:
      'O recebimento não comprova a contabilização. Verifique o resultado externo; se necessário, repita a mesma requisição.',
    voucher: 'Comprovante externo: {{number}}',
    states: {
      not_sent: 'Não enviado',
      sending: 'Enviando ou verificando resultado',
      accepted:
        'Recebido pelo sistema financeiro; contabilização não confirmada',
      posted: 'Comprovante criado',
      rejected: 'Rejeitado pelo sistema financeiro',
      unknown: 'O resultado precisa de confirmação',
    },
    results: {
      transport:
        'A conexão terminou antes que fosse possível confirmar o resultado.',
      unconfirmed: 'O sistema financeiro não retornou um resultado confirmado.',
      invalid_receipt:
        'Não foi possível associar o recebimento a esta solicitação.',
      not_found:
        'Nenhum registro externo encontrado nesta verificação. Um recebimento anterior continua válido.',
      invalid_mapping:
        'O mapeamento de contas financeiras ou fornecedores precisa de atenção.',
      invalid_document: 'O sistema financeiro rejeitou os dados do documento.',
      duplicate_source:
        'Um lançamento externo já usa esta referência de negócio.',
      accounting_period_closed: 'O período contábil está encerrado.',
      other: 'Peça ao financeiro que revise o resultado externo.',
    },
  },
};
