import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Fechar',
  nav: { apiKeys: 'Chaves de API' },
  page: {
    search: 'Pesquisar pelo nome da chave',
    retry: 'Tentar novamente',
    clear: 'Limpar filtros',
    noResults: 'Nenhuma chave corresponde à pesquisa.',
    loading: 'Carregando',
    title: 'Chaves de API',
    description:
      'Crie chaves para que scripts e integrações chamem esta aplicação em seu nome.',
    add: 'Criar chave',
    empty: 'Você ainda não tem chaves de API.',
    unnamed: 'Chave sem nome',
    never: 'Nunca',
    unused: 'Nunca utilizada',
    active: 'Ativa',
    expired: 'Expirada',
    disabled: 'Desativada',
    columns: {
      name: 'Nome',
      key: 'Chave',
      status: 'Status',
      lastUsed: 'Último uso',
      expires: 'Expira em',
      actions: 'Ações',
    },
    actions: { revoke: 'Revogar', menu: 'Ações de "{{name}}"' },
  },
  form: {
    title: 'Criar chave de API',
    description:
      'A chave atua em seu nome. Ela possui exatamente as permissões da sua conta.',
    name: 'Nome',
    namePlaceholder: 'Tarefa de exportação noturna',
    expiry: 'Expira em',
    expiryChoices: {
      never: 'Nunca',
      '7': 'Em 7 dias',
      '30': 'Em 30 dias',
      '90': 'Em 90 dias',
      '365': 'Em 1 ano',
    },
    cancel: 'Cancelar',
    create: 'Criar',
  },
  reveal: {
    title: 'Copie sua chave agora',
    description:
      '“{{name}}” foi criada. Esta é a única vez que a chave será exibida.',
    usage: 'Envie-a no cabeçalho de requisição x-api-key.',
    copy: 'Copiar chave',
    done: 'Concluído',
  },
  revoke: {
    success: 'Chave "{{name}}" revogada',
    title: 'Revogar a chave "{{name}}"?',
    description:
      'As requisições que usam “{{name}}” falharão imediatamente. Esta ação não pode ser desfeita.',
    cancel: 'Cancelar',
    confirm: 'Revogar',
  },
  errors: {
    forbidden:
      'Você não pode mais visualizar chaves. Entre em contato com um administrador.',
    notFound:
      'O gerenciamento de chaves de API está indisponível. Volte à área de trabalho.',
    nameRequired: 'Informe um nome para a chave.',
    copyFailed:
      'Não foi possível copiar a chave. Selecione-a e copie manualmente.',
    loadFailed: 'Não foi possível carregar suas chaves de API.',
    createFailed: 'Não foi possível criar a chave de API.',
    revokeFailed: 'Não foi possível revogar a chave de API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
