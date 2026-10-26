/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Atualizar',
    personal: {
      title: 'Cadastro pessoal',
      description:
        'Visualize seus dados de colaborador; entre em contato com RH para corrigir erros.',
      identity: '{{name}} · {{code}}',
      basic: 'Informações básicas',
      profile: 'Dados pessoais',
      bank: 'Conta de pagamento',
      emptyTitle: 'Nenhum cadastro de colaborador ainda',
      emptyDescription:
        'Entre em contato com RH para criar um cadastro de colaborador para sua conta.',
      profileMissing:
        'Dados pessoais não encontrados; peça ao RH que verifique seu cadastro.',
      forbidden:
        'Não foi possível acessar seu cadastro; peça a um administrador que verifique o acesso.',
      refresh: 'Atualizar',
    },
    authz: {
      section: 'Colaboradores',
      settings: 'Página de cadastro de colaboradores',
      settingsRead: 'Abrir',
      collections: {
        employees: 'Cadastros de colaboradores',
        employeeProfiles: 'Informações controladas de colaboradores',
        employeeCompensation: 'Remuneração de colaboradores',
      },
      archive: {
        title: 'Cadastro de colaborador',
        view: 'Visualizar',
        manage: 'Criar e editar',
        correctStatus: 'Corrigir status',
      },
      profile: {
        title: 'Informações controladas de colaboradores',
        view: 'Visualizar todos',
        viewBank: 'Visualizar conta bancária',
        update: 'Editar',
      },
      compensation: {
        title: 'Remuneração de colaboradores',
        view: 'Visualizar',
      },
      directory: {
        title: 'Diretório',
        view: 'Visualizar pessoas',
        viewContact: 'Visualizar telefone e e-mail',
      },
      scopes: {
        reports: 'Meus subordinados (todos os níveis)',
        selfAndReports: 'Eu e meus subordinados',
        reportsHint:
          'Pessoas abaixo do visualizador na linha de subordinação, em qualquer nível; um gestor inativo intermediário não interrompe a relação.',
      },
      subjects: {
        position: 'Cargos',
        reportingManager: 'Gestores diretos',
      },
    },
    permissionSets: {
      hr: 'RH: cadastros de colaboradores',
      compensation:
        'Remuneração de colaboradores (direção geral, direção financeira)',
      bank: 'Contas bancárias de colaboradores (financeiro)',
      manager: 'Gestor direto: cadastros de subordinados',
      head: 'Chefe de departamento: cadastros do departamento',
      admin: 'Correção de dados do cadastro de colaboradores',
      directory: 'Diretório',
    },
    navigation: {
      archive: 'Colaboradores',
      directory: 'Diretório',
    },
    title: 'Colaboradores',
    description:
      'Mantenha a conta, a linha de subordinação, o cargo e as informações controladas de cada colaborador.',
    fields: {
      name: 'Nome',
      code: 'Código do colaborador',
      user: 'Conta',
      primaryDepartment: 'Departamento principal',
      position: 'Cargo',
      grade: 'Nível',
      manager: 'Gestor direto',
      status: 'Status',
      careerStartDate: 'Data do primeiro emprego',
      hireDate: 'Data de admissão',
      probationEndDate: 'Fim do período de experiência',
      lastWorkingDay: 'Último dia de trabalho',
      phone: 'Telefone',
      email: 'E-mail',
      workLocation: 'Local de trabalho',
      emergencyContact: 'Contato de emergência',
      active: 'Ativa',
      updatedAt: 'Atualizado',
      idType: 'Tipo de documento',
      idNumber: 'Número do documento',
      birthDate: 'Data de nascimento',
      address: 'Endereço',
      education: 'Escolaridade',
      school: 'Instituição de ensino',
      major: 'Área de formação',
      bankName: 'Banco',
      bankAccount: 'Conta bancária',
      bankAccountName: 'Titular da conta',
      effectiveFrom: 'Vigente desde',
      baseSalary: 'Salário base',
      sourceApplication: 'Solicitação de origem',
      note: 'Observação',
      kind: 'Alteração',
      effectiveAt: 'Data de vigência',
      changes: 'Alterações',
    },
    status: {
      probation: 'Em experiência',
      regular: 'Efetivo',
      leaving: 'Em desligamento',
      left: 'Desligado',
    },
    historyKind: {
      hire: 'Admissão',
      regularization: 'Efetivação',
      transfer: 'Transferir',
      salaryChange: 'Alteração salarial',
      departure: 'Desligamento',
      correction: 'Correção de dados',
    },
    boolean: {
      yes: 'Sim',
      no: 'Não',
    },
    search: {
      placeholder: 'Pesquisar por nome ou código de colaborador',
      label: 'Pesquisar colaboradores',
    },
    filters: {
      department: 'Departamento',
      allDepartments: 'Todos os departamentos',
      status: 'Status',
      allStatuses: 'Todos os status',
      clear: 'Limpar filtros',
    },
    empty: {
      title: 'Nenhum cadastro de colaborador ainda',
      description:
        'Crie um cadastro para vincular uma conta, linha de subordinação e cargo.',
      descriptionReadOnly:
        'Nenhum cadastro visível para você ainda. Consulte o RH caso esperasse encontrar algum aqui.',
      noResults: 'Nenhum colaborador corresponde aos filtros.',
    },
    error: {
      title: 'Não foi possível carregar colaboradores',
      requestFailed:
        'A requisição falhou. Verifique a conexão e tente novamente.',
      forbidden: 'Você não tem permissão para visualizar isto.',
      notFound: 'Este cadastro de colaborador não existe ou foi excluído.',
      tabForbidden: 'Você não tem permissão para visualizar esta seção.',
    },
    actions: {
      label: 'Ações',
      more: 'Ações de {{name}}',
      edit: 'Editar',
      correctStatus: 'Corrigir status',
      editProfile: 'Editar',
      moreActions: 'Mais ações',
    },
    create: {
      action: 'Novo colaborador',
      title: 'Novo colaborador',
      description: 'Vincule uma conta e preencha o cadastro.',
      submit: 'Criar',
      success: 'Colaborador “{{name}}” criado',
    },
    edit: {
      title: 'Editar colaborador',
      success: 'Colaborador “{{name}}” salvo',
    },
    form: {
      basicSection: 'Informações básicas',
      contactSection: 'Contato',
      nameRequired: 'Informe um nome.',
      codeRequired: 'Informe um código de colaborador.',
      userRequired: 'Escolha a conta a vincular.',
      careerStartInvalid: 'Escolha uma data válida do primeiro emprego.',
      careerStartFuture: 'A data do primeiro emprego não pode estar no futuro.',
      careerStartAfterHire:
        'A data do primeiro emprego não pode ser posterior à data de admissão.',
      hireDateRequired: 'Escolha a data de admissão.',
      tooLong: 'Use no máximo {{max}} caracteres.',
      emailInvalid: 'O formato do e-mail é inválido.',
      userTaken: 'Esta conta já tem um cadastro.',
      codeTaken: 'Este código de colaborador já está em uso.',
      userInvalid: 'Esta conta não existe ou está desabilitada.',
      managerInvalid:
        'Escolha um colaborador ativo que não esteja subordinado a este.',
      positionInvalid: 'Este cargo não existe ou está desabilitado.',
      gradeInvalid: 'Este nível não existe ou está desabilitado.',
      initialStatus: 'Status inicial',
      managerPlaceholder: 'Pesquisar por nome ou código de colaborador',
      managerEmpty: 'Nenhum colaborador correspondente',
      none: 'Nenhum',
      positionPlaceholder: 'Escolher um cargo',
      gradePlaceholder: 'Escolher um nível',
      optionsFailed: 'Não foi possível carregar as opções.',
      userPlaceholder: 'Pesquisar contas por nome ou e-mail',
    },
    page: {
      title: 'Colaborador',
      tabsLabel: 'Seções do colaborador',
    },
    tabs: {
      basic: 'Informações básicas',
      profile: 'Informações controladas',
      compensation: 'Remuneração',
      history: 'Histórico de alterações',
    },
    profile: {
      title: 'Informações controladas',
      description:
        'Identidade, endereço, formação e conta bancária; visíveis apenas para papéis autorizados.',
      bankOnly: 'Você pode ver somente a conta bancária.',
      editTitle: 'Editar informações controladas',
      success: 'Informações controladas de “{{name}}” salvas',
      identitySection: 'Identidade',
      educationSection: 'Escolaridade',
      bankSection: 'Conta bancária',
    },
    compensation: {
      title: 'Remuneração',
      description:
        'Cada efetivação e alteração salarial adiciona uma linha; as linhas nunca são editadas.',
      empty: 'Nenhum registro de remuneração ainda.',
    },
    history: {
      referenceNotice:
        'Os nomes de referência usam o diretório atual; os nomes no momento da alteração não foram armazenados.',
      sources: {
        onboarding: 'Admissão',
        departure: 'Desligamento',
        transfer: 'Alteração de pessoal',
        probation: 'Efetivação',
        other: 'Outra operação de negócio',
      },
      referenceUnavailable: 'Referência histórica indisponível',
      personUnavailable: 'Pessoa histórica indisponível',
      otherField: 'Outra alteração',
      title: 'Histórico de alterações',
      description:
        'Admissões, efetivações, transferências, desligamentos e correções de dados.',
      empty: 'Nenhuma alteração registrada ainda.',
    },
    correction: {
      title: 'Corrigir status',
      description:
        'Uma correção de dados fora dos fluxos de aprovação. É auditada com seu motivo.',
      reason: 'Motivo',
      reasonPlaceholder: 'Por que o status registrado está errado',
      reasonRequired: 'Informe o motivo da correção.',
      submit: 'Corrigir',
      unchanged: 'A correção não altera nada.',
      success: 'Status de “{{name}}” corrigido',
    },
    directory: {
      title: 'Diretório',
      description:
        'Encontre colegas por departamento ou nome, com seus contatos.',
      searchPlaceholder: 'Pesquisar por nome ou código de colaborador',
      searchLabel: 'Pesquisar no diretório',
      contactHidden: 'Não visível',
      emptyTitle: 'O diretório está vazio',
      emptyDescription:
        'As pessoas aparecem aqui quando o RH cria seus cadastros.',
      noResults: 'Nenhum colega corresponde aos filtros.',
      errorTitle: 'Não foi possível carregar o diretório',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
