/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Sumber tugas',
      search: 'Cari jenis tugas',
      noMatches: 'Tidak ada jenis tugas yang cocok',
      clearSearch: 'Hapus pencarian',
      expand: 'Perluas {{name}}',
      collapse: 'Ciutkan {{name}}',
      subjects: 'Jenis tugas {{name}}',
      pending: '{{count}} perlu dikerjakan',
    },
    tabs: {
      pending: 'Perlu dikerjakan',
      closed: 'Selesai',
      all: 'Semua',
    },
    groups: {
      today: 'Hari ini',
      yesterday: 'Kemarin',
      earlier: 'Sebelumnya',
    },
    time: {
      received: '{{time}}',
      closed: 'Ditutup {{time}}',
    },
    selection: {
      select: 'Pilih "{{name}}"',
      lockedTask:
        '"{{name}}" tidak tersedia: {{type}} dipilih, dan hanya tugas satu jenis yang dapat dipilih bersama',
      otherType:
        '{{type}} dipilih; hanya tugas satu jenis yang dapat dipilih bersama',
      unsupportedTask: '"{{name}}" tidak memiliki tindakan massal',
      unsupported: 'Tugas jenis ini ditangani satu per satu',
    },
    bulk: {
      label: 'Tindakan massal',
      selected: '{{count}} dipilih',
      clear: 'Hapus pilihan',
      cancel: 'Batal',
      skipped:
        '{{count}} tugas terpilih lainnya tidak mendukungnya dan tetap seperti semula.',
    },
    empty: {
      pending: {
        title: 'Semua sudah beres',
        description: 'Tidak ada yang menunggu Anda di sini.',
      },
      closed: {
        title: 'Belum ada yang selesai',
        description:
          'Tugas yang Anda selesaikan atau yang dibatalkan muncul di sini.',
      },
      all: {
        title: 'Tidak ada tugas',
        description: 'Tugas jenis ini muncul di sini saat sampai kepada Anda.',
      },
      showAll: 'Tampilkan semua',
    },
    loading: 'Memuat tugas',
    pagination: {
      label: 'Halaman',
      summary: 'Halaman {{page}} dari {{pages}}, {{total}} tugas',
      previous: 'Sebelumnya',
      next: 'Berikutnya',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of task-center-ui has. */
export type TaskCenterUiLocale = Widen<typeof enUS>;

const locale: TaskCenterUiLocale = enUS;

export default locale;
