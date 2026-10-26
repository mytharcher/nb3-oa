import optionMessages from './options/pt-BR.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  navigation: {
    authorization: 'Autorização',
    permissionSets: 'Conjuntos de permissões',
    inspector: 'Inspetor de permissões',
  },
  feedback: {
    saved: '"{{name}}" salvo',
    deleted: '"{{name}}" excluído',
    assigned: 'Permissões de "{{name}}" atribuídas',
    revoked: 'Permissões de "{{name}}" revogadas',
  },
  common: {
    actionsFor: 'Ações de "{{name}}"',
    clearFilters: 'Limpar filtros',
    all: 'Todos',
    allFields: 'Todos os campos',
    cancel: 'Cancelar',
    close: 'Fechar',
    delete: 'Excluir',
    edit: 'Editar',
    key: 'Chave',
    keyHint: 'Identificador estável utilizado pelas APIs.',
    loading: 'Carregando…',
    noFields: 'Nenhum campo',
    remove: 'Remover',
    removeNamed: 'Remover {{label}}',
    resource: 'Recurso',
    retry: 'Tentar novamente',
    ruleSections: 'Seções de regras',
    search: 'Pesquisar',
    selectNamed: 'Selecionar {{label}}',
    signedInUsers: 'Todos os usuários conectados',
    type: 'Tipo',
    view: 'Visualizar',
  },
  page: {
    loadFailed: 'Não foi possível carregar esta página.',
  },
  pagination: {
    navLabel: 'Paginação de {{label}}',
    next: 'Próxima página',
    page: 'Página {{number}}',
    previous: 'Página anterior',
    range: '{{first}}–{{last}} de {{total}}',
    empty: '0 de 0',
  },
  filters: {
    clear: 'Limpar filtro',
    clearSearch: 'Limpar {{label}}',
  },
  errors: {
    requestFailed: 'A requisição de autorização falhou.',
    lastAssignment:
      'Este conjunto de permissões deve manter um responsável ativo. Atribua-o a outra conta habilitada antes de remover esta atribuição.',
    protectedSet:
      'Este conjunto de permissões é mantido pela aplicação e não pode ser alterado aqui.',
    subjectNotAllowed:
      'Este conjunto de permissões não aceita o tipo de sujeito selecionado. Escolha um tipo permitido pela aplicação.',
    completePermissions: 'Complete todas as permissões antes de salvar.',
    completeRule: 'Complete a regra antes de salvar.',
    selectAnAction: 'Selecione pelo menos uma ação.',
  },
  marks: {
    labels: {
      all: 'Acesso completo',
      scoped: 'Acesso limitado',
      none: 'Sem acesso',
      bypass: 'Sem restrições',
    },
    descriptions: {
      all: 'Acesso completo',
      scoped: 'Acesso limitado',
      none: 'Sem acesso',
      bypass: 'Sem restrições: concessões não são consultadas',
    },
  },
  filterEditor: {
    logic: 'Lógica do grupo',
    all: 'Todas as condições (E)',
    any: 'Qualquer condição (OU)',
    addGroup: 'Adicionar grupo',
    removeGroup: 'Remover grupo',
    valueType: 'Tipo de valor',
    text: 'Texto',
    number: 'Número',
    boolean: 'Booleano',
    unsupported:
      'Esta condição foi preservada, mas não pode ser editada visualmente.',
    invalid:
      'Nenhum nó de filtro editável encontrado. Recomeçar substitui o filtro existente.',
    start: 'Configurar condições',
  },
  filterOperators: {
    $includes: 'Contém',
    $notIncludes: 'Não contém',
    $startsWith: 'Começa com',
    $endsWith: 'Termina com',
    $empty: 'Está vazio',
    $notEmpty: 'Não está vazio',
    $isTruly: 'É verdadeiro',
    $isFalsy: 'É falso',

    $eq: 'Igual a',
    $ne: 'Diferente de',
    $in: 'Em',
    $notIn: 'Não está em',
    $gt: 'Maior que',
    $gte: 'Pelo menos',
    $lt: 'Menor que',
    $lte: 'No máximo',
  },
  labels: {
    allRecords: 'Todos os registros',
    selectedRecords: '{{count}} registros selecionados',
    unknownScope: 'Escopo desconhecido',
    actionScope: '{{action}}: {{scope}}',
  },
  subjects: {
    matchAny: 'Aplica-se quando qualquer sujeito selecionado corresponde.',
    search: 'Pesquisar sujeitos',
    empty: 'Nenhum sujeito correspondente',
    previous: 'Anterior',
    next: 'Próximo',
    selected: 'Sujeitos selecionados · {{count}}',
    unresolved: '{{id}} (não resolvido)',
    none: 'Nenhum sujeito selecionado',
  },
  editors: {
    resourceGroup: 'Grupo de recursos',
    actions: 'Ações',
    addCondition: 'Adicionar condição',
    assignments: 'Atribuições',
    assignmentsSelected: {
      one: '{{count}} atribuição selecionada',
      other: '{{count}} atribuições selecionadas',
    },
    audienceHint: 'Aplica-se a todo usuário com uma sessão válida.',
    filterConditions: 'Condições de filtro',
    records: 'Registros',
    recordsSelected: {
      one: '{{count}} registro selecionado',
      other: '{{count}} registros selecionados',
    },
    recordAccessPolicy: 'Política de acesso a registros',
    recordScope: 'Escopo de registros',
    resource: 'Recurso',
    resourceType: 'Tipo de recurso',
    searchPeople: 'Pesquisar pessoas',
    searchPeoplePlaceholder: 'Pesquisar nome, usuário ou e-mail',
    searchRecords: 'Pesquisar registros',
    selectUser: 'Selecionar um usuário',
    specificRecordIds: 'IDs de registros específicos',
    specificUser: 'Usuário específico',
    user: 'Usuário',
    who: 'Quem',
  },
  permissionWorkspace: {
    businessModules: 'Módulos de negócio',
    allModules: 'Todos',
    otherModules: 'Outro',
    clearFilters: 'Limpar filtros',
    noModuleMatches: 'Nenhuma permissão correspondente neste módulo',
    moduleCount: '{{module}}: {{configured}} configurados / {{total}} recursos',

    pageAccessHint:
      'O acesso à página controla a entrada. As permissões de negócio controlam as operações de dados.',
    specifyScope: 'Especificar escopo: {{scope}}',
    inheritScope:
      'Quando não especificado, os escopos padrão configurados e as regras de compartilhamento e restrição continuam válidos.',
    configurePermission: 'Configurar permissão',
    noOperationGrant:
      'Este conjunto de permissões não concede esta operação. Escolha Configurar permissão para definir seu escopo de dados.',
    features: 'Permissões de funcionalidades',
    dataScope: 'Escopo de dados',
    dataScopeHelp:
      'Filtra as permissões deste conjunto, incluindo registros compartilhados. A ausência de restrição não adiciona filtros nem concede registros.',
    appliesTo: 'Aplica-se a',
    moduleGranted: 'Acesso completo',
    modulePartial: 'Acesso limitado',
    moduleNotGranted: 'Sem acesso',

    selectAll: 'Selecionar tudo',
    selectFiltered: 'Selecionar recursos correspondentes',
    selectGroup: 'Selecionar tudo em {{group}}',

    expandSets: 'Expandir conjuntos de permissões',
    collapseSets: 'Recolher conjuntos de permissões',
    userAssignments: 'Responsáveis',
    chooseSet: 'Escolha ou crie um conjunto de permissões.',
    clickScope: 'Clique em um ícone de escopo para alterar o acesso.',
    mode: {
      none: 'Sem acesso',
      all: 'Acesso completo',
      custom: 'Escopo personalizado',
    },
    unavailableSet:
      'Este conjunto de permissões não existe ou não pode ser editado.',
    description:
      'Configure os recursos deste conjunto de permissões. As alterações serão aplicadas ao salvar.',
    sections: 'Seções do conjunto de permissões',
    permissions: 'Permissões',
    details: 'Informações básicas',
    unsaved: 'Alterações não salvas',
    showMore: 'Mostrar mais',
    development: {
      pages:
        'Nenhuma página que exige autorização foi definida. Peça à IA para adicionar permissões de acesso às suas páginas de negócio e configure-as aqui.',
      business:
        'Nenhuma permissão de negócio foi definida. Peça à IA para projetar operações, campos e escopos de registros para seu negócio e configure-os aqui.',
    },
    configuredOnly: 'Apenas recursos configurados',
    configured: 'Configurado neste conjunto',
    backResources: 'Voltar aos recursos',
    discardTitle: 'Descartar alterações não salvas?',
    discard: 'Descartar alterações',
    discardBody: 'Suas alterações de permissões não foram salvas.',
    configureScope: 'Configurar escopo de registros',
  },
  databasePolicy: {
    addCondition: 'Adicionar condição',
    filterField: 'Campo do filtro',
    filterOperator: 'Operador do filtro',
    filterValue: 'Valor do filtro',
    removeCondition: 'Remover condição',
    conditionRequired: 'Adicione pelo menos uma condição.',
  },
  inspector: {
    summary: {
      all: 'Esta operação é permitida.',
      scoped:
        'Esta operação é permitida apenas dentro dos limites de registros e campos aplicáveis.',
      none: 'Esta operação não é permitida. A concessão de registros por si só não concede a operação.',
      error:
        'Não foi possível concluir a verificação. Isto não representa uma negação de permissão.',
      context: 'Selecione um usuário específico para avaliar este escopo.',
    },
    dataAccess: 'Quais dados estão acessíveis',
    subjectHint: '“Eu” refere-se à pessoa inspecionada.',
    scopeAndFields: 'Visualizar condições e campos efetivos',
    technicalHint:
      'Resultado bruto de autorização para diagnóstico, incluindo verificações subjacentes de páginas e tabelas.',
    selectedRecords: '{{count}} registros selecionados',
    databaseActions: {
      read: 'Ler',
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
    },

    subjectType: 'Tipo de sujeito',
    subject: 'Sujeito',
    selectSubject: 'Selecionar um sujeito',
    searchSubjects: 'Pesquisar sujeitos',
    inheritsFrom: 'Herda de:',
    grantedVia: 'via {{label}}',
    grantedDirectly: 'atribuído diretamente',
    inheritedSubject: '{{name}} ({{type}})',
    listSeparator: ', ',
    noRegisteredResources:
      'Nenhum recurso foi registrado para este tipo ainda.',
    status: {
      context: 'Contexto do usuário necessário',
      all: 'Permitido',
      scoped: 'Permitido com limites',
      none: 'Não permitido',
      error: 'Falha na inspeção',
    },
    reasonCodes: {
      NO_MATCHING_GRANT: 'Nada concede esta operação',
      RESOURCE_ACTION_NOT_SUPPORTED: 'Este recurso não oferece esta operação',
      USER_CONTEXT_REQUIRED:
        'Este escopo depende de um usuário específico e não pode ser resolvido apenas com este sujeito.',
      GRANT_MATCHED: 'Esta operação foi concedida',
      SELECTION_EXPANDED: 'Amplia os registros acessíveis',
      SELECTION_RESTRICTED: 'Restringe os registros acessíveis',
      NO_OBJECT_PERMISSION: 'Esta operação não foi concedida',
      NO_RECORD_ACCESS: 'Nenhum escopo de registros acessíveis',
      EMPTY_RECORD_ACCESS:
        'O escopo de registros não corresponde a nenhum registro',
      UNRESTRICTED_ACCESS: 'Acesso sem restrições',
    },
    inputFields: 'Campos graváveis',
    outputFields: 'Campos retornados',
    allFields: 'Todos os campos',

    refresh: 'Atualizar',
    failed: 'Falha na inspeção',
    noResources: 'Nenhum recurso correspondente',
    recordScope: 'Escopo efetivo de registros',
    fields: 'Campos permitidos',
    fieldSearch: 'Pesquisar campos',
    technicalDetails: 'Detalhes técnicos',
    allConditions: 'Corresponder a todas as condições',
    anyCondition: 'Corresponder a qualquer condição',

    page: {
      title: 'Inspetor de permissões',
      description:
        'Visualize o acesso concedido a um sujeito de autorização e inspecione os motivos.',
    },
    person: 'Pessoa',
    selectPerson: 'Selecionar uma pessoa',
    searchPeople: 'Pesquisar pessoas',
    searchPeoplePlaceholder: 'Pesquisar nome, usuário ou e-mail',
    action: 'Ação',
    selectAction: 'Selecionar uma ação',
    inspect: 'Inspecionar',
    inspecting: 'Inspecionando…',
    empty:
      'Selecione um sujeito de autorização para visualizar suas permissões de recursos.',
    decision: 'Decisão',
    effects: {
      permit: 'Permitido',
      deny: 'Negado',
      conditional: 'Permitido com condições',
    },
    reasons: 'Motivos',
    noReasons: 'A decisão não apresenta motivos.',
    reasonFrom: 'De {{plugin}}',
    reasonFromCore: 'Do núcleo de autorização',
    conditions: 'Condições',
    conditionsHint:
      'A decisão é válida apenas para o que estas condições selecionam, exibidas conforme retornadas pelo núcleo.',
  },
  permissionSets: {
    builtIn: { root: 'Administrador do sistema', member: 'Membro' },
    page: {
      title: 'Conjuntos de permissões',
      description:
        'Conjuntos de permissões concedem acesso: reúna os recursos e as ações necessários e atribua o conjunto às pessoas.',
    },
    unknownPage: 'Página desconhecida',
    assignmentCount: {
      one: '{{count}} atribuição',
      other: '{{count}} atribuições',
    },
    list: {
      search: 'Pesquisar pelo nome ou chave do conjunto de permissões',
      create: 'Novo conjunto de permissões',
      nameHeader: 'Conjunto de permissões',
      system: 'Sistema',
      custom: 'Personalizado',
      emptyNone:
        'Nenhum conjunto de permissões ainda. Crie um para reunir os recursos e as ações necessários.',
      emptySearch: 'Nenhum conjunto de permissões corresponde à pesquisa.',
      pagerLabel: 'Conjuntos de permissões',
    },
    detail: {
      untitled: 'Novo conjunto de permissões',
      unrestrictedTitle:
        'Este conjunto de permissões concede acesso sem restrições.',
      unrestrictedBody:
        'Este conjunto concede acesso sem restrições, independentemente de outros conjuntos de permissões ou regras de compartilhamento e restrição. Não é necessário configurar permissões individuais. Gerencie suas atribuições em Responsáveis.',
      confirmDeleteTitle: 'Excluir o conjunto de permissões "{{title}}"?',
      confirmDeleteBody:
        'Exclua “{{title}}” e suas atribuições. Outros conjuntos de permissões e regras continuam válidos.',
      confirmDelete: 'Excluir',
    },
    assignments: {
      search: 'Pesquisar atribuições',
      searchPlaceholder: 'Pesquisar nome ou ID do sujeito',
      kindLabel: 'Tipo de atribuição',
      kindAll: 'Todas as atribuições',
      kindUsers: 'Usuários',
      kindAudiences: 'Públicos',
      revokeSelected: 'Revogar selecionados ({{count}})',
      add: 'Adicionar atribuições',
      assignedTo: 'Atribuído a',
      subjectType: 'Tipo de sujeito',
      selectAllVisible: 'Selecionar todas as atribuições visíveis',
      audience: 'Público',
      user: 'Usuário',
      revoke: 'Revogar',
      emptyNone:
        'Nenhuma atribuição ainda. Adicione uma para conceder este conjunto de permissões a alguém.',
      emptyFiltered: 'Nenhuma atribuição corresponde a estes filtros.',
      pagerLabel: 'Atribuições',
      confirmRevokeTitleOne: 'Revogar a atribuição de "{{name}}"?',
      confirmRevokeTitleMany: 'Revogar as atribuições de "{{name}}"?',
      confirmRevokeBody:
        '{{label}} deixará de possuir este conjunto de permissões. Outras atribuições continuam válidas, e este conjunto poderá ser atribuído novamente.',
      confirmRevoke: 'Revogar',
      pickerDescription:
        'Selecione os sujeitos que receberão este conjunto de permissões.',
      audienceDescription:
        'Todos com uma sessão válida. Este público é gerenciado separadamente dos usuários individuais.',
      usersHeading: 'Usuários',
      usersHint: 'Usuários já atribuídos ficam ocultos.',
      selectedCount: '{{count}} selecionados',
      selectAllResults: 'Selecionar todos os resultados',
      userCount: '{{count}} usuários',
      noAvailableUsers: 'Nenhum usuário disponível corresponde à pesquisa.',
      assigning: 'Atribuindo…',
    },
    editor: {
      nameRequired: 'Informe um nome para o conjunto de permissões.',
      keyRequired: 'Informe uma chave para o conjunto de permissões.',
      resourceRequired: 'Escolha um recurso para esta permissão.',
      actionsRequired: 'Escolha pelo menos uma ação para este recurso.',
      editTitle: 'Editar conjunto de permissões',
      newTitle: 'Novo conjunto de permissões',
      description: 'Reúna o acesso em uma atribuição reutilizável.',
      name: 'Nome',
      permissions: 'Permissões',
      permissionsHint:
        'Escolha os recursos e as ações que este conjunto concede.',
      addPermission: 'Adicionar permissão',
      searchResources: 'Pesquisar recursos ou ações',
      resourceTypeLabel: 'Tipo de recurso da permissão',
      allResourceTypes: 'Todos os tipos de recursos',
      visibleCount: '{{visible}} de {{total}} recursos',
      noActions: 'Nenhuma ação',
      unknownPageNotice:
        'Nenhuma rota declara mais esta página, portanto esta permissão não concede nada. Ela foi renomeada ou removida: remova a permissão ou adicione uma para a página substituta.',
      emptyFiltered: 'Nenhuma permissão corresponde a estes filtros.',
      addFirst: 'Adicionar a primeira permissão',
      addFirstHint: 'Selecione recursos por tipo e configure suas ações.',
      saving: 'Salvando…',
      save: 'Salvar conjunto de permissões',
      confirmRemoveTitle: 'Remover esta permissão?',
      confirmRemoveBody:
        '{{resource}} e todas as ações configuradas nele serão removidos deste conjunto de permissões. Após salvar o conjunto, esta ação não poderá ser desfeita.',
      confirmRemove: 'Remover permissão',
      thisResource: 'Este recurso',
    },
    picker: {
      title: 'Adicionar permissões',
      description:
        'Selecione recursos e configure seu acesso em um único espaço.',
      resourceTypes: 'Tipos de recursos',
      resources: 'Recursos',
      selectResourceHint: 'Selecione um recurso para configurá-lo.',
      searchResources: 'Pesquisar recursos',
      added: 'Adicionado',
      noResources: 'Nenhum recurso corresponde à pesquisa.',
      emptyTitle: 'Selecione um recurso para configurar',
      emptyHint:
        'Suas ações e configurações de acesso específicas aparecerão aqui.',
      readyCount: {
        one: '{{count}} recurso pronto para adicionar',
        other: '{{count}} recursos prontos para adicionar',
      },
      incomplete: ' · Selecione pelo menos uma ação para cada recurso',
      add: 'Adicionar permissões',
    },
  },
  ruleWorkspace: {
    unset: 'Não definido',
    unsetHint:
      'Nenhum escopo adicional de registros foi fornecido para esta ação.',
    clearDefaults: 'Remover configuração padrão',
    setDefault: 'Definir escopo padrão',
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
