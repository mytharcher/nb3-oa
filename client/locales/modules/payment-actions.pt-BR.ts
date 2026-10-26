export default {
  actionForm: {
    uncertain:
      'O resultado não foi confirmado. Mantenha estes dados e repita a operação idêntica; não emita uma solicitação alterada.',
    replay: 'Repetir operação idêntica',
    title: '{{action}} a solicitação de pagamento “{{name}}”',
    unavailable:
      'Esta ação não está mais disponível. Leia a solicitação de pagamento mais recente.',
    unsupported:
      'Esta ação exige um contrato de entrada que esta página não suporta.',
    comment: 'Parecer ou motivo',
    person: 'Destinatário',
    mode: 'Posição do signatário',
    place: 'Posição de aprovação',
    returnTarget: 'Destino da devolução',
    voucher: 'Número do comprovante de pagamento',
    voucherHint:
      'Deixe vazio somente ao registrar uma liquidação administrativa sem comprovante.',
    amount: 'Valor do pagamento',
    amountConfirm: 'Confirmar valor exato do pagamento',
    voucherAttachments: 'Anexos do comprovante de pagamento',
    exactAmount: 'Informe o valor exato exibido acima.',
    confirm: 'Confirmar {{action}}',
    confirmDescription:
      'Confirme esta operação em “{{name}}”. Pagamento {{amount}}. {{consequence}}',
    releaseConsequence:
      'Isto libera reservas não liquidadas e não pode ser desfeito aqui.',
    returnConsequence:
      'A solicitação retorna para correção e o trabalho pendente atual é encerrado.',
    paymentConsequence:
      'Registre um pagamento efetivamente concluído usando seu comprovante.',
    forcedConsequence:
      'Registre uma liquidação administrativa; isto não inicia uma transferência bancária.',
    unableConsequence: 'A solicitação entra em uma exceção de processamento.',
    submitConsequence:
      'A solicitação entra em aprovação com os dados enviados congelados.',
    genericConsequence:
      'O servidor aplica a operação oferecida ao destino de aprovação selecionado.',
    latest: 'Ler versão mais recente',
    conflict:
      'A solicitação de pagamento mudou. Seus dados foram mantidos. Leia a versão mais recente, revise-a e confirme novamente.',
    completed: '{{action}} concluída para “{{name}}”',
    committed:
      'A operação foi concluída. Atualize a solicitação de pagamento antes de executar outra ação.',
    before: 'Antes',
    after: 'Depois',
    alongside: 'Em paralelo',
    revision: 'Correção do solicitante',
    required: 'Preencha este campo.',
    labels: {
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver para correção',
      returnTo: 'Devolver para correção',
      submit: 'Enviar para aprovação',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      retryCash: 'Repetir processamento do caixa',
      retryCashAsAdmin: 'Repetição administrativa do caixa',
      forcePayException: 'Registrar liquidação excepcional',
      forceComplete: 'Liquidação administrativa',
      reviseBusiness: 'Revisar para aprovação',
      claim: 'Assumir',
      release: 'Liberar',
      assign: 'Atribuir',
      complete: 'Confirmar pagamento',
      unable: 'Não é possível pagar',
      transfer: 'Transferir',
      addSigner: 'Adicionar signatário',
      cc: 'Copiar',
      appoint: 'Designar',
      reassign: 'Reatribuir',
      comment: 'Comentário',
      read: 'Marcar como lido',
      urge: 'Lembrar',
    },
  },
};
