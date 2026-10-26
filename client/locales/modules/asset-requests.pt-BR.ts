export default {
  discardTitle: 'Descartar edições em “{{name}}”?',
  discardDescription:
    'As alterações não salvas serão perdidas. Os comprovantes do rascunho armazenados são mantidos.',
  discard: 'Descartar alterações',
  title: 'Solicitações de bens',
  description:
    'Solicite uso, empréstimo e descarte de bens; confirme o processamento físico.',
  new: 'Nova solicitação de bem',
  draft: 'Rascunho de solicitação de bem',
  source: 'Visualização de origem',
  detail: 'Visualizar',
  detailDescription:
    'Dados da solicitação e ações de aprovação efetivamente disponíveis.',
  edit: 'Editar',
  editTitle: 'Editar solicitação de bem',
  number: 'Número',
  operationLabel: 'Operação',
  statusLabel: 'Status',
  quantity: 'Quantidade',
  purpose: 'Finalidade',
  category: 'Categoria',
  asset: 'Bem',
  borrowDueDate: 'Data de devolução',
  updatedAt: 'Atualizado',
  scrapReason: 'Motivo do descarte',
  appraisalOpinion: 'Parecer da inspeção',
  handlingReason: 'Motivo do recebimento',
  exceptionReason: 'Motivo da exceção',
  allocation: 'Alocação real',
  photos: 'Fotos comprobatórias',
  originalValue: 'Valor original do bem',
  companyTimeZone: 'Fuso horário da empresa: {{timeZone}}',
  search: 'Pesquisar',
  searchPlaceholder: 'Pesquisar número ou finalidade',
  all: 'Todos',
  clearFilters: 'Limpar filtros',
  refresh: 'Atualizar',
  rowActions: 'Ações de {{name}}',
  empty: 'Nenhuma solicitação de bem ainda',
  emptyDescription: 'Crie uma solicitação para pedir ou descartar bens.',
  emptyReadonly: 'Peça acesso às solicitações a um administrador.',
  noResults: 'Nenhuma solicitação correspondente',
  noResultsDescription: 'Altere ou limpe filtros para encontrar solicitações.',
  noAccess: 'Você não tem mais acesso. Entre em contato com um administrador.',
  missing:
    'Esta solicitação não existe ou foi excluída. Volte à visualização de origem.',
  missingNamed: 'A solicitação “{{name}}” não existe ou foi excluída.',
  conflict:
    'A solicitação mudou. Carregue os dados mais recentes antes de continuar.',
  invalid:
    'Esta operação foi rejeitada. Verifique os campos obrigatórios e as ações atuais.',
  loadFailed:
    'Não foi possível carregar. Tente novamente quando a conexão estiver disponível.',
  retry: 'Tentar novamente',
  loadLatest: 'Carregar versão mais recente',
  missingFields:
    'Alguns campos obrigatórios não são legíveis. A edição completa ou a confirmação física está desabilitada.',
  unknownResult:
    'O resultado é desconhecido. O comando original completo está congelado; repita exatamente a operação para conciliá-lo.',
  retryExact: 'Repetir operação original',
  cancel: 'Cancelar',
  save: 'Salvar',
  saveDraft: 'Salvar rascunho',
  submit: 'Enviar para aprovação',
  saving: 'Salvando…',
  saved: '“{{name}}” salvo',
  submitted: '“{{name}}” enviado',
  completed: '{{action}} concluída para “{{name}}”',
  required: 'Preencha este campo obrigatório.',
  quantityInvalid: 'Informe uma quantidade inteira de 1 a 100.',
  textLimit: 'Use no máximo 2.000 caracteres.',
  reasonLimit: 'Use no máximo 5.000 caracteres.',
  futureDate: 'Escolha uma data futura no calendário local da empresa.',
  photoRequired: 'Selecione pelo menos uma foto comprobatória.',
  photoLimit: 'Até 10 fotos JPEG, PNG ou WebP, de no máximo 5 MB cada.',
  removeSelection: 'Remover seleção',
  selectPhoto: 'Selecionar comprovante existente',
  uploadUnknown:
    'O envio de “{{name}}” precisa de conciliação. Revise o comprovante armazenado e selecione-o; não envie outro arquivo antes de conciliar.',
  noEligibleEmployee:
    'É necessário um registro de colaborador ativo, em experiência ou efetivo, para enviar.',
  noDepartment: 'É necessário um departamento principal ativo para enviar.',
  noActiveHead: 'É necessário um chefe de departamento ativo para enviar.',
  searchCandidates: 'Pesquisar candidatos elegíveis',
  selectAsset: 'Selecionar um bem elegível',
  noEligibleAssets: 'Nenhum bem elegível disponível.',
  previous: 'Página anterior',
  next: 'Próxima página',
  comment: 'Parecer / motivo',
  person: 'Destinatário',
  signerMode: 'Posição do signatário adicional',
  place: 'Posição de aprovação',
  fullBatch:
    'Confirme cada unidade reservada e seu número de série real. Recebimentos físicos parciais não podem concluir este lote.',
  serialFor: 'Número de série real de {{code}}',
  serialLimit: 'Use no máximo 200 caracteres.',
  serialMismatch: 'O número de série real deve corresponder ao bem alocado.',
  actionUnavailable:
    'Esta ação não está mais disponível. Atualize a solicitação atual.',
  actionTitle: '{{action}} a solicitação de bem “{{name}}”',
  confirmDanger:
    'Isto altera a solicitação ou registra uma entrega física. Confirme os dados e o motivo antes de continuar.',
  operations: {
    use: 'Uso permanente',
    borrow: 'Empréstimo',
    scrap: 'Descarte',
  },
  statuses: {
    draft: 'Rascunho',
    revision: 'Devolvido para revisão',
    head: 'Revisão do chefe de departamento',
    appraisal: 'Inspeção',
    finance: 'Revisão financeira',
    gm: 'Revisão da direção geral',
    issuing: 'Aguardando entrega',
    borrowed: 'Emprestado',
    returning: 'Aguardando devolução física',
    issued: 'Entregue',
    returned: 'Devolvido',
    scrapped: 'Descartado',
    unable: 'Não foi possível processar',
    rejected: 'Rejeitado',
    withdrawn: 'Retirado',
    terminated: 'Encerrado',
    exception: 'Exceção de processamento',
  },
  actions: {
    submit: 'Enviar para aprovação',
    withdraw: 'Retirar',
    terminate: 'Encerrar',
    approve: 'Aprovar',
    reject: 'Rejeitar',
    return: 'Devolver para revisão',
    complete: 'Confirmar processamento físico',
    unable: 'Não foi possível processar',
    returnIssued: 'Confirmar devolução do bem entregue',
    transfer: 'Transferir',
    addSigner: 'Adicionar signatário',
    cc: 'Copiar',
    assign: 'Atribuir',
    appoint: 'Designar',
    reassign: 'Reatribuir',
    urge: 'Cobrar',
    read: 'Marcar como lido',
    comment: 'Comentário',
    claim: 'Assumir',
    release: 'Liberar',
  },
  tabs: {
    mine: 'Minhas',
    pending: 'Pendente',
    done: 'Processadas',
    copied: 'Copiado',
  },
  modes: {
    before: 'Antes',
    alongside: 'Em paralelo',
    after: 'Depois',
  },
  authz: {
    ownedScope: 'Próprias solicitações de bens',
    resource: 'Solicitações de bens',
    view: 'Ler solicitações de bens',
    viewValue: 'Ler valores originais dos bens',
    create: 'Criar próprias solicitações de bens',
    edit: 'Editar próprias solicitações de bens',
    operate: 'Executar ações autorizadas de aprovação e processamento de bens',
    returnIssued: 'Confirmar devolução física de bens entregues para uso',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Informe o motivo do recebimento físico.',
    ASSET_ACCESS_DENIED: 'Você não pode acessar esta solicitação de bem.',
    ASSET_ACTION_INVALID: 'Esta ação não está disponível para a solicitação.',
    ASSET_REQUEST_NOT_FOUND: 'Solicitação de bem não encontrada.',
    ASSET_INVALID_COMMAND:
      'Informe um identificador estável de requisição e o motivo obrigatório.',
    ASSET_REQUEST_REUSED:
      'Este identificador de requisição está vinculado a outra operação.',
    ASSET_REQUIRED_FIELDS:
      'Preencha a finalidade, a quantidade e a seleção de bens.',
    ASSET_CATEGORY_INACTIVE: 'Escolha uma categoria de bem ativa.',
    ASSET_EMPLOYEE_INACTIVE:
      'O solicitante deve ter um registro de colaborador ativo.',
    ASSET_DEPARTMENT_MISSING:
      'O solicitante precisa de um departamento principal ativo.',
    ASSET_HEAD_MISSING: 'O departamento precisa de um chefe aprovador ativo.',
    ASSET_BORROW_DATE_INVALID:
      'Escolha uma data de devolução futura válida no calendário local da empresa.',
    ASSET_SCRAP_REQUIRED:
      'Selecione um bem, informe o motivo da baixa e anexe uma foto.',
    ASSET_SCRAP_INELIGIBLE:
      'Somente um bem elegível sob custódia ou um item de estoque controlado por administrador pode ser baixado.',
    ASSET_PHOTO_DENIED:
      'A solicitação ou seu campo de foto não está acessível.',
    ASSET_PHOTO_INVALID:
      'Escolha no máximo dez fotos válidas vinculadas a esta solicitação.',
    ASSET_PHOTO_SIZE: 'Cada foto deve ter no máximo 5 MB.',
    ASSET_PHOTO_TYPE: 'Envie uma imagem JPEG, PNG ou WebP válida.',
    ASSET_STOCK_SHORTAGE:
      'Não há unidades disponíveis suficientes para esta solicitação completa.',
    ASSET_INVALID_QUANTITY: 'Confirme uma quantidade inteira entre 1 e 100.',
    ASSET_INVALID_AMOUNT:
      'O valor armazenado do bem está fora do intervalo exato suportado.',
    ASSET_NOT_FOUND: 'Um bem desta solicitação não foi encontrado.',
    ASSET_INVALID_VERSION: 'Carregue a versão atual do bem.',
    ASSET_VERSION_CONFLICT: 'O bem mudou. Recarregue-o antes de confirmar.',
    ASSET_ALREADY_RESERVED: 'Um bem está reservado por outra solicitação.',
    ASSET_EXISTING_HOLD:
      'Resolva a reserva existente antes de alterar o estoque.',
    ASSET_HOLD_MISMATCH: 'A reserva real não corresponde a esta solicitação.',
    ASSET_BASELINE_CONFLICT:
      'Os dados do bem mudaram após a aprovação. Devolva para revisão antes da execução.',
    ASSET_UNITS_INCOMPLETE:
      'Confirme cada unidade alocada e seu número de série real.',
    ASSET_SERIAL_MISMATCH: 'O número de série difere do bem real.',
    ASSET_RETURN_MISMATCH:
      'Os itens devolvidos não correspondem à custódia efetivamente entregue.',
    ASSET_ALREADY_RETURNED: 'Este bem já foi devolvido.',
    ASSET_RETURN_FORBIDDEN:
      'Um administrador de patrimônio ativo deve confirmar a devolução física.',
    ASSET_RETURN_INELIGIBLE:
      'Esta solicitação não é uma solicitação elegível de uso com entrega efetuada.',
    ASSET_ALLOCATION_MISSING: 'A alocação real completa está ausente.',
    ASSET_SOURCE_UNAVAILABLE:
      'A origem da solicitação de bem está indisponível.',
    ASSET_SOURCE_MISSING: 'A solicitação de bem proprietária não existe mais.',
    ASSET_SOURCE_FORBIDDEN: 'A origem não autorizou esta operação de estoque.',
    ASSET_SOURCE_MISMATCH:
      'A origem do estoque não corresponde à solicitação real.',
    ASSET_TARGET_MISMATCH:
      'O destino da aprovação pertence a outra solicitação.',
    ASSET_DIRECTORY_UNAVAILABLE:
      'É necessário um diretório de aprovação atualizado.',
    ASSET_SLA_UNSUPPORTED:
      'Não é possível enviar a aprovação. Peça a um administrador que defina os prazos para 24/48 horas úteis.',
  },
  schedule: {
    title: 'Lembretes de devolução de bens emprestados',
    description:
      'Lembretes diários de vencimento no calendário local da empresa e semanais de atraso. Uma entrega pendente é reportada como ocorrência com falha.',
  },
  reminders: {
    before:
      'Solicitação de bem {{number}}: {{quantity}} item(ns) emprestado(s) vence(m) em {{date}}. Providencie a devolução física.',
    overdue:
      'Solicitação de bem {{number}}: {{quantity}} item(ns) emprestado(s) venceu(ram) em {{date}} e ainda não foi(ram) devolvido(s).',
  },
};
