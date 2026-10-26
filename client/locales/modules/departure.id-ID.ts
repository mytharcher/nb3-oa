export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Lengkapi daftar periksa pemberhentian sebelum melanjutkan.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Konfirmasikan hari kerja terakhir karyawan.',
    DEPARTURE_DATE_PAST:
      'Hari kerja terakhir tidak boleh sebelum hari ini dalam zona waktu perusahaan.',
    DEPARTURE_HANDOVER_INVALID:
      'Pilih penerima serah terima yang memenuhi syarat selain karyawan yang akan berhenti.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Lengkapi item serah terima sebelum melanjutkan.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Selesaikan serah terima biasa sebelum penyelesaian pemberhentian.',
    DEPARTURE_LOAN_UNCLEARED:
      'Lunasi pinjaman karyawan yang belum lunas sebelum penyelesaian pemberhentian.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Masukkan bukti penerimaan atau penyelesaian untuk item serah terima ini.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED:
      'Masukkan catatan penyelesaian pemberhentian.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Selesaikan penetapan ulang tugas tertunda sebelum melanjutkan.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Pilih perkiraan hari kerja terakhir dan penerima serah terima.',
    DEPARTURE_TYPE_INVALID: 'Pilih jenis pemberhentian aktif.',
    DEPARTURE_ALREADY_ACTIVE:
      'Karyawan ini sudah memiliki permintaan pemberhentian aktif. Buka permintaan yang ada.',
    DEPARTURE_CANCELLATION_PENDING:
      'Pembatalan pemberhentian tertunda. Selesaikan sebelum melanjutkan.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'Fakta karyawan atau pemberhentian berubah. Muat ulang dan verifikasi sebelum eksekusi.',
  },

  authz: {
    cancel: 'Batalkan pemberhentian',
    resource: 'Pemberhentian dan serah terima',
    view: 'Lihat permintaan pemberhentian',
    submit: 'Ajukan permintaan pemberhentian',
    delegate: 'Buat permintaan pemberhentian untuk karyawan',
    work: 'Tangani serah terima pemberhentian',
    settle: 'Konfirmasi penyelesaian pemberhentian',
  },
  schedule: {
    title: 'Pelaksanaan pemberhentian',
    description:
      'Jalankan pemberhentian yang jatuh tempo dan ulangi perubahan akun dan keanggotaan yang belum selesai.',
  },

  title: 'Pemberhentian dan serah terima',
  description:
    'Tinjau pemberhentian, serah terima, dan eksekusi tanggal berlaku.',
  new: 'Permintaan pemberhentian baru',
  edit: 'Edit',
  number: 'Nomor permintaan',
  refresh: 'Muat ulang',
  search: 'Cari berdasarkan nomor permintaan, karyawan, atau alasan',
  view: 'Lihat',
  allTypes: 'Semua jenis pemberhentian',
  allStatuses: 'Semua status',
  clearFilters: 'Hapus filter',
  emptyTitle: 'Tidak ada permintaan pemberhentian',
  emptyDescription:
    'Permohonan pemberhentian dan kemajuan serah terima muncul di sini.',
  noResults: 'Tidak ada permintaan pemberhentian yang cocok',
  departureType: 'Jenis pemberhentian',
  reason: 'Alasan',
  expectedLastWorkingDay: 'Perkiraan hari kerja terakhir',
  lastWorkingDay: 'Hari kerja terakhir yang dikonfirmasi',
  handoverUser: 'Penerima serah terima',
  createdBy: 'Dibuat oleh',
  application: 'Permohonan',
  settlement: 'Penyelesaian SDM',
  settlementDate: 'Tanggal penyelesaian',
  settlementNote: 'Catatan penyelesaian',
  execution: 'Pelaksanaan pemberhentian',
  notSettled: 'Penyelesaian belum selesai.',
  notExecuted:
    'Eksekusi pemberhentian belum selesai. Akun belum dinonaktifkan.',
  executionComplete: 'Akun dan keanggotaan organisasi telah dinonaktifkan.',
  cancellationReason: 'Alasan pembatalan',
  cancellationGuidance:
    'Setelah wawancara SDM, SDM dapat meminta pembatalan sebelum pemberhentian aktual. Peninjau SDM lain harus mengonfirmasi sebelum hubungan kerja dipulihkan.',
  handover: 'Pekerjaan serah terima',
  claimant: 'Diklaim oleh',
  receiver: 'Penerima',
  manager: 'Manajer penanggung jawab',
  forcedBy: 'Dibebaskan oleh',
  forceReason: 'Alasan pembebasan',
  checklistConfirmed: 'Daftar periksa dikonfirmasi',
  receiverAcknowledged: 'Penerimaan diakui',
  yes: 'Ya',
  no: 'Tidak',
  notReady: 'Persyaratan pengajuan belum lengkap.',
  views: {
    mine: 'Milik saya',
    pending: 'Menunggu',
    done: 'Selesai',
    copied: 'Disalin',
  },
  statuses: {
    cancellationReview: 'Konfirmasi pembatalan',
    cancelled: 'Dibatalkan',
    draft: 'Draf',
    revision: 'Dikembalikan untuk revisi',
    manager: 'Tinjauan manajer',
    head: 'Tinjauan kepala departemen',
    hr: 'Wawancara SDM',
    gm: 'Tinjauan manajer umum',
    handover: 'Serah terima',
    completed: 'Penyelesaian selesai',
    withdrawn: 'Ditarik',
    rejected: 'Ditolak',
    terminated: 'Dihentikan',
  },
  workKinds: {
    work: 'Serah terima pekerjaan',
    it: 'TI dan akun',
    admin: 'Aset dan tempat kerja',
    finance: 'Pinjaman dan penggantian biaya',
  },
  workStates: {
    cancelled: 'Dibatalkan',
    open: 'Tersedia untuk diklaim',
    claimed: 'Sedang berlangsung',
    completed: 'Selesai',
  },
  executionStates: {
    cancelled: 'Dibatalkan',
    ready: 'Menunggu tanggal berlaku',
    transferring: 'Mengalihkan persetujuan tertunda',
    blocked: 'Eksekusi terhalang',
    executed: 'Akun dinonaktifkan',
  },
  errors: {
    missingUnnamed:
      'Permintaan pemberhentian ini tidak lagi ada. Dikembalikan ke daftar sumber.',
    missingReturned:
      '"{{name}}" tidak lagi tersedia. Dikembalikan ke daftar sumber.',
    forbidden: 'Anda tidak lagi memiliki akses ke rekaman ini.',
    notFound: 'Rekaman ini tidak ada. Kembali ke daftar.',
    conflict:
      'Rekaman ini berubah. Muat rekaman terbaru sebelum mengonfirmasi lagi.',
    invalid: 'Persyaratan operasi belum terpenuhi. Periksa rekaman saat ini.',
    failed: 'Permintaan gagal. Coba muat lagi.',
  },
  form: {
    create: 'Permintaan pemberhentian baru',
    confirmSubmission: 'Konfirmasi pengajuan pemberhentian',
    submissionHelp:
      'Konfirmasikan perkiraan hari kerja terakhir dan penerima serah terima sebelum mengajukan untuk persetujuan.',
    edit: 'Edit permintaan pemberhentian',
    save: 'Simpan draf',
    saved: '"{{name}}" disimpan',
    mode: 'Buat untuk',
    self: 'Pengunduran diri saya',
    manual: 'Permintaan yang diwakilkan SDM',
    employee: 'Karyawan',
    employeeSearch: 'Cari karyawan',
    chooseEmployee: 'Pilih karyawan aktif',
    employeesDenied: 'Akses arsip karyawan diperlukan untuk memilih target.',
    previous: 'Kandidat sebelumnya',
    next: 'Kandidat berikutnya',
    chooseType: 'Pilih jenis pemberhentian',
    chooseHandover: 'Pilih penerima serah terima',
    searchHandover: 'Cari penerima yang memenuhi syarat',
    handoverSearchMinimum:
      'Masukkan setidaknya dua karakter untuk mencari berdasarkan nama atau kode karyawan.',
    noHandoverCandidates:
      'Tidak ditemukan penerima yang memenuhi syarat. Coba nama atau kode karyawan lain, atau minta SDM memeriksa status karyawan dan akun.',
    requiredOnSubmit: 'Wajib untuk pengajuan; opsional saat menyimpan draf.',
    handoverHelp:
      'Wajib untuk pengajuan; opsional untuk draf. Pilih karyawan masa percobaan atau tetap lainnya dengan akun aktif. Cari berdasarkan nama atau kode karyawan.',
    refineHandoverSearch:
      'Banyak penerima yang cocok. Masukkan nama lebih spesifik untuk mempersempit pencarian.',
    required: 'Lengkapi bidang ini.',
    dateInvalid: 'Pilih tanggal kalender valid.',
    invalid: 'Periksa bidang ini dan coba lagi.',
    dateHelp:
      'Tanggal yang dikonfirmasi saat wawancara SDM adalah hari kerja terakhir final.',
    manualHelp:
      'SDM dapat membuat permintaan pemecatan atau berakhirnya kontrak untuk karyawan.',
    unavailable:
      'Anda tidak dapat membuat permintaan ini. Periksa status karyawan dan izin Anda.',
    unknown:
      'Hasil penyimpanan belum dikonfirmasi. Periksa draf yang ada sebelum membuat permintaan lain.',
    checkDrafts: 'Periksa draf yang ada',
    noProof:
      'Tidak ditemukan draf yang cocok. Ini tidak membuktikan penyimpanan gagal. Pertahankan permintaan terkunci dan hubungi SDM.',
    openDraft: 'Buka draf ini untuk verifikasi',
    confirmDraft: 'Ini permintaan yang disimpan',
    storageUnavailable:
      'Penyimpanan browser tidak tersedia. Penyimpanan dinonaktifkan untuk mencegah permintaan duplikat setelah penyimpanan terputus.',
    unknownPersisted:
      'Permintaan pembuatan sebelumnya masih belum dikonfirmasi. Kunci ini tetap berlaku setelah dimuat ulang.',
  },
  actionForm: {
    approveConsequence:
      'Persetujuan yang ditawarkan dicatat. Persetujuan akhir menerapkan hasil kepegawaian yang disetujui.',

    uncertain:
      'Hasil belum dikonfirmasi. Pertahankan input ini dan ulangi operasi identik; jangan kirim permintaan yang diubah.',
    replay: 'Ulangi operasi identik',
    unsupported:
      'Tindakan ini memerlukan kontrak input yang tidak didukung halaman ini.',
    person: 'Penerima',
    mode: 'Posisi penandatangan',
    place: 'Posisi persetujuan',
    releaseConsequence:
      'Ini melepaskan tugas persetujuan tertunda dan tidak dapat dibatalkan di sini.',
    returnConsequence:
      'Permintaan dikembalikan untuk koreksi dan pekerjaan tertunda saat ini ditutup.',
    submitConsequence:
      'Permintaan masuk ke persetujuan dengan fakta pengajuannya dibekukan.',
    genericConsequence:
      'Server menerapkan operasi yang ditawarkan ke target persetujuan terpilih.',
    latest: 'Baca versi terbaru',
    conflict:
      'Permintaan pemberhentian berubah. Input Anda dipertahankan. Baca versi terbaru, tinjau, lalu konfirmasikan lagi.',
    completed: '{{action}} selesai untuk "{{name}}"',
    committed:
      'Operasi selesai. Muat ulang permintaan pemberhentian sebelum melakukan tindakan lain.',
    before: 'Sebelum',
    after: 'Setelah',
    alongside: 'Bersamaan',
    revision: 'Koreksi pemohon',
    required: 'Lengkapi bidang ini.',
    limit: 'Nilai ini terlalu panjang.',
    title: '{{action}} pemberhentian "{{name}}"',
    comment: 'Komentar / alasan',
    confirm: 'Konfirmasi',
    saved: '"{{name}}" diperbarui',
    unavailable: 'Tindakan ini tidak lagi tersedia. Muat rekaman terbaru.',
    unknown:
      'Hasil belum dikonfirmasi. Muat rekaman terbaru sebelum melanjutkan.',
    to: 'Penerima',
    returnTarget: 'Kembalikan kepada',
    confirmTitle: '{{action}} "{{name}}"?',
    confirmDescription:
      'Ini memperbarui keputusan pemberhentian. Konfirmasikan karyawan dan rekaman saat ini.',
    lastWorkingDay: 'Hari kerja terakhir yang dikonfirmasi',
    settlementDate: 'Tanggal penyelesaian',
    settlementNote: 'Catatan penyelesaian',
    labels: {
      requestCancellation: 'Minta pembatalan pemberhentian',
      submit: 'Ajukan',
      withdraw: 'Tarik',
      terminate: 'Hentikan',
      settle: 'Konfirmasi penyelesaian',
      approve: 'Setujui',
      reject: 'Tolak',
      return: 'Kembalikan',
      returnTo: 'Kembalikan',
      comment: 'Komentar',
      read: 'Tandai dibaca',
      urge: 'Desak',
      transfer: 'Alihkan',
      addSigner: 'Tambah penandatangan',
      cc: 'Salin',
      claim: 'Klaim',
      release: 'Lepaskan',
      appoint: 'Tunjuk',
      reassign: 'Tetapkan ulang',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Minta pembatalan pemberhentian',
      claim: 'Klaim',
      confirmChecklist: 'Konfirmasi daftar periksa',
      acknowledgeReceipt: 'Akui penerimaan',
      complete: 'Selesaikan',
      forceComplete: 'Paksa penyelesaian',
    },
    title: '{{action}} {{kind}} untuk "{{name}}"',
    reason: 'Alasan pembebasan',
    confirmChecklist: 'Saya telah menyelesaikan daftar periksa.',
    acknowledgeReceipt: 'Saya telah menerima serah terima.',
    blocked:
      'Penyelesaian belum lengkap. Selesaikan item tertunggak yang tercantum.',
    forceWarning:
      'Penyelesaian serah terima secara paksa tidak mengubah fakta buku besar aset atau keuangan.',
    forceConfirm: 'Bebaskan {{kind}} untuk "{{name}}"?',
    forceDescription:
      'Bukti penyelesaian normal akan dilewati. Alasan dan pelaku aktual akan diaudit.',
  },
  blockers: {
    generic:
      'Persyaratan belum terpenuhi. Muat ulang dan minta penanggung jawab menyelesaikannya.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'Penyelesaian aset normal belum tersedia.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'Penyelesaian penggantian biaya tidak tersedia.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'Pinjaman atau pelunasan dicadangkan belum diselesaikan.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED:
      'Permintaan penggantian biaya masih terbuka.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Pilih tanggal perkiraan dan penerima serah terima.',
    DEPARTURE_DATE_PAST: 'Perkiraan hari kerja terakhir sudah berlalu.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'Pengalihan persetujuan tidak tersedia. Akun tetap aktif.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Persetujuan tertunda tetap ditetapkan kepada karyawan ini.',
    DEPARTURE_EXECUTION_FAILED:
      'Eksekusi pemberhentian gagal dan akan dicoba ulang oleh tugas harian.',
  },
};
