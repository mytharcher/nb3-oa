export default {
  vehicles: {
    authz: {
      requests: 'Solicitações de veículos',
      garage: 'Garagem de veículos',
      manage: 'Gerenciar frota de veículos',
      viewCost: 'Visualizar custo privado de combustível',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Restrinja a pesquisa antes de ordenar esta quantidade de registros.',
      VEHICLE_ACCESS_DENIED:
        'A atualização do motorista está fora da política concedida.',
      VEHICLE_ALREADY_DISPATCHED:
        'Esta origem já tem um fato imutável de despacho.',
      VEHICLE_APPROVAL_REFUSED:
        'A operação de veículo está indisponível; atualize a solicitação e verifique sua permissão.',
      VEHICLE_CONTENT_CHANGED:
        'O despacho exige conteúdo aprovado inalterado e seus dados privados de ação.',
      VEHICLE_COST_NOT_FOUND: 'O custo de uso não é legível.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'É necessária uma tarefa real de despacho permitida.',
      VEHICLE_DRIVER_INACTIVE: 'O motorista não é elegível no momento.',
      VEHICLE_DRIVER_REQUIRED:
        'A seleção do motorista deve corresponder à solicitação aprovada.',
      VEHICLE_EMPLOYEE_INACTIVE:
        'É necessário um cadastro de colaborador ativo.',
      VEHICLE_FIELDS_RESTRICTED:
        'Campos não financeiros completos da solicitação são necessários para a fachada de aprovação.',
      VEHICLE_GARAGE_DENIED:
        'É necessário um membro ativo da responsabilidade administrativa.',
      VEHICLE_INTERVAL_CONFLICT:
        'O veículo ou motorista já está despachado neste intervalo.',
      VEHICLE_INVALID_COMMAND:
        'São necessárias uma origem e uma chave de requisição estável.',
      VEHICLE_INVALID_INPUT:
        'Forneça identificação do veículo, capacidade positiva e status válido.',
      VEHICLE_INVALID_INTERVAL:
        'Forneça um intervalo de tempo em ordem e uma quantidade positiva de passageiros.',
      VEHICLE_INVALID_USAGE:
        'Quilometragem e combustível devem ser inteiros não negativos exatos.',
      VEHICLE_INVALID_VERSION: 'A versão armazenada não pode avançar.',
      VEHICLE_NOT_DISPATCHED:
        'Nenhum despacho real existe para esta solicitação.',
      VEHICLE_NOT_FOUND: 'Veículo ou motorista não encontrado.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Nenhum veículo atual tem capacidade suficiente neste intervalo. O envio não o reserva.',
      VEHICLE_OUTSTANDING_USE:
        'Conclua o uso real antes de desabilitar este motorista.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Os dados de execução de negócio devem usar a fachada privada.',
      VEHICLE_REQUEST_KEY_REQUIRED:
        'É necessária uma chave de requisição estável.',
      VEHICLE_REQUEST_REUSED:
        'Esta chave de requisição está vinculada a outro executor ou dados.',
      VEHICLE_SLA_UNSUPPORTED:
        'Esta versão exige os relógios padrão de aprovação em horas úteis.',
      VEHICLE_SOURCE_DENIED:
        'É necessária uma operação real de aprovação permitida em sua transação.',
      VEHICLE_SOURCE_MISMATCH:
        'O comando não corresponde à origem da aprovação.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'O adaptador real de origem da aprovação está indisponível.',
      VEHICLE_TARGET_MISMATCH:
        'O destino da ação pertence a outra solicitação.',
      VEHICLE_TYPE_INACTIVE: 'Escolha um tipo de veículo ativo.',
      VEHICLE_UNAVAILABLE:
        'Escolha um veículo ativo com capacidade suficiente.',
      VEHICLE_USAGE_OWNER: 'Somente o solicitante real pode registrar o uso.',
      VEHICLE_VERSION_CONFLICT: 'Carregue a versão atual do veículo.',
    },
  },
};
