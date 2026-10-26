import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Permissões de páginas',
    page: 'Páginas',
    business: 'Permissões de negócio',
    administration: 'Administração',
    other: 'Outro',
  },
  options: {
    defaultAndSharing: 'Usar escopo de dados padrão',
    actions: {
      assign: 'Gerenciar atribuições',
      configure: 'Configurar',
      inspect: 'Inspecionar permissões',

      read: 'Ler',
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
      access: 'Acesso',
    },
    settingsModules: { authorization: 'Autorização' },
    pages: {
      all: 'Todas as páginas',
      allDescription:
        'Permitir acesso a todas as páginas, incluindo as adicionadas posteriormente.',
    },
    settings: {
      inspector: 'Inspetor de permissões',
      'permission-sets': 'Conjuntos de permissões',
    },
    subjectTypes: {
      authenticated: 'Todos os usuários conectados',
      authenticatedDescription:
        'Aplica-se a todo usuário com uma sessão válida.',
      user: 'Usuários',
    },
    recordAccessPolicies: {
      allRecords: 'Todos os registros',
      recordsIOwn: 'Registros que possuo',
      recordsICreated: 'Registros que criei',
      customFilter: 'Filtro personalizado',
      customFilterHint:
        'Selecione registros com uma condição de filtro personalizada.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
