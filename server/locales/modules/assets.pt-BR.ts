export default {
  authz: {
    returnHeld: 'Confirmar devolução física de bens legados sob custódia',
    resource: 'Cadastro de bens',
    view: 'Ler cadastro de bens e valor original',
    viewHeld: 'Ler bens sob minha custódia',
    manage: 'Registrar e corrigir descrições de bens',
    heldScope: 'Bens sob minha custódia',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Um administrador de patrimônio ativo deve confirmar a devolução física.',
    ASSET_REQUEST_REUSED:
      'Esta chave de requisição de devolução já identifica outro recebimento.',
    ASSET_RETURN_INELIGIBLE:
      'Confirme o item real sob custódia, o colaborador e o número de série.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Resolva este bem pela solicitação real antes de confirmar a devolução.',

    ASSET_ACCESS_DENIED:
      'Você não tem permissão para esta operação de patrimônio.',
    ASSET_NOT_FOUND: 'Bem não encontrado.',
    ASSET_INVALID_INPUT:
      'Informe código, nome e valor exato não negativo do bem em centavos.',
    ASSET_CATEGORY_INACTIVE: 'Escolha uma categoria de bem ativa.',
    ASSET_INVALID_COMMAND:
      'São necessários um executor e o motivo da correção.',
    ASSET_INVALID_VERSION: 'Informe a versão atual do bem.',
    ASSET_VERSION_CONFLICT: 'Este bem mudou. Carregue sua versão mais recente.',
    ASSET_CODE_EXISTS: 'Este código de bem já existe.',
    ASSET_INVALID_STORED_AMOUNT:
      'O valor armazenado do bem está fora do intervalo exato suportado.',
    ASSET_WRITE_UNCONFIRMED: 'Não foi possível confirmar a gravação do bem.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Bens atribuídos, emprestados ou reservados devem ser devolvidos antes da liberação do desligamento.',
  },
};
