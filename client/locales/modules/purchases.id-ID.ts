export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Setiap barang pembelian memerlukan nama, satuan, dan jumlah positif. Periksa barang duplikat.',
      PURCHASE_INVALID_DATE: 'Pilih perkiraan tanggal penerimaan valid.',
      PURCHASE_INVALID_PRICE:
        'Masukkan harga aktual positif, pilih pemasok, dan lampirkan bukti penawarannya.',
      PURCHASE_INVALID_QUOTES:
        'File penawaran tidak dapat digunakan ulang untuk pemasok berbeda. Pilih bukti terpisah.',
      PURCHASE_QUOTES_REQUIRED:
        'Jumlah ini memerlukan penawaran dari tiga pemasok berbeda, masing-masing dengan lampiran.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Revisi perkiraan anggaran menjadi harga penawaran terkonfirmasi sebelum mengajukan ulang.',
      PURCHASE_INVALID_INPUT:
        'Tambahkan barang pembelian dan tujuan, serta masukkan perkiraan jumlah positif.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
      INVALID_RECEIPT:
        'Pilih tanggal penerimaan aktual dan masukkan alasan konfirmasi penerimaan.',
    },

    discardThenNavigate:
      'Buang perubahan yang belum disimpan ini? Setelah mengonfirmasi, pilih tujuan Anda lagi.',
    localInputsRetained:
      'Versi terbaru dimuat. Input Anda dipertahankan; periksa sebelum menyimpan lagi.',
    chooseForceMode: 'Pilih metode penanganan',
    confirmForceClose: 'Tutup pembelian {{name}}?',
    confirmPricing: 'Konfirmasi penawaran untuk {{name}}?',
    confirmCancelOrder: 'Batalkan pesanan {{name}}?',
    priceWillReturn:
      'Harga melebihi perkiraan lebih dari 20%. Ini mengembalikan permintaan kepada pemohon untuk konfirmasi sebelum tinjauan keuangan.',
    pricingSubmitConsequence:
      'Pengajuan membekukan penawaran ini untuk tahap persetujuan berikutnya dan menyesuaikan penahanan anggaran.',

    new: 'Pembelian baru',
    edit: 'Edit pembelian',
    saved: 'Pembelian disimpan',
    formDescription:
      'Jelaskan barang, tujuan, dan perkiraan. Pengajuan mencadangkan anggaran departemen utama untuk tahun kalender perusahaan saat ini.',
    primaryDepartment: 'Departemen utama: {{department}}',
    yearHint: 'Tahun pengajuan mengikuti kalender perusahaan ({{timeZone}}).',
    departmentMissing: 'Tidak ada departemen utama',
    department: 'Departemen',
    departmentPending: 'Ditentukan saat pengajuan',
    departmentUnavailable: 'Departemen tidak tersedia',
    budgetYear: 'Tahun anggaran',
    purpose: 'Tujuan',
    subject: 'Pos anggaran',
    selectSubject: 'Pilih pos anggaran',
    estimated: 'Perkiraan jumlah',
    actual: 'Harga aktual',
    actualAmount: 'Harga aktual (yuan)',
    yuan: 'yuan',
    expectedDate: 'Perkiraan tanggal pengiriman',
    suggestedVendor: 'Pemasok yang disarankan',
    selectedVendor: 'Pemasok terpilih',
    vendor: 'Pemasok',
    vendorUnavailable: 'Pemasok tidak tersedia',
    noSuggestedVendor: 'Tidak ada pemasok yang disarankan',
    vendorInactive: 'Pilih pemasok aktif',
    subjectInactive: 'Pilih pos anggaran aktif',
    disabled: 'Dinonaktifkan',
    inactive: 'Tidak aktif',
    fieldInvalid: 'Periksa bidang ini',
    amountInvalid: 'Masukkan jumlah positif dengan maksimal dua angka desimal',
    amountHint: 'Gunakan maksimal dua angka desimal.',
    dateInvalid: 'Pilih tanggal valid',
    items: 'Barang pembelian',
    itemName: 'Nama barang',
    itemNumber: 'Barang {{number}}',
    specification: 'Spesifikasi',
    quantity: 'Jumlah',
    unit: 'Satuan',
    quantityInvalid: 'Masukkan jumlah positif; desimal didukung',
    quantityHint: 'Jumlah desimal didukung, misalnya 1,5 kg.',
    addItem: 'Tambah barang',
    removeItem: 'Hapus barang',
    reserveHint:
      'Draf tidak mencadangkan anggaran. Pengajuan membuat penahanan.',
    loadLatest: 'Muat permintaan terbaru',
    unknownCreate:
      'Hasil penyimpanan tidak pasti. Pembuatan lain diblokir. Periksa draf di pusat tugas.',
    unknownEdit:
      'Hasil penyimpanan tidak pasti. Muat permintaan terbaru sebelum melanjutkan.',
    unknownPricing:
      'Hasil tidak pasti dan formulir dikunci. Percobaan ulang mengirim payload dan ID permintaan identik.',
    quotes: 'Bukti penawaran',
    quoteEvidence: 'Bukti penawaran pemasok',
    quoteEvidenceDescription:
      'Unggah bukti untuk setiap pemasok. Bukti yang ada dapat digunakan ulang jika persyaratan tidak berubah. Di atas ambang penawaran yang dibekukan, bukti dari tiga pemasok berbeda diwajibkan.',
    addQuote: 'Tambah penawaran pemasok',
    removeQuote: 'Hapus pilihan penawaran',
    threeQuotesRequired:
      'Di atas ambang penawaran, berikan lampiran penawaran dari tiga pemasok berbeda.',
    selectExistingQuote: 'Pilih penawaran yang ada: {{filename}}',
    refreshQuotes: 'Muat ulang penawaran yang ada',
    completePricing: 'Selesaikan penetapan harga',
    forcePricing: 'Tindakan pengadaan administrator',
    forceMode: 'Mode tindakan',
    forcePriced: 'Ajukan hasil lengkap untuk persetujuan keuangan',
    forceClose: 'Tutup paksa tanpa pesanan',
    forceCloseDescription:
      'Penutupan paksa melepaskan penahanan anggaran dan mencatat alasan administrator. Ini tidak menyatakan pengadaan atau penerimaan selesai dan tidak membuat pesanan.',
    priceConfirmationDescription:
      'Harga di atas 120% perkiraan dikembalikan kepada pemohon untuk konfirmasi. Hasil lainnya masuk ke persetujuan keuangan.',
    confirmPriceHint:
      'Harga melebihi 120% perkiraan. Periksa dan ajukan ulang untuk konfirmasi.',
    handler: 'Petugas pengadaan',
    forcedClosedHint:
      'Administrator menutup paksa permintaan ini. Penahanan dilepaskan dan tidak ada pesanan atau penerimaan dibuat.',
    actualHold: 'Penahanan anggaran saat ini',
    holdHint:
      'Persetujuan mempertahankan penahanan anggaran. Anggaran diselesaikan saat pemohon mengonfirmasi penerimaan.',
    order: 'Pesanan pembelian',
    orderHint:
      'Pesanan membekukan harga disetujui, pemasok, dan barang. Penerimaan dan pembayaran dilacak terpisah.',
    openOrder: 'Buka pesanan',
    mergedTitle: 'Persetujuan berdekatan digabungkan',
    merged:
      '{{name}} menyelesaikan tahap berdekatan secara pribadi; persetujuan orang yang sama digabungkan.',
    authz: {
      orderScope: 'Pesanan pembelian yang boleh dibaca pengguna ini',
      resource: 'Pembelian',
      submit: 'Ajukan pembelian',
      view: 'Lihat pembelian',
      orders: 'Lihat pesanan pembelian',
      accept: 'Konfirmasi penerimaan',
    },
    errors: {
      insufficient:
        'Anggaran tersedia tidak mencukupi. Hubungi pemilik anggaran.',
      inactive: 'Pemohon tidak aktif.',
      configuration:
        'Konfigurasi persetujuan tidak didukung. Hubungi administrator.',
      invalid: 'Periksa bidang yang disorot.',
    },
    states: {
      draft: 'Draf',
      revision: 'Revisi',
      head: 'Persetujuan departemen',
      purchasing: 'Penanganan pengadaan',
      exception: 'Pengecualian pengadaan',
      finance: 'Persetujuan keuangan',
      executive: 'Persetujuan eksekutif',
      gm: 'Persetujuan manajer umum',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
      forcedClosed: 'Ditutup paksa',
    },
    stages: {
      draft: 'Draf',
      revision: 'Revisi',
      head: 'Persetujuan departemen',
      purchasing: 'Penanganan pengadaan',
      exception: 'Pengecualian pengadaan',
      finance: 'Persetujuan keuangan',
      executive: 'Persetujuan eksekutif',
      gm: 'Persetujuan manajer umum',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
      forcedClosed: 'Ditutup paksa',
    },
    actions: {
      claim: 'Klaim',
      release: 'Lepaskan klaim',
      complete: 'Selesaikan penetapan harga',
      unable: 'Tidak dapat melakukan pengadaan',
      forceComplete: 'Tindakan administrator',
      cc: 'Salin',
    },
    ledgerTitle: 'Buku besar pesanan pembelian',
    ledgerDescription:
      'Tinjau pesanan pembelian disetujui, status penerimaan, dan rekaman pembayaran. Penerimaan menyelesaikan anggaran; pembayaran dicatat terpisah.',
    orderNumber: 'Nomor pesanan',
    emptyOrders: 'Tidak ada pesanan pembelian dalam cakupan Anda',
    pendingPayments: 'Pembayaran tertunda (yuan)',
    paidPayments: 'Jumlah dibayar (yuan)',
    receiptDate: 'Tanggal penerimaan',
    acceptedBy: 'Penerimaan dikonfirmasi oleh',
    receiptReason: 'Catatan penerimaan',
    confirmReceipt: 'Konfirmasi penerimaan',
    cancelOrder: 'Batalkan pesanan',
    orderSaved: 'Pesanan diperbarui',
    unknownOrderAction:
      'Hasil tidak pasti. Formulir dikunci; percobaan ulang mengirim payload dan ID permintaan identik.',
    receiptSettlementHint:
      'Konfirmasi menyelesaikan penahanan anggaran pesanan. Ini tidak berarti pemasok telah dibayar. Penerimaan yang dikonfirmasi tidak dapat diubah.',
    cancelOrderHint:
      'Hanya administrator persetujuan yang dapat membatalkan pesanan belum diterima tanpa jumlah tertunda atau dibayar. Pembatalan melepaskan penahanan anggaran dan mencatat alasan.',
    orderStates: {
      awaitingReceipt: 'Menunggu penerimaan',
      accepted: 'Diterima',
      cancelled: 'Dibatalkan',
    },
    actionTitle: '{{action}} pembelian “{{name}}”',
    completed: '{{action}} selesai untuk pembelian “{{name}}”',
    quoteBasisChanged:
      'Persyaratan pengadaan berubah. Input draf Anda dipertahankan, tetapi bukti penawaran harus sesuai dengan persyaratan terbaru.',
    frozenRules: 'Aturan diterapkan saat pengajuan',
    frozenRulesHint:
      'Hanya jumlah yang benar-benar melampaui ambang ini yang memerlukan bukti penawaran atau tahap persetujuan terkait. Perubahan aturan berikutnya tidak mengubah pengajuan ini.',
    ruleLabels: {
      purchase_quotes: 'Ambang penawaran tiga pemasok',
      spend_vp: 'Ambang persetujuan eksekutif',
      spend_gm: 'Ambang persetujuan manajer umum',
    },
    staleQuoteUpload:
      'Versi penanganan berubah. Muat ulang permintaan sebelum mengunggah bukti penawaran.',
    ordersTitle: 'Pesanan pembelian',
  },
};
