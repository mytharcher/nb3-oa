/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Importação de dados' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Importação de dados',
      read: 'Visualizar histórico e modelos',
      update: 'Importar',
    },
    title: 'Importação de dados',
    description:
      'Importe departamentos, cargos, níveis, cadastros de colaboradores e membros de papéis de responsabilidade usando modelos Excel.',
    kinds: {
      departments: 'Departamentos',
      positions: 'Cargos',
      grades: 'Níveis',
      employees: 'Cadastros de colaboradores',
      dutyRoleMembers: 'Membros de papéis de responsabilidade',
    },
    kindHints: {
      departments:
        'Correspondência pelo código do departamento. Departamentos superiores podem ser definidos abaixo na planilha.',
      positions: 'Correspondência pelo código do cargo.',
      grades: 'Correspondência pelo código do nível.',
      employees:
        'Correspondência pelo número do colaborador. Importe departamentos, cargos e níveis primeiro; gestores podem ser definidos na mesma planilha.',
      dutyRoleMembers:
        'Correspondência pelo código do papel e conta. "Não" na coluna ativo remove o membro.',
    },
    actions: {
      new: 'Nova importação',
      templates: 'Baixar modelo',
      templateFor: 'Baixar o modelo de {{kind}}',
      check: 'Verificar',
      checking: 'Verificando…',
      confirm: 'Importar',
      importing: 'Importando…',
      chooseAgain: 'Escolher outro arquivo',
      back: 'Voltar',
      chooseFile: 'Escolher arquivo',
      downloadFile: 'Baixar o arquivo original',
      refresh: 'Atualizar',
      clearFilters: 'Limpar filtros',
    },
    fields: {
      kind: 'Tipo',
      file: 'Arquivo',
      createdAt: 'Iniciado',
      finishedAt: 'Finalizado',
      status: 'Resultado',
      summary: 'Resumo',
      actor: 'Por',
      rowCount: 'Linhas lidas',
      createdCount: 'Criado',
      updatedCount: 'Atualizado',
      unchangedCount: 'Sem alteração',
      errorCount: 'Problemas',
      row: 'Linha',
      column: 'Coluna',
      problem: 'Problema',
    },
    filters: { allKinds: 'Todos os tipos' },
    status: { succeeded: 'Bem-sucedido', failed: 'Falhou' },
    summary: {
      succeeded:
        '{{created}} criados · {{updated}} atualizados · {{unchanged}} sem alteração',
      failed: 'Problemas: {{count}}',
    },
    noFile: 'Nenhum arquivo selecionado',
    templateFile: 'Modelo de importação de {{kind}}.xlsx',
    fileHint: 'Uma pasta de trabalho .xlsx de até 5 MB, no formato do modelo.',
    notice: {
      title: 'Antes de importar',
      accounts:
        'Importações nunca criam contas: cada conta indicada no arquivo (nome de usuário ou e-mail) deve existir e estar habilitada, ou sua linha será reportada.',
      atomic:
        'Todo o arquivo é verificado primeiro e gravado de uma só vez: se qualquer linha tiver um problema, nada será gravado.',
    },
    validation: {
      kindRequired: 'Escolha o conteúdo do arquivo.',
      fileRequired: 'Escolha um arquivo .xlsx.',
      fileType: 'Somente pastas de trabalho .xlsx podem ser importadas.',
      fileSize: 'O arquivo é maior que 5 MB. Divida-o em vários arquivos.',
    },
    report: {
      invalidTitle: 'Problemas encontrados: {{count}}. Nada foi importado.',
      invalidDescription:
        'Corrija no arquivo as linhas abaixo e verifique-o novamente.',
      truncated:
        'Somente os primeiros {{shown}} de {{count}} problemas são listados.',
      okTitle: 'O arquivo passou na verificação',
      okDescription:
        '{{rows}} linhas lidas: {{created}} serão criadas, {{updated}} atualizadas e {{unchanged}} permanecerão inalteradas.',
      wholeFile: 'Arquivo',
    },
    toast: {
      imported: '"{{name}}" importado',
      templateFailed: 'Não foi possível baixar o modelo. Tente novamente.',
    },
    failure: {
      forbidden: 'Você não tem permissão para importar.',
      tooLarge: 'O arquivo é maior que 5 MB. Divida-o em vários arquivos.',
      invalidFile:
        'Não foi possível enviar o arquivo. Escolha uma pasta de trabalho .xlsx.',
      generic: 'A requisição falhou. Verifique sua conexão e tente novamente.',
    },
    empty: {
      title: 'Nenhuma importação ainda',
      description:
        'Baixe um modelo, preencha-o e importe-o para incluir departamentos, pessoas e papéis.',
      readOnly:
        'Nenhuma importação ainda. Peça a um administrador que importe os dados da organização.',
    },
    noResults: 'Nenhuma importação corresponde ao filtro.',
    loadFailedTitle: 'Não foi possível carregar o histórico de importação',
    detail: {
      title: 'Detalhes da importação · {{name}}',
      titleLoading: 'Detalhes da importação',
      notFound: 'Esta importação não existe ou foi excluída.',
      problems: 'Problemas',
    },
    common: {
      forbidden: 'Você não tem permissão para visualizar isto.',
      notFound: 'Este registro não existe ou foi excluído.',
      loadFailed:
        'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'O arquivo não é uma pasta de trabalho .xlsx legível. Salve-o como pasta de trabalho Excel e tente novamente.',
      SHEET_EMPTY:
        'A primeira planilha não tem linhas de dados. Preencha as linhas abaixo do cabeçalho.',
      TOO_MANY_ROWS:
        'O arquivo possui mais de {{max}} linhas. Divida-o em vários arquivos.',
      HEADER_MISSING:
        'A coluna obrigatória "{{header}}" está ausente na linha de cabeçalho.',
      HEADER_DUPLICATE: 'A coluna "{{header}}" aparece mais de uma vez.',
      REQUIRED: 'Obrigatório.',
      INVALID_CODE:
        '"{{value}}" não é um código válido: use letras, dígitos, ".", "_" e "-", até 64 caracteres.',
      TOO_LONG: 'Mais de {{max}} caracteres.',
      INVALID_INTEGER: '"{{value}}" não é um número inteiro.',
      INVALID_BOOLEAN: '"{{value}}" não é 是 / 否 (sim / não).',
      CAREER_START_FUTURE:
        'A data do primeiro emprego não pode ser posterior a hoje no fuso horário do calendário de trabalho.',
      CAREER_START_AFTER_HIRE:
        'A data do primeiro emprego não pode ser posterior à data de admissão.',
      INVALID_DATE:
        '"{{value}}" não é uma data válida. Use uma célula de data ou YYYY-MM-DD.',
      INVALID_STATUS:
        '"{{value}}" não é um status: use 试用, 正式, 离职中 ou 已离职.',
      INVALID_EMAIL: '"{{value}}" não é um endereço de e-mail.',
      DUPLICATE_IN_FILE: '"{{value}}" já aparece na linha {{firstRow}}.',
      USER_NOT_FOUND:
        'Nenhuma conta "{{value}}". Importações nunca criam contas: crie-a primeiro na página Usuários.',
      USER_DISABLED:
        'A conta "{{value}}" está desabilitada. Habilite-a primeiro na página Usuários.',
      USER_TAKEN: 'A conta "{{value}}" já pertence ao colaborador {{code}}.',
      USER_MISMATCH:
        'Este número de colaborador está vinculado a outra conta; um cadastro mantém sua conta.',
      PARENT_NOT_FOUND:
        'Nenhum departamento com código "{{value}}" no arquivo ou no sistema.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Somente departamentos de nível superior podem designar um executivo; os departamentos filhos o herdam.',
      PARENT_CYCLE: 'Os departamentos superiores formam um ciclo.',
      DEPARTMENT_NOT_FOUND:
        'Nenhum departamento com código "{{value}}". Importe os departamentos primeiro.',
      DEPARTMENT_INACTIVE: 'O departamento "{{value}}" está desabilitado.',
      POSITION_NOT_FOUND: 'Nenhum cargo com código "{{value}}".',
      POSITION_INACTIVE: 'O cargo "{{value}}" está desabilitado.',
      GRADE_NOT_FOUND: 'Nenhum nível com código "{{value}}".',
      GRADE_INACTIVE: 'O nível "{{value}}" está desabilitado.',
      MANAGER_NOT_FOUND:
        'Nenhum número de colaborador "{{value}}" no arquivo ou no sistema.',
      MANAGER_SELF: 'Um colaborador não pode ser seu próprio gestor.',
      MANAGER_INACTIVE: 'O gestor "{{value}}" foi desligado.',
      MANAGER_CYCLE: 'Os gestores formam um ciclo.',
      DUTY_ROLE_INACTIVE:
        'Este papel está inativo; novos membros não podem ser adicionados.',
      DUTY_ROLE_NOT_FOUND:
        'Nenhum papel de responsabilidade com código "{{value}}".',
      WRITE_FAILED:
        'Não foi possível gravar esta linha ({{reason}}), portanto nada foi importado. Verifique a linha e tente novamente.',
      unknown: 'Esta linha não pode ser importada.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
