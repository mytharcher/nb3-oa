const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'pour {{name}}',
      showEvents: 'Modifications ({{count}})',
      system: '{{count}} mises à jour système',
      empty: 'Aucun événement pour le moment.',
    },
    progress: {
      empty: 'Aucune approbation n’a encore commencé.',
      copies: 'En copie à',
      read: 'lu',
      unread: 'non lu',
      step: {
        current: 'en cours',
        rejected: 'rejeté',
        returned: 'renvoyé',
        ended: 'terminé',
        skipped: 'ignoré',
      },
      tally: {
        answered: '{{count}} réponses sur {{total}}',
        needed: '{{count}} requis pour approuver',
      },
    },
    branches: {
      done: '{{count}} terminés sur {{total}}',
      blocked: 'Bloque la demande',
    },
    receipts: {
      read: 'Lire',
      confirmed: 'Confirmé',
      empty: 'Personne ne l’a encore reçue.',
    },
    preview: {
      title: 'Qui décidera',
      loading: 'Calcul du circuit…',
      submit: 'Soumettre',
      finished: 'Décidé',
      automatic: 'Approuvé sans décision',
      parallel: 'En parallèle',
      optional: 'Facultatif',
      nobody: 'Aucune personne admissible pour le moment',
      none: 'Cette demande est décidée sans approbation.',
      skipped: 'Non nécessaire : {{stages}}',
    },
    actions: {
      more: 'Plus',
      all: 'Actions',
      admin: 'Administration',
      confirm: '{{action}} ?',
      loading: 'Chargement…',
      loadFailed: 'Impossible de charger. Fermez et réessayez.',
      cancel: 'Annuler',
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
