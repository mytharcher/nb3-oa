export default {
  loanRequests: {
    relatedUnavailable: 'Rekaman terkait tidak tersedia',
    rowActions: 'Tindakan untuk {{name}}',
    description: 'Kelola permintaan pinjaman, pembayaran, dan pelunasan.',

    saved: 'Permintaan pinjaman "{{name}}" disimpan',
    submitted: 'Permintaan pinjaman "{{name}}" diajukan',
    cashRecorded: 'Pelunasan tunai untuk "{{name}}" dicatat',
    repaymentConfirmed: 'Pelunasan "{{receipt}}" dikonfirmasi',
    repaymentCancelled: 'Pelunasan "{{receipt}}" dibatalkan',
    confirmRepaymentTitle: 'Konfirmasi pelunasan "{{receipt}}"?',
    cancelRepaymentTitle: 'Batalkan pelunasan "{{receipt}}"?',

    businessErrors: {
      LOAN_REQUEST_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
      LOAN_REQUEST_INVALID_DATE:
        'Tanggal jatuh tempo pelunasan harus hari ini atau setelahnya dalam zona waktu perusahaan.',
      LOAN_REQUEST_INVALID_TRAVEL:
        'Pilih perjalanan aktif Anda sendiri yang disetujui dan berlaku.',
      LOAN_REQUEST_INVALID_INPUT:
        'Masukkan alasan pinjaman dan jumlah positif.',
      LOAN_REQUEST_NOT_PAID:
        'Pinjaman ini belum dibayar. Pelunasan hanya dapat dicatat setelah pembayaran.',
      LOAN_REQUEST_REPAYMENT_INPUT_INVALID:
        'Masukkan tanda terima pelunasan dan alasannya.',
    },

    loadLatest: 'Muat fakta terbaru',
    latestFacts:
      'Versi {{version}} · {{amount}} yuan · jatuh tempo {{date}} · tujuan: {{reason}}',
    adoptVersion: 'Pertahankan input saya dan gunakan versi ini',
    noLongerEditable: 'Permintaan ini tidak lagi dapat diedit.',
    invalidDate: 'Pilih tanggal kalender perusahaan saat ini atau mendatang.',
    number: 'Referensi',
    more: 'Tindakan lainnya',
    confirm: 'Konfirmasi',
    operationLabels: {
      complete: 'Selesaikan pembayaran',
      unable: 'Pembayaran gagal',
      retryCash: 'Ulangi pembayaran',
      claim: 'Klaim penanganan',
      release: 'Lepaskan penanganan',
      assign: 'Tetapkan petugas',
    },
    confirmRetry:
      'Perbarui detail rekening bank Anda dan kembalikan permintaan disetujui ini kepada kasir.',
    confirmPayment:
      'Konfirmasikan bahwa pembayaran benar-benar selesai dengan bukti transaksi ini. Ini menciptakan utang peminjam.',
    confirmUnable:
      'Catat pengecualian pembayaran dan alasan. Jumlah disetujui tetap dicadangkan.',
    receipt: 'Referensi tanda terima',
    actions: 'Tindakan',
    bank: 'Rekening pembayaran dilindungi',
    hideBank: 'Sembunyikan rekening pembayaran',
    showBank: 'Tampilkan rekening pembayaran',
    bankRestricted:
      'Hanya peminjam dan peran keuangan yang diizinkan secara eksplisit yang dapat membaca rekening pembayaran.',
    bankName: 'Bank',
    bankHolder: 'Pemilik rekening',
    bankAccount: 'Nomor rekening bank',
    loadingBank: 'Memuat rekening pembayaran…',
    bankNotSnapshot: 'Belum ada rekening pembayaran yang direkam.',
    recordCash: 'Catat pelunasan tunai',
    invalidRepaymentAmount:
      'Jumlah pelunasan tidak dapat dibaca. Hubungi bagian keuangan untuk memeriksa rekaman ini.',
    noRepayments: 'Tidak ada rekaman pelunasan',
    loading: 'Memuat…',
    confirmRepayment: 'Konfirmasi pelunasan',
    cancelRepayment: 'Batalkan tanda terima tertunda',
    confirmReason: 'Peminjam mengonfirmasi pelunasan tunai',
    cancelReason: 'Kasir membatalkan tanda terima tunai tertunda',
    confirmCashWarning:
      'Konfirmasi tanda terima {{receipt}} sebesar {{amount}} yuan. Ini mengurangi utang Anda dan tidak dapat dibatalkan.',
    cancelCashWarning:
      'Batalkan tanda terima {{receipt}} sebesar {{amount}} yuan. Utang terutang Anda tetap tidak berubah.',
    cashRestricted:
      'Hanya kasir yang dapat mencatat pelunasan pada pinjaman yang telah dibayar.',
    repaymentStates: {
      pending: 'Menunggu konfirmasi',
      settled: 'Dikonfirmasi',
      cancelled: 'Dibatalkan',
    },
    department: 'Departemen',
    yuan: 'yuan',
    inflight: 'Dicadangkan terhadap batas pinjaman: {{amount}} yuan',
    quotaFact:
      'Fakta pengajuan: utang {{debt}}, permohonan lain {{inflight}}, total termasuk permintaan ini {{total}} yuan.',
    principal: 'Pokok awal',
    repaid: 'Dilunasi',
    outstanding: 'Utang terutang',
    pendingRepayment: 'Pencadangan pelunasan tertunda',
    pendingHint:
      'Konfirmasi tunai tertunda dan pengimbangan penggantian biaya tidak mengurangi utang terutang.',
    edit: 'Edit draf pinjaman',
    invalidAmount: 'Masukkan jumlah positif dengan maksimal dua angka desimal.',
    invalidTravel:
      'Pilih permintaan perjalanan aktif Anda sendiri yang disetujui.',
    readOnly: 'Anda tidak memiliki izin untuk mengedit draf ini.',
    bankMissing:
      'Rekening pembayaran Anda belum lengkap. Perbarui sebelum kasir dapat menyelesaikan pembayaran.',
    conflict: 'Permintaan berubah. Buka detail saat ini sebelum mengedit lagi.',
    amountHint: 'Jumlah menggunakan sen presisi; maksimal dua angka desimal.',
    companyDate: 'Tanggal kalender dalam zona waktu perusahaan: {{zone}}',
    noTravel: 'Tanpa tautan perjalanan',
    search: 'Nomor, tujuan, atau pemohon',
    allStatuses: 'Semua status',
    view: 'Daftar kerja',
    filteredEmpty: 'Tidak ada permintaan pinjaman yang cocok',
    empty: 'Tidak ada permintaan pinjaman',
    emptyHint:
      'Buat permintaan pinjaman untuk mendanai kebutuhan bisnis disetujui.',
    clear: 'Hapus filter',
    states: {
      draft: 'Draf',
      revision: 'Dikembalikan untuk revisi',
      manager: 'Tinjauan manajer',
      head: 'Tinjauan kepala departemen',
      finance: 'Tinjauan keuangan',
      executive: 'Tinjauan wakil presiden',
      gm: 'Tinjauan manajer umum',
      cashier: 'Menunggu pembayaran',
      exception: 'Pengecualian pembayaran',
      paid: 'Dibayar',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
    },
    stages: {
      draft: 'Draf',
      revision: 'Dikembalikan untuk revisi',
      manager: 'Tinjauan manajer',
      head: 'Tinjauan kepala departemen',
      finance: 'Tinjauan keuangan',
      executive: 'Tinjauan wakil presiden',
      gm: 'Tinjauan manajer umum',
      cashier: 'Menunggu pembayaran',
      exception: 'Pengecualian pembayaran',
      paid: 'Dibayar',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
    },
    errors: {
      inactive: 'Arsip karyawan aktif diperlukan.',
      configuration:
        'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
      invalid: 'Periksa bidang input dan coba lagi.',
      quota: 'Batas pinjaman pribadi akan terlampaui.',
      overdue:
        'Lunasi utang lewat jatuh tempo sebelum mengajukan pinjaman lain.',
    },
    authz: {
      ownedScope: 'Permintaan yang saya ajukan atau buat',
      resource: 'Permintaan pinjaman',
      submit: 'Ajukan permintaan pinjaman sendiri',
      delegate: 'Buat permintaan pinjaman untuk karyawan',
      view: 'Baca permintaan pinjaman',
      payment: 'Baca detail pembayaran pinjaman dilindungi',
      cashRepayment: 'Catat dan batalkan pelunasan tunai',
      confirmRepayment: 'Konfirmasi pelunasan tunai sendiri',
      collection: 'Permintaan pinjaman',
    },
    title: 'Permintaan pinjaman',
    new: 'Permintaan pinjaman baru',
    reason: 'Tujuan pinjaman',
    amount: 'Jumlah pinjaman (yuan)',
    dueDate: 'Tanggal pelunasan',
    travel: 'Permintaan perjalanan tertaut',
    status: 'Status',
    refresh: 'Muat ulang',
    loan: 'Saldo pinjaman',
    repayment: 'Pelunasan tunai',
    voucher: 'Bukti pembayaran',
  },
};
