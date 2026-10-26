export default {
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
    ASSET_PHOTO_SIZE: 'Cada foto deve ter no máximo 5 MiB.',
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
      'Esta versão suporta somente os relógios padrão de aprovação de 24/48 horas úteis.',
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
