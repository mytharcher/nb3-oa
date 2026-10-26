export default {
  meetingRooms: {
    authz: {
      title: 'Salas de reunião',
      bookings: 'Reservas de reuniões',
      view: 'Visualizar',
      manage: 'Gerenciar salas de reunião',
      create: 'Reservar uma sala',
      edit: 'Editar reservas',
      cancel: 'Cancelar reservas',
      confirm: 'Confirmar solicitações administrativas',
      reject: 'Rejeitar solicitações administrativas',
      checkIn: 'Registrar presença',
      owned: 'Organizadas por mim',
      participating: 'Reuniões de que participo',
      readable: 'Reuniões que organizo ou de que participo',
    },
    notifications: {
      title: 'Atualização de reserva de reunião',
      body: 'Uma reserva de reunião que envolve você mudou. Abra suas reservas de reuniões para revisar os detalhes acessíveis.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Muitos registros correspondentes. Restrinja a pesquisa antes de ordenar por nome.',
      ACCESS_DENIED:
        'Esta operação ou seus campos estão fora da sua permissão.',
      ACTIVE_EMPLOYEE_REQUIRED:
        'É necessário um cadastro de colaborador ativo.',
      BOOKING_NOT_FOUND: 'A reserva está indisponível.',
      CAPACITY_EXCEEDED:
        'O organizador e os participantes excedem a capacidade da sala.',
      COMMAND_CONFLICT:
        'Este identificador de requisição pertence a outra operação ou executor.',
      INVALID_BOOKING: 'Informe um título e participantes ativos distintos.',
      INVALID_INTERVAL:
        'Escolha um intervalo futuro com término posterior ao início.',
      INVALID_PARTICIPANT:
        'Todos os participantes devem ser colaboradores ativos.',
      INVALID_RECURRENCE:
        'Escolha uma série diária ou semanal de 1 a 52 ocorrências.',
      INVALID_REQUEST_ID: 'É necessário um identificador de requisição.',
      INVALID_ROOM: 'Informe nome da sala, capacidade e motivo da alteração.',
      INVALID_SERIES: 'Escolha uma série existente.',
      INVALID_STATE:
        'Esta reserva não pode executar esta operação no estado ou intervalo de tempo atual.',
      REASON_REQUIRED: 'Informe um motivo para esta decisão administrativa.',
      ROOM_INACTIVE: 'Esta sala está inativa.',
      ROOM_NOT_FOUND: 'Esta sala está indisponível.',
      TIME_CONFLICT:
        'Um ou mais intervalos solicitados conflitam com um intervalo ocupado.',
      VERSION_CONFLICT:
        'A reserva ou a sala mudou. Atualize antes de tentar novamente.',
      INVALID_LOCAL_TIME: 'Informe uma data e hora locais da empresa válidas.',
      NONEXISTENT_LOCAL_TIME:
        'Este horário local não existe devido a uma mudança de fuso horário. Escolha outro horário.',
      AMBIGUOUS_LOCAL_TIME:
        'Este horário local ocorre duas vezes devido a uma mudança de fuso horário. Escolha um horário sem ambiguidade.',
    },
  },
};
