const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'para {{name}}',
      showEvents: 'Cambios ({{count}})',
      system: '{{count}} actualizaciones del sistema',
      empty: 'Aún no ha ocurrido nada.',
    },
    progress: {
      empty: 'Aún no se ha iniciado ninguna aprobación.',
      copies: 'En copia para',
      read: 'leído',
      unread: 'sin leer',
      step: {
        current: 'en curso',
        rejected: 'rechazado',
        returned: 'devuelto',
        ended: 'finalizado',
        skipped: 'omitido',
      },
      tally: {
        answered: '{{count}} de {{total}} han respondido',
        needed: 'Se necesitan {{count}} para aprobar',
      },
    },
    branches: {
      done: '{{count}} de {{total}} han finalizado',
      blocked: 'Retrasando la solicitud',
    },
    receipts: {
      read: 'Leer',
      confirmed: 'Confirmado',
      empty: 'Aún no lo ha recibido nadie.',
    },
    preview: {
      title: 'Quién decidirá',
      loading: 'Calculando la ruta…',
      submit: 'Enviar',
      finished: 'Decidido',
      automatic: 'Aprobado sin decisión',
      parallel: 'En paralelo',
      optional: 'Opcional',
      nobody: 'Aún no hay nadie apto',
      none: 'Esta solicitud se resuelve sin aprobación.',
      skipped: 'No necesarias: {{stages}}',
    },
    actions: {
      more: 'Más',
      all: 'Acciones',
      admin: 'Administración',
      confirm: '¿{{action}}?',
      loading: 'Cargando…',
      loadFailed: 'No se ha podido cargar. Cierra y vuelve a intentarlo.',
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
