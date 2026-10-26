export default {
  probationRequests: {
    businessErrors: {
      PROBATION_SELF_EVALUATION_REQUIRED:
        'Masukkan evaluasi diri karyawan sebelum mengajukan.',
      PROBATION_CONCLUSION_REQUIRED:
        'Masukkan kesimpulan manajer sebelum menyetujui.',
      PROBATION_COMPENSATION_REQUIRED:
        'Lengkapi informasi jenjang dan gaji dilindungi dalam formulir persetujuan SDM.',
      PROBATION_INVALID_GRADE: 'Pilih jenjang aktif.',
      PROBATION_ALREADY_ACTIVE:
        'Karyawan ini sudah memiliki permintaan masa percobaan aktif. Buka permintaan yang ada.',
      PROBATION_STALE_EMPLOYEE:
        'Informasi masa percobaan karyawan berubah. Muat ulang sebelum bertindak lagi.',
      PROBATION_DEPARTMENT_REQUIRED:
        'Karyawan memerlukan departemen utama aktif. Minta SDM memperbarui rekaman.',
    },

    title: 'Permintaan masa percobaan',
    description:
      'Tinjau evaluasi masa percobaan dan pantau keputusan pengangkatan tetap.',
    new: 'Permintaan masa percobaan baru',
    edit: 'Edit',
    details: 'Lihat detail',
    number: 'Angka',
    employee: 'Karyawan',
    probationEndDate: 'Tanggal akhir masa percobaan',
    conclusion: 'Kesimpulan',
    search: 'Cari nomor, nama karyawan, atau evaluasi diri',
    view: 'Tampilan rekaman',
    allStatuses: 'Semua status',
    refresh: 'Muat ulang',
    clearFilters: 'Hapus filter',
    emptyTitle: 'Belum ada permintaan masa percobaan',
    emptyDescription:
      'Karyawan menerima draf sistem menjelang akhir masa percobaan. SDM dapat membuat evaluasi untuk karyawan masa percobaan.',
    noResults: 'Tidak ada permintaan yang cocok',
    rowActions: 'Tindakan untuk {{name}}',
    views: {
      mine: 'Milik saya',
      pending: 'Menunggu',
      done: 'Selesai',
      copied: 'Disalin',
    },
    conclusions: {
      regular: 'Angkat tetap',
      deferred: 'Perpanjang masa percobaan',
      declined: 'Tolak pengangkatan tetap',
    },
    statuses: {
      draft: 'Draf',
      revision: 'Revisi',
      manager: 'Tinjauan manajer',
      head: 'Tinjauan departemen',
      hr: 'Tinjauan SDM',
      gm: 'Tinjauan manajer umum',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
    },
    errors: {
      forbidden:
        'Anda tidak memiliki akses. Minta administrator memeriksa izin Anda.',
      notFound:
        'Rekaman ini tidak lagi ada atau tidak tersedia. Kembali ke halaman sumber.',
      conflict:
        'Evaluasi ini berubah. Baca rekaman terbaru sebelum bertindak lagi.',
      invalid: 'Periksa konten evaluasi dan bidang wajib.',
      failed: 'Permintaan tidak selesai. Coba lagi.',
      departureUnavailable:
        'Alur pemberhentian tidak tersedia; tindakan ini tidak selesai. Tinjauan manajer umum tetap tertunda.',
    },
    detail: {
      creator: 'Dibuat oleh',
      selfEvaluation: 'Evaluasi diri',
      evaluation: 'Evaluasi manajer',
      deferredTo: 'Tanggal akhir masa percobaan diperpanjang',
      grade: 'Jenjang',
      manager: 'Peninjau manajer',
      head: 'Peninjau departemen',
      hr: 'Peninjau SDM',
      gm: 'Peninjau manajer umum',
      rules: 'Aturan dibekukan',
      unsubmitted: 'Aturan dibekukan saat pengajuan.',
    },
    rules: {
      grade_managerRank: 'Ambang jenjang manajer',
      sla_remindHours: 'Jam kerja pengingat',
      sla_escalateHours: 'Jam kerja eskalasi',
      sla_urgeCooldownHours: 'Jam jeda pengingat',
    },
    compensation: {
      title: 'Usulan kompensasi pribadi',
      denied: 'Anda tidak dapat melihat kompensasi.',
      missing: 'Belum ada usulan kompensasi disimpan.',
      grade: 'Jenjang diusulkan',
      salary: 'Gaji pokok (yuan)',
    },
    authz: {
      resource: 'Evaluasi masa percobaan',
      submit: 'Edit dan ajukan evaluasi masa percobaan',
      delegate: 'SDM membuat evaluasi masa percobaan',
      view: 'Baca evaluasi masa percobaan yang diizinkan',
      compensation: 'Akses kompensasi masa percobaan pribadi',
    },
    schedule: {
      title: 'Pengingat berakhirnya masa percobaan',
      description:
        'Rekonsiliasi tanggal masa percobaan dalam waktu perusahaan, buat draf evaluasi diri 14 hari sebelum berakhir, dan beri tahu karyawan.',
    },
  },
};
