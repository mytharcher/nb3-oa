export default {
  resourceTitle: 'Escopo de dados padrão',
  navigation: { title: 'Escopo de dados padrão' },
  defaultAccess: {
    supportedScope:
      'Somente tipos de recursos que aceitam escopos de dados são exibidos. Configure aqui o escopo padrão de registros para cada ação.',
    groupFilter: 'Grupo de recursos',
    allGroups: 'Todos os grupos',
    inlineHint:
      'Alterações simples são salvas imediatamente. Configure e salve escopos específicos no painel lateral.',
    saved: 'Salvo',
    editScope: 'Editar escopo',
    back: 'Voltar ao acesso padrão',

    configureResource: 'Configurar recurso',
    configure: 'Configurar',
    chooseResource:
      'Escolha um recurso para configurar seus escopos padrão de registros.',
    configured: 'Configurado',
    noDefault: 'Sem escopo padrão',
    customScope: 'Escopo específico',

    page: {
      title: 'Escopo de dados padrão',
      description:
        'O escopo de dados padrão amplia o escopo básico de registros para usuários com a permissão de ação correspondente. Ele não concede permissões de ações ou campos; as regras de compartilhamento e restrição também se aplicam.',
    },
    search: 'Pesquisar pelo nome ou chave do recurso',
    create: 'Definir acesso padrão',
    recordAccessHeader: 'Acesso padrão a registros',
    allowedActions: 'Ações permitidas',
    emptyNone:
      'Nenhum acesso padrão configurado. Conjuntos de permissões e outras regras determinam o acesso.',
    emptySearch: 'Nenhuma regra de acesso padrão corresponde à pesquisa.',
    pagerLabel: 'Regras de escopo de dados padrão',
    editTitle: 'Editar acesso padrão',
    newTitle: 'Definir acesso padrão',
    editorDescription:
      'Defina a visibilidade básica dos registros antes da aplicação de compartilhamentos e restrições.',
    resourceHeading: 'Recurso',
    resourceDescription: 'Escolha a coleção cujo acesso básico será definido.',
    accessHeading: 'Acesso por ação',
    accessDescription:
      'Defina o escopo de registros de cada ação independentemente.',
    deleteRule: 'Excluir regra',
    save: 'Salvar acesso padrão',
    confirmDeleteTitle: 'Remover os padrões de "{{resource}}"?',
    confirmDeleteBody:
      'Exclua a regra de acesso padrão de “{{resource}}”. Os conjuntos de permissões e regras restantes determinarão o acesso.',
  },
};
