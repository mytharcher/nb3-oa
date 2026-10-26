const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'para {{name}}',
      showEvents: 'O que mudou ({{count}})',
      system: '{{count}} atualizações do sistema',
      empty: 'Nada aconteceu ainda.',
    },
    progress: {
      empty: 'Nenhuma aprovação foi iniciada ainda.',
      copies: 'Em cópia para',
      read: 'lido',
      unread: 'não lido',
      step: {
        current: 'em andamento',
        rejected: 'rejeitado',
        returned: 'devolvido',
        ended: 'encerrado',
        skipped: 'ignorado',
      },
      tally: {
        answered: '{{count}} de {{total}} respondidos',
        needed: '{{count}} necessários para aprovar',
      },
    },
    branches: {
      done: '{{count}} de {{total}} concluídos',
      blocked: 'Retendo a solicitação',
    },
    receipts: {
      read: 'Ler',
      confirmed: 'Confirmado',
      empty: 'Ninguém recebeu ainda.',
    },
    preview: {
      title: 'Quem decidirá',
      loading: 'Calculando o fluxo…',
      submit: 'Enviar',
      finished: 'Decidido',
      automatic: 'Aprovado sem decisão',
      parallel: 'Em paralelo',
      optional: 'Opcional',
      nobody: 'Ninguém elegível ainda',
      none: 'Esta solicitação é decidida sem aprovação.',
      skipped: 'Desnecessário: {{stages}}',
    },
    actions: {
      more: 'Mais',
      all: 'Ações',
      admin: 'Administração',
      confirm: '{{action}}?',
      loading: 'Carregando…',
      loadFailed: 'Não foi possível carregar isto. Feche e tente novamente.',
      cancel: 'Cancelar',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of approval-ui has. */
export type ApprovalUiLocale = Widen<typeof enUS>;

const locale: ApprovalUiLocale = enUS;

export default locale;
