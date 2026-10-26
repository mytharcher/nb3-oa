export default {
  access: {
    guide: {
      title: 'Cara kerja peran dan izin',
      roles:
        'Konfigurasikan operasi berdasarkan departemen, jabatan, atau tanggung jawab di sini. Anggota menerima izin ini bersama penetapan langsung mereka.',
      setsTitle: 'Kumpulan izin',
      sets: 'Pemberian izin tersimpan yang mendasari peran, tersedia untuk diperiksa dan digunakan kembali. Gunakan halaman peran untuk perubahan sehari-hari.',
      defaultTitle: 'Akses rekaman default',
      default:
        'Menyediakan cakupan dasar ketika operasi tidak memiliki cakupan tertentu. Ini tidak memberikan izin operasi itu sendiri.',
      sharingTitle: 'Aturan berbagi',
      sharing:
        'Memperluas rekaman yang tersedia bagi orang yang sudah memiliki izin operasi.',
      restrictionTitle: 'Aturan pembatasan',
      restriction: 'Membatasi lebih lanjut rekaman berizin yang dapat diakses.',
      inspectTitle: 'Pemeriksa izin',
      inspect:
        'Periksa izin efektif dan sumbernya ketika halaman atau rekaman tidak tersedia.',
    },
    permissionColumn: 'Izin',
    personalGranted: 'Diberikan secara pribadi',
    personalTarget: 'Pilih tujuan pemberian izin pribadi',
    rowSaving: 'Menyimpan…',
    rowSaved: 'Disimpan',
    rowFailed:
      'Perubahan tidak disimpan. Konfigurasi saat ini telah dipulihkan; periksa dan coba lagi.',
    rowUncertain:
      'Hasil penyimpanan tidak dapat dikonfirmasi. Muat ulang sebelum melakukan perubahan lebih lanjut.',
    inlinePermissionsHelp:
      'Perubahan langsung disimpan. Izin pribadi menambah akses warisan; menonaktifkannya tidak menghapus izin warisan.',
    configuredOnly: 'Hanya izin yang dikonfigurasi',

    personalGrantEnabled: 'Berikan operasi ini secara pribadi',
    systemScope: 'Gunakan aturan sistem',
    systemScopeHelp:
      'Cakupan yang tidak ditentukan mengikuti aturan akses default dan berbagi. Ini tidak berarti semua rekaman.',
    grantSources: 'Diberikan oleh',
    scopeForAction: '{{action}}: cakupan {{scope}}',
    personalGrantAction: 'Berikan “{{action}}” secara pribadi',
    personalGrantScope:
      'Berikan “{{action}}” secara pribadi. Cakupan data: {{scope}}',
    personalGrantOff: 'Tidak ada izin pribadi; izin warisan tetap berlaku.',
    personalGrantPending: 'Perubahan belum disimpan. Berlaku setelah disimpan.',
    editPersonalCard: 'Edit izin pribadi untuk {{name}}',
    userPermissions: 'Izin',
    inheritedPermissions: 'Izin warisan',
    inheritedUnavailable: 'Anda tidak memiliki akses ke izin warisan.',
    personalOnly: 'Hanya pengecualian pribadi',
    notGranted: 'Tidak diberikan',
    notSet: 'Belum diatur',
    adjustPersonalPermissions: 'Sesuaikan izin pribadi',
    unifiedPermissionsHelp:
      'Izin yang dikonfigurasi berdasarkan sumber. Perubahan pribadi tidak menghapus izin warisan; akses aktual juga mengikuti pembatasan yang berlaku.',
    sourceGroups: {
      baseline: 'Akses dasar semua orang',
      duties: 'Peran fungsional',
      organization: 'Hubungan organisasi',
      direct: 'Izin pribadi',
      system: 'Administrator sistem',
    },
    noPersonalExceptions: 'Tidak ada pengecualian pribadi',
    membershipChanged:
      'Keanggotaan berubah pada operasi lain. Kondisi saat ini telah dimuat ulang; konfirmasi perubahan yang tersisa.',
    username: 'Nama pengguna',
    personalExceptions: 'Pengecualian pribadi',
    adjustExceptions: 'Sesuaikan pengecualian pribadi',
    exceptionsHelp:
      'Hanya izin yang diberikan langsung kepada orang ini yang diubah. Izin peran atau organisasi dapat tetap berlaku setelah penghapusan.',
    editDenied:
      'Anda tidak dapat mengedit konfigurasi ini. Menampilkan tampilan hanya baca.',
    permissionSources: 'Sumber izin',
    frozenConfiguration:
      'Akun ini dibekukan. Konfigurasi otorisasi dipertahankan dan berlaku mengikuti aturan saat akun diaktifkan.',
    frozenRoles:
      'Akun ini dibekukan. Aktifkan sebelum menambahkan peran fungsional; peran yang ada dapat dihapus.',
    roleInactive: 'Tidak aktif',
    roleAdditionBlocked:
      'Akun dibekukan atau peran yang dipilih tidak aktif atau tidak tersedia. Batalkan penambahan ini, atau muat ulang kondisi sebelum mengonfirmasi.',
    membershipUnverified:
      'Hasil belum diverifikasi. Muat ulang keanggotaan sebelum melanjutkan; jangan ulangi pengiriman.',
    dutyRolesHelp:
      'Peran fungsional yang ditetapkan langsung kepada orang ini muncul di sini.',
    noPrimaryDepartment: 'Tidak ada departemen utama saat ini',
    primaryDepartment: 'Departemen utama',
    departmentPath: 'Jalur departemen',
    organizationHelp:
      'Keanggotaan organisasi dikelola oleh administrator organisasi.',
    roleFilterInvalid:
      'Peran fungsional ini tidak tersedia. Filter peran telah dihapus.',
    roleFilterTooLarge:
      'Peran ini memiliki lebih dari 500 anggota. Pemfilteran menurut peran ini tidak didukung; hapus filter peran.',
    organizationState: {
      'inactive-chain':
        'Departemen utama atau induknya tidak aktif. Hubungan organisasi ini saat ini tidak berlaku.',
      'invalid-chain':
        'Hubungan organisasi ini tidak valid. Hubungi administrator organisasi.',
    },

    scopeNumber: 'Cakupan rekaman {{number}}',
    scopeLabels: {
      paymentRequests: 'Permintaan pembayaran',
      reimbursementRequests: 'Permintaan penggantian biaya',
      leaveRequests: 'Permintaan cuti',
      contractRequests: 'Permintaan persetujuan kontrak',
      certificateRequests: 'Permintaan sertifikat',
      sealRequests: 'Permintaan stempel',
      printTemplates: 'Templat',
      printTemplateRevisions: 'Versi templat',
      knowledgeDocuments: 'Dokumen',
      knowledgeVersions: 'Versi dokumen',
      knowledgeFolders: 'Folder',
      sealLedger: 'Pendaftaran stempel',
      sealReceipts: 'Tanda terima stempel',
      contracts: 'Kontrak',
      contractVersions: 'Versi kontrak',
      contractChanges: 'Perubahan kontrak',
      contractPayments: 'Pembayaran kontrak',
    },
    sourceNumber: 'Sumber {{number}}',
    more: 'Lainnya',
    userRoles: 'Peran',
    permissionOverview: 'Ringkasan izin',
    noRoles: 'Tidak ada',
    organization: 'Organisasi',
    moreFor: 'Lainnya · {{name}}',
    addModules: 'Tambah modul',
    userDetails: 'Detail pengguna',
    information: 'Informasi',
    email: 'Email',
    accountStatus: 'Status akun',
    enabled: 'Aktif',
    disabled: 'Dibekukan',
    organizationReadOnly:
      'Departemen, jabatan, dan hubungan pelaporan dikelola di Organisasi.',
    advancedExceptions: 'Lanjutan: izin pengecualian',
    partialSave:
      '{{count}} perubahan disimpan. Perubahan yang tersisa dipertahankan; coba lagi untuk melanjutkan.',
    addedRoles: 'Tambah: {{names}}',
    removedRoles: 'Hapus: {{names}}',
    compareRole: 'Bandingkan peran',
    copyRole: 'Salin dari perbandingan',
    copyHelp:
      'Salin izin biasa ke draf ini. Kebijakan khusus tetap tidak berubah. Periksa semua perubahan sebelum menyimpan.',
    advanced: 'Lanjutan',
    addRoles: 'Tambah peran ke perbandingan',

    directAudience: 'Penetapan individual',
    dutyAudience: 'Anggota peran tanggung jawab',

    targetSet: 'Kumpulan izin tujuan',
    chooseTarget: 'Pilih kumpulan izin untuk operasi ini',
    targetRequired: 'Pilih tujuan untuk operasi baru ini sebelum menyimpan.',
    roleGrantTitle: '{{module}} ({{role}} · izin mandiri {{number}})',

    assignmentSearch: 'Cari izin, tindakan, atau cakupan rekaman',
    assignmentOnlySelected: 'Hanya yang dipilih',
    assignmentCount:
      'Menampilkan {{visible}} dari {{total}} · {{selected}} dipilih di seluruh modul',
    assignmentChoicesHelp:
      'Filter berdasarkan modul, lalu bandingkan tindakan dan cakupan rekaman. Kumpulan dengan nama yang sama tetap independen. Filter mempertahankan pilihan di modul lainnya.',
    assignmentBusiness: 'Operasi bisnis',
    assignmentOther: 'Administrasi / lainnya',
    pageAccess: 'Akses halaman',
    configuredGrant: 'Diberikan',
    dutyMembershipTitle:
      '{{action}} peran tanggung jawab "{{role}}" untuk "{{name}}"?',
    exceptionSummary: 'Izin pengecualian: {{names}}',
    noExceptions: 'Tidak ada',
    baseOnlyDepartment:
      'Akses departemen menjangkau anggota turunannya. Utamakan peran tanggung jawab untuk operasi spesialis.',

    adminMembersHelp:
      'Kelola administrator di akun pengguna. Pertahankan setidaknya satu administrator aktif.',
    openUsers: 'Lihat akun pengguna',
    ruleLinks: 'Aturan akses',
    rulesHelp:
      'Aturan akses default, berbagi, dan pembatasan tetap memengaruhi akses efektif.',
    defaultRules: 'Akses default',
    sharingRules: 'Aturan berbagi',
    restrictionRules: 'Aturan pembatasan',

    modules: 'Telusuri berdasarkan modul',
    onlyConfigured: 'Hanya yang dikonfigurasi',
    baselineValue: 'Semua orang memiliki akses dasar: {{value}}',
    advancedEdit: 'Editor lanjutan',
    changedCount: '{{count}} perubahan',
    roleImpact: 'Anggota "{{name}}" yang terdampak: {{count}}',
    sharedObjects: 'Kumpulan izin juga ditetapkan kepada: {{names}}',
    changeShared: 'Ubah semua subjek ini',
    splitDefault:
      'Secara default, pisahkan kumpulan bersama menjadi salinan independen untuk peran ini.',
    userPermissionsTitle: 'Izin untuk {{name}}',
    unionHelp:
      'Cakupan rekaman dari beberapa sumber digabungkan; aturan akses tetap berlaku.',
    assignedRoles: 'Peran yang ditetapkan',
    preferRoles:
      'Utamakan peran tanggung jawab; izin langsung digunakan untuk pengecualian.',
    exceptionGrant: 'Kelola izin pengecualian',
    configurationDenied:
      'Akses baca kumpulan izin diperlukan untuk melihat detail konfigurasi. Hubungi administrator.',
    checkOperation: 'Periksa operasi',
    notConfigured: 'Belum dikonfigurasi',
    applicable: 'Berlaku untuk',
    modulesCount: 'Modul yang dikonfigurasi',
    personalAudience: 'Penetapan langsung · {{count}} orang',
    maintainedAudience: 'Anggota yang dikelola · {{count}} orang',
    automaticAudience: 'Dihitung dari hubungan organisasi',
    departmentAudience: 'Anggota departemen dan turunannya',
    positionAudience: 'Orang yang menduduki jabatan ini',
    allAuthenticated: 'Semua orang yang masuk',
    organizationMembersHelp:
      'Anggota dikelola dalam organisasi dan dihitung dari hubungan aktif.',
    openOrganization: 'Lihat organisasi',
    adjustDutyRoles: 'Sesuaikan peran tanggung jawab',
    membersUnknown: 'Jumlah anggota tidak tersedia',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Hapus filter',
    noModuleMatches: 'Tidak ada izin yang cocok dalam modul ini',

    businessModules: 'Modul bisnis',
    allModules: 'Semua',
    otherModules: 'Lainnya',
    noModulePermissions: 'Tidak ada izin yang dikonfigurasi dalam modul ini',
    moduleCount:
      '{{module}}: {{configured}} dikonfigurasi / {{total}} sumber daya',

    actionsFor: 'Tindakan untuk "{{name}}"',
    configuredScopes: 'Cakupan yang dikonfigurasi',

    lastAdmin:
      'Setidaknya satu administrator sistem aktif harus dipertahankan. Tetapkan pengganti terlebih dahulu.',
    subjectNotAllowed:
      'Akses ini tidak dapat ditetapkan kepada jenis subjek ini. Pilih akses bisnis lain.',

    title: 'Pengelolaan akses',
    description:
      'Konfigurasikan operasi bisnis dan cakupan rekaman berdasarkan peran.',
    roles: 'Akses peran',
    baseline: 'Akses dasar pengguna yang masuk',
    baselineHelp:
      'Akses dasar berlaku untuk akun yang masuk. Keanggotaan tanggung jawab juga memengaruhi kandidat persetujuan.',
    name: 'Nama',
    type: 'Jenis',
    all: 'Semua jenis',
    dutyRoles: 'Peran fungsional',
    positions: 'Jabatan',
    departments: 'Departemen',
    automatic: 'Akses otomatis',
    members: 'Anggota',
    permissions: 'Izin bisnis',
    missingMembers: 'Belum ada anggota yang ditetapkan',
    memberDenied: 'Akses anggota tidak tersedia',
    membersFailed: 'Tidak dapat memuat anggota',
    byMembership: 'Diterapkan berdasarkan keanggotaan',
    none: 'Belum ada akses bisnis yang ditetapkan',
    noneHelp:
      'Tetapkan akses bisnis yang ada setelah mengonfirmasi tanggung jawab. Akses warisan tetap berlaku.',
    searchRoles: 'Cari peran, jabatan, atau departemen…',
    clear: 'Hapus filter',
    noResults: 'Tidak ada hasil yang cocok',
    clearHelp: 'Ubah pencarian Anda atau hapus filter.',
    loading: 'Memuat',
    refresh: 'Muat ulang',
    denied:
      'Anda tidak memiliki akses ke operasi ini. Hubungi administrator akses.',
    missing: 'Item ini tidak lagi ada. Kembali ke daftar.',
    conflict:
      'Konfigurasi akses berubah. Muat ulang dan periksa sebelum menyimpan.',
    failed:
      'Tidak dapat menyelesaikan operasi ini. Coba lagi atau hubungi administrator.',
    reload: 'Muat ulang',
    retry: 'Coba lagi',
    roleHelp:
      'Periksa anggota, operasi bisnis, dan cakupan rekaman untuk tanggung jawab ini.',
    rules:
      'Aturan akses tambahan mungkin berlaku. Periksa akses orang tersebut dan operasi bisnis aktualnya.',
    actions: 'Tindakan',
    addMember: 'Tambah anggota',
    remove: 'Hapus',
    memberImpact:
      'Keanggotaan tanggung jawab memengaruhi akses warisan dan kandidat persetujuan. Sumber akses lainnya tetap berlaku setelah penghapusan.',
    assign: 'Tetapkan akses bisnis',
    usedBy:
      'Akses ini ditetapkan kepada {{count}} subjek. Pengeditan memengaruhi semuanya.',
    edit: 'Edit',
    special: 'Konfigurasi khusus yang ada',
    specialReadOnly:
      'Konfigurasi khusus hanya dapat dibaca dan akan dipertahankan saat disimpan.',
    noScope: 'Belum ada cakupan rekaman yang dikonfigurasi',
    systemAdmin: 'Administrator sistem',
    unrestricted: 'Administrator sistem: akses tanpa batasan',
    removeTitle: 'Hapus anggota "{{name}}"?',
    cancel: 'Batal',
    removed: '"{{name}}" dihapus',
    added: '"{{name}}" ditambahkan',
    addMemberTitle: 'Tambah anggota {{name}}',
    add: 'Tambah',
    person: 'Orang',
    selectPerson: 'Pilih orang yang akan memegang tanggung jawab ini.',
    userDenied:
      'Anda tidak dapat melihat direktori pengguna. Hubungi administrator.',
    direct: 'Ditetapkan langsung',
    inherited: 'Akses warisan',
    personUnknown: 'Orang (nama tidak tersedia)',
    back: 'Kembali ke daftar',
    pageActionHelp:
      'Akses halaman mengatur menu dan akses masuk. Berikan setiap operasi bisnis beserta cakupan rekamannya secara terpisah; membuka halaman saja tidak memberikan izin tindakannya.',
    emptyDirectory: 'Tidak ada subjek tersedia',
    emptyHelp: 'Saat ini tidak ada rekaman tersedia dalam direktori ini.',
    deniedAction: 'Tidak diotorisasi',
    sensitive: 'Akses sensitif',
    impactUnavailable:
      'Dampak lengkap tidak dapat diverifikasi. Periksa subjek yang terdampak dan visibilitasnya sebelum mengubah akses bersama ini.',
    conditional: 'Akses bersyarat',
    permitted: 'Akses tanpa syarat',
    assignTitle: 'Ubah akses untuk "{{name}}"',
    assignHelp:
      'Pilih akses bisnis langsung subjek ini. Sumber lainnya dipertahankan.',
    noAssignable: 'Tidak ada akses bisnis yang dapat ditetapkan',
    preserveInherited:
      'Hanya penetapan langsung yang diubah di sini. Akses warisan dari departemen, jabatan, tanggung jawab, dan akses dasar tetap berlaku.',
    save: 'Simpan',
    saved: 'Akses untuk "{{name}}" disimpan',
    confirmTitle: 'Simpan perubahan akses untuk "{{name}}"?',
    assignmentImpact:
      'Periksa akses yang ditambahkan dan dihapus. Sumber lainnya tetap berlaku; administrator sistem harus tetap aktif.',
    discardTitle: 'Buang perubahan yang belum disimpan?',
    discard: 'Buang',
    discardHelp:
      'Perubahan Anda belum disimpan. Membuangnya akan menghapus perubahan tersebut.',
    editTitle: 'Edit akses bisnis untuk "{{name}}"',
    editorHelp:
      'Pilih operasi dan cakupan satu per satu. Operasi sensitif dipisahkan; periksa dampaknya sebelum menyimpan.',
    impact: 'Subjek yang terdampak',
    searchActions: 'Cari fitur atau operasi bisnis…',
    multipleScopes: 'Konfigurasikan setiap cakupan di bawah untuk operasi ini.',
    levelFor: 'Cakupan rekaman untuk "{{name}}"',
    protected: 'Akses ini dilindungi',
    protectedHelp:
      'Perlindungan sistem tetap berlaku. Kelola keanggotaan administrator melalui akun pengguna.',
    sharedHelp:
      'Perubahan ini memengaruhi setiap subjek yang tercantum di atas. Periksa operasi dan cakupannya.',
    system: 'Tanggung jawab sistem',
  },
};
