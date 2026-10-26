const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'untuk {{name}}',
      showEvents: 'Yang berubah ({{count}})',
      system: '{{count}} pembaruan sistem',
      empty: 'Belum ada yang terjadi.',
    },
    progress: {
      empty: 'Belum ada persetujuan dimulai.',
      copies: 'Ditembuskan kepada',
      read: 'dibaca',
      unread: 'belum dibaca',
      step: {
        current: 'sedang berlangsung',
        rejected: 'ditolak',
        returned: 'dikembalikan',
        ended: 'berakhir',
        skipped: 'dilewati',
      },
      tally: {
        answered: '{{count}} dari {{total}} ditanggapi',
        needed: '{{count}} diperlukan untuk lolos',
      },
    },
    branches: {
      done: '{{count}} dari {{total}} selesai',
      blocked: 'Menahan kelanjutan permintaan',
    },
    receipts: {
      read: 'Baca',
      confirmed: 'Dikonfirmasi',
      empty: 'Belum ada yang menerimanya.',
    },
    preview: {
      title: 'Yang akan memutuskan',
      loading: 'Menghitung rute…',
      submit: 'Ajukan',
      finished: 'Diputuskan',
      automatic: 'Disetujui tanpa keputusan',
      parallel: 'Secara paralel',
      optional: 'Opsional',
      nobody: 'Belum ada yang memenuhi syarat',
      none: 'Permintaan ini diputuskan tanpa persetujuan.',
      skipped: 'Tidak diperlukan: {{stages}}',
    },
    actions: {
      more: 'Lainnya',
      all: 'Tindakan',
      admin: 'Administrasi',
      confirm: '{{action}}?',
      loading: 'Memuat…',
      loadFailed: 'Ini tidak dapat dimuat. Tutup dan coba lagi.',
      cancel: 'Batal',
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
