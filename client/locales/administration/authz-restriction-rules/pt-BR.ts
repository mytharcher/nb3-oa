export default {
  resourceTitle: 'Regras de restrição',
  navigation: { title: 'Regras de restrição' },
  restrictionRules: {
    noResources:
      'Nenhum recurso de negócio com suporte a escopos de registros foi definido. Peça à IA para definir as permissões de negócio e os escopos de registros antes de configurar regras aqui.',
    page: {
      title: 'Regras de restrição',
      description:
        'As regras de restrição reduzem o acesso, limitando os registros acessíveis aos usuários selecionados sem conceder acesso por si só.',
    },
    notice:
      'As regras de restrição apenas reduzem o acesso existente. Nunca concedem permissão por si só.',
    search: 'Pesquisar pelo nome, chave ou recurso da regra',
    create: 'Nova regra de restrição',
    ruleHeader: 'Regra',
    appliesToHeader: 'Aplica-se a',
    restrictedActionsHeader: 'Ações restritas',
    allowedScopeHeader: 'Escopo permitido',
    emptyNone:
      'Nenhuma regra de restrição ainda. Crie uma para limitar o acesso de usuários selecionados.',
    emptySearch: 'Nenhuma regra de restrição corresponde à pesquisa.',
    pagerLabel: 'Regras de restrição',
    editTitle: 'Editar regra de restrição',
    newTitle: 'Nova regra de restrição',
    editorDescription: 'Limite o escopo efetivo de registros de um público.',
    ruleHeading: 'Informações básicas',
    ruleDescription: 'Nomeie a regra e escolha o recurso a restringir.',
    ruleName: 'Nome da regra',
    assignmentsHeading: 'Aplica-se a',
    assignmentsDescription: 'Escolha quem estará sujeito a esta restrição.',
    reason: 'Descrição',
    accessHeading: 'Ações e escopo de registros',
    accessDescription:
      'Defina o escopo máximo de registros de cada ação independentemente.',
    deleteRule: 'Excluir regra',
    save: 'Salvar regra de restrição',
    confirmDeleteTitle: 'Excluir a regra "{{title}}"?',
    confirmDeleteBody:
      'Exclua a regra de restrição “{{title}}”. Os conjuntos de permissões e regras restantes determinarão o acesso.',
  },
};
