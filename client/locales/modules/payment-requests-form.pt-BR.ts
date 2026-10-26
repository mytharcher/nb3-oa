export default {
  paymentRequestsForm: {
    new: 'Nova solicitação de pagamento',
    edit: 'Editar solicitação de pagamento',
    description:
      'Envie a solicitação completa ou salve um rascunho. Os dados de negócio obrigatórios são verificados novamente no envio.',
    save: 'Salvar rascunho',
    saved: 'Rascunho de pagamento salvo',
    draft: 'Rascunho',
    maxFiles: 'Selecione no máximo 10 arquivos comprobatórios.',
    limit: 'Este texto excede o limite de tamanho.',
    required: 'Este campo é obrigatório.',
    amountInvalid:
      'Informe um valor não negativo com até duas casas decimais, dentro do intervalo exato de centavos suportado.',
    invalid: 'Verifique este campo.',
    notEditable: 'Este registro não está mais disponível para edição.',
    inactive: 'Indisponível — escolha uma opção elegível',
    select: 'Escolha uma opção',
    unknown:
      'O resultado não foi confirmado. Mantenha seus dados e repita exatamente a mesma requisição.',
    replay: 'Conciliar a requisição original',
    latest:
      'Versão mais recente carregada. Seus dados foram mantidos; compare-os com as opções de origem mais recentes antes de salvar novamente.',
    leaveReady:
      'Clique novamente no destino original para sair. Continuar editando cancela esta confirmação.',
    applicantId: 'Solicitante',
    reason: 'Motivo do pagamento',
    sourceMode: 'Origem da aprovação prévia',
    contract: 'Contrato',
    contractVersion: 'Versão do contrato',
    contractId: 'Contrato',
    counterparty: 'Contraparte do contrato',
    customerAccountHint:
      'Contratos de clientes não possuem conta bancária de fornecedor. Se necessário, a conta protegida poderá ser corrigida após o caixa informar uma exceção.',
    purchase: 'Pedido de compra aprovado',
    none: 'Sem aprovação prévia',
    purchaseOrderId: 'Pedido de compra',
    noPriorApprovalReason: 'Justificativa do pagamento sem aprovação prévia',
    vendorId: 'Beneficiário',
    amount: 'Valor (yuan)',
    invoiceNumber: 'Número da nota fiscal',
    paymentMethod: 'Forma de pagamento',
    orderStatus: 'Status do pedido',
    approved: 'Valor aprovado',
    paid: 'Já pago',
    pending: 'Pagamentos pendentes',
    available: 'Valor disponível',
    cents: 'centavos',
    overApproval:
      'Valores acima do limite cumulativo aprovado, incluindo pagamentos pendentes, exigem aprovação completa. Solicitações de pagamento excedente são permitidas.',
    frozenHint:
      'Origem, beneficiário, valor e nota fiscal são congelados no envio.',
    voucherAttachments: 'Comprovantes de pagamento',
    attachments: 'Comprovantes de nota fiscal',
    uploadHint:
      'PDF, JPEG, PNG ou WebP; até 5 MB. Remover uma seleção preserva o comprovante armazenado.',
    fileSize: 'Escolha um arquivo não vazio de até 5 MB.',
    fileType:
      'Escolha um arquivo PDF, JPEG, PNG ou WebP com a extensão correspondente.',
    selectEvidence: 'Selecionar comprovante armazenado / conciliar envio',
    uploading: 'Enviando ou lendo comprovantes…',
    uploadUnknown:
      'O resultado do envio não foi confirmado. Leia o comprovante armazenado e inspecione-o antes de enviar novamente. Não há repetição automática do envio.',
    emptyEvidence: 'Nenhum comprovante armazenado.',
    evidenceMissing:
      'Alguns comprovantes não estão mais acessíveis. Atualize ou verifique suas permissões.',
    removeEvidence: 'Remover {{name}} desta seleção',
    bank: {
      title: 'Conta privada do beneficiário',
      denied: 'Você não tem acesso a esta conta de pagamento.',
      missing: 'Nenhuma conta de pagamento foi capturada.',
      correct: 'Corrigir conta de pagamento',
      unavailable:
        'A correção da conta só está disponível ao solicitante ou criador durante o processamento de uma exceção.',
      bankName: 'Banco',
      bankAccount: 'Número da conta',
      bankAccountName: 'Titular da conta',
      reason: 'Motivo da correção',
      saved: 'Conta de pagamento corrigida',
      unknown:
        'O resultado da gravação não foi confirmado. Leia a conta mais recente e compare-a antes de enviar explicitamente de novo.',
      conflict:
        'A conta ou a versão do pagamento mudou. Carregue os dados mais recentes; suas edições foram mantidas.',
      reconciled:
        'Dados mais recentes carregados. Compare seus dados mantidos e confirme explicitamente qualquer nova gravação.',
    },
  },
};
