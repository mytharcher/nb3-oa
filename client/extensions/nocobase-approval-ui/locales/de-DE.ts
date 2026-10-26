const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'für {{name}}',
      showEvents: 'Änderungen ({{count}})',
      system: '{{count}} Systemaktualisierungen',
      empty: 'Noch keine Ereignisse.',
    },
    progress: {
      empty: 'Noch keine Genehmigung gestartet.',
      copies: 'Kopie an',
      read: 'gelesen',
      unread: 'ungelesen',
      step: {
        current: 'in Bearbeitung',
        rejected: 'abgelehnt',
        returned: 'zurückgegeben',
        ended: 'beendet',
        skipped: 'übersprungen',
      },
      tally: {
        answered: '{{count}} von {{total}} beantwortet',
        needed: '{{count}} für die Genehmigung erforderlich',
      },
    },
    branches: {
      done: '{{count}} von {{total}} abgeschlossen',
      blocked: 'Verzögert den Antrag',
    },
    receipts: {
      read: 'Lesen',
      confirmed: 'Bestätigt',
      empty: 'Noch niemand hat ihn erhalten.',
    },
    preview: {
      title: 'Wer entscheidet',
      loading: 'Genehmigungsweg wird ermittelt…',
      submit: 'Einreichen',
      finished: 'Entschieden',
      automatic: 'Ohne Entscheidung genehmigt',
      parallel: 'Parallel',
      optional: 'Optional',
      nobody: 'Noch keine geeignete Person',
      none: 'Über diesen Antrag wird ohne Genehmigung entschieden.',
      skipped: 'Nicht erforderlich: {{stages}}',
    },
    actions: {
      more: 'Mehr',
      all: 'Aktionen',
      admin: 'Verwaltung',
      confirm: '{{action}}?',
      loading: 'Wird geladen…',
      loadFailed:
        'Dies konnte nicht geladen werden. Schließen Sie die Ansicht und versuchen Sie es erneut.',
      cancel: 'Abbrechen',
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
