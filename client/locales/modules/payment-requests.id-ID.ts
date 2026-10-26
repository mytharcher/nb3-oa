export default {
  paymentRequests: {
    relatedUnavailable: 'Rekaman terkait tidak tersedia',
    businessErrors: {
      PAYMENT_REQUEST_INVALID_INPUT:
        'Lengkapi alasan, penerima pembayaran, jumlah positif, nomor faktur, dan bukti faktur.',
      PAYMENT_REQUEST_ACCOUNT_REQUIRED:
        'Lengkapi rekening bank dilindungi milik penerima pembayaran sebelum mengajukan.',
      PAYMENT_REQUEST_ACCOUNT_STALE:
        'Rekening penerima pembayaran berubah. Muat rekening terbaru sebelum mengoreksinya.',
      PAYMENT_REQUEST_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
      PAYMENT_REQUEST_METHOD_INVALID: 'Pilih metode pembayaran aktif.',
      PAYMENT_REQUEST_SOURCE_REQUIRED:
        'Jelaskan mengapa tidak ada persetujuan sebelumnya, dan hapus tautan pesanan pembelian.',
      PAYMENT_REQUEST_SOURCE_INVALID:
        'Pilih pesanan pembelian atau kontrak yang berlaku beserta penerima pembayaran awalnya.',
      PAYMENT_REQUEST_SOURCE_STALE:
        'Dokumen sumber berubah. Muat ulang pembayaran dan sumber sebelum bertindak lagi.',
      PAYMENT_REQUEST_CONTRACT_STALE:
        'Kontrak berubah. Muat ulang versinya dan revisi pembayaran sebelum mengajukan ulang.',
      PAYMENT_REQUEST_VOUCHER_REQUIRED:
        'Masukkan nomor bukti pembayaran dan unggah atau pilih bukti pembayaran.',
      PAYMENT_REQUEST_FORCE_CONFIRMATION_REQUIRED:
        'Konfirmasikan jumlah disetujui secara persis sebelum memaksa penyelesaian pembayaran.',
      PAYMENT_REQUEST_HANDLING_REASON_REQUIRED:
        'Masukkan alasan pembayaran tidak dapat diselesaikan.',
      PAYMENT_REQUEST_ALREADY_PAID:
        'Pembayaran ini sudah diselesaikan. Muat ulang untuk melihat hasil tercatat.',
      PAYMENT_REQUEST_CONTRACT_ACTUAL_PAYMENT_REQUIRED:
        'Catat pembayaran kontrak aktual sebelum menyelesaikan operasi ini.',
      PAYMENT_FILE_SIZE: 'Pilih lampiran yang tidak kosong dan maksimal 5 MB.',
      PAYMENT_FILE_TYPE:
        'Unggah file PDF, JPEG, PNG, atau WebP dengan jenis file yang sesuai.',
      PAYMENT_ATTACHMENT_INVALID:
        'Pilih bukti yang diunggah untuk permintaan pembayaran ini.',
    },

    title: 'Permintaan pembayaran',
    description:
      'Tinjau permohonan pembayaran, fakta sumber yang dibekukan, dan penanganan kasir.',
    new: 'Permintaan pembayaran baru',
    edit: 'Edit',
    details: 'Lihat detail',
    number: 'Angka',
    reason: 'Alasan',
    vendor: 'Penerima pembayaran',
    amount: 'Jumlah pembayaran (yuan)',
    search: 'Cari nomor, alasan, pemohon, atau penerima pembayaran',
    view: 'Tampilan rekaman',
    allStatuses: 'Semua status',
    refresh: 'Muat ulang',
    clearFilters: 'Hapus filter',
    emptyTitle: 'Belum ada permintaan pembayaran',
    emptyDescription:
      'Buat draf untuk meminta pembayaran dan lampirkan bukti fakturnya.',
    noResults: 'Tidak ada rekaman yang cocok. Hapus atau sesuaikan filter.',
    rowActions: 'Tindakan untuk {{name}}',
    yes: 'Ya',
    no: 'Tidak',
    frozenHint:
      'Sumber, penerima pembayaran, jumlah, dan faktur dibekukan saat pengajuan.',
    sourceModes: {
      contract: 'Kontrak',
      purchase: 'Pesanan pembelian',
      none: 'Tanpa persetujuan sebelumnya',
    },
    views: {
      mine: 'Milik saya',
      pending: 'Menunggu',
      done: 'Selesai',
      copied: 'Disalin',
    },
    statuses: {
      draft: 'Draf',
      revision: 'Revisi',
      head: 'Tinjauan departemen',
      finance: 'Tinjauan keuangan',
      executive: 'Tinjauan eksekutif',
      gm: 'Tinjauan manajer umum',
      cashier: 'Penanganan kasir',
      exception: 'Pengecualian penanganan',
      paid: 'Dibayar',
      forcedPaid: 'Pembayaran paksa dicatat',
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
        'Pembayaran ini berubah. Baca rekaman terbaru sebelum bertindak lagi.',
      invalid: 'Periksa konten pembayaran dan bukti wajib.',
      failed: 'Permintaan tidak selesai. Coba lagi.',
    },
    detail: {
      creator: 'Dibuat oleh',
      sourceMode: 'Sumber',
      order: 'Pesanan pembelian',
      noPriorReason: 'Alasan tanpa persetujuan sebelumnya',
      invoice: 'Nomor faktur',
      method: 'Metode pembayaran',
      failure: 'Kegagalan penanganan',
      voucher: 'Bukti pembayaran',
      forcedReason: 'Alasan pembayaran paksa',
      paidAt: 'Dibayar pada',
      sourceFacts: 'Fakta sumber dibekukan',
      cumulativeHint:
        'Pembayaran kumulatif saat pengajuan mencakup pembayaran tertunda. Pencadangan permintaan saat ini ditampilkan terpisah dan tidak boleh ditambahkan lagi. Pembayaran tidak mengonfirmasi pengiriman atau penerimaan.',
      sourceApproved: 'Nilai pesanan disetujui (yuan)',
      sourceCumulative: 'Jumlah kumulatif saat pengajuan (yuan)',
      sourceHeld: 'Pencadangan sumber saat ini (yuan)',
      fullApproval: 'Persetujuan lengkap diperlukan',
      attachments: 'Bukti faktur',
      voucherAttachments: 'Bukti pembayaran',
      notSubmitted: 'Aturan dibekukan saat pengajuan.',
    },
    rules: {
      spend_vp: 'Ambang eksekutif (yuan)',
      spend_gm: 'Ambang manajer umum (yuan)',
      sla_remindHours: 'Jam kerja pengingat',
      sla_escalateHours: 'Jam kerja eskalasi',
      sla_urgeCooldownHours: 'Jam jeda pengingat',
    },
    authz: {
      voucherEvidence: 'Unggah bukti pembayaran',
      ownScope: 'Pembayaran milik saya atau yang saya buat',
      resource: 'Permintaan pembayaran',
      view: 'Lihat permintaan pembayaran',
      submit: 'Buat dan ajukan pembayaran saya',
      delegate: 'Buat pembayaran untuk karyawan',
      paymentAccount: 'Baca dan koreksi rekening pembayaran yang diizinkan',
    },
  },
};
