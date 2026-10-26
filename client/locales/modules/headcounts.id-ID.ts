export default {
  headcounts: {
    technicalDetails: 'Detail teknis',
    copyId: 'Salin ID internal',
    copyFailed: 'Tidak dapat menyalin ID internal.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Buat',
    idCopied: 'ID akun disalin',
    title: 'Buku besar jumlah karyawan',
    description:
      'Kapasitas tahunan dan pengisian karyawan aktual. Inisialisasikan akun sebelum rekrutmen.',
    account: 'Jumlah karyawan tahunan',
    state: 'Status inisialisasi',
    create: 'Jumlah karyawan tahunan baru',
    adjust: 'Sesuaikan batas',
    alreadyInitialized:
      'Akun ini sudah diinisialisasi. Pengisian aktualnya tidak dapat dihitung ulang di sini.',
    reconcile: 'Verifikasi dan inisialisasi',
    confirmInitialize: 'Konfirmasi inisialisasi',
    initialized: 'Diinisialisasi',
    uninitialized: 'Belum diinisialisasi',
    view: 'Lihat jumlah karyawan',
    refresh: 'Muat ulang',
    cancel: 'Batal',
    save: 'Simpan',
    clearFilters: 'Hapus filter',
    allPositions: 'Semua jabatan',
    rowActions: 'Tindakan untuk “{{name}}”',
    empty: 'Tidak ada jumlah karyawan tahunan',
    noResults: 'Tidak ada jumlah karyawan tahunan yang cocok',
    filterHelp: 'Ubah filter.',
    emptyManage: 'Buat akun dan verifikasi daftar karyawannya.',
    emptyRead: 'Minta SDM memasukkan jumlah karyawan tahunan.',
    journal: 'Jurnal sumber',
    noJournal: 'Belum ada kejadian sumber',
    noJournalPermission:
      'Anda tidak memiliki izin untuk membaca jurnal sumber.',
    uninitializedHelp:
      'Akun ini belum diinisialisasi dan tidak dapat digunakan untuk rekrutmen. Verifikasi daftar karyawan lengkap.',
    rosterHelp:
      'Verifikasi daftar karyawan lengkap, termasuk karyawan masa percobaan, tetap, dan yang akan berhenti.',
    rosterEmpty:
      'Saat ini tidak ada karyawan cocok yang mengisi akun ini. Konfirmasikan bahwa daftar aktual kosong.',
    rosterCount: '{{count}} karyawan',
    confirmRoster: 'Saya telah memverifikasi daftar karyawan lengkap',
    created: '"{{name}}" dibuat. Selanjutnya verifikasi dan inisialisasikan.',
    adjusted: 'Batas untuk "{{name}}" diperbarui.',
    reconciled: '"{{name}}" diinisialisasi untuk rekrutmen.',
    invalidYear: 'Masukkan tahun bilangan bulat antara 1900 dan 9999.',
    invalidLimit: 'Masukkan bilangan bulat antara 0 dan 1.000.000.',
    reasonRequired: 'Masukkan alasan antara 1 dan 5.000 karakter.',
    selectRequired: 'Pilih departemen dan jabatan yang saat ini diizinkan.',
    rosterConfirmationRequired:
      'Konfirmasikan bahwa Anda telah memverifikasi daftar lengkap.',
    noAccess: 'Anda tidak memiliki izin untuk membaca jumlah karyawan ini.',
    missing: 'Akun jumlah karyawan ini tidak ada atau tidak dapat diakses.',
    failed: 'Tidak dapat menyelesaikan permintaan. Coba lagi.',
    loadLatest: 'Muat data terbaru',
    unknownOutcome:
      'Hasil belum dikonfirmasi. Pertahankan perintah ini dan coba lagi.',
    retryCommand: 'Ulangi operasi ini',
    reduceTitle: 'Kurangi batas jumlah karyawan untuk “{{account}}”?',
    reduceDescription:
      'Batas akan berubah dari {{previous}} menjadi {{next}}. Pengisian dan pencadangan yang ada harus tetap tercakup.',
    reduceConfirm: 'Konfirmasi pengurangan',
    minimumLimit:
      'Total pengisian dan pencadangan saat ini {{count}}. Batas baru tidak boleh lebih rendah.',
    discard: 'Buang perubahan yang belum disimpan?',
    discardDescription:
      'Menutup akan membuang perubahan yang belum disimpan ini.',
    discardConfirm: 'Buang perubahan',
    noTargets:
      'Tidak ada target departemen dan jabatan yang diizinkan. Minta administrator memeriksa izin pengelolaan jumlah karyawan.',
    recruitmentSource: 'Lihat permintaan rekrutmen',
    transferSource: 'Lihat permintaan mutasi',
    fields: {
      department: 'Departemen',
      position: 'Jabatan',
      year: 'Tahun jumlah karyawan',
      limit: 'Batas diizinkan',
      used: 'Pengisian karyawan',
      pending: 'Pencadangan tertunda',
      allocated: 'Disetujui, belum mulai bekerja',
      available: 'Kapasitas tersedia',
      id: 'ID internal',
      version: 'Versi',
      updatedAt: 'Diperbarui pada',
      reason: 'Alasan',
      replacementPending: 'Pengganti mendatang tertunda',
      replacementAllocated: 'Pengganti mendatang disetujui',
      replacementBlocked: 'Posisi pengganti diblokir',
    },
    journalActions: {
      create: 'Buat akun',
      reconcile: 'Verifikasi dan inisialisasi',
      adjustLimit: 'Sesuaikan batas',
      hold: 'Cadangkan kapasitas',
      reviseHold: 'Revisi pencadangan',
      allocate: 'Alokasikan kapasitas disetujui',
      close: 'Tutup sumber',
      consume: 'Gunakan untuk penerimaan karyawan',
      releaseEmployee: 'Lepaskan pengisian karyawan',
      invalidateReplacement: 'Batalkan keabsahan pengganti',
      rebindOut: 'Alihkan ikatan keluar',
      rebindIn: 'Alihkan ikatan masuk',
      transferOut: 'Mutasi keluar',
      transferIn: 'Mutasi masuk',
      claimReplacement: 'Klaim pengganti',
      cancelReplacement: 'Batalkan pengganti',
      fulfillReplacement: 'Penuhi pengganti',
      other: 'Perubahan jumlah karyawan',
    },
    journalColumns: {
      time: 'Waktu',
      actor: 'Pelaku',
      action: 'Tindakan',
      source: 'Sumber bisnis',
    },
    employeeStatus: {
      probation: 'Masa percobaan',
      regular: 'Tetap',
      leaving: 'Akan berhenti',
    },
    authz: {
      title: 'Kapasitas jumlah karyawan',
      view: 'Lihat kapasitas',
      manage: 'Kelola kapasitas tahunan',
      viewJournal: 'Lihat jurnal sumber',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Daftar karyawan lengkap tidak dapat dibaca. Minta administrator memeriksa izin baca karyawan.',
      HEADCOUNT_ACCESS_DENIED:
        'Anda tidak memiliki izin untuk melakukan operasi jumlah karyawan ini.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Bidang ringkasan kapasitas di luar izin Anda.',
      HEADCOUNT_NOT_FOUND: 'Akun jumlah karyawan tidak tersedia.',
      HEADCOUNT_ALREADY_EXISTS:
        'Departemen, jabatan, dan tahun ini sudah memiliki akun.',
      HEADCOUNT_NOT_INITIALIZED:
        'Rekonsiliasi daftar karyawan lengkap sebelum mencadangkan kapasitas.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Pilih daftar karyawan masa percobaan, tetap, dan yang akan berhenti secara lengkap dan aktual.',
      HEADCOUNT_ROSTER_DRIFT:
        'Daftar karyawan aktual berubah. Rekonsiliasi fakta sumbernya sebelum melanjutkan.',
      HEADCOUNT_VERSION_CONFLICT: 'Akun berubah. Muat ulang sebelum menyimpan.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Pengenal permintaan ini sudah milik operasi lain.',
      HEADCOUNT_INSUFFICIENT:
        'Batas tahunan tidak dapat mencakup jumlah karyawan yang terisi dan dicadangkan secara aktual.',
      HEADCOUNT_INVALID_NUMBER:
        'Masukkan jumlah orang bilangan bulat dalam batas yang didukung.',
      HEADCOUNT_INVALID_ACCOUNT: 'Pilih departemen, jabatan, dan tahun nyata.',
      HEADCOUNT_INVALID_IDENTITY:
        'Pilih departemen dan jabatan organisasi aktif.',
      HEADCOUNT_INVALID_COMMAND:
        'Pelaku, pengenal permintaan, dan alasan diperlukan.',
      HEADCOUNT_INVALID_SOURCE: 'Jenis dan pengenal sumber nyata diperlukan.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Setiap posisi pengganti memerlukan karyawan berbeda yang akan berhenti.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Sumber pengganti harus sesuai dengan pengisian nyata yang akan atau sudah berhenti.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Pengisian pengganti ini tidak ada atau sudah diklaim.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Karyawan sumber yang dipulihkan memblokir pengganti ini.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Arsip karyawan tidak tersedia.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Karyawan aktual tidak sesuai dengan departemen dan jabatan yang dialokasikan.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Karyawan ini sudah mengisi akun tahunan ini.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Alihkan ikatan ke tahun perusahaan saat ini secara eksplisit sebelum digunakan.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Sumber kapasitas tidak tersedia.',
      HEADCOUNT_SOURCE_EXISTS: 'Sumber ini sudah memiliki pencadangan.',
      HEADCOUNT_SOURCE_STATE: 'Kondisi sumber tidak mengizinkan operasi ini.',
      HEADCOUNT_SOURCE_CLOSED: 'Sumber kapasitas sudah ditutup.',
      HEADCOUNT_SEAT_STATE: 'Posisi pencadangan tidak tertunda.',
      HEADCOUNT_STATE_CONFLICT: 'Posisi pencadangan berubah.',
      HEADCOUNT_NO_ALLOCATION:
        'Tidak ada posisi tersedia yang disetujui tersisa.',
      HEADCOUNT_NOT_LEFT:
        'Pemberhentian aktual diperlukan sebelum melepaskan kapasitas terisi.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Pengisian karyawan nyata yang belum dilepaskan diperlukan.',
      HEADCOUNT_NOT_RESTORED:
        'Pemulihan aktual diperlukan sebelum memblokir pengganti mendatang.',
      HEADCOUNT_INVALID_REBIND:
        'Pengalihan ikatan tahunan harus mempertahankan departemen dan jabatan serta bergerak maju.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Kredit pengganti memerlukan sumber tahun tujuan eksplisit.',
      HEADCOUNT_INVALID_TRANSFER:
        'Pencadangan tujuan disetujui yang berbeda diperlukan.',
      HEADCOUNT_INVALID_PAGE: 'Pilih ukuran halaman antara 1 dan 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Pengaman transaksi kapasitas tidak tersedia.',
    },
  },
};
