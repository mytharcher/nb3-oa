export default {
  vendors: {
    saved: 'Fornecedor "{{name}}" salvo',

    title: 'Fornecedores',
    description:
      'O setor de compras mantém fornecedores manuais. Pedidos aprovados mantêm os dados de fornecedor registrados.',
    new: 'Novo fornecedor',
    edit: 'Editar fornecedor',
    view: 'Detalhes do fornecedor',
    refresh: 'Atualizar',
    search: 'Pesquisar nome, código ou categoria',
    clear: 'Limpar filtros',
    rowActions: 'Ações de {{name}}',
    save: 'Salvar',
    cancel: 'Cancelar',
    loading: 'Carregando fornecedores',
    retry: 'Tentar novamente',
    active: 'Ativa',
    status: 'Status',
    statuses: {
      manual: 'Fornecedor manual',
      qualified: 'Qualificado',
      disabled: 'Desativada',
    },
    updatedAt: 'Atualizado',
    reason: 'Motivo desta alteração',
    formDescription:
      'Alterações de fornecedores e dados bancários são auditados. Desabilitar impede novas compras e pagamentos.',
    disableHint:
      'Novas compras e detalhes da conta de pagamento serão bloqueados.',
    required: 'Este campo é obrigatório.',
    invalidCode: 'Use letras, dígitos, pontos, hífens ou sublinhados.',
    invalidEmail: 'Informe um endereço de e-mail válido.',
    noChanges: 'Altere pelo menos um campo antes de salvar.',
    unknownCreate:
      'O resultado da criação é desconhecido. Verifique a lista de fornecedores e seu código antes de criar outro fornecedor.',
    unknownEdit:
      'O resultado é desconhecido. Carregue o fornecedor mais recente antes de tentar novamente; suas alterações não confirmadas serão mantidas.',
    loadLatest: 'Carregar fornecedor mais recente',
    fields: {
      code: 'Código',
      name: 'Nome',
      category: 'Categoria',
      contactName: 'Contato',
      contactPhone: 'Telefone',
      contactEmail: 'E-mail',
      bankName: 'Banco',
      bankAccount: 'Conta bancária',
      bankAccountName: 'Nome da conta',
    },
    authz: {
      resource: 'Fornecedores',
      view: 'Ler detalhes de fornecedores',
      manage: 'Manter fornecedores',
      bankRead: 'Ler informações bancárias',
      createdScope: 'Fornecedores criados pelo usuário atual',
    },
    empty: {
      accountsTitle: 'Nenhum fornecedor',
      accountsDescription: 'Adicione um fornecedor manual para compras.',
      readonlyTitle: 'Nenhum fornecedor legível',
      readonlyDescription:
        'Não há fornecedores no seu escopo concedido. Peça ao setor de compras que adicione um fornecedor ou a um administrador a permissão Manter fornecedores.',
      filteredTitle: 'Nenhum fornecedor correspondente',
      filteredDescription: 'Altere ou limpe a pesquisa.',
    },
    error: {
      forbidden: 'Você não tem permissão para acessar estes fornecedores.',
      missing: 'Este fornecedor está indisponível. Atualize a lista de origem.',
      invalid: 'Verifique os campos do fornecedor.',
      failed:
        'Não foi possível carregar ou salvar fornecedores. Tente novamente.',
      VENDOR_INVALID_INPUT:
        'Verifique os campos de contato e banco do fornecedor.',
      VENDOR_INVALID_COMMAND:
        'São necessários um executor e um motivo de alteração.',
      VENDOR_CODE_EXISTS: 'Este código já pertence a um fornecedor.',
      VENDOR_VERSION_CONFLICT:
        'Este fornecedor mudou. Carregue a versão mais recente antes de tentar novamente.',
      VENDOR_NOT_FOUND: 'Este fornecedor está indisponível.',
      VENDOR_INACTIVE: 'Escolha um fornecedor ativo.',
      VENDOR_FIELDS_RESTRICTED:
        'Os campos do fornecedor estão fora da sua concessão.',
      VENDOR_ACCESS_DENIED:
        'Você não tem permissão para esta ação de fornecedor.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Preencha os dados bancários do fornecedor antes do pagamento.',
    },
  },
};
