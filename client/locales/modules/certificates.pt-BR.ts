export default {
  certificates: {
    authz: {
      readable: 'Solicitações próprias e com participação',
      requests: 'Solicitações de certificados',
      view: 'Visualizar',
      create: 'Criar',
      edit: 'Editar',
      operate: 'Operar',
      issue: 'Emitir',
      income: 'Renda',
      owned: 'Próprios',
    },
    savedRecord: 'Solicitação de certificado de "{{name}}" salva',
    issuedRecord: 'Certificado de "{{name}}" emitido',
    submittedRecord: 'Solicitação de certificado de "{{name}}" enviada',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED:
        'Operação de certificado rejeitada: acesso negado',
      CERTIFICATE_APPROVAL_REFUSED:
        'Operação de certificado rejeitada: aprovação recusada',
      CERTIFICATE_ARTIFACT_MISSING:
        'Operação de certificado rejeitada: artefato ausente',
      CERTIFICATE_CLAIM_REQUIRED:
        'Operação de certificado rejeitada: é necessário assumir a tarefa',
      CERTIFICATE_COMMAND_CONFLICT:
        'Operação de certificado rejeitada: conflito de comando',
      CERTIFICATE_COMMAND_INVALID:
        'Operação de certificado rejeitada: comando inválido',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Operação de certificado rejeitada: departamento obrigatório',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Operação de certificado rejeitada: colaborador obrigatório',
      CERTIFICATE_HEAD_REQUIRED:
        'Operação de certificado rejeitada: chefe obrigatório',
      CERTIFICATE_HR_REQUIRED:
        'Operação de certificado rejeitada: RH obrigatório',
      CERTIFICATE_INCOME_DENIED:
        'Operação de certificado rejeitada: acesso à renda negado',
      CERTIFICATE_INCOME_INVALID:
        'Operação de certificado rejeitada: renda inválida',
      CERTIFICATE_INVALID: 'Operação de certificado rejeitada: inválida',
      CERTIFICATE_PREPARATION_INVALID:
        'Operação de certificado rejeitada: preparação inválida',
      CERTIFICATE_PREPARATION_MISSING:
        'Operação de certificado rejeitada: preparação ausente',
      CERTIFICATE_PREPARATION_STALE:
        'Operação de certificado rejeitada: preparação desatualizada',
      CERTIFICATE_SOURCE_STALE:
        'Operação de certificado rejeitada: origem desatualizada',
      CERTIFICATE_TARGET_MISMATCH:
        'Operação de certificado rejeitada: destino incompatível',
      CERTIFICATE_TEMPLATE_DENIED:
        'Operação de certificado rejeitada: acesso ao modelo negado',
    },

    title: 'Certificados',
    description: 'Solicite e emita certificados de colaboradores',
    new: 'Nova solicitação de certificado',
    edit: 'Editar solicitação de certificado',
    detail: 'Detalhes do certificado',
    issue: 'Emitir certificado',
    refresh: 'Atualizar',
    clear: 'Limpar filtros',
    search: 'Pesquisar finalidade',
    all: 'Todos os status',
    name: 'Certificado',
    recordName: 'Certificado · {{name}}',
    type: 'Tipo',
    purpose: 'Finalidade',
    copies: 'Cópias',
    delivery: 'Forma de entrega',
    applicant: 'Solicitante',
    createdAt: 'Solicitado em',
    status: 'Status',
    number: 'Número do certificado',
    issueDate: 'Data de emissão',
    oldest: 'Mais antigos primeiro',
    newest: 'Mais recentes primeiro',
    empty: 'Nenhuma solicitação de certificado',
    noMatch: 'Nenhuma solicitação correspondente',
    failed: 'Não foi possível concluir esta operação',
    unavailable: 'Este registro ou ação não está mais disponível',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    save: 'Salvar rascunho',
    saved: 'Salvo',
    loading: 'Carregando detalhes do certificado',
    moreActions: 'Mais ações',
    backToList: 'Voltar à lista de certificados',
    consequences: {
      withdraw: 'Retire esta solicitação; ela sairá da fila de revisão ativa.',
      terminate:
        'Encerre esta solicitação; o processamento normal será interrompido.',
      forceComplete:
        'Encerre esta solicitação excepcionalmente; nenhum certificado será emitido.',
      reject: 'Rejeite esta solicitação; ela não prosseguirá para emissão.',
      return: 'Devolva esta solicitação ao solicitante para alterações.',
      unable:
        'Registre que o RH não pode emitir este certificado; a solicitação exigirá resolução.',
    },
    invalidInput: 'Revise os campos indicados e informe valores válidos.',
    invalidCopies: 'Informe um número inteiro de 1 a 100.',
    invalidPurpose: 'A finalidade deve ter no máximo 2.000 caracteres.',
    required: 'Obrigatório',
    confirm: 'Confirmar',
    discard: 'Descartar alterações',
    discardDescription: 'Suas alterações não salvas serão perdidas.',
    confirmDescription:
      'Aplicar esta ação ao certificado solicitado por {{name}}? Isto altera a solicitação atual.',
    history: 'Histórico de aprovação',
    mode: 'Posição do revisor',
    modes: {
      before: 'Antes da minha decisão',
      alongside: 'Junto à minha decisão',
    },
    recipient: 'Destinatário',
    reason: 'Motivo ou comentário',
    download: 'Baixar DOCX',
    income: 'Renda mensal (CNY)',
    template: 'Modelo',
    selectTemplate: 'Escolher um modelo',
    revision: 'Revisão fixa',
    previous: 'Anterior',
    next: 'Próximo',
    prepare: 'Preparar emissão',
    generate: 'Gerar documento',
    confirmIssue: 'Confirmar emissão',
    issued: 'Certificado emitido',
    issueDescription:
      'Prepare uma revisão fixa do modelo, gere o documento real e confirme a emissão e seu arquivamento.',
    invalidIssue:
      'Escolha uma data de emissão e informe um valor de renda válido com até duas casas decimais.',
    generateDescription:
      'A geração pode levar um momento. Se falhar, repita esta preparação; nenhum certificado foi emitido ainda.',
    confirmIssueDescription:
      'O documento gerado será emitido e registrado permanentemente no cadastro do colaborador.',
    types: {
      employment: 'Vínculo empregatício',
      income: 'Renda',
      other: 'Outro',
    },
    deliveries: { pickup: 'Retirada', mail: 'Correio', digital: 'Digital' },
    states: {
      draft: 'Rascunho',
      revision: 'Precisa de revisão',
      head: 'Revisão do gestor',
      issuing: 'Processamento de RH',
      issued: 'Entregue',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      issueException: 'Exceção de emissão',
      administrativelyClosed: 'Encerrado administrativamente',
    },
    actions: {
      edit: 'Editar',
      submit: 'Enviar',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      forceComplete: 'Encerramento administrativo',
      retry: 'Repetir processamento',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver para revisão',
      claim: 'Assumir',
      release: 'Liberar',
      assign: 'Atribuir',
      transfer: 'Transferir',
      appoint: 'Designar',
      reassign: 'Reatribuir',
      comment: 'Comentário',
      read: 'Marcar como lido',
      cc: 'Copiar',
      addSigner: 'Adicionar revisor',
      addSign: 'Adicionar revisor',
      urge: 'Lembrar',
      complete: 'Confirmar emissão',
      unable: 'Não é possível emitir',
      delegate: 'Delegado',
      recall: 'Recolher',
    },
  },
};
