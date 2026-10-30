/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Calendário de trabalho',
      dictionaries: 'Dicionários',
      rules: 'Visão geral de regras e histórico',
      sequences: 'Números de documentos',
      auditLogs: 'Registro de auditoria',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'Plataforma OA',
      calendar: 'Calendário de trabalho',
      dictionaries: 'Dicionários',
      rules: 'Visão geral de regras e histórico',
      sequences: 'Números de documentos',
      auditLogs: 'Registro de auditoria',
      actions: { read: 'Visualizar', update: 'Editar' },
    },
    common: {
      actions: 'Ações',
      actionsFor: 'Ações de {{name}}',
      edit: 'Editar',
      delete: 'Excluir',
      refresh: 'Atualizar',
      clearFilters: 'Limpar filtros',
      noResults: 'Nada corresponde aos filtros.',
      forbidden: 'Você não tem permissão para visualizar isto.',
      notFound: 'Este registro não existe ou foi excluído.',
      loadFailed:
        'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
      writeForbidden: 'Você não tem permissão para fazer esta alteração.',
      saveFailed: 'Não foi possível salvar a alteração. Tente novamente.',
    },
    calendar: {
      title: 'Calendário de trabalho',
      description:
        'Defina os horários de trabalho e mantenha os feriados e dias de compensação de cada ano.',
      loadFailedTitle:
        'Não foi possível carregar as configurações do calendário',
      kinds: {
        holiday: 'Feriado',
        adjustedWorkday: 'Dia de trabalho compensatório',
        workday: 'Dia útil',
        weekend: 'Dia de folga',
      },
      workHours: {
        title: 'Horário de trabalho',
        description:
          'Lembretes e escalonamentos de aprovação contam apenas estas horas em dias úteis.',
        start: 'Início em',
        end: 'Fim em',
        range: '{{start}}–{{end}}',
        invalidTime: 'Informe um horário como 09:00.',
        endBeforeStart: 'O término deve ser posterior ao início.',
        scheduled: 'A partir de {{date}}: {{start}}–{{end}}',
        saved: 'Horários de trabalho salvos',
      },
      timeZone: {
        title: 'Fuso horário',
        description:
          'O fuso horário utilizado pelo calendário e pelos números de documentos. Uma alteração se aplica imediatamente.',
        label: 'Fuso horário',
        hint: 'Um nome de fuso horário IANA, como Asia/Shanghai.',
        required: 'Informe um fuso horário.',
        invalid:
          'Este fuso horário não é conhecido pelo servidor. Use um nome como Asia/Shanghai.',
        saved: 'Fuso horário salvo',
      },
      days: {
        remove: 'Remover',
        title: 'Dias especiais',
        description:
          'Dias não listados seguem a semana: segunda a sexta são dias úteis.',
        previousYear: 'Ano anterior',
        nextYear: 'Próximo ano',
        add: 'Adicionar dia',
        addTitle: 'Adicionar dia',
        addDescription: 'Uma data já listada é substituída.',
        addSubmit: 'Adicionar',
        editTitle: 'Editar {{date}}',
        import: 'Importar',
        date: 'Data',
        weekday: 'Dia da semana',
        kind: 'Tipo',
        note: 'Observação',
        dateRequired: 'Escolha uma data.',
        noteTooLong: 'Use no máximo {{max}} caracteres.',
        emptyTitle: 'Nenhum dia especial em {{year}} ainda',
        emptyDescription:
          'Importe os feriados e dias de compensação do ano ou adicione-os individualmente.',
        emptyReadOnly:
          'Todos os dias seguem a semana. Peça a um administrador que importe os feriados.',
        saved: '"{{date}}" salvo',
        removed: '"{{date}}" removido',
        removeTitle: 'Remover "{{date}}"?',
        removeDescription: 'A data volta a seguir a semana.',
        notFound: 'Este dia não está mais listado. Ele pode ter sido removido.',
      },
      import: {
        title: 'Importar dias especiais de {{year}}',
        description:
          'Cole um dia por linha: data, tipo e uma observação opcional.',
        lines: 'Dias',
        placeholder:
          '{{year}}-10-01,holiday,Dia Nacional\n{{year}}-10-10,adjustedWorkday',
        hint: 'Separe com vírgulas ou tabulações. Tipos: holiday, adjustedWorkday, workday, weekend (ou 休 / 班).',
        replace: 'Substituir o ano',
        replacePreview:
          'Com base no calendário atual, {{count}} dias especiais existentes em {{year}} estão ausentes nesta importação e serão removidos. Outros usuários podem alterar o calendário antes de você salvar.',
        previewFailed:
          'Não foi possível carregar o ano completo do calendário. Tente novamente antes de substituí-lo.',
        confirmReplaceTitle: 'Substituir os dias especiais de {{year}}?',
        replaceHint:
          'Remova os dias especiais de {{year}} que não estão na lista.',
        submit: 'Importar',
        emptyText: 'Cole pelo menos um dia.',
        success:
          'Importados: {{created}} adicionados, {{updated}} alterados, {{removed}} removidos',
        problems: {
          format: 'A linha {{line}} precisa de data e tipo.',
          date: 'A linha {{line}} possui uma data inválida.',
          kind: 'A linha {{line}} possui um tipo desconhecido.',
          year: 'A linha {{line}} não está em {{year}}.',
          duplicate: 'A linha {{line}} repete uma data.',
        },
      },
    },
    dictionaries: {
      title: 'Dicionários',
      description:
        'Mantenha as opções oferecidas pelos formulários de solicitação. Entradas são desabilitadas, nunca excluídas.',
      loadFailedTitle: 'Não foi possível carregar o dicionário',
      searchPlaceholder: 'Pesquisar por nome ou código',
      searchLabel: 'Pesquisar entradas',
      notFound: 'Esta entrada não existe ou foi removida.',
      enable: 'Habilitar',
      enabled: '"{{name}}" habilitado',
      disable: 'Desabilitar',
      disabled: '"{{name}}" desabilitado',
      disableTitle: 'Desabilitar "{{name}}"?',
      disableDescription:
        'Solicitações existentes continuam exibindo-a, mas novas solicitações não poderão escolhê-la. Você pode habilitá-la novamente.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: sem limite',
      fields: {
        type: 'Tipo de dicionário',
        label: 'Nome',
        labelZh: 'Nome (chinês)',
        labelEn: 'Nome (inglês)',
        code: 'Código',
        extra: 'Atributos',
        sortOrder: 'Ordem',
        status: 'Status',
      },
      status: {
        all: 'Todos os status',
        active: 'Habilitado',
        inactive: 'Desativada',
      },
      empty: {
        title: 'Nenhuma entrada deste tipo ainda',
        description:
          'Adicione a primeira entrada para disponibilizá-la nos formulários.',
        readOnly: 'Peça a um administrador que adicione entradas.',
      },
      create: {
        action: 'Nova entrada',
        title: 'Nova entrada: {{type}}',
        success: 'Entrada "{{name}}" criada',
      },
      edit: { title: 'Editar entrada', success: 'Entrada "{{name}}" salva' },
      form: {
        description:
          'Uma entrada de {{type}}. Nomeie-a em pelo menos um idioma.',
        codeHint:
          'Letras, dígitos, _ e -, começando com uma letra. Não pode ser alterado posteriormente.',
        codeFixed:
          'Os registros armazenam o código, por isso ele não pode mudar.',
        codeInvalid:
          'Use letras, dígitos, _ e -, começando com uma letra (no máximo 64).',
        codeTaken: 'Este tipo já tem uma entrada com este código.',
        labelRequired: 'Informe um nome em pelo menos um idioma.',
        labelTooLong: 'Use no máximo {{max}} caracteres.',
        sortOrderHint: 'Números menores vêm primeiro nos formulários.',
        sortOrderInvalid: 'Informe um número inteiro de 0 a 1.000.000.',
        numberRequired: 'Informe um número.',
        numberMin: 'Informe um número de pelo menos {{min}}.',
        integerMin: 'Informe um número inteiro de pelo menos {{min}}.',
        blankUnlimited: 'Deixe vazio para não ter limite.',
        extraInvalid: 'Este valor não é aceito.',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: 'Assuntos de solicitações de despesas',
        officeItem: 'Materiais de escritório',
        leaveType: 'Tipos de licença',
        annualLeaveTier: 'Férias anuais por tempo de serviço',
        paymentMethod: 'Forma de pagamento',
        expenseCategory: 'Categorias de despesas',
        budgetSubject: 'Rubricas orçamentárias',
        sealType: 'Tipos de carimbo',
        contractType: 'Tipos de contrato',
        assetCategory: 'Categorias de bens',
        supplierCategory: 'Categorias de fornecedores',
        vehicleType: 'Tipos de veículo',
        departureType: 'Tipo de desligamento',
        resignationReason: 'Motivos de demissão',
        recruitmentReason: 'Motivos de contratação',
        certificateType: 'Tipos de certificado',
        travelStandard: 'Padrões de viagem',
      },
      travelStandardKindHelp:
        'Use a categoria correspondente para hospedagem e diária. Uma categoria agregada de viagem não representa nenhuma delas e não possui padrão diário.',
      invalidStandardKind:
        'Escolha uma classificação válida de padrão de viagem.',
      extraOptions: {
        travelStandardKind: {
          none: 'Não se aplica',
          lodging: 'Hospedagem por noite',
          allowance: 'Diária por dia',
        },
      },
      extra: {
        travelStandardKind: 'Classificação do padrão de viagem',
        requiresPrintInfo: 'Exige detalhes para impressão',
        deductsBalance: 'Deduz saldo',
        requiresAttachment: 'Exige anexo',
        attachmentAboveDays: 'Anexo acima de (dias)',
        maxDays: 'Máximo de dias',
        requiresHr: 'Aprovação de RH',
        minYears: 'A partir de anos de serviço',
        days: 'Dias',
        voluntary: 'Voluntário',
        replacement: 'Substitui um desligado',
        involvesSalary: 'Exibe salário',
        minRank: 'A partir da classificação do nível',
        lodgingPerNight: 'Hospedagem por noite (yuan)',
        allowancePerDay: 'Diária por dia (yuan)',
      },
    },
    rules: {
      relatedFlows: 'Processos relacionados (editar no nó)',
      editAtNode: 'Editar no nó do processo',
      title: 'Visão geral de regras e histórico',
      description:
        'Visualize regras atuais, alterações agendadas e histórico. Abra um nó de processo relacionado para editar; regras compartilhadas afetam vários processos.',
      loadFailedTitle: 'Não foi possível carregar as regras de aprovação',
      notFound: 'Esta regra não existe.',
      change: 'Alteração',
      history: 'Histórico',
      changeTitle: 'Alterar "{{name}}"',
      changeDescription:
        'O novo valor se aplica às solicitações enviadas a partir de sua entrada em vigor.',
      changed: '"{{name}}" alterado',
      historyTitle: 'Histórico de "{{name}}"',
      currentValue: 'Agora: {{value}}',
      scheduledValue: 'A partir de {{date}}: {{value}}',
      defaultVersion: 'Padrão',
      withdraw: 'Retirar',
      withdrawn: 'Alteração agendada de "{{name}}" retirada',
      withdrawTitle: 'Retirar a alteração de "{{name}}" a partir de {{date}}?',
      withdrawDescription: 'O valor agendado {{value}} não entrará em vigor.',
      versionStatus: { current: 'Em vigor', scheduled: 'Agendado' },
      fields: {
        rule: 'Regra',
        current: 'Valor atual',
        scheduled: 'Agendado',
        newValue: 'Novo valor',
        value: 'Valor',
        note: 'Observação',
        effectiveFrom: 'Entra em vigor',
        changedBy: 'Alterado por',
      },
      effective: {
        label: 'Entra em vigor',
        now: 'Imediatamente',
        fromDate: 'A partir de uma data',
        dateLabel: 'Data de vigência',
        hint: 'A partir de 00:00 daquele dia.',
        dateRequired: 'Escolha a data de entrada em vigor.',
        pastError: 'Escolha uma data a partir de amanhã.',
      },
      errors: {
        valueRequired: 'Informe um valor.',
        notANumber: 'Informe um número.',
        minimum: 'Informe pelo menos {{min}}.',
        percentRange: 'Informe uma porcentagem de {{min}} a {{max}}.',
        integer: 'Informe um número inteiro.',
        halfDays: 'Informe dias em incrementos de 0,5.',
        noteTooLong: 'Use no máximo {{max}} caracteres.',
        invalidValue: 'Este valor não é aceito.',
        orderViolated:
          'Este valor está fora da ordem em relação a uma regra relacionada (por exemplo, o limite da vice-presidência acima do da direção geral). Altere primeiro a regra relacionada.',
        versionExists:
          'Uma alteração já entra em vigor nesse momento. Escolha outra data.',
        inEffect: 'Esta alteração já entrou em vigor e agora é histórica.',
      },
      domains: {
        spend: {
          title: 'Gastos',
          description:
            'Limites de valor da escala de gastos e de outras aprovações financeiras.',
        },
        leave: {
          title: 'Licença',
          description:
            'Durações de licença que exigem chefe de departamento ou RH.',
        },
        attendance: {
          title: 'Ponto',
          description: 'Limites de horas extras e correções de ponto.',
        },
        hr: {
          title: 'RH',
          description: 'Níveis de carreira e limites de aumento salarial.',
        },
        sla: {
          title: 'Prazos de aprovação',
          description: 'Lembretes e escalonamentos, contados em horas úteis.',
        },
        committee: {
          title: 'Comitês de revisão',
          description: 'Padrões de votos dos comitês.',
        },
        calendar: {
          title: 'Calendário de trabalho',
          description: 'Horários de trabalho e fuso horário.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} vezes',
        integer: '{{value}}',
        days: '{{value}} dias',
        hours: '{{value}} horas',
        workingHours: '{{value}} horas úteis',
        rank: 'Classificação {{value}}',
      },
      unitSuffix: {
        money: 'yuan',
        count: 'vezes',
        integer: '',
        days: 'dias',
        hours: 'horas',
        workingHours: 'horas úteis',
        ratio: '%',
        rank: 'classificação',
      },
      keys: {
        itRepair_securityTransfer: {
          label: 'Restricted transfer (0 off, 1 on)',
          description:
            'Enable only after isolation verification; production configuration needs separate authorization.',
        },
        itRepair_acceptanceDays: {
          label: 'Acceptance reminder (working days)',
          description:
            'Frozen on submission; never closes a repair automatically.',
        },
        itRepair_followUpDays: {
          label: 'Follow-up interval (working days)',
          description: 'Frozen interval after a waiting reminder.',
        },
        itRepair_morning: {
          label: 'IT repair morning hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_afternoon: {
          label: 'IT repair afternoon hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_P1_response: {
          label: 'P1 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P1_resolution: {
          label: 'P1 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_response: {
          label: 'P2 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_resolution: {
          label: 'P2 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_response: {
          label: 'P3 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_resolution: {
          label: 'P3 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_response: {
          label: 'P4 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_resolution: {
          label: 'P4 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        leave_annualAccrualEnabled: {
          label: 'Acúmulo automático de férias anuais',
          description:
            '0 desabilita concessões automáticas; 1 habilita o acúmulo diário. Preencha as datas de início de carreira dos colaboradores antes de habilitar.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Mês de vencimento das férias anuais acumuladas',
          description:
            'Mês do ano seguinte em que as férias anuais não utilizadas expiram (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Dia de vencimento das férias anuais acumuladas',
          description:
            'Último dia válido do mês de vencimento (1–31); meses mais curtos usam seu último dia.',
        },
        spend_vp: {
          label: 'Limite da vice-presidência',
          description:
            'Valores acima deste exigem o vice-presidente responsável.',
        },
        spend_gm: {
          label: 'Limite da direção geral',
          description: 'Valores acima deste exigem o diretor geral.',
        },
        expense_head: {
          label: 'Reembolsos que dispensam o chefe de departamento',
          description:
            'Um reembolso com total até este valor é aprovado pelo gestor direto.',
        },
        loan_head: {
          label: 'Limite do chefe de departamento para empréstimos',
          description:
            'Empréstimos acima deste valor exigem o chefe de departamento.',
        },
        loan_personalMax: {
          label: 'Limite pessoal de empréstimos',
          description: 'O máximo que uma pessoa pode dever por vez.',
        },
        purchase_quotes: {
          label: 'Três cotações obrigatórias acima de',
          description:
            'Compras acima deste valor exigem três cotações concorrentes.',
        },
        contract_gm: {
          label: 'Limite da direção geral para contratos',
          description: 'Contratos acima deste valor exigem o diretor geral.',
        },
        asset_scrapGm: {
          label: 'Limite de baixa patrimonial',
          description:
            'A baixa de bens com valor original acima deste exige o diretor geral.',
        },
        budget_increaseGm: {
          label: 'Limite de aumento orçamentário',
          description:
            'Aumentos orçamentários acima deste valor exigem o diretor geral.',
        },
        leave_head: {
          label: 'Licença que exige chefe de departamento',
          description:
            'Licenças com pelo menos esta quantidade de dias exigem o chefe de departamento.',
        },
        leave_hr: {
          label: 'Licença que exige RH',
          description:
            'Licenças com pelo menos esta quantidade de dias exigem RH.',
        },
        overtime_monthlyHead: {
          label: 'Horas extras mensais que exigem chefe de departamento',
          description:
            'Horas extras acima desta quantidade de horas no mês exigem o chefe de departamento.',
        },
        attendance_fixPerMonth: {
          label: 'Correções de ponto por mês',
          description: 'Quantas correções uma pessoa pode solicitar por mês.',
        },
        grade_managerRank: {
          label: 'Classificação do nível de gestor',
          description:
            'Níveis com pelo menos esta classificação são considerados gerenciais.',
        },
        grade_directorRank: {
          label: 'Classificação do nível de diretor',
          description:
            'Níveis com pelo menos esta classificação são considerados de diretoria.',
        },
        raise_vp: {
          label: 'Aumento salarial que exige vice-presidência',
          description:
            'Aumentos acima desta proporção exigem o vice-presidente.',
        },
        raise_gm: {
          label: 'Aumento salarial que exige direção geral',
          description: 'Aumentos acima desta proporção exigem o diretor geral.',
        },
        sla_remindHours: {
          label: 'Lembrete após',
          description: 'Lembrar o aprovador após este tempo útil.',
        },
        sla_escalateHours: {
          label: 'Escalonamento após',
          description:
            'Escalonar para o gestor do aprovador após este tempo útil.',
        },
        sla_urgeCooldownHours: {
          label: 'Intervalo entre cobranças',
          description: 'Quanto tempo o solicitante aguarda entre cobranças.',
        },
        committee_min: {
          label: 'Votos de aprovação do comitê',
          description:
            'Quantidade padrão de votos de aprovação exigida pelo comitê.',
        },
        calendar_workHours: {
          label: 'Horário de trabalho',
          description: 'A janela diária de trabalho.',
        },
        calendar_timeZone: {
          label: 'Fuso horário',
          description: 'O fuso horário do calendário.',
        },
      },
    },
    sequences: {
      title: 'Números de documentos',
      description:
        'Os números emitidos por cada prefixo de documento por mês. Os números são emitidos no envio.',
      loadFailedTitle: 'Não foi possível carregar os números de documentos',
      searchPlaceholder: 'Filtrar por prefixo, como LV',
      searchLabel: 'Filtrar por prefixo',
      fields: {
        prefix: 'Prefixo',
        period: 'Mês',
        issued: 'Entregue',
        next: 'Próximo número',
      },
      empty: {
        title: 'Nenhum número emitido ainda',
        description:
          'Os números aparecem aqui quando as solicitações são enviadas.',
      },
    },
    auditLogs: {
      title: 'Registro de auditoria',
      description:
        'Um registro somente leitura de alterações sensíveis na organização, nas pessoas, nas regras e nas configurações.',
      loadFailedTitle: 'Não foi possível carregar o registro de auditoria',
      system: 'Sistema',
      notFound: 'Esta entrada não existe.',
      detailTitle: 'Entrada de auditoria: {{action}}',
      detailTitleLoading: 'Entrada de auditoria',
      changes: 'O que mudou',
      noChanges: 'Nenhum valor foi registrado.',
      changed: 'Alterado',
      wholeValue: 'Valor',
      fields: {
        at: 'Horário',
        actor: 'Por',
        action: 'Ação',
        targetType: 'Tipo de objeto',
        targetId: 'Objeto',
        reason: 'Motivo',
        field: 'Campo',
        before: 'Antes',
        after: 'Depois',
      },
      filters: {
        allTargetTypes: 'Todos os tipos de objeto',
        allActions: 'Todas as ações',
        actor: 'Qualquer pessoa',
        dateRange: 'Qualquer data',
        presets: 'Intervalo rápido',
      },
      presets: {
        last7: 'Últimos 7 dias',
        last30: 'Últimos 30 dias',
        thisMonth: 'Este mês',
        lastMonth: 'Mês passado',
        last90: 'Últimos 90 dias',
      },
      empty: {
        title: 'Nenhuma entrada de auditoria ainda',
        description:
          'Alterações sensíveis são registradas aqui à medida que são feitas.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
