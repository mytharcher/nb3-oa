import optionMessages from './options/id-ID.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  navigation: {
    authorization: 'Otorisasi',
    permissionSets: 'Kumpulan Izin',
    inspector: 'Pemeriksa Izin',
  },
  feedback: {
    saved: '"{{name}}" disimpan',
    deleted: '"{{name}}" dihapus',
    assigned: 'Izin dari "{{name}}" diberikan',
    revoked: 'Izin dari "{{name}}" dicabut',
  },
  common: {
    actionsFor: 'Tindakan untuk "{{name}}"',
    clearFilters: 'Hapus filter',
    all: 'Semua',
    allFields: 'Semua bidang',
    cancel: 'Batal',
    close: 'Tutup',
    delete: 'Hapus',
    edit: 'Edit',
    key: 'Kunci',
    keyHint: 'Pengenal tetap yang digunakan API.',
    loading: 'Memuat…',
    noFields: 'Tidak ada bidang',
    remove: 'Hapus',
    removeNamed: 'Hapus {{label}}',
    resource: 'Sumber daya',
    retry: 'Coba lagi',
    ruleSections: 'Bagian aturan',
    search: 'Cari',
    selectNamed: 'Pilih {{label}}',
    signedInUsers: 'Semua pengguna yang masuk',
    type: 'Jenis',
    view: 'Lihat',
  },
  page: {
    loadFailed: 'Halaman ini tidak dapat dimuat.',
  },
  pagination: {
    navLabel: 'Paginasi {{label}}',
    next: 'Halaman berikutnya',
    page: 'Halaman {{number}}',
    previous: 'Halaman sebelumnya',
    range: '{{first}}–{{last}} dari {{total}}',
    empty: '0 dari 0',
  },
  filters: {
    clear: 'Hapus filter',
    clearSearch: 'Hapus {{label}}',
  },
  errors: {
    requestFailed: 'Permintaan otorisasi gagal.',
    lastAssignment:
      'Kumpulan izin ini harus tetap memiliki penerima aktif. Berikan ke akun lain yang aktif sebelum menghapus penetapan ini.',
    protectedSet:
      'Kumpulan izin ini dikelola oleh aplikasi dan tidak dapat diubah di sini.',
    subjectNotAllowed:
      'Kumpulan izin ini tidak mendukung jenis subjek yang dipilih. Pilih jenis yang diizinkan aplikasi.',
    completePermissions: 'Lengkapi setiap izin sebelum menyimpan.',
    completeRule: 'Lengkapi aturan sebelum menyimpan.',
    selectAnAction: 'Pilih setidaknya satu tindakan.',
  },
  marks: {
    labels: {
      all: 'Akses penuh',
      scoped: 'Akses terbatas',
      none: 'Tanpa akses',
      bypass: 'Tanpa batasan',
    },
    descriptions: {
      all: 'Akses penuh',
      scoped: 'Akses terbatas',
      none: 'Tanpa akses',
      bypass: 'Tanpa batasan: pemberian izin tidak diperiksa',
    },
  },
  filterEditor: {
    logic: 'Logika grup',
    all: 'Semua kondisi (AND)',
    any: 'Salah satu kondisi (OR)',
    addGroup: 'Tambah grup',
    removeGroup: 'Hapus grup',
    valueType: 'Jenis nilai',
    text: 'Teks',
    number: 'Angka',
    boolean: 'Boolean',
    unsupported:
      'Kondisi ini dipertahankan tetapi tidak dapat diedit secara visual.',
    invalid:
      'Tidak ditemukan simpul filter yang dapat diedit. Memulai ulang akan mengganti filter yang ada.',
    start: 'Atur kondisi',
  },
  filterOperators: {
    $includes: 'Mengandung',
    $notIncludes: 'Tidak mengandung',
    $startsWith: 'Diawali dengan',
    $endsWith: 'Diakhiri dengan',
    $empty: 'Kosong',
    $notEmpty: 'Tidak kosong',
    $isTruly: 'Benar',
    $isFalsy: 'Salah',

    $eq: 'Sama dengan',
    $ne: 'Tidak sama dengan',
    $in: 'Termasuk dalam',
    $notIn: 'Tidak termasuk dalam',
    $gt: 'Lebih besar dari',
    $gte: 'Setidaknya',
    $lt: 'Kurang dari',
    $lte: 'Paling banyak',
  },
  labels: {
    allRecords: 'Semua rekaman',
    selectedRecords: '{{count}} rekaman dipilih',
    unknownScope: 'Cakupan tidak dikenal',
    actionScope: '{{action}}: {{scope}}',
  },
  subjects: {
    matchAny: 'Berlaku ketika salah satu subjek yang dipilih cocok.',
    search: 'Cari subjek',
    empty: 'Tidak ada subjek yang cocok',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    selected: 'Subjek yang dipilih · {{count}}',
    unresolved: '{{id}} (belum terselesaikan)',
    none: 'Belum ada subjek yang dipilih',
  },
  editors: {
    resourceGroup: 'Grup sumber daya',
    actions: 'Tindakan',
    addCondition: 'Tambah kondisi',
    assignments: 'Penetapan',
    assignmentsSelected: {
      one: '{{count}} penetapan dipilih',
      other: '{{count}} penetapan dipilih',
    },
    audienceHint: 'Berlaku bagi setiap pengguna dengan sesi masuk yang valid.',
    filterConditions: 'Kondisi filter',
    records: 'Rekaman',
    recordsSelected: {
      one: '{{count}} rekaman dipilih',
      other: '{{count}} rekaman dipilih',
    },
    recordAccessPolicy: 'Kebijakan Akses Rekaman',
    recordScope: 'Cakupan rekaman',
    resource: 'Sumber daya',
    resourceType: 'Jenis sumber daya',
    searchPeople: 'Cari orang',
    searchPeoplePlaceholder: 'Cari nama, nama pengguna, atau email',
    searchRecords: 'Cari rekaman',
    selectUser: 'Pilih pengguna',
    specificRecordIds: 'ID rekaman tertentu',
    specificUser: 'Pengguna tertentu',
    user: 'Pengguna',
    who: 'Siapa',
  },
  permissionWorkspace: {
    businessModules: 'Modul bisnis',
    allModules: 'Semua',
    otherModules: 'Lainnya',
    clearFilters: 'Hapus filter',
    noModuleMatches: 'Tidak ada izin yang cocok dalam modul ini',
    moduleCount:
      '{{module}}: {{configured}} dikonfigurasi / {{total}} sumber daya',

    pageAccessHint:
      'Akses halaman mengatur akses masuk. Izin bisnis mengatur operasi data.',
    specifyScope: 'Tentukan cakupan: {{scope}}',
    inheritScope:
      'Jika tidak ditentukan, cakupan default, aturan berbagi, dan aturan pembatasan yang dikonfigurasi tetap berlaku.',
    configurePermission: 'Konfigurasi izin',
    noOperationGrant:
      'Kumpulan izin ini tidak memberikan operasi ini. Pilih Konfigurasi izin untuk mengatur cakupan datanya.',
    features: 'Izin fitur',
    dataScope: 'Cakupan data',
    dataScopeHelp:
      'Memfilter izin dari kumpulan izin ini, termasuk rekaman bersama. Tanpa pembatasan, tidak ada filter tambahan dan tidak ada akses rekaman yang diberikan.',
    appliesTo: 'Berlaku untuk',
    moduleGranted: 'Akses penuh',
    modulePartial: 'Akses terbatas',
    moduleNotGranted: 'Tanpa akses',

    selectAll: 'Pilih semua',
    selectFiltered: 'Pilih sumber daya yang cocok',
    selectGroup: 'Pilih semua di {{group}}',

    expandSets: 'Perluas kumpulan izin',
    collapseSets: 'Ciutkan kumpulan izin',
    userAssignments: 'Penerima',
    chooseSet: 'Pilih atau buat kumpulan izin.',
    clickScope: 'Klik ikon cakupan untuk mengubah akses.',
    mode: { none: 'Tanpa akses', all: 'Akses penuh', custom: 'Cakupan khusus' },
    unavailableSet:
      'Kumpulan izin ini tidak ditemukan atau tidak dapat diedit.',
    description:
      'Konfigurasi sumber daya dalam kumpulan izin ini. Perubahan berlaku setelah disimpan.',
    sections: 'Bagian kumpulan izin',
    permissions: 'Izin',
    details: 'Informasi dasar',
    unsaved: 'Perubahan belum disimpan',
    showMore: 'Tampilkan lainnya',
    development: {
      pages:
        'Belum ada halaman yang memerlukan otorisasi. Minta AI menambahkan izin akses halaman untuk halaman bisnis Anda, lalu konfigurasikan di sini.',
      business:
        'Belum ada izin bisnis yang ditentukan. Minta AI merancang operasi, bidang, dan cakupan rekaman untuk bisnis Anda, lalu konfigurasikan di sini.',
    },
    configuredOnly: 'Hanya sumber daya yang dikonfigurasi',
    configured: 'Dikonfigurasi dalam kumpulan ini',
    backResources: 'Kembali ke sumber daya',
    discardTitle: 'Buang perubahan yang belum disimpan?',
    discard: 'Buang perubahan',
    discardBody: 'Perubahan izin Anda belum disimpan.',
    configureScope: 'Konfigurasi cakupan rekaman',
  },
  databasePolicy: {
    addCondition: 'Tambah kondisi',
    filterField: 'Bidang filter',
    filterOperator: 'Operator filter',
    filterValue: 'Nilai filter',
    removeCondition: 'Hapus kondisi',
    conditionRequired: 'Tambahkan setidaknya satu kondisi.',
  },
  inspector: {
    summary: {
      all: 'Operasi ini diizinkan.',
      scoped:
        'Operasi ini diizinkan hanya dalam batas rekaman dan bidang yang berlaku.',
      none: 'Operasi ini tidak diizinkan. Pemberian akses rekaman saja tidak memberikan izin operasi.',
      error: 'Pemeriksaan tidak dapat diselesaikan. Ini bukan penolakan izin.',
      context: 'Pilih pengguna tertentu untuk mengevaluasi cakupan ini.',
    },
    dataAccess: 'Data yang dapat diakses',
    subjectHint: '“Saya” merujuk pada orang yang sedang diperiksa.',
    scopeAndFields: 'Lihat kondisi dan bidang yang berlaku',
    technicalHint:
      'Hasil otorisasi mentah untuk pemecahan masalah, termasuk pemeriksaan halaman dan tabel yang mendasarinya.',
    selectedRecords: '{{count}} rekaman dipilih',
    databaseActions: {
      read: 'Baca',
      create: 'Buat',
      update: 'Perbarui',
      delete: 'Hapus',
    },

    subjectType: 'Jenis subjek',
    subject: 'Subjek',
    selectSubject: 'Pilih subjek',
    searchSubjects: 'Cari subjek',
    inheritsFrom: 'Diwarisi dari:',
    grantedVia: 'melalui {{label}}',
    grantedDirectly: 'ditetapkan langsung',
    inheritedSubject: '{{name}} ({{type}})',
    listSeparator: ', ',
    noRegisteredResources:
      'Belum ada sumber daya yang terdaftar untuk jenis ini.',
    status: {
      context: 'Konteks pengguna diperlukan',
      all: 'Diizinkan',
      scoped: 'Diizinkan dengan batasan',
      none: 'Tidak diizinkan',
      error: 'Pemeriksaan gagal',
    },
    reasonCodes: {
      NO_MATCHING_GRANT: 'Tidak ada yang memberikan izin operasi ini',
      RESOURCE_ACTION_NOT_SUPPORTED:
        'Sumber daya ini tidak menyediakan operasi ini',
      USER_CONTEXT_REQUIRED:
        'Cakupan ini bergantung pada pengguna tertentu dan tidak dapat ditentukan hanya dari subjek ini.',
      GRANT_MATCHED: 'Operasi ini diizinkan',
      SELECTION_EXPANDED: 'Memperluas rekaman yang dapat diakses',
      SELECTION_RESTRICTED: 'Membatasi rekaman yang dapat diakses',
      NO_OBJECT_PERMISSION: 'Operasi ini belum diizinkan',
      NO_RECORD_ACCESS: 'Tidak ada cakupan rekaman yang dapat diakses',
      EMPTY_RECORD_ACCESS:
        'Cakupan rekaman tidak cocok dengan rekaman mana pun',
      UNRESTRICTED_ACCESS: 'Akses tanpa batasan',
    },
    inputFields: 'Bidang yang dapat ditulis',
    outputFields: 'Bidang yang dikembalikan',
    allFields: 'Semua bidang',

    refresh: 'Muat ulang',
    failed: 'Pemeriksaan gagal',
    noResources: 'Tidak ada sumber daya yang cocok',
    recordScope: 'Cakupan rekaman efektif',
    fields: 'Bidang yang diizinkan',
    fieldSearch: 'Cari bidang',
    technicalDetails: 'Detail teknis',
    allConditions: 'Cocokkan semua kondisi',
    anyCondition: 'Cocokkan salah satu kondisi',

    page: {
      title: 'Pemeriksa Izin',
      description:
        'Lihat akses yang diberikan kepada subjek otorisasi dan periksa alasannya.',
    },
    person: 'Orang',
    selectPerson: 'Pilih orang',
    searchPeople: 'Cari orang',
    searchPeoplePlaceholder: 'Cari nama, nama pengguna, atau email',
    action: 'Tindakan',
    selectAction: 'Pilih tindakan',
    inspect: 'Periksa',
    inspecting: 'Memeriksa…',
    empty: 'Pilih subjek otorisasi untuk melihat izin sumber dayanya.',
    decision: 'Keputusan',
    effects: {
      permit: 'Diizinkan',
      deny: 'Ditolak',
      conditional: 'Diizinkan dengan kondisi',
    },
    reasons: 'Alasan',
    noReasons: 'Keputusan ini tidak menyertakan alasan.',
    reasonFrom: 'Dari {{plugin}}',
    reasonFromCore: 'Dari inti otorisasi',
    conditions: 'Kondisi',
    conditionsHint:
      'Keputusan hanya berlaku pada data yang dipilih kondisi ini, ditampilkan sebagaimana dikembalikan oleh inti.',
  },
  permissionSets: {
    builtIn: { root: 'Administrator sistem', member: 'Anggota' },
    page: {
      title: 'Kumpulan Izin',
      description:
        'Kumpulan izin memberikan akses: kelompokkan sumber daya dan tindakan yang dibutuhkan pengguna, lalu tetapkan kepada mereka.',
    },
    unknownPage: 'Halaman tidak dikenal',
    assignmentCount: {
      one: '{{count}} penetapan',
      other: '{{count}} penetapan',
    },
    list: {
      search: 'Cari berdasarkan nama atau kunci kumpulan izin',
      create: 'Kumpulan izin baru',
      nameHeader: 'Kumpulan izin',
      system: 'Sistem',
      custom: 'Khusus',
      emptyNone:
        'Belum ada kumpulan izin. Buat untuk mengelompokkan sumber daya dan tindakan yang dibutuhkan pengguna.',
      emptySearch: 'Tidak ada kumpulan izin yang cocok dengan pencarian Anda.',
      pagerLabel: 'Kumpulan izin',
    },
    detail: {
      untitled: 'Kumpulan izin baru',
      unrestrictedTitle: 'Kumpulan izin ini memberikan akses tanpa batasan.',
      unrestrictedBody:
        'Kumpulan ini memberikan akses tanpa batasan yang tidak dipengaruhi kumpulan izin lain, aturan berbagi, atau aturan pembatasan. Tidak perlu mengonfigurasi izin satu per satu. Kelola penetapannya di Penerima.',
      confirmDeleteTitle: 'Hapus kumpulan izin "{{title}}"?',
      confirmDeleteBody:
        'Hapus “{{title}}” beserta penetapannya. Kumpulan izin dan aturan lainnya tetap berlaku.',
      confirmDelete: 'Hapus',
    },
    assignments: {
      search: 'Cari penetapan',
      searchPlaceholder: 'Cari nama atau ID subjek',
      kindLabel: 'Jenis penetapan',
      kindAll: 'Semua penetapan',
      kindUsers: 'Pengguna',
      kindAudiences: 'Audiens',
      revokeSelected: 'Cabut yang dipilih ({{count}})',
      add: 'Tambah penetapan',
      assignedTo: 'Ditetapkan kepada',
      subjectType: 'Jenis subjek',
      selectAllVisible: 'Pilih semua penetapan yang terlihat',
      audience: 'Audiens',
      user: 'Pengguna',
      revoke: 'Cabut',
      emptyNone:
        'Belum ada penetapan. Tambahkan untuk memberikan kumpulan izin ini kepada seseorang.',
      emptyFiltered: 'Tidak ada penetapan yang cocok dengan filter ini.',
      pagerLabel: 'Penetapan',
      confirmRevokeTitleOne: 'Cabut penetapan untuk "{{name}}"?',
      confirmRevokeTitleMany: 'Cabut penetapan untuk "{{name}}"?',
      confirmRevokeBody:
        '{{label}} tidak lagi memiliki kumpulan izin ini. Penetapan lain tetap berlaku, dan kumpulan ini dapat ditetapkan kembali.',
      confirmRevoke: 'Cabut',
      pickerDescription: 'Pilih subjek yang akan menerima kumpulan izin ini.',
      audienceDescription:
        'Semua orang dengan sesi valid. Ini dikelola secara terpisah dari pengguna individual.',
      usersHeading: 'Pengguna',
      usersHint: 'Pengguna yang sudah ditetapkan disembunyikan.',
      selectedCount: '{{count}} dipilih',
      selectAllResults: 'Pilih semua hasil',
      userCount: '{{count}} pengguna',
      noAvailableUsers:
        'Tidak ada pengguna tersedia yang cocok dengan pencarian Anda.',
      assigning: 'Menetapkan…',
    },
    editor: {
      nameRequired: 'Masukkan nama kumpulan izin.',
      keyRequired: 'Masukkan kunci kumpulan izin.',
      resourceRequired: 'Pilih sumber daya untuk izin ini.',
      actionsRequired: 'Pilih setidaknya satu tindakan untuk sumber daya ini.',
      editTitle: 'Edit kumpulan izin',
      newTitle: 'Kumpulan izin baru',
      description:
        'Gabungkan akses menjadi penetapan yang dapat digunakan kembali.',
      name: 'Nama',
      permissions: 'Izin',
      permissionsHint:
        'Pilih sumber daya dan tindakan yang diberikan kumpulan ini.',
      addPermission: 'Tambah izin',
      searchResources: 'Cari sumber daya atau tindakan',
      resourceTypeLabel: 'Jenis sumber daya izin',
      allResourceTypes: 'Semua jenis sumber daya',
      visibleCount: '{{visible}} dari {{total}} sumber daya',
      noActions: 'Tidak ada tindakan',
      unknownPageNotice:
        'Tidak ada lagi rute yang mendeklarasikan halaman ini, sehingga izin ini tidak memberikan akses apa pun. Halaman telah diganti nama atau dihapus — hapus izinnya atau tambahkan izin untuk halaman penggantinya.',
      emptyFiltered: 'Tidak ada izin yang cocok dengan filter ini.',
      addFirst: 'Tambah izin pertama',
      addFirstHint:
        'Pilih sumber daya berdasarkan jenis, lalu konfigurasikan tindakannya.',
      saving: 'Menyimpan…',
      save: 'Simpan kumpulan izin',
      confirmRemoveTitle: 'Hapus izin ini?',
      confirmRemoveBody:
        '{{resource}} dan semua tindakan yang dikonfigurasi padanya dihapus dari kumpulan izin ini. Tindakan ini tidak dapat dibatalkan setelah kumpulan disimpan.',
      confirmRemove: 'Hapus izin',
      thisResource: 'Sumber daya ini',
    },
    picker: {
      title: 'Tambah izin',
      description:
        'Pilih sumber daya dan konfigurasikan aksesnya dalam satu ruang kerja.',
      resourceTypes: 'Jenis sumber daya',
      resources: 'Sumber daya',
      selectResourceHint: 'Pilih sumber daya untuk mengonfigurasikannya.',
      searchResources: 'Cari sumber daya',
      added: 'Ditambahkan',
      noResources: 'Tidak ada sumber daya yang cocok dengan pencarian Anda.',
      emptyTitle: 'Pilih sumber daya untuk dikonfigurasi',
      emptyHint:
        'Tindakan dan pengaturan akses khusus sumber daya akan muncul di sini.',
      readyCount: {
        one: '{{count}} sumber daya siap ditambahkan',
        other: '{{count}} sumber daya siap ditambahkan',
      },
      incomplete: ' · Pilih setidaknya satu tindakan untuk setiap sumber daya',
      add: 'Tambah izin',
    },
  },
  ruleWorkspace: {
    unset: 'Belum diatur',
    unsetHint: 'Tidak ada cakupan rekaman tambahan untuk tindakan ini.',
    clearDefaults: 'Hapus konfigurasi default',
    setDefault: 'Atur cakupan default',
  },
};

const enUS: typeof messages & typeof optionMessages = {
  ...messages,
  ...optionMessages,
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type AuthorizationResource = LocaleResource<typeof enUS>;

export default enUS;
