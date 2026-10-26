import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Fechar',
  nav: { users: 'Gerenciamento de usuários' },
  assignment: {
    saved: 'Permissões de "{{name}}" atualizadas',
    inspect: 'Verificar permissões efetivas',
    keepEditing: 'Continuar editando',
    discardChanges: 'Descartar alterações',
    showMore: 'Mostrar mais',
    title: 'Atribuições de permissões',
    description:
      'Gerencie as permissões atribuídas diretamente a este usuário. As alterações serão aplicadas ao salvar.',
    search: 'Pesquisar nomes ou descrições',
    selectedOnly: 'Somente selecionados',
    selected: '{{count}} selecionados',
    changes: '{{added}} adicionados, {{removed}} removidos',
    noChanges: 'Nenhuma alteração',
    empty: 'Nenhuma opção correspondente',
    protected: 'Esta atribuição é protegida e não pode ser alterada aqui',
    failed: 'Não foi possível salvar. Tente novamente.',
    discard: 'Descartar alterações não salvas?',
  },
  sessions: {
    title: 'Revogar as sessões de "{{name}}"?',
    description:
      'O usuário precisará entrar novamente em todos os dispositivos.',
    confirm: 'Revogar',
    success: 'Sessões de "{{name}}" revogadas',
  },
  page: {
    noMatches: 'Nenhum usuário corresponde aos filtros.',
    clearFilters: 'Limpar filtros',
    emptyDescription:
      'Crie usuários aqui ou peça a um administrador para adicionar uma conta.',
    retry: 'Tentar novamente',
    loading: 'Carregando',
    title: 'Usuários',
    description: 'Gerencie contas, atribuições de permissões e sessões ativas.',
    add: 'Adicionar usuário',
    search: 'Pesquisar nome, usuário ou e-mail',
    allStatuses: 'Todos os status',
    allRoles: 'Todos os conjuntos de permissões',
    enabled: 'Ativa',
    disabled: 'Bloqueado',
    noUsers: 'Nenhum usuário encontrado.',
    total: '{{count}} usuários',
    previous: 'Anterior',
    next: 'Próximo',
    selectRole: 'Selecionar conjunto de permissões',
    roles: 'Conjuntos de permissões',
    systemAdministrator: 'Administrador do sistema',
    noDirectRoles: 'Não atribuído diretamente',
    protectedRole: 'Atribuição protegida',
    authenticatedDefaultAccess:
      'Somente atribuições diretas são exibidas aqui. Permissões recebidas por todos os usuários conectados, equipes ou outros sujeitos não são listadas.',
    columns: { user: 'Usuário', status: 'Status', actions: 'Ações' },
    actions: {
      menuFor: 'Ações de {{name}}',
      edit: 'Editar',
      resetPassword: 'Redefinir senha',
      revokeSessions: 'Revogar sessões',
      enable: 'Ativar conta',
      delete: 'Excluir',
      disable: 'Bloquear conta',
    },
  },
  form: {
    roleRequired: 'Escolha um valor para {{name}}.',
    nameRequired: 'Informe um nome.',
    emailInvalid: 'Informe um endereço de e-mail válido.',
    passwordRequired: 'Informe uma senha.',
    saved: 'Usuário "{{name}}" salvo',
    addTitle: 'Adicionar usuário',
    editTitle: 'Editar usuário',
    addDescription: 'Crie uma conta e atribua permissões.',
    editDescription: 'Atualize o perfil da conta.',
    name: 'Nome',
    username: 'Nome de usuário',
    email: 'E-mail',
    password: 'Senha',
    cancel: 'Cancelar',
    save: 'Salvar',
    create: 'Criar',
  },
  password: {
    saved: 'Redefinir a senha de "{{name}}"',
    title: 'Redefinir senha',
    description:
      'Defina uma nova senha para {{name}}. Todas as sessões serão revogadas.',
    newPassword: 'Nova senha',
    submit: 'Redefinir senha',
  },
  state: {
    enabled: 'Conta "{{name}}" ativada',
    disabled: 'Conta "{{name}}" bloqueada',
    enableTitle: 'Ativar a conta "{{name}}"?',
    disableTitle: 'Bloquear a conta "{{name}}"?',
    enableDescription:
      'O bloqueio de acesso de {{name}} será removido. As regras de acesso existentes continuarão válidas.',
    disableDescription:
      '{{name}} não poderá entrar e será desconectado de todos os dispositivos. A configuração de autorização é mantida; bloquear não significa desligamento.',
    enable: 'Ativar conta',
    disable: 'Bloquear conta',
  },
  deletion: {
    title: 'Excluir o usuário "{{name}}"?',
    description:
      'Todas as sessões e chaves de API de {{name}} serão revogadas. O histórico de atividades será mantido. Esta ação não pode ser desfeita.',
    success: 'Usuário "{{name}}" excluído',
  },
  invite: {
    open: 'Convidar usuários',
    title: 'Convidar usuários',
    description:
      'Cada endereço sem conta recebe um e-mail com um link para criá-la.',
    emails: 'Endereços de e-mail',
    emailsHint:
      'Um por linha, ou separados por vírgulas ou espaços. Até 50 por vez.',
    emailsRequired: 'Informe pelo menos um endereço de e-mail.',
    emailsInvalid: 'Endereços de e-mail inválidos: {{emails}}',
    emailsTooMany: 'Convide no máximo 50 endereços por vez.',
    roles: 'Permissões após ingressar',
    send: 'Enviar convites',
    sent: 'Convites enviados.',
    done: 'Concluído',
    link: 'Link do convite',
    copy: 'Copiar link',
    copied: 'Copiado',
    copyFailed: 'Não foi possível copiar o link.',
    outcome: {
      sent: 'E-mail enviado',
      notSent: 'E-mail não enviado: copie o link abaixo',
      existingUser: 'Já possui uma conta',
    },
  },
  invitations: {
    title: 'Convites pendentes',
    empty: 'Nenhum convite pendente.',
    email: 'E-mail',
    invitedBy: 'Convidado por',
    expires: 'Expira em',
    status: 'Status',
    pending: 'Pendente',
    expired: 'Expirada',
    notSent: 'Não enviado',
    resend: 'Enviar novamente',
    revoke: 'Revogar',
    actionsFor: 'Ações do convite para {{email}}',
    resent: 'Convite reenviado.',
    revoked: 'Convite revogado.',
    revokeTitle: 'Revogar o convite para "{{email}}"?',
    revokeDescription: 'O link enviado para {{email}} deixará de funcionar.',
  },
  accept: {
    title: 'Aceitar o convite',
    description: '{{inviter}} convidou você.',
    summary: 'Você também ingressará em: {{items}}',
    loading: 'Carregando convite…',
    email: 'E-mail',
    name: 'Nome',
    password: 'Senha',
    nameRequired: 'Informe seu nome.',
    passwordTooShort: 'A senha precisa ter pelo menos {{min}} caracteres.',
    submit: 'Criar conta e ingressar',
    submitting: 'Ingressando…',
    signedIn:
      'Você está conectado como {{name}}. Saia para aceitar este convite com uma nova conta.',
    signOut: 'Sair',
    signOutFailed: 'Não foi possível sair.',
    existingAccount:
      'Este endereço já possui uma conta. Entre com ela para continuar.',
    goToLogin: 'Ir para entrar',
    errors: {
      notFound: 'Este link de convite é inválido.',
      expired: 'Este convite expirou. Solicite outro.',
      accepted: 'Este convite já foi aceito.',
      revoked: 'Este convite foi revogado.',
      password: 'A senha não atende aos requisitos.',
      accountConflict: 'Não é possível criar uma conta com este endereço.',
      failed: 'Algo deu errado. Tente novamente.',
    },
  },
  errors: {
    loadFailed: 'Não foi possível carregar usuários. Tente novamente.',
    loadForbidden:
      'Você não pode mais visualizar usuários. Entre em contato com um administrador.',
    loadNotFound:
      'O gerenciamento de usuários está indisponível. Volte à área de trabalho.',
    SELF_DELETE_NOT_ALLOWED: 'Você não pode excluir sua própria conta.',
    LAST_ASSIGNMENT:
      'Este usuário é o último a possuir um conjunto de permissões que deve permanecer atribuído.',
    USER_HAS_APPS:
      'Transfira ou exclua as aplicações deste usuário antes de excluí-lo.',
    HUB_ADMIN_REQUIRED:
      'Somente um administrador da plataforma pode excluir usuários.',
    PROTECTED_ROLE_ASSIGNMENT:
      'Este papel não pode ser atribuído ou removido pelo gerenciamento de usuários.',
    USER_NOT_FOUND: 'O usuário não existe mais.',
    USER_DELETION_NOT_CONFIGURED:
      'A exclusão de usuários não está configurada para esta aplicação.',
    USER_EMAIL_CONFLICT: 'Já existe um usuário com este e-mail.',
    USER_USERNAME_CONFLICT: 'Já existe um usuário com este nome de usuário.',
    USER_IDENTITY_CONFLICT:
      'Já existe um usuário com este e-mail ou nome de usuário.',
    PASSWORD_TOO_SHORT: 'A senha é muito curta.',
    PASSWORD_TOO_LONG: 'A senha é muito longa.',
    operationFailed: 'A operação do usuário falhou.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
