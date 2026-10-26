export default {
  jobGrades: {
    authz: {
      resource: 'Tabelas de níveis salariais',
      view: 'Visualizar histórico de publicação',
      viewSalary: 'Ler faixas salariais',
      manage: 'Publicar tabela de níveis salariais',
    },

    title: 'Tabelas de níveis salariais',
    description:
      'Inspecione o histórico imutável de publicação e publique intervalos salariais completos.',
    publish: 'Publicar nova versão',
    publishing: 'Publicando…',
    search: 'Pesquisar número exato da versão',
    empty: 'Nenhuma tabela salarial publicada',
    emptyDescription:
      'Publique a primeira tabela completa de níveis salariais.',
    emptyReadonly:
      'Peça ao RH que publique a primeira tabela de níveis salariais.',
    noMatches: 'Nenhuma versão correspondente',
    noMatchesDescription:
      'Limpe a pesquisa de versão para ver o histórico de publicação.',
    replacement:
      'A publicação substitui toda a tabela atual. Documentos enviados anteriormente mantêm sua versão.',
    privateDenied:
      'Você não pode ler os intervalos salariais. Peça acesso a um administrador.',
    publishDenied:
      'Você não pode publicar tabelas de níveis salariais. Peça acesso a um administrador.',
    unknown:
      'O resultado da publicação não foi confirmado. Repita a publicação original.',
    conflict:
      'A tabela atual mudou. Carregue a tabela mais recente antes de publicar.',
    inactive:
      'Este nível está indisponível. Remova-o ou escolha um nível ativo.',
    success: 'Tabela salarial “Versão {{version}}” publicada',
    version: 'Versão {{version}}',
    versionColumn: 'Versão',
    publisher: 'Publicado por',
    publishedAt: 'Publicado em',
    refresh: 'Atualizar',
    retry: 'Tentar novamente',
    retryPublication: 'Repetir publicação original',
    clear: 'Limpar filtros',
    loading: 'Carregando tabelas de níveis salariais',
    view: 'Visualizar versão',
    rowActions: 'Ações da versão {{version}}',
    grade: 'Nível',
    gradeCode: 'Código do nível',
    gradeTitle: 'Nome do nível',
    rank: 'Classificação congelada',
    minimum: 'Mínimo',
    maximum: 'Máximo',
    reason: 'Motivo da publicação',
    addGrade: 'Adicionar nível',
    remove: 'Remover nível {{index}}',
    selectGrade: 'Selecionar um nível ativo',
    removeDescription:
      'Remover uma linha altera somente a nova tabela proposta. As versões históricas permanecem inalteradas.',
    cancel: 'Cancelar',
    loadLatest: 'Carregar tabela mais recente',
    currentVersion: 'Versão de origem: {{version}}',
    notFound:
      'Esta tabela de níveis salariais está indisponível. Volte ao histórico de publicação.',
    failed:
      'Não foi possível carregar as tabelas de níveis salariais. Tente novamente.',
    writeFailed:
      'A publicação foi recusada. Verifique os campos e tente novamente.',
    storageFailure:
      'Não é possível salvar a publicação original com segurança nesta aba. A publicação está bloqueada; verifique o armazenamento do navegador e recarregue.',
    unsavedTitle: 'Descartar alterações da tabela salarial?',
    unsavedDescription: 'Suas alterações não publicadas serão perdidas.',
    discard: 'Descartar alterações',
    stay: 'Continuar editando',
    replaceTitle: 'Substituir a tabela proposta?',
    replaceDescription:
      'Carregar a tabela mais recente descarta esta proposta e começa a partir da tabela atual completa.',
    confirmReplace: 'Substituir e carregar mais recente',
    noGrades:
      'Nenhum nível ativo disponível. Peça a um administrador da organização que configure os níveis.',
    reasonHint:
      'Explique a publicação completa da tabela (até 2.000 caracteres).',
    immutable:
      'Esta versão publicada é imutável. Suas identidades de níveis e intervalos estão congelados.',
    validation: {
      required: 'Este campo é obrigatório.',
      amount:
        'Informe um valor não negativo com até duas casas decimais dentro do intervalo suportado.',
      range: 'O máximo deve ser maior ou igual ao mínimo.',
      duplicate: 'Cada nível pode aparecer apenas uma vez.',
      inactive:
        'Este nível está indisponível. Remova-o ou escolha um nível ativo.',
      nonempty: 'Inclua pelo menos um nível ativo.',
      reasonLength: 'Use no máximo 2.000 caracteres.',
      server: 'Verifique este campo e tente novamente.',
    },
  },
};
