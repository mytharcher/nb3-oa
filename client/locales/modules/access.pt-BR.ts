export default {
  access: {
    guide: {
      title: 'Como funcionam os papéis e as permissões',
      roles:
        'Configure aqui as operações por departamento, cargo ou responsabilidade. Os membros recebem estas permissões além de suas atribuições diretas.',
      setsTitle: 'Conjuntos de permissões',
      sets: 'As concessões armazenadas por trás dos papéis, disponíveis para inspeção e reutilização. Use a página de papéis para alterações cotidianas.',
      defaultTitle: 'Acesso padrão a registros',
      default:
        'Fornece o escopo básico quando uma operação não tem escopo específico. Não concede a operação em si.',
      sharingTitle: 'Regras de compartilhamento',
      sharing:
        'Amplia os registros disponíveis às pessoas que já possuem permissão para a operação.',
      restrictionTitle: 'Regras de restrição',
      restriction:
        'Limita ainda mais quais registros autorizados estão acessíveis.',
      inspectTitle: 'Inspetor de permissões',
      inspect:
        'Verifique as concessões efetivas e suas origens quando uma página ou registro estiver indisponível.',
    },
    permissionColumn: 'Permissão',
    personalGranted: 'Concedida pessoalmente',
    personalTarget: 'Escolher destino da concessão pessoal',
    rowSaving: 'Salvando…',
    rowSaved: 'Salvo',
    rowFailed:
      'Alteração não salva. A configuração atual foi restaurada; revise e tente novamente.',
    rowUncertain:
      'Não foi possível confirmar o resultado do salvamento. Atualize antes de fazer outras alterações.',
    inlinePermissionsHelp:
      'As alterações são salvas imediatamente. Concessões pessoais se somam ao acesso herdado; desativá-las não remove permissões herdadas.',
    configuredOnly: 'Somente permissões configuradas',

    personalGrantEnabled: 'Conceder esta operação pessoalmente',
    systemScope: 'Usar regras do sistema',
    systemScopeHelp:
      'Escopos não especificados seguem o acesso padrão e as regras de compartilhamento. Isso não significa todos os registros.',
    grantSources: 'Concedida por',
    scopeForAction: '{{action}}: escopo {{scope}}',
    personalGrantAction: 'Conceder “{{action}}” pessoalmente',
    personalGrantScope:
      'Conceder “{{action}}” pessoalmente. Escopo de dados: {{scope}}',
    personalGrantOff: 'Sem concessão pessoal; permissões herdadas permanecem.',
    personalGrantPending: 'Alteração não salva. Entra em vigor após salvar.',
    editPersonalCard: 'Editar permissões pessoais de {{name}}',
    userPermissions: 'Permissões',
    inheritedPermissions: 'Permissões herdadas',
    inheritedUnavailable: 'Você não tem acesso às permissões herdadas.',
    personalOnly: 'Somente exceções pessoais',
    notGranted: 'Não concedida',
    notSet: 'Não definido',
    adjustPersonalPermissions: 'Ajustar permissões pessoais',
    unifiedPermissionsHelp:
      'Permissões configuradas por origem. Alterações pessoais não removem concessões herdadas; o acesso real também segue as restrições aplicáveis.',
    sourceGroups: {
      baseline: 'Base para todos',
      duties: 'Papéis funcionais',
      organization: 'Vínculos organizacionais',
      direct: 'Concessões pessoais',
      system: 'Administrador do sistema',
    },
    noPersonalExceptions: 'Sem exceções pessoais',
    membershipChanged:
      'A associação foi alterada em outra operação. O estado atual foi recarregado; confirme as alterações restantes.',
    username: 'Nome de usuário',
    personalExceptions: 'Exceções pessoais',
    adjustExceptions: 'Ajustar exceções pessoais',
    exceptionsHelp:
      'Somente as permissões concedidas diretamente a esta pessoa são alteradas. Permissões do papel ou da organização podem continuar válidas após a remoção.',
    editDenied:
      'Você não pode editar esta configuração. Exibindo a visualização somente leitura.',
    permissionSources: 'Origens das permissões',
    frozenConfiguration:
      'Esta conta está bloqueada. A configuração de autorização é mantida e será aplicada conforme as regras em vigor quando for ativada.',
    frozenRoles:
      'Esta conta está bloqueada. Ative-a antes de adicionar papéis funcionais; papéis existentes podem ser removidos.',
    roleInactive: 'Inativo',
    roleAdditionBlocked:
      'A conta está bloqueada ou um papel selecionado está inativo ou indisponível. Cancele estas adições ou recarregue o estado antes de confirmar.',
    membershipUnverified:
      'O resultado não foi verificado. Recarregue as associações antes de continuar; não repita o envio.',
    dutyRolesHelp:
      'Os papéis funcionais atribuídos diretamente a esta pessoa aparecem aqui.',
    noPrimaryDepartment: 'Sem departamento principal atual',
    primaryDepartment: 'Departamento principal',
    departmentPath: 'Caminho do departamento',
    organizationHelp:
      'A associação à organização é mantida pelos administradores da organização.',
    roleFilterInvalid:
      'Este papel funcional está indisponível. O filtro de papel foi limpo.',
    roleFilterTooLarge:
      'Este papel possui mais de 500 membros. A filtragem por este papel não é suportada; limpe o filtro.',
    organizationState: {
      'inactive-chain':
        'O departamento principal ou um ancestral está inativo. Este vínculo organizacional não se aplica atualmente.',
      'invalid-chain':
        'Este vínculo organizacional é inválido. Entre em contato com um administrador da organização.',
    },

    scopeNumber: 'Escopo de registros {{number}}',
    scopeLabels: {
      paymentRequests: 'Solicitações de pagamento',
      reimbursementRequests: 'Solicitações de reembolso',
      leaveRequests: 'Solicitações de licença',
      contractRequests: 'Solicitações de aprovação de contrato',
      certificateRequests: 'Solicitações de certificados',
      sealRequests: 'Solicitações de carimbos',
      printTemplates: 'Modelos',
      printTemplateRevisions: 'Versões de modelos',
      knowledgeDocuments: 'Documentos',
      knowledgeVersions: 'Versões de documentos',
      knowledgeFolders: 'Pastas',
      sealLedger: 'Cadastros de carimbos',
      sealReceipts: 'Comprovantes de carimbos',
      contracts: 'Contratos',
      contractVersions: 'Versões de contratos',
      contractChanges: 'Alterações de contratos',
      contractPayments: 'Pagamentos de contratos',
    },
    sourceNumber: 'Origem {{number}}',
    more: 'Mais',
    userRoles: 'Papéis',
    permissionOverview: 'Visão geral de permissões',
    noRoles: 'Nenhum',
    organization: 'Organização',
    moreFor: 'Mais · {{name}}',
    addModules: 'Adicionar módulos',
    userDetails: 'Detalhes do usuário',
    information: 'Informações',
    email: 'E-mail',
    accountStatus: 'Status da conta',
    enabled: 'Ativa',
    disabled: 'Bloqueado',
    organizationReadOnly:
      'Departamentos, cargos e relações de subordinação são mantidos em Organização.',
    advancedExceptions: 'Avançado: concessões excepcionais',
    partialSave:
      '{{count}} alterações salvas. As restantes foram mantidas; tente novamente para continuar.',
    addedRoles: 'Adicionar: {{names}}',
    removedRoles: 'Remover: {{names}}',
    compareRole: 'Comparar papel',
    copyRole: 'Copiar da comparação',
    copyHelp:
      'Copie concessões comuns para este rascunho. Políticas especiais permanecem inalteradas. Revise todas as alterações antes de salvar.',
    advanced: 'Avançado',
    addRoles: 'Adicionar papéis à comparação',

    directAudience: 'Atribuições individuais',
    dutyAudience: 'Membros do papel de responsabilidade',

    targetSet: 'Conjunto de permissões de destino',
    chooseTarget: 'Escolha um conjunto de permissões para esta operação',
    targetRequired:
      'Escolha um destino para esta nova operação antes de salvar.',
    roleGrantTitle: '{{module}} ({{role}} · concessão independente {{number}})',

    assignmentSearch: 'Pesquisar permissões, ações ou escopos de registros',
    assignmentOnlySelected: 'Somente selecionados',
    assignmentCount:
      'Exibindo {{visible}} de {{total}} · {{selected}} selecionados em todos os módulos',
    assignmentChoicesHelp:
      'Filtre por módulo e compare ações e escopos de registros. Conjuntos com o mesmo nome permanecem independentes. Os filtros preservam seleções em outros módulos.',
    assignmentBusiness: 'Operações de negócio',
    assignmentOther: 'Administração / outros',
    pageAccess: 'Acesso a páginas',
    configuredGrant: 'Concedido',
    dutyMembershipTitle:
      '{{action}} o papel de responsabilidade "{{role}}" de "{{name}}"?',
    exceptionSummary: 'Concessões excepcionais: {{names}}',
    noExceptions: 'Nenhum',
    baseOnlyDepartment:
      'O acesso de departamento alcança membros descendentes. Prefira papéis de responsabilidade para operações especializadas.',

    adminMembersHelp:
      'Gerencie administradores nas contas de usuários. Mantenha pelo menos um administrador ativo.',
    openUsers: 'Visualizar contas de usuários',
    ruleLinks: 'Regras de acesso',
    rulesHelp:
      'O acesso padrão e as regras de compartilhamento e restrição continuam afetando o acesso efetivo.',
    defaultRules: 'Acesso padrão',
    sharingRules: 'Regras de compartilhamento',
    restrictionRules: 'Regras de restrição',

    modules: 'Navegar por módulo',
    onlyConfigured: 'Somente configurados',
    baselineValue: 'Todos possuem acesso básico: {{value}}',
    advancedEdit: 'Editor avançado',
    changedCount: '{{count}} alterações',
    roleImpact: 'Membros afetados de "{{name}}": {{count}}',
    sharedObjects:
      'Os conjuntos de permissões também estão atribuídos a: {{names}}',
    changeShared: 'Alterar todos estes sujeitos',
    splitDefault:
      'Por padrão, dividir conjuntos compartilhados em cópias independentes para este papel.',
    userPermissionsTitle: 'Permissões de {{name}}',
    unionHelp:
      'Os escopos de registros de várias origens são combinados; as regras de acesso continuam válidas.',
    assignedRoles: 'Papéis atribuídos',
    preferRoles:
      'Prefira papéis de responsabilidade; concessões diretas são para exceções.',
    exceptionGrant: 'Gerenciar concessões excepcionais',
    configurationDenied:
      'É necessário acesso de leitura a conjuntos de permissões para visualizar os detalhes da configuração. Entre em contato com um administrador.',
    checkOperation: 'Verificar uma operação',
    notConfigured: 'Não configurado',
    applicable: 'Aplica-se a',
    modulesCount: 'Módulos configurados',
    personalAudience: 'Atribuição direta · {{count}} pessoas',
    maintainedAudience: 'Membros gerenciados · {{count}} pessoas',
    automaticAudience: 'Calculado a partir dos vínculos organizacionais',
    departmentAudience: 'Membros do departamento e descendentes',
    positionAudience: 'Pessoas que ocupam este cargo',
    allAuthenticated: 'Todas as pessoas conectadas',
    organizationMembersHelp:
      'Os membros são mantidos na organização e calculados a partir dos vínculos ativos.',
    openOrganization: 'Visualizar organização',
    adjustDutyRoles: 'Ajustar papéis de responsabilidade',
    membersUnknown: 'Quantidade de membros indisponível',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Limpar filtros',
    noModuleMatches: 'Nenhuma permissão correspondente neste módulo',

    businessModules: 'Módulos de negócio',
    allModules: 'Todos',
    otherModules: 'Outro',
    noModulePermissions: 'Nenhuma permissão configurada neste módulo',
    moduleCount: '{{module}}: {{configured}} configurados / {{total}} recursos',

    actionsFor: 'Ações de "{{name}}"',
    configuredScopes: 'Escopos configurados',

    lastAdmin:
      'Pelo menos um administrador ativo do sistema deve permanecer. Atribua primeiro um substituto.',
    subjectNotAllowed:
      'Este acesso não pode ser atribuído a este tipo de sujeito. Escolha outro acesso de negócio.',

    title: 'Gerenciamento de acesso',
    description:
      'Configure operações de negócio e escopos de registros por papel.',
    roles: 'Acesso por papel',
    baseline: 'Acesso básico de usuários conectados',
    baselineHelp:
      'O acesso básico se aplica às contas conectadas. A associação a responsabilidades também afeta os candidatos a aprovação.',
    name: 'Nome',
    type: 'Tipo',
    all: 'Todos os tipos',
    dutyRoles: 'Papéis funcionais',
    positions: 'Cargos',
    departments: 'Departamentos',
    automatic: 'Acesso automático',
    members: 'Membros',
    permissions: 'Permissões de negócio',
    missingMembers: 'Nenhum membro atribuído',
    memberDenied: 'Acesso a membros indisponível',
    membersFailed: 'Não foi possível carregar membros',
    byMembership: 'Aplicado pela associação',
    none: 'Nenhum acesso de negócio atribuído',
    noneHelp:
      'Atribua acesso de negócio existente após confirmar as responsabilidades. O acesso herdado continua válido.',
    searchRoles: 'Pesquisar papéis, cargos ou departamentos…',
    clear: 'Limpar filtros',
    noResults: 'Nenhum resultado correspondente',
    clearHelp: 'Altere sua pesquisa ou limpe os filtros.',
    loading: 'Carregando',
    refresh: 'Atualizar',
    denied:
      'Você não tem acesso a esta operação. Entre em contato com um administrador de acesso.',
    missing: 'Este item não existe mais. Volte à lista.',
    conflict:
      'A configuração de acesso mudou. Recarregue e revise antes de salvar.',
    failed:
      'Não foi possível concluir esta operação. Tente novamente ou entre em contato com um administrador.',
    reload: 'Recarregar',
    retry: 'Tentar novamente',
    roleHelp:
      'Revise os membros, as operações de negócio e os escopos de registros desta responsabilidade.',
    rules:
      'Regras adicionais de acesso podem se aplicar. Verifique o acesso da pessoa e a operação de negócio real.',
    actions: 'Ações',
    addMember: 'Adicionar membro',
    remove: 'Remover',
    memberImpact:
      'A associação à responsabilidade afeta o acesso herdado e os candidatos a aprovação. Outras origens de acesso permanecem após a remoção.',
    assign: 'Atribuir acesso de negócio',
    usedBy:
      'Este acesso está atribuído a {{count}} sujeitos. A edição afeta todos eles.',
    edit: 'Editar',
    special: 'Configuração personalizada existente',
    specialReadOnly:
      'A configuração personalizada é somente leitura e será preservada ao salvar.',
    noScope: 'Nenhum escopo de registros configurado',
    systemAdmin: 'Administrador do sistema',
    unrestricted: 'Administrador do sistema: acesso sem restrições',
    removeTitle: 'Remover o membro "{{name}}"?',
    cancel: 'Cancelar',
    removed: '"{{name}}" removido',
    added: '"{{name}}" adicionado',
    addMemberTitle: 'Adicionar membro de {{name}}',
    add: 'Adicionar',
    person: 'Pessoa',
    selectPerson: 'Selecione a pessoa que terá esta responsabilidade.',
    userDenied:
      'Você não pode visualizar o diretório de usuários. Entre em contato com um administrador.',
    direct: 'Atribuído diretamente',
    inherited: 'Acesso herdado',
    personUnknown: 'Pessoa (nome indisponível)',
    back: 'Voltar à lista',
    pageActionHelp:
      'O acesso à página controla o menu e a entrada. Conceda separadamente cada operação de negócio e seus escopos de registros; abrir uma página não concede suas ações.',
    emptyDirectory: 'Nenhum sujeito disponível',
    emptyHelp: 'Nenhum registro disponível atualmente neste diretório.',
    deniedAction: 'Não autorizado',
    sensitive: 'Acesso sensível',
    impactUnavailable:
      'Não é possível verificar o impacto completo. Verifique os sujeitos afetados e sua visibilidade antes de alterar este acesso compartilhado.',
    conditional: 'Acesso condicional',
    permitted: 'Acesso incondicional',
    assignTitle: 'Alterar acesso de "{{name}}"',
    assignHelp:
      'Selecione o acesso de negócio direto deste sujeito. Outras origens são preservadas.',
    noAssignable: 'Nenhum acesso de negócio atribuível',
    preserveInherited:
      'Somente atribuições diretas são alteradas aqui. O acesso herdado de departamentos, cargos, responsabilidades e da base permanece.',
    save: 'Salvar',
    saved: 'Acesso de "{{name}}" salvo',
    confirmTitle: 'Salvar alterações de acesso de "{{name}}"?',
    assignmentImpact:
      'Revise o acesso adicionado e removido. Outras origens permanecem; um administrador do sistema deve continuar ativo.',
    discardTitle: 'Descartar alterações não salvas?',
    discard: 'Descartar',
    discardHelp: 'Suas alterações não foram salvas. Descartá-las as removerá.',
    editTitle: 'Editar acesso de negócio de "{{name}}"',
    editorHelp:
      'Selecione operações e escopos individualmente. Operações sensíveis são separadas; revise o impacto antes de salvar.',
    impact: 'Sujeitos afetados',
    searchActions: 'Pesquisar funcionalidades ou operações de negócio…',
    multipleScopes: 'Configure cada um dos escopos abaixo para esta operação.',
    levelFor: 'Escopo de registros de "{{name}}"',
    protected: 'Este acesso é protegido',
    protectedHelp:
      'A proteção do sistema permanece. Gerencie a associação de administradores nas contas de usuários.',
    sharedHelp:
      'Esta alteração afeta todos os sujeitos listados acima. Revise as operações e os escopos.',
    system: 'Responsabilidades do sistema',
  },
};
