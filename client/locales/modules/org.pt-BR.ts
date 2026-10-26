/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Departamentos',
      positions: 'Cargos',
      grades: 'Níveis',
      dutyRoles: 'Papéis de responsabilidade',
    },
    authz: {
      section: 'Organização e pessoas',
      departments: 'Departamentos',
      positions: 'Cargos',
      grades: 'Níveis',
      dutyRoles: 'Papéis de responsabilidade',
      read: 'Visualizar',
      update: 'Gerenciar',
    },
    subjects: {
      departments: 'Departamentos',
      heads: 'Chefes de departamento',
      dutyRoles: 'Papéis de responsabilidade',
      disabled: 'Desativada',
    },
    scopes: {
      mine: 'Meus departamentos',
      mineHint:
        'Registros pertencentes a membros dos departamentos aos quais pertenço ou que lidero.',
      mineAndBelow: 'Meus departamentos e subordinados',
      mineAndBelowHint:
        'Registros pertencentes a membros dos meus departamentos e de todos os departamentos abaixo deles.',
      headed: 'Departamentos que lidero e subordinados',
      headedHint:
        'Registros pertencentes a membros dos departamentos que lidero e de todos os departamentos abaixo deles.',
    },
    dutyRoleTitles: {
      gm: 'Diretor geral',
      cfo: 'Diretor financeiro',
      hr: 'Especialista de RH',
      hrbp: 'Parceiro de negócios de RH',
      hrDirector: 'Diretor de RH',
      admin: 'Administração',
      sealKeeper: 'Responsável pelos carimbos',
      finance: 'Contador',
      financeManager: 'Gerente financeiro',
      cashier: 'Caixa',
      legal: 'Jurídico',
      purchasing: 'Compras',
      it: 'TI',
      committeeTech: 'Comitê de revisão (assento técnico)',
    },
    common: {
      active: 'Habilitado',
      inactive: 'Desativada',
      allStatuses: 'Todos os status',
      noResults: 'Nada corresponde aos filtros.',
      clearFilters: 'Limpar filtros',
      clearSearch: 'Limpar pesquisa',
      searchByTitleOrCode: 'Pesquisar por nome ou código',
      askAdministrator: 'Peça a um administrador que configure isto.',
      fields: {
        title: 'Nome',
        code: 'Código',
        status: 'Status',
        name: 'Nome',
        email: 'E-mail',
        user: 'Pessoa',
      },
      actions: {
        label: 'Ações',
        more: 'Ações de {{name}}',
        edit: 'Editar',
        enable: 'Habilitar',
        disable: 'Desabilitar',
      },
      form: {
        titleRequired: 'Informe um nome.',
        titleTooLong: 'Use no máximo {{max}} caracteres.',
        codeRequired: 'Informe um código.',
        codeFormat:
          'Use letras, dígitos, ".", "_" e "-", começando com letra ou dígito, até 64 caracteres.',
        codeHint:
          'Um identificador estável utilizado por importações e outros sistemas.',
        integer: 'Informe um número inteiro.',
        userRequired: 'Escolha uma pessoa.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Somente departamentos de nível superior podem designar um executivo; os departamentos filhos o herdam.',
      codeTaken: 'Este código já está em uso. Escolha outro.',
      parentCycle:
        'Um departamento não pode ser movido para baixo de si mesmo ou de um de seus subdepartamentos.',
      parentNotFound: 'O departamento superior não existe mais. Escolha outro.',
      userNotFound: 'Esta pessoa não existe ou está desabilitada.',
      notFound: 'Este registro não existe ou foi excluído.',
      forbidden: 'Você não tem permissão para fazer isto.',
      requestFailed: 'A requisição falhou. Tente novamente.',
    },
    departmentPicker: {
      placeholder: 'Pesquisar departamentos',
      empty: 'Nenhum departamento correspondente',
      loadFailed: 'Não foi possível carregar departamentos.',
      inactivePath: '{{path}} (desabilitado)',
    },
    departments: {
      title: 'Departamentos',
      description:
        'Mantenha a árvore de departamentos, chefes e membros. Desabilitar um departamento desabilita tudo abaixo dele.',
      create: 'Novo departamento',
      createChild: 'Novo subdepartamento',
      editTitle: 'Editar departamento',
      formDescription:
        'Alterar o superior move o departamento com tudo que está abaixo dele.',
      created: 'Departamento "{{name}}" criado',
      saved: 'Departamento "{{name}}" salvo',
      enabled: 'Departamento "{{name}}" habilitado',
      disabled: 'Departamento "{{name}}" desabilitado',
      disableTitle: 'Desabilitar o departamento "{{name}}"?',
      disableDescription:
        'Seus subdepartamentos também deixam de contar e os membros não herdam mais suas permissões. Nada é excluído; você pode habilitá-lo novamente a qualquer momento.',
      loadFailed: 'Não foi possível carregar departamentos',
      emptyTitle: 'Nenhum departamento ainda',
      emptyDescription:
        'Crie o topo da organização e adicione departamentos abaixo dele.',
      noResults: 'Nenhum departamento corresponde à pesquisa.',
      searchPlaceholder: 'Pesquisar por nome ou código de departamento',
      treeLabel: 'Árvore de departamentos',
      choose: 'Escolha um departamento à esquerda para ver seus detalhes.',
      notFound: 'Este departamento não existe ou foi excluído.',
      backToTree: 'Voltar à árvore',
      topLevel: 'Departamento de nível superior',
      inheritedFrom: '(herdado de "{{name}}")',
      inactiveByAncestor: 'Desabilitado com "{{name}}"',
      fields: {
        parent: 'Departamento superior',
        manager: 'Chefe de departamento',
        executive: 'Executivo responsável',
        sortOrder: 'Ordem de classificação',
      },
      form: {
        codeHint:
          'Opcional. As importações atualizam departamentos pelo código.',
        parentPlaceholder: 'Nível superior (sem pai)',
        parentHint: 'Deixe vazio para um departamento de nível superior.',
        managerHint:
          'As aprovações vão para esta pessoa; ela não precisa ser membro. Vazio: o chefe do departamento superior.',
        executiveHint:
          'Definido somente em departamentos de nível superior. Selecionar um superior limpa este campo; departamentos filhos o herdam.',
        sortOrderHint:
          'Números menores vêm primeiro entre departamentos do mesmo nível.',
      },
      members: {
        title: 'Membros ({{count}})',
        description:
          'Membros diretos. Cada pessoa tem um departamento principal, usado em aprovações e orçamentos.',
        add: 'Adicionar membro',
        addTitle: 'Adicionar membro a "{{name}}"',
        added: '"{{name}}" adicionado a "{{department}}"',
        primary: 'Tipo de departamento',
        primaryBadge: 'Principal',
        secondaryBadge: 'Secundário',
        makePrimary: 'Definir como departamento principal',
        primarySet: '"{{name}}" agora tem este como departamento principal',
        makePrimaryField: 'Definir como departamento principal da pessoa',
        makePrimaryHint:
          'Substitui o departamento principal atual. Desmarcado, só se torna principal se a pessoa não tiver nenhum.',
        remove: 'Remover do departamento',
        removeTitle: 'Remover "{{name}}" de "{{department}}"?',
        removeDescription:
          'A pessoa deixa de herdar as permissões deste departamento. Se era seu departamento principal, ficará sem nenhum até que você defina outro.',
        removed: '"{{name}}" removido de "{{department}}"',
        loadFailed: 'Não foi possível carregar membros',
        emptyTitle: 'Nenhum membro ainda',
        emptyDescription:
          'Adicione as pessoas que trabalham neste departamento.',
      },
    },
    positions: {
      title: 'Cargos',
      description:
        'Cargos referenciados pelos cadastros de colaboradores. Desabilite um cargo em vez de excluí-lo.',
      create: 'Novo cargo',
      editTitle: 'Editar cargo',
      formDescription: 'O código permanece estável quando o nome muda.',
      created: 'Cargo "{{name}}" criado',
      saved: 'Cargo "{{name}}" salvo',
      enabled: 'Cargo "{{name}}" habilitado',
      disabled: 'Cargo "{{name}}" desabilitado',
      disableTitle: 'Desabilitar o cargo "{{name}}"?',
      disableDescription:
        'Ele deixa de ser oferecido para novas atribuições. Os colaboradores que o ocupam o mantêm.',
      loadFailed: 'Não foi possível carregar cargos',
      notFound: 'Este cargo não existe ou foi excluído.',
      emptyTitle: 'Nenhum cargo ainda',
      emptyDescription:
        'Adicione os cargos para os quais os colaboradores são contratados, como "Comprador".',
      fields: { number: 'Ordem de classificação' },
      form: {
        numberRequired: 'Informe uma ordem de classificação.',
        numberHint: 'Opcional. Números menores vêm primeiro.',
      },
    },
    grades: {
      title: 'Níveis',
      description:
        'Níveis de carreira como P5 ou M2. A classificação determina a senioridade nos padrões de viagem e níveis de aprovação.',
      create: 'Novo nível',
      editTitle: 'Editar nível',
      formDescription: 'O código permanece estável quando o nome muda.',
      created: 'Nível "{{name}}" criado',
      saved: 'Nível "{{name}}" salvo',
      enabled: 'Nível "{{name}}" habilitado',
      disabled: 'Nível "{{name}}" desabilitado',
      disableTitle: 'Desabilitar o nível "{{name}}"?',
      disableDescription:
        'Ele deixa de ser oferecido para novas atribuições. Os colaboradores que o ocupam o mantêm.',
      loadFailed: 'Não foi possível carregar níveis',
      notFound: 'Este nível não existe ou foi excluído.',
      emptyTitle: 'Nenhum nível ainda',
      emptyDescription:
        'Adicione seus níveis com uma classificação; classificações maiores indicam maior senioridade.',
      fields: { number: 'Classificação' },
      form: {
        numberRequired: 'Informe uma classificação.',
        numberHint: 'Um número inteiro; quanto maior, maior a senioridade.',
      },
    },
    dutyRoles: {
      title: 'Papéis de responsabilidade',
      description:
        'As etapas de aprovação e processamento encontram pessoas por estes papéis. Atribua o que cada papel pode fazer nas configurações de autorização.',
      viewMembers: 'Visualizar membros',
      drawerDescription:
        'Pessoas que têm esta responsabilidade. Etapas de aprovação atribuídas ao papel são encaminhadas a elas.',
      enabled: 'Papel de responsabilidade "{{name}}" habilitado',
      disabled: 'Papel de responsabilidade "{{name}}" desabilitado',
      disableTitle: 'Desabilitar o papel de responsabilidade "{{name}}"?',
      disableDescription:
        'Seus membros deixam de exercer o papel: etapas de aprovação não encontram ninguém nele e as permissões atribuídas deixam de ser aplicadas. Os membros são mantidos.',
      loadFailed: 'Não foi possível carregar papéis de responsabilidade',
      detailFailed: 'Não foi possível carregar o papel de responsabilidade',
      notFound:
        'Este papel de responsabilidade não existe. Feche este painel para voltar à lista.',
      emptyTitle: 'Nenhum papel de responsabilidade',
      emptyDescription:
        'Papéis de responsabilidade são instalados com a aplicação. Peça a um administrador que verifique a instalação.',
      fields: {
        code: 'Código',
        memberCount: 'Membros',
        description: 'Descrição',
      },
      members: {
        title: 'Membros ({{count}})',
        add: 'Adicionar membro',
        addTitle: 'Adicionar membro a "{{role}}"',
        added: '"{{name}}" adicionado a "{{role}}"',
        remove: 'Remover',
        removeTitle: 'Remover "{{name}}" de "{{role}}"?',
        removeDescription:
          'A pessoa deixa de receber aprovações deste papel e as permissões atribuídas a ele.',
        removed: '"{{name}}" removido de "{{role}}"',
        alreadyRemoved: 'Esta pessoa já havia sido removida.',
        emptyTitle: 'Nenhum membro ainda',
        emptyDescription:
          'Adicione as pessoas com esta responsabilidade. As etapas de aprovação aguardam até que alguém seja adicionado.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
