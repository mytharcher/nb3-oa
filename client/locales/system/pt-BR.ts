import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/pt-BR';
import inboxEnUS from '#extensions/nocobase-inbox/locales/pt-BR';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Mensagens',
  'inbox.loadFailed': 'Não foi possível carregar mensagens',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Mensagens',
  'inboxButton.pending': 'Mensagens, {{count}} aguardando',
  'inboxButton.unread': 'Mensagens, {{count}} não lidas',
  'inboxButton.pendingHint':
    '{{count}} aguardando você; a contagem diminui ao processá-las.',
  'inboxButton.unreadHint':
    '{{count}} não lidas; a contagem diminui conforme você as lê.',
  'auth.welcome': 'Bem-vindo de volta',
  'auth.loginDescription': 'Entre com seu nome de usuário ou e-mail e senha.',
  'auth.registerTitle': 'Criar uma conta',
  'auth.registerDescription': 'Crie uma conta para começar.',
  'auth.forgotTitle': 'Esqueci a senha',
  'auth.forgotDescription':
    'Informe seu e-mail e enviaremos um link de redefinição se a conta existir.',
  'auth.resetDescription': 'Escolha uma nova senha para sua conta.',
  'auth.resetTitle': 'Redefinir senha',
  'auth.identifier': 'Nome de usuário ou e-mail',
  'auth.password': 'Senha',
  'auth.signIn': 'Entrar',
  'auth.signingIn': 'Entrando…',
  'auth.hidePassword': 'Ocultar senha',
  'auth.showPassword': 'Mostrar senha',
  'auth.forgotLink': 'Esqueceu a senha?',
  'auth.noAccount': 'Não tem uma conta?',
  'auth.signUp': 'Cadastrar-se',
  'auth.createAccount': 'Criar conta',
  'auth.creatingAccount': 'Criando conta…',
  'auth.name': 'Nome',
  'auth.username': 'Nome de usuário',
  'auth.email': 'E-mail',
  'auth.confirmPassword': 'Confirmar senha',
  'auth.existingAccount': 'Já tem uma conta?',
  'auth.passwordMismatch': 'As senhas não coincidem.',
  'auth.resetting': 'Redefinindo…',
  'auth.newPassword': 'Nova senha',
  'auth.confirmNewPassword': 'Confirmar nova senha',
  'auth.invalidResetLink':
    'Este link de redefinição de senha é inválido ou expirou.',
  'auth.backToSignIn': 'Voltar para entrar',
  'auth.sendResetLink': 'Enviar link de redefinição',
  'auth.sending': 'Enviando…',
  'auth.resetSent': 'Se a conta existir, um link de redefinição foi enviado.',
  'auth.rememberPassword': 'Lembrou sua senha?',
  'auth.methods': 'Métodos de acesso',
  'auth.or': 'Ou continue com',
  'auth.continueWith': 'Continuar com {provider}',
  'auth.about': 'Sobre esta aplicação',
  'auth.platform': 'Plataforma de aplicações nativa de IA',
  'auth.marketingTitleFirst': 'Deixe a IA criar livremente.',
  'auth.marketingTitleSecond': 'O NocoBase mantém tudo',
  'auth.marketingTitleThird': 'confiável.',
  'auth.marketingDescription':
    'Dê à IA um framework frontend flexível para criar cada experiência, enquanto o NocoBase protege os dados, as permissões e a governança subjacentes.',
  'auth.frontend': 'Frontend nativo de IA',
  'auth.frontendDescription':
    'Componha interfaces livremente em um framework flexível.',
  'auth.foundation': 'Base NocoBase',
  'auth.foundationDescription':
    'Dados, controle de acesso e governança confiáveis.',
  'auth.marketingFooter': 'Liberdade na superfície. Confiança na base.',
  'status.loading': 'Carregando',
  'status.loadingPage': 'Carregando página',
  'status.denied': 'Acesso negado',
  'status.pageFailed': 'Não foi possível carregar a página',
  'status.retry': 'Tentar novamente',
  'navigation.brandHome': 'Página inicial do NocoBase',
  'navigation.brandApps': 'Aplicações NocoBase',
  'routeOverlay.close': 'Fechar',
  'status.backHome': 'Voltar à área de trabalho',
  'status.deniedDescription':
    'Você não tem permissão para acessar esta página.',
  'status.routeFailedDescription':
    'Não foi possível carregar esta página. Tente novamente.',
  shell: {
    buildFreely: 'A IA cria livremente.',
    reliability: 'O <brand>NocoBase</brand> mantém tudo confiável.',
  },
  home: {
    platform: 'NocoBase · Plataforma de aplicações nativa de IA',
    title: 'Descreva e seu agente cria',
    description:
      'Esta aplicação é desenvolvida conversando com seu agente de programação. Diga em palavras simples o que o negócio precisa e ele escreve as páginas, modelos de dados, APIs e processos de negócio neste projeto.',
    steps: {
      describe: {
        title: 'Descreva a necessidade',
        description:
          'Diga quem usa, quais dados mantém e o que deve acontecer.',
      },
      build: {
        title: 'Deixe o agente criar',
        description:
          'Ele lê este projeto e seus recursos integrados e escreve o código.',
      },
      review: {
        title: 'Verifique e refine',
        description:
          'Atualize a página para experimentar e solicite alterações da mesma forma.',
      },
    },
    example: {
      title: 'Experimente uma solicitação como esta',
      text: 'Crie uma aplicação de pedidos de compra.\n\nUm pedido tem número, item, solicitante, valor e status de aprovação. Solicitantes criam pedidos e veem somente os próprios; revisores veem todos os pedidos pendentes e os aprovam ou rejeitam.\nApós uma decisão, notifique o solicitante na caixa de entrada com um link para o pedido.',
      hint: 'Cole no Claude Code, Codex, Cursor ou em qualquer agente de programação aberto neste projeto.',
    },
    capabilitiesTitle: 'Recursos integrados',
    capabilitiesDescription:
      'Seu agente usa estes recursos diretamente. Abra um deles para obter um comando que pode editar e copiar.',
    viewPrompts: 'Visualizar comandos ({{count}})',
    prompt: {
      label: 'Comando',
      hint: 'Edite o comando conforme seu negócio antes de copiar. As alterações não são salvas após fechar o diálogo.',
      copy: 'Copiar',
      copiedShort: 'Copiado',
      copied: 'Comando copiado',
      copyFailed:
        'Não foi possível copiar. Selecione o texto e copie manualmente.',
      reset: 'Restaurar padrão',
    },
    capabilities: {
      auth: {
        title: 'Autenticação',
        description:
          'Acesso, cadastro, redefinição de senha e acesso único corporativo.',
        prompts: {
          disableSignUp: {
            label: 'Desabilitar cadastro',
            text: 'Esta aplicação é exclusiva para colaboradores da empresa. Os administradores criam todas as contas.\nDesabilite o autocadastro e remova o link de cadastro da página de acesso.\nOs colaboradores existentes devem continuar entrando com suas contas e senhas.\nMantenha o link de recuperação de senha.',
          },
          passwordRules: {
            label: 'Regras de senha',
            text: 'Exija pelo menos 12 caracteres ao cadastrar ou redefinir uma senha.\nMostre este requisito nos dois formulários e use mensagens de validação consistentes.\nPermita que contas existentes continuem entrando sem exigir troca imediata de senha.',
          },
          companySso: {
            label: 'SSO corporativo',
            text: 'Permita que colaboradores entrem pela plataforma de identidade da empresa usando OIDC.\n\nMantenha o acesso por conta e senha e adicione um botão Conta corporativa.\nO botão abre a plataforma de identidade da empresa. Após o acesso bem-sucedido, retorne à página inicial da aplicação.\n\nPermita que o primeiro acesso crie uma conta da aplicação, identificada pelo identificador estável do usuário da plataforma.\nNão vincule contas automaticamente pela correspondência de nomes ou e-mails. Novas contas usam as permissões padrão da aplicação.\n\nListe as informações que o administrador da plataforma de identidade deve fornecer e a URL de retorno que precisa registrar.',
          },
        },
      },
      authorization: {
        title: 'Permissões',
        description:
          'Controle quem pode abrir cada página, executar ações e visualizar registros.',
        prompts: {
          jobs: {
            label: 'Funções',
            text: 'Crie as funções Solicitante de compras e Revisor de pedidos para a aplicação.\nSolicitantes de compras podem entrar na página de pedidos e visualizar os pedidos que solicitaram.\nRevisores de pedidos podem entrar na página de pedidos, visualizar pedidos e aprovar ou rejeitar pedidos pendentes.\nSomente administradores da aplicação podem alterar permissões e atribuições.\nUse o recurso existente de autorização da aplicação para que administradores possam ajustar permissões e atribuir pessoas posteriormente.',
          },
          dataScopes: {
            label: 'Escopos de dados',
            text: 'Permita que solicitantes de compras visualizem somente os próprios pedidos, usando o campo solicitante para determinar a propriedade.\nRevisores de pedidos podem visualizar todos os pedidos e processar aprovações pendentes.\nAdministradores podem ajustar o escopo de visualização de pedidos de cada função em seu conjunto de permissões.',
          },
          sharing: {
            label: 'Compartilhamento',
            text: 'Compartilhe o pedido PO-2026-004 de Bob com Alice para que ela possa revisá-lo.\nAlice já tem permissão para visualizar pedidos; adicione acesso de visualização a este pedido.\nMantenha suas responsabilidades existentes. Os revisores de pedidos continuam processando aprovações.\nPermita que administradores gerenciem esta regra de compartilhamento.',
          },
        },
      },
      scheduler: {
        title: 'Tarefas agendadas',
        description:
          'Execute trabalhos de negócio em horários definidos e veja a próxima execução e seus resultados.',
        prompts: {
          reminder: {
            label: 'Lembrete diário',
            text: 'Adicione um Lembrete de pedidos pendentes à aplicação existente de pedidos.\n\nÀs 09:00 no horário de Pequim em cada dia de semana, encontre pedidos aguardando aprovação, agrupe-os por revisor e envie uma notificação interna para cada revisor.\nInclua a quantidade de pedidos pendentes e um link para a lista. Não envie nada quando não houver pedidos pendentes.\nAdministradores podem visualizar o agendamento e os registros de execução e pausar ou retomar os lembretes.',
          },
          weeklyReport: {
            label: 'Relatório semanal',
            text: 'Às 08:00 no horário de Pequim de cada segunda-feira, gere o resumo de vendas da semana anterior e notifique o gerente de vendas.\nInclua a receita de vendas, a quantidade de pedidos e os totais regionais. Administradores podem visualizar a tarefa e os registros de execução.',
          },
        },
      },
      notification: {
        title: 'Notificações',
        description:
          'Envie mensagens internas, e-mails ou mensagens de bot em grupo quando algo acontecer.',
        prompts: {
          inApp: {
            label: 'Mensagem interna',
            text: 'Adicione aprovação de pedidos à aplicação atual e notifique os solicitantes dos resultados por mensagens internas.\n\nOs pedidos incluem número, nome, solicitante, valor e status de aprovação.\nSolicitantes podem visualizar os próprios pedidos. Revisores podem visualizar pedidos pendentes e aprová-los ou rejeitá-los. Reutilize os recursos existentes de pedidos e aprovação, se disponíveis.\n\nApós aprovação ou rejeição, envie uma mensagem interna somente ao solicitante do pedido.\nO título indica se o pedido foi aprovado ou rejeitado. O conteúdo inclui número, nome e resultado da aprovação do pedido.\nClicar na mensagem abre os detalhes do pedido correspondente.\nNão envie enquanto a aprovação estiver pendente. Notifique somente uma vez para o mesmo resultado de aprovação.\nUma falha na notificação não afeta o resultado de aprovação salvo.',
          },
          email: {
            label: 'E-mail',
            text: 'Adicione e-mail às notificações existentes de aprovação de pedidos, usando o canal de e-mail configurado da aplicação.\n\nApós aprovação ou rejeição de um pedido, envie o resultado para o e-mail da conta do solicitante.\nInclua o número do pedido no assunto e o nome e o resultado no conteúdo.\nMantenha as mensagens internas existentes. Se o solicitante não tiver e-mail, envie somente a mensagem interna.\nUma falha no e-mail não deve afetar o resultado da aprovação nem a mensagem interna.',
          },
        },
      },
      mail: {
        title: 'Correio',
        description:
          'Conecte caixas de e-mail pessoais e leia, responda e envie e-mails de negócio.',
        prompts: {
          mailCenter: {
            label: 'Central de e-mail',
            text: 'Adicione uma central de e-mail e uma entrada de gerenciamento de contas de e-mail à aplicação. Os usuários podem conectar suas caixas pessoais, selecionar uma caixa, sincronizar mensagens recebidas, ler mensagens e anexos e responder.\n\nQuando um representante de vendas recebe uma solicitação de cotação, pode responder pela central de e-mail. Mantenha o assunto original e o contexto da conversa e enderece a resposta ao remetente original. Cada usuário trabalha com suas próprias caixas conectadas.',
          },
          correspondence: {
            label: 'E-mails de clientes',
            text: 'Adicione uma seção de correspondência aos detalhes do cliente. Mostre mensagens cujo remetente ou destinatário corresponde aos e-mails de contato do cliente atual. Representantes de vendas podem ler mensagens, visualizar anexos e responder usando suas próprias caixas conectadas.',
          },
        },
      },
      file: {
        title: 'Arquivos',
        description:
          'Envie arquivos, anexe-os a registros e visualize ou baixe-os.',
        prompts: {
          attachments: {
            label: 'Anexos',
            text: 'Adicione anexos de compra à minha aplicação existente de gerenciamento de pedidos.\n\nAdicione uma área de anexos aos detalhes do pedido. Cada pedido pode ter vários arquivos, incluindo PDF, imagens e DOCX.\nMostre nomes e tamanhos de arquivos, com ações para visualizar, baixar e remover anexos.\nApós enviar, permita que usuários salvem os anexos no pedido atual. Mantenha-os disponíveis ao reabrir o pedido.\nQualquer pessoa com acesso ao pedido pode visualizar e baixar seus anexos. Solicitantes e revisores podem adicionar ou remover anexos.\nRemover um anexo apenas o desvincula do pedido atual; mantenha o arquivo.',
          },
          avatar: {
            label: 'Avatar',
            text: 'Adicione um avatar a cada colaborador, com uma imagem por colaborador.\nPermita enviar e substituir o avatar e exiba-o nas listas e detalhes dos colaboradores.\nUse o novo avatar após a substituição e mantenha-o visível após atualizar a página.',
          },
        },
      },
      templatePrint: {
        title: 'Impressão por modelo',
        description:
          'Preencha modelos Word ou Excel com dados de negócio e gere arquivos.',
        prompts: {
          approvalForm: {
            label: 'Formulário de aprovação',
            text: 'Adicione uma ação “Gerar formulário de aprovação” aos detalhes do pedido.\n\nUse o modelo Word fornecido para preencher número do pedido atual, solicitação de compra, solicitante, valor, resultado da aprovação e horário de processamento.\nMantenha o cabeçalho, a disposição das tabelas e a área de assinatura do modelo. Nomeie a saída “Aprovação-compra-número-pedido” e forneça download em Word.\nQualquer pessoa com acesso ao pedido pode gerar seu formulário de aprovação. Use os dados atuais do pedido ao gerar o arquivo.',
          },
          pdf: {
            label: 'Saída PDF',
            text: 'Adicione download em PDF ao formulário de aprovação de compra, preservando fontes, tabelas e área de assinatura do modelo Word.',
          },
        },
      },
      i18n: {
        title: 'Idiomas',
        description:
          'Alterne o idioma da interface, adicione idiomas e defina o padrão.',
        prompts: {
          addLanguage: {
            label: 'Adicionar um idioma',
            text: 'Adicione espanhol à minha aplicação. Traduza a interface e as mensagens do servidor e adicione espanhol ao menu de idiomas.',
          },
          defaultLanguage: {
            label: 'Idioma padrão',
            text: 'Defina chinês simplificado como idioma padrão da aplicação para pessoas que não escolheram um. Mantenha inglês disponível no menu de idiomas.',
          },
        },
      },
      theme: {
        title: 'Temas',
        description:
          'Ajuste cores, fontes e densidade e alterne entre claro e escuro.',
        prompts: {
          changeTheme: {
            label: 'Alterar um tema',
            text: 'Atualize o tema Compacto: use azul como cor primária e aumente ligeiramente o raio dos cantos. Mantenha as fontes atuais, os tamanhos de texto e o espaçamento compacto.',
          },
          newTheme: {
            label: 'Novo tema',
            text: 'Crie um tema Floresta com verde como cor primária, fundos suaves, cantos moderadamente arredondados e sombras discretas.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Aparência',
    mode: 'Modo de cor',
    preset: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    system: 'Sistema',
    themes: { default: 'Espaçoso', compact: 'Compacto' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Fechar',
    save: 'Salvar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    language: 'Idioma',
  },
  notices: {
    serverLocaleFallback:
      'O servidor não suporta este idioma, portanto as mensagens do servidor usarão inglês.',
    languageChangeFailed:
      'Não foi possível concluir a mudança de idioma. Tente novamente.',
  },
  account: {
    signOutFailed: 'Não foi possível sair. Tente novamente.',
    openMenu: 'Abrir menu da conta',
    fallback: 'Conta',
    signOut: 'Sair',
    signingOut: 'Saindo…',
  },
  navigation: {
    home: 'Início',
    open: 'Abrir navegação',
    close: 'Fechar navegação',
    expand: 'Expandir navegação',
    collapse: 'Recolher navegação',
    toggle: 'Expandir ou recolher navegação',
    label: 'Navegação da aplicação',
    description: 'Ir para uma página desta aplicação.',
    breadcrumb: 'Navegação estrutural',
    breadcrumbMore: 'Mostrar os níveis intermediários',
    back: 'Voltar',
  },
  dataTable: {
    emptyDescription:
      'Nenhum registro disponível no escopo atual. Tente outro escopo ou verifique novamente mais tarde.',
    noResults: 'Nenhum resultado.',
    sortAscending: 'Crescente',
    sortDescending: 'Decrescente',
    hideColumn: 'Ocultar',
    view: 'Visualizar',
    toggleColumns: 'Alternar colunas',
    selectedCount: '{{selected}} de {{total}} linha(s) selecionada(s).',
    rowsPerPage: 'Linhas por página',
    pageOf: 'Página {{page}} de {{pageCount}}',
    firstPage: 'Ir para a primeira página',
    previousPage: 'Ir para a página anterior',
    nextPage: 'Ir para a próxima página',
    lastPage: 'Ir para a última página',
  },
  datePicker: {
    placeholder: 'Escolher uma data',
    rangePlaceholder: 'Escolher um intervalo de datas',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
