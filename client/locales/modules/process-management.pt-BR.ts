export default {
  flowDiagram: {
    escapeHint: 'Pressione Esc para sair',
    controls: 'Controles do diagrama',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Diminuir zoom',
    fitView: 'Ajustar visualização',
    fullscreen: 'Tela cheia',
    exitFullscreen: 'Sair da tela cheia',
    minimap: 'Minimapa',

    empty: 'Nenhum estado para exibir.',
    loading: 'Organizando diagrama…',
    failed:
      'Não foi possível organizar o diagrama. Consulte os parâmetros do processo e as execuções recentes.',
    nodeHelp: 'Estado do processo. Arraste e amplie para explorar.',
    edgeHelp: 'Transição do processo',
  },
  processManagement: {
    managementReason: 'Motivo',
    normalDescription:
      'Mostra o caminho principal de negócio; as condições determinam os ramos.',
    revealHint:
      'Passe o cursor sobre uma etapa para mostrar suas devoluções e outras saídas e depois sobre uma saída para obter detalhes.',
    graphLegend: 'Legenda do diagrama',
    otherExits: 'Outras saídas',
    exitNext: 'Depois pode:',
    exitEnds: 'O processo termina aqui.',
    nodeTypes: {
      start: 'Início',
      approval: 'Aprovação',
      work: 'Etapa de trabalho',
      success: 'Concluído',
      negative: 'Encerrado',
      exception: 'Devolução ou exceção',
    },
    rulesCount_one: '{{count}} regra',
    rulesCount_other: '{{count}} regras',
    notReached: 'Ainda não alcançado',
    parameters: {
      title: 'Parâmetros do fluxo de trabalho',
      description:
        'Limites lidos por este processo em cada etapa. Cada valor é definido uma vez e se aplica a todas as etapas listadas ao lado dele.',
      none: 'Este processo não possui parâmetros ajustáveis.',
      onNodes:
        'Este processo é configurado em suas etapas. Use o botão de configurações de uma etapa no diagrama.',
      forbidden:
        'Você não tem permissão para visualizar os parâmetros deste processo.',
      readOnly: 'Você pode visualizar estes parâmetros, mas não alterá-los.',
      changed: 'Alterado',
      scheduled: 'Muda para {{value}} em {{date}}.',
      orderViolated:
        'Fora de ordem em relação a um parâmetro relacionado: um limite inferior não pode exceder um superior. Ajuste ambos aqui e salve-os juntos.',
      discard: 'Descartar alterações',
      save_zero: 'Salvar',
      save_one: 'Salvar 1 alteração',
      save_other: 'Salvar {{count}} alterações',
      saved_one: '1 parâmetro salvo',
      saved_other: '{{count}} parâmetros salvos',
    },
    nodeSettings: {
      edit: 'Editar parâmetros',
      editNamed: 'Editar parâmetros de {{name}}',
      title: 'Editar parâmetros de {{name}}',
      parameter: 'Parâmetro',
      effect:
        'As alterações não reescrevem os retratos salvos das solicitações nem as tarefas existentes. Novos envios usam a configuração vigente; reenvios seguem as regras do processo proprietário.',
      shared: 'Configuração compartilhada. Também afeta: {{flows}}.',
      unavailable:
        'Este nó não possui parâmetros editáveis disponíveis. Feche este diálogo e escolha um nó configurado.',
      forbidden: 'Você não tem permissão para editar a configuração deste nó.',
      newCommittee: 'Publicar uma nova estrutura do comitê',
      seat: 'Versão {{version}} · pessoa do assento {{name}}',
      committeeContext:
        'Nó selecionado: versão {{selected}}. Ativa: {{active}}. Última salva: {{latest}}.',
    },
    conditionMissing:
      'Este ramo precisa de uma descrição de condição explícita; inspecione as regras de negócio proprietárias',
    snapshotConditions:
      'Os limites de valor, dias e nível usam as regras congeladas no envio. Esta definição explica os critérios de decisão, não o retrato de uma solicitação histórica.',
    branchConditions: {
      travelCancellation_unbooking:
        'A viagem original solicita reserva, portanto o cancelamento exige desfazê-la',
      travelCancellation_approved:
        'A viagem original não solicita reserva, portanto não é necessário desfazê-la',
      reimbursement_managerApproved_head:
        'Total do reembolso > limite congelado do chefe de departamento e a validação de unificação das tarefas de gestor/chefe não foi aprovada',
      reimbursement_managerApproved_finance:
        'O total do reembolso não excede o limite do chefe ou as tarefas de aprovação de gestor/chefe foram validamente unificadas',

      training_managerApproved_head:
        'Valor do treinamento > 0 e as tarefas de aprovação de gestor/chefe não foram validamente unificadas',
      training_managerApproved_finance:
        'Valor do treinamento > 0; gestor e chefe são a mesma pessoa e esta rodada passa na validação de unificação das tarefas de aprovação',
      training_managerApproved_approved: 'O valor do treinamento é zero',

      travel_managerApproved_head:
        'As condições de unificação de gestor/chefe não foram atendidas',
      travel_managerApproved_finance:
        'Gestor e chefe de departamento são a mesma pessoa e esta rodada passa na validação de unificação das tarefas de aprovação',
      probation_managerApproved_head:
        'As condições de unificação de gestor/chefe não foram atendidas',
      probation_managerApproved_hr:
        'Gestor e chefe de departamento são a mesma pessoa e esta rodada passa na validação de unificação das tarefas de aprovação',
      departure_managerApproved_head:
        'As condições de unificação de gestor/chefe não foram atendidas',
      departure_managerApproved_hr:
        'Gestor e chefe de departamento são a mesma pessoa e esta rodada passa na validação de unificação das tarefas de aprovação',
      expensePlan_financeApproved_executive:
        'Aprovação executiva necessária: valor > limite executivo congelado no envio',
      expensePlan_financeApproved_gm:
        'Não é necessária aprovação executiva; valor > limite da direção geral congelado no envio',
      expensePlan_financeApproved_approved:
        'Nenhuma condição de aprovação adicional executiva ou da direção geral se aplica',
      expensePlan_executiveApproved_gm:
        'Aprovação da direção geral necessária e a validação de unificação das tarefas executivas/direção geral não foi aprovada',
      expensePlan_executiveApproved_approved:
        'Não é necessária aprovação da direção geral ou as tarefas de aprovação executivas/direção geral foram validamente unificadas',
      loan_financeApproved_executive:
        'Aprovação executiva necessária: valor > limite executivo congelado no envio',
      loan_financeApproved_gm:
        'Não é necessária aprovação executiva; valor > limite da direção geral congelado no envio',
      loan_financeApproved_cashier:
        'Nenhuma condição de aprovação adicional executiva ou da direção geral se aplica',
      loan_executiveApproved_gm:
        'Aprovação da direção geral necessária e a validação de unificação das tarefas executivas/direção geral não foi aprovada',
      loan_executiveApproved_cashier:
        'Não é necessária aprovação da direção geral ou as tarefas de aprovação executivas/direção geral foram validamente unificadas',
      purchase_financeApproved_executive:
        'Aprovação executiva necessária: valor > limite executivo congelado no envio',
      purchase_financeApproved_gm:
        'Não é necessária aprovação executiva; valor > limite da direção geral congelado no envio',
      purchase_financeApproved_approved:
        'Nenhuma condição de aprovação adicional executiva ou da direção geral se aplica',
      purchase_executiveApproved_gm:
        'Aprovação da direção geral necessária e a validação de unificação das tarefas executivas/direção geral não foi aprovada',
      purchase_executiveApproved_approved:
        'Não é necessária aprovação da direção geral ou as tarefas de aprovação executivas/direção geral foram validamente unificadas',
      payment_financeApproved_executive:
        'Aprovação executiva necessária: escala completa de aprovação e valor > limite executivo congelado no envio',
      payment_financeApproved_gm:
        'Não é necessária aprovação executiva; valor > limite da direção geral congelado no envio e aprovação completa obrigatória',
      payment_financeApproved_cashier:
        'Nenhuma condição de aprovação adicional executiva ou da direção geral se aplica',
      payment_executiveApproved_gm:
        'Aprovação da direção geral necessária e a validação de unificação das tarefas executivas/direção geral não foi aprovada',
      payment_executiveApproved_cashier:
        'Não é necessária aprovação da direção geral ou as tarefas de aprovação executivas/direção geral foram validamente unificadas',
      travel_financeApproved_executive:
        'Aprovação executiva necessária: viagem internacional ou valor > limite executivo congelado no envio',
      travel_financeApproved_gm:
        'Não é necessária aprovação executiva; valor > limite da direção geral congelado no envio',
      travel_financeApproved_booking:
        'Não é necessária aprovação executiva/direção geral adicional e a reserva foi solicitada',
      travel_financeApproved_completed:
        'Não é necessária aprovação executiva/direção geral adicional e a reserva não foi solicitada',
      travel_executiveApproved_gm:
        'Aprovação da direção geral necessária e a validação de unificação das tarefas executivas/direção geral não foi aprovada',
      travel_executiveApproved_booking:
        'Aprovação da direção geral desnecessária ou validamente unificada; reserva solicitada',
      travel_executiveApproved_completed:
        'Aprovação da direção geral desnecessária ou validamente unificada; reserva não solicitada',
      travel_gmApproved_booking: 'Reserva solicitada',
      travel_gmApproved_completed: 'Reserva não solicitada',
      payment_submit_head:
        'A verificação da fonte de recursos exige a escala completa de aprovação, incluindo pagamentos excedentes que exigem aprovação adicional',
      payment_submit_finance:
        'A verificação da fonte de recursos não exige a escala completa de aprovação',
      budgetAdjustment_cfoApproved_gm:
        'O valor do aumento orçamentário excede o limite da direção geral congelado no envio',
      budgetAdjustment_cfoApproved_approved:
        'Não é um aumento orçamentário ou o aumento não excede o limite congelado da direção geral',
      leave_managerApproved_head:
        'Dias ≥ limite congelado do chefe de departamento e o chefe está ausente ou difere do gestor',
      leave_managerApproved_hr:
        'Nenhuma revisão de chefe necessária; o tipo de licença exige RH ou dias ≥ limite congelado de RH',
      leave_managerApproved_approved:
        'Sem revisão de chefe, tipo de licença sem RH obrigatório e dias abaixo do limite congelado de RH',
      leave_headApproved_hr:
        'O tipo de licença exige RH ou dias ≥ limite congelado de RH',
      leave_headApproved_approved:
        'O tipo de licença não exige RH e os dias estão abaixo do limite congelado de RH',
      overtime_managerApproved_head:
        'As horas extras mensais excedem o limite congelado de revisão do chefe e o chefe está ausente ou difere do gestor',
      overtime_managerApproved_hr:
        'Nenhuma revisão de chefe necessária; enviado mais de 3 dias úteis após a data das horas extras',
      overtime_managerApproved_approved:
        'Nenhuma revisão de chefe necessária; enviado dentro da janela de comunicação de 3 dias úteis',
      overtime_headApproved_hr:
        'Enviado mais de 3 dias úteis após a data das horas extras',
      overtime_headApproved_approved:
        'Enviado dentro de 3 dias úteis após a data das horas extras',
      supplies_submit_issuing:
        'Reenviado de uma exceção de execução com o conteúdo aprovado inalterado',
      supplies_submit_manager:
        'Nova solicitação, conteúdo abrangido pela aprovação alterado ou condições de retomada não atendidas',
      vehicleRequest_submit_dispatch:
        'Reenviado de uma exceção de execução com o conteúdo aprovado inalterado',
      vehicleRequest_submit_head:
        'Nova solicitação, conteúdo abrangido pela aprovação alterado ou condições de retomada não atendidas',
      purchase_submit_purchasing:
        'Reenviado de uma exceção de execução com o conteúdo aprovado inalterado',
      purchase_submit_head:
        'Nova solicitação, conteúdo abrangido pela aprovação alterado ou condições de retomada não atendidas',
      assetRequest_submit_issuing:
        'Reenviado de uma exceção de execução com o conteúdo aprovado inalterado; elegibilidade de retomada aprovada; não é uma solicitação de baixa',
      assetRequest_submit_head:
        'Nova solicitação, conteúdo abrangido pela aprovação alterado ou condições de retomada não atendidas',
      sealRequest_submit_stamping:
        'Reenviado de uma exceção de execução com o conteúdo aprovado inalterado; elegibilidade de retomada aprovada',
      sealRequest_submit_head:
        'Nova solicitação, conteúdo abrangido pela aprovação alterado ou condições de retomada não atendidas',
      purchase_priced_revision:
        'Preço real > 120% da estimativa original; confirmação e reenvio do solicitante obrigatórios',
      purchase_priced_finance: 'Preço real ≤ 120% da estimativa original',
      purchase_forcedPriced_revision:
        'Preço real > 120% da estimativa original; confirmação e reenvio do solicitante obrigatórios',
      purchase_forcedPriced_finance: 'Preço real ≤ 120% da estimativa original',
      probation_hrApproved_gm:
        'A efetivação foi recusada ou o nível confirmado por RH atinge o limite congelado de classificação gerencial',
      probation_hrApproved_approved:
        'A efetivação não foi recusada e o nível confirmado por RH está abaixo do limite gerencial',
      departure_hrApproved_gm:
        'Nível do colaborador ≥ limite de classificação gerencial congelado no envio',
      departure_hrApproved_handover:
        'O nível do colaborador está abaixo do limite congelado de classificação gerencial',
      departure_cancellationRejected_gm:
        'Cancelamento rejeitado; retomar o estado salvo da direção geral anterior ao cancelamento',
      departure_cancellationRejected_handover:
        'Cancelamento rejeitado; retomar o estado salvo de transferência anterior ao cancelamento',
      departure_cancellationRejected_completed:
        'Cancelamento rejeitado; retomar o estado salvo de conclusão anterior ao cancelamento',
      recruitment_submit_head:
        'O solicitante não é o chefe de departamento ou o chefe está ausente',
      recruitment_submit_hrbp:
        'O solicitante é o chefe de departamento; pular autoaprovação',
      recruitment_reviewEdit_head:
        'O solicitante não é o chefe de departamento ou o chefe está ausente',
      recruitment_reviewEdit_hrbp:
        'O solicitante é o chefe de departamento; pular autoaprovação',
      recruitment_hrDirectorApproved_executive:
        'A requisição usa quadro de pessoal adicional',
      recruitment_hrDirectorApproved_gm:
        'Sem quadro adicional; o nível pretendido atinge o limite congelado de classificação de diretor',
      recruitment_hrDirectorApproved_approved:
        'Sem quadro adicional; o nível pretendido está abaixo do limite de classificação de diretor',
      recruitment_executiveApproved_gm:
        'Quadro adicional ou nível pretendido atinge o limite de diretor',
      recruitment_executiveApproved_approved:
        'Sem quadro adicional e nível pretendido abaixo do limite de diretor',
      transfer_submit_manager:
        'O executor do envio não é o gestor do colaborador; a ausência de gestor ainda encaminha à revisão gerencial',
      transfer_submit_sourceHead:
        'O executor do envio é o gestor do colaborador',
      transfer_reviewEdit_manager:
        'O executor do envio não é o gestor do colaborador; a ausência de gestor ainda encaminha à revisão gerencial',
      transfer_reviewEdit_sourceHead:
        'O executor do envio é o gestor do colaborador',
      transfer_sourceHeadApproved_targetHead:
        'A alteração inclui transferência de departamento',
      transfer_sourceHeadApproved_hr:
        'A alteração não inclui transferência de departamento',
      transfer_hrApproved_executive:
        'O aumento salarial excede o limite executivo congelado ou o nível pretendido atinge a classificação gerencial',
      transfer_hrApproved_gm:
        'Sem revisão executiva; aumento excede o limite congelado da direção geral ou nível pretendido atinge a classificação de diretor',
      transfer_hrApproved_pendingEffective:
        'Nenhuma condição salarial ou de nível para revisão adicional executiva/direção geral se aplica',
      transfer_executiveApproved_gm:
        'O aumento excede o limite congelado da direção geral ou o nível pretendido atinge a classificação de diretor',
      transfer_executiveApproved_pendingEffective:
        'Nenhuma condição salarial ou de nível para revisão adicional da direção geral se aplica',
      assetRequest_headApproved_appraisal:
        'A solicitação é de baixa patrimonial',
      assetRequest_headApproved_issuing:
        'A solicitação não é de baixa patrimonial',
      assetRequest_financeApproved_gm:
        'Solicitação de baixa; valor original total dos bens excede o limite congelado da direção geral para baixa',
      assetRequest_financeApproved_scrapped:
        'O limite da direção geral para valor original de baixa não foi excedido',
      assetRequest_issueCompleted_returning:
        'Solicitação de empréstimo: entregar e entrar no processamento de devolução',
      assetRequest_issueCompleted_issued: 'A solicitação não é de empréstimo',
      sealRequest_stamped_returning:
        'O empréstimo externo de carimbo exige processamento de devolução',
      sealRequest_stamped_completed: 'O carimbo não é usado externamente',
      vendorQualification_submit_removalReview:
        'A operação remove um fornecedor do diretório',
      vendorQualification_submit_purchasing:
        'A operação não remove um fornecedor',
      contract_headApproved_legalFinance:
        'Rescisão de contrato ou modelo não padrão',
      contract_headApproved_standardFinance:
        'Sem rescisão e com uso de modelo padrão',
      contract_legalFinanceApproved_executive:
        'O valor do contrato excede o limite executivo congelado; não é uma rescisão',
      contract_legalFinanceApproved_gm:
        'Sem revisão executiva; valor excede o limite congelado da direção geral para contratos ou jurídico/financeiro o marca como não padrão; não é uma rescisão',
      contract_legalFinanceApproved_approved:
        'Rescisão ou nenhuma condição de aprovação adicional',
      contract_standardFinanceApproved_executive:
        'O valor do contrato excede o limite executivo congelado',
      contract_standardFinanceApproved_gm:
        'Sem revisão executiva; valor excede o limite congelado da direção geral para contratos',
      contract_standardFinanceApproved_approved:
        'Nem o limite executivo nem o da direção geral para contratos foi excedido',
      contract_executiveApproved_gm:
        'O valor excede o limite congelado da direção geral para contratos ou o contrato é não padrão',
      contract_executiveApproved_approved:
        'O valor não excede o limite da direção geral para contratos e o contrato é padrão',
      committeeVersion:
        'Usar o grupo do comitê correspondente à versão congelada no envio',
      returnApplicant:
        'A decisão de devolução seleciona revisão e reenvio pelo solicitante',
      returnEarlier:
        'A decisão de devolução seleciona esta etapa anterior de aprovação já percorrida',
      seal_legal:
        'Após revisão do chefe: carimbo de contrato ou contrato vinculado',
      seal_financeManager:
        'Da revisão do chefe/jurídico: carimbo financeiro, após a prioridade do caminho de contrato',
      seal_gm:
        'Nenhum ramo jurídico/financeiro se aplica; carimbo do representante ou uso externo e o revisor atual não é o diretor geral',
      seal_stamping:
        'Nenhum ramo jurídico/financeiro se aplica e sem revisão adicional da direção geral ou o revisor atual é o diretor geral',
    },

    conditional: 'Condições de negócio se aplicam',
    transitionUnknown: 'Ação: {{name}}',
    transitionNames: {
      edit: 'Editar conteúdo',
      submit: 'Enviar',
      approved: 'Aprovação concluída',
      rejected: 'Rejeitar',
      returned: 'Devolver para revisão',
      withdraw: 'Retirar',
      terminate: 'Encerrar',
      booked: 'Reserva concluída',
      bookingFailed: 'Reserva falhou',
      bookingForced: 'Confirmar conclusão',
      retryBooking: 'Repetir reserva',
      reviseTrip: 'Revisar viagem',
      cancelApproved: 'Cancelamento aprovado',
      issued: 'Entrega concluída',
      unavailable: 'Indisponível / execução falhou',
      forceClosed: 'Forçar encerramento',
    },

    place: 'Posição vaga',
    placeNumber: 'Posição vaga {{number}}',
    placeRequired: 'Escolha uma posição vaga.',
    title: 'Gerenciamento de processos',
    description:
      'Visualize definições, execuções e históricos de aprovação de processos autorizados',
    definitions: 'Definições',
    executions: 'Execuções',
    refresh: 'Atualizar',
    search: 'Pesquisar por número, processo ou solicitante',
    definitionSearch: 'Pesquisar por nome do processo',
    clear: 'Limpar filtros',
    all: 'Todos',
    name: 'Nome',
    domain: 'Domínio de negócio',
    category: 'Categoria',
    capabilities: 'Recursos de gerenciamento',
    approval: 'Processo de aprovação',
    connected: 'Conectado',
    readOnly: 'Somente leitura',
    notConnected: 'Ações de gerenciamento ainda não conectadas',
    reference: 'Número / título',
    applicant: 'Solicitante',
    status: 'Status',
    stage: 'Etapa atual',
    createdAt: 'Iniciado',
    endedAt: 'Encerrado',
    empty: 'Nenhuma execução ainda',
    emptyDescription:
      'Execuções de processos conectados aparecem aqui quando iniciam',
    noDefinitions: 'Nenhuma definição legível',
    noDefinitionsDescription:
      'Peça a um administrador que configure o acesso às definições',
    noResults: 'Nenhum registro correspondente',
    noResultsDescription: 'Ajuste ou limpe os filtros para encontrar registros',
    definitionGraph: 'Definição atual',
    graphDescription:
      'Estados e transições registrados atualmente; as regras de negócio determinam ramos dinâmicos',
    currentNode: 'Estado atual',
    visitedNode: 'Visitado',
    unvisitedNode: 'Não visitado',
    executionHistory: 'Histórico de execução',
    terminationOutcome: 'Resultado do encerramento',
    actualPath: 'Caminho real de execução',
    actualDescription:
      'O fluxo completo de aprovação e execução com nós visitados, transições e estado atual destacados. Devoluções reais e caminhos históricos permanecem visíveis.',
    tasks: 'Tarefas e histórico de aprovação',
    timeline: 'Histórico de aprovação e gerenciamento',
    run: 'Execução de aprovação',
    historical: 'Histórico de execução',
    definitionMissing: 'Definição histórica indisponível',
    commentsRestricted:
      'Comentários podem conter conteúdo privado e exigem acesso de negócio separado',
    comment: 'Comentário / motivo',
    actor: 'Executor',
    assignee: 'Responsável',
    answer: 'Decisão',
    previousTask: 'Tarefa anterior',
    from: 'De',
    to: 'Para',
    initial: 'Inicial',
    final: 'Final',
    transitions: 'Transições de estado',
    definitionDetails: 'Etapas e transições',
    viewExecutions: 'Visualizar todos os registros',
    back: 'Voltar',
    manage: 'Ações de gerenciamento',
    appoint: 'Atribuir',
    reassign: 'Reatribuir',
    terminate: 'Encerrar',
    unavailable: 'A tarefa ou o estado de negócio atual não permite esta ação',
    person: 'Destinatário',
    reason: 'Motivo',
    personRequired: 'Escolha um destinatário',
    reasonRequired: 'Informe um motivo',
    cancel: 'Cancelar',
    retry: 'Tentar novamente',
    loadFailed: 'Falha no carregamento. Tente novamente',
    submitFailed: 'A ação falhou. Revise e tente novamente',
    unknown: 'Resultado desconhecido. Atualize para verificar',
    stale: 'A tarefa mudou. Atualize e revise',
    gone: 'Registro ausente ou fora do seu escopo atual',
    forbidden:
      'Você não pode ler esta seção. Entre em contato com um administrador',
    loading: 'Carregando',
    noPeople: 'Nenhum destinatário elegível para a tarefa atual',
    peopleSearch: 'Pesquisar destinatários autorizados',
    loadMore: 'Carregar mais',
    reassignTitle: 'Reatribuir uma tarefa de "{{recordLabel}}"',
    appointTitle: 'Atribuir uma tarefa de "{{recordLabel}}"',
    terminateTitle: 'Encerrar a solicitação "{{recordLabel}}"',
    reassigned: 'Tarefa de "{{recordLabel}}" reatribuída',
    appointed: 'Tarefa de "{{recordLabel}}" atribuída',
    terminated: 'Solicitação "{{recordLabel}}" encerrada',
    recentDescription:
      'As cinco execuções autorizadas mais recentes. Abra a lista de execuções para obter o histórico completo.',
    vehicleTerminationGuard:
      'Solicitações despachadas não podem ser encerradas diretamente. O solicitante real deve registrar o uso e seguir o processo de negócio de veículos.',
    terminationConsequences: {
      vehicle:
        'Encerra uma solicitação não despachada. Esta operação não pode encerrar uma solicitação despachada.',
      leave:
        'Encerra a aprovação atual; o serviço de licenças trata as reservas de saldo pendentes.',
      funding:
        'Encerra a aprovação atual; o serviço de negócio trata as reservas pendentes de orçamento, fundos ou solicitação. Pagamentos liquidados permanecem registrados.',
      stock:
        'Encerra a aprovação atual; o serviço de materiais trata as reservas de estoque pendentes. Devoluções físicas exigem seu processo de negócio.',
      ordinary:
        'Encerra a aprovação atual e executa as verificações de encerramento de negócio e o processamento de saída.',
    },
    terminationDescription:
      'O encerramento fecha tarefas atuais e libera reservas conforme as regras de negócio, preservando todo o histórico. Fatos de negócio executados exigem seu próprio cancelamento ou liberação de custódia.',
    graphView: 'Diagrama',
    dateRange: 'Data de início',
    last7: 'Últimos 7 dias',
    last30: 'Últimos 30 dias',
    last90: 'Últimos 90 dias',
    thisMonth: 'Este mês',
    lastMonth: 'Mês passado',
    safeHistory:
      'Esta visualização contém somente informações seguras de processos autorizados',
    business: 'Conteúdo de negócio',
    businessRestricted:
      'Conteúdo de negócio, anexos e campos privados exigem acesso separado',
    guardedBranch:
      'Ramo selecionado conforme as condições de negócio de origem',
    frozen: 'Campos congelados',
    covered: 'Campos abrangidos',
    management: 'Intervenção administrativa',
    kinds: {
      leave: 'Licença',
      overtime: 'Horas extras',
      leaveCancellation: 'Cancelamento de licença',
      general: 'Solicitação geral',
      attendanceChange: 'Correção de ponto',
      outing: 'Saída externa',
      supplies: 'Solicitação de materiais',
      budgetAdjustment: 'Ajuste orçamentário',
      expensePlan: 'Autorização de despesas',
      training: 'Treinamento',
      travel: 'Viagem',
      travelCancellation: 'Cancelamento de viagem',
      reimbursement: 'Reembolso',
      purchase: 'Compra',
      loan: 'Solicitação de empréstimo',
      payment: 'Solicitação de pagamento',
      probation: 'Avaliação de experiência',
      vehicleRequest: 'Solicitação de veículo',
      contract: 'Contrato',
      assetRequest: 'Solicitação de bem',
      vendorQualification: 'Qualificação de fornecedor',
      recruitment: 'Recrutamento',
      sealRequest: 'Solicitação de carimbo',
      transfer: 'Alteração de pessoal',
      departure: 'Desligamento',
      certificateRequest: 'Solicitação de certificado',
    },
    domains: {
      office: 'Rotina de escritório',
      organization: 'Organização e RH',
      finance: 'Finanças e despesas',
      procurement: 'Compras e contratos',
      administration: 'Administração e patrimônio',
    },
    states: {
      issued: 'Entregue',
      forcedClosed: 'Encerrado à força',
      draft: 'Rascunho',
      revision: 'Revisão',
      manager: 'Gestor',
      head: 'Chefe de departamento',
      hr: 'RH',
      extra: 'Revisão adicional',
      finance: 'Financeiro',
      cashier: 'Caixa',
      executive: 'Executivo',
      gm: 'Diretor geral',
      cfo: 'Diretor financeiro',
      legal: 'Jurídico',
      financeManager: 'Gerente financeiro',
      hrbp: 'Parceiro de negócios de RH',
      hrDirector: 'Diretor de RH',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      withdrawn: 'Retirado',
      terminated: 'Encerrado',
      completed: 'Concluído',
      exception: 'Exceção de processamento',
      dispatch: 'Despacho',
      usage: 'Uso de veículo',
      issuing: 'Entrega',
      returning: 'Devolução',
      returnException: 'Exceção de devolução',
      stamping: 'Aplicação de carimbo',
      booking: 'Reserva',
      unbooking: 'Cancelar reserva',
      paid: 'Pago',
      paymentException: 'Exceção de pagamento',
      pendingEffective: 'Aguardando data de vigência',
      cancellationReview: 'Revisão de cancelamento',
      sourceHead: 'Chefe do departamento de origem',
      targetHead: 'Chefe do departamento de destino',
      committee: 'Comitê',
      purchasing: 'Compras',
      inquiry: 'Pesquisa de preços',
      quoting: 'Cotação',
      pending: 'Pendente',
      claimed: 'Assumida',
      waiting: 'Aguardando',
      blocked: 'Bloqueado',
      candidate: 'Candidato',
      suspended: 'Suspenso',
      transferred: 'Transferido',
      voided: 'Encerrado',
      open: 'Abrir',
      cancelled: 'Cancelado',
      returned: 'Devolvido',
      concluded: 'Concluído',
      decide: 'Decisão',
      copy: 'Copiar',
      approve: 'Aprovar',
      reject: 'Rejeitar',
      return: 'Devolver',
      unknown: 'Outro estado',
    },
    authz: {
      definitionRead: 'Definições',
      historyRead: 'Histórico de execução',
      appoint: 'Atribuir',
      reassign: 'Reatribuir',
      terminate: 'Encerrar',
    },
    otherStage: 'Outra etapa ({{name}})',
    otherEvent: 'Evento do processo ({{name}})',
    events: {
      approve: 'Aprovado',
      reject: 'Rejeitado',
      return: 'Devolvido',
      reassign: 'Reatribuição administrativa',
      appoint: 'Atribuição administrativa',
      comment: 'Comentário',
      transfer: 'Transferido',
      addSign: 'Signatário adicionado',
      claim: 'Assumida',
      release: 'Tarefa liberada',
      'stage.unassigned': 'Etapa não atribuída',
      'run.started': 'Aprovação iniciada',
      'run.ended': 'Aprovação encerrada',
      'stage.entered': 'Entrada na etapa',
      remind: 'Lembrete',
      escalate: 'Escalonado',
      read: 'Ler',
    },
  },
};
