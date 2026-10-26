export default {
  actionForm: {
    uncertain:
      'O resultado não foi confirmado. Mantenha estes dados e repita a operação idêntica; não emita uma solicitação alterada.',
    replay: 'Repetir operação idêntica',
    ownedScope: 'Reembolsos que possuo ou criei',
    title: '{{action}} o reembolso “{{name}}”',
    unavailable:
      'Esta ação não está mais disponível. Leia o reembolso mais recente.',
    unsupported:
      'Esta ação exige um contrato de entrada que esta página não suporta.',
    submitRequirements:
      'A aprovação usa o motivo e as linhas de despesas salvos no rascunho. Edite o reembolso para informar o motivo, as categorias, datas, valores e números de notas fiscais e selecione comprovantes para cada linha.',
    reasonRequired: 'O rascunho não tem motivo de reembolso. Edite-o primeiro.',
    linesRequired:
      'O rascunho não tem linhas de despesas. Edite o reembolso e envie comprovantes primeiro.',
    lineIncomplete:
      'A linha de despesa {{number}} está incompleta. Adicione categoria, data, valor positivo, número da nota fiscal e comprovantes.',
    duplicateLines:
      'As linhas de despesas estão duplicadas. Edite o reembolso e revise as linhas.',
    editDraft: 'Editar reembolso',
    comment: 'Parecer ou motivo',
    person: 'Destinatário',
    mode: 'Posição do signatário',
    place: 'Posição de aprovação',
    returnTarget: 'Destino da devolução',
    voucher: 'Número do comprovante de pagamento',
    voucherHint:
      'Deixe vazio somente ao registrar uma liquidação administrativa sem comprovante.',
    grossConfirm: 'Confirmar reembolso bruto',
    offsetConfirm: 'Confirmar compensação de empréstimo',
    netConfirm: 'Confirmar dinheiro líquido',
    exactAmount: 'Informe o valor exato exibido acima.',
    confirm: 'Confirmar {{action}}',
    confirmDescription:
      'Confirme esta operação em “{{name}}”. Bruto {{gross}}, compensação de empréstimo {{offset}}, dinheiro líquido {{net}}. {{consequence}}',
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
    line: 'Linha de despesa selecionada',
    noLine: 'A linha de aprovação selecionada está indisponível.',
    latest: 'Ler versão mais recente',
    conflict:
      'O reembolso mudou. Seus dados foram mantidos. Leia a versão mais recente, revise-a e confirme novamente.',
    completed: '{{action}} concluída para “{{name}}”',
    committed:
      'A operação foi concluída. Atualize o reembolso antes de executar outra ação.',
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
      returnItem: 'Devolver linha de despesa',
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
