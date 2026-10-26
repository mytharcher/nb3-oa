export default {
  supplies: {
    namedRowActions: 'Tindakan untuk {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS:
        'Tambahkan setidaknya satu barang dan masukkan tujuannya.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Barang terpilih tidak tersedia. Pilih kembali barang aktif.',
      SUPPLY_CONTENT_CHANGED:
        'Barang disetujui berubah. Muat ulang permintaan sebelum mencatat penyerahan.',
    },

    rowActions: 'Tindakan rekaman',
    number: 'Nomor permintaan',
    unknownEdit:
      'Hasil penyimpanan tidak pasti. Muat permintaan terbaru sebelum mengedit lagi.',
    emptyCatalog:
      'Belum ada barang kantor aktif dikonfigurasi. Hubungi Administrasi.',
    ledgerDetail: 'Rekaman penyerahan',
    ledgerDescription:
      'Jumlah tercatat dan penutupan administratif. Jumlah yang belum dikonfirmasi tidak membuktikan penyerahan.',
    entryMissing: 'Rekaman penyerahan ini tidak tersedia.',
    authz: {
      resource: 'Permintaan perlengkapan',
      ledger: 'Baca buku besar penyerahan perlengkapan',
    },
    navigation: 'Buku besar perlengkapan',
    new: 'Permintaan perlengkapan baru',
    edit: 'Edit permintaan perlengkapan',
    formDescription:
      'Pilih barang dan jumlah. Manajer Anda menyetujui permintaan sebelum Administrasi menyerahkannya.',
    purpose: 'Tujuan',
    item: 'Barang',
    items: 'Barang diminta',
    quantity: 'Jumlah',
    quantityValue: 'Jumlah: {{quantity}}',
    chooseItem: 'Pilih barang',
    line: 'Barang {{number}}',
    remove: 'Hapus barang {{number}}',
    addItem: 'Tambah barang',
    quantityInvalid: 'Masukkan jumlah bulat antara 1 dan 100.000.',
    duplicate: 'Pilih setiap barang sekali.',
    emailInvalid: 'Masukkan alamat email yang valid.',
    printRequired: 'Lengkapi informasi pencetakan kartu nama yang diwajibkan.',
    print: {
      name: 'Nama',
      title: 'Nama jabatan',
      phone: 'Telepon',
      email: 'Email',
      address: 'Alamat',
      department: 'Departemen (opsional)',
    },
    approvedAt: 'Waktu persetujuan manajer',
    issuingStage: 'Penyerahan administratif',
    resubmitHint:
      'Pengajuan ulang dengan barang dan tujuan tidak berubah kembali ke Administrasi. Perubahannya memerlukan persetujuan manajer lagi. Persetujuan sebelumnya tetap dalam riwayat.',
    forcedHint:
      'Administrator persetujuan menutup permintaan ini tanpa mengonfirmasi penyerahan fisik. Jumlah aktual belum dikonfirmasi.',
    uncertainCreate:
      'Hasil penyimpanan tidak pasti. Tutup dan periksa Permintaan saya sebelum membuat draf lain.',
    invalid: 'Periksa tujuan, pilihan barang, dan jumlah bulat.',
    itemUnavailable:
      'Barang dinonaktifkan atau tidak ada. Muat ulang sebelum mengajukan konten yang diubah.',
    inactive: 'Arsip karyawan aktif diperlukan.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    contentChanged:
      'Konten tidak lagi sesuai dengan permintaan disetujui. Muat versi terbaru.',
    reasonRequired: 'Berikan alasan.',
    actions: {
      claim: 'Klaim penyerahan',
      release: 'Lepaskan klaim',
      assign: 'Tetapkan petugas',
      complete: 'Konfirmasi penerbitan',
      unable: 'Tidak dapat menerbitkan',
      forceComplete: 'Tutup paksa',
    },
    actionHints: {
      complete:
        'Konfirmasikan bahwa setiap barang yang diminta telah diserahkan secara fisik dalam jumlah penuh. Ini menulis buku besar penyerahan.',
      unable:
        'Jelaskan kekurangan stok atau alasan lain penyerahan tidak dapat diselesaikan. Persetujuan manajer dipertahankan.',
      release:
        'Lepaskan klaim ini agar petugas administrasi lain dapat mengambilnya.',
      forceComplete:
        'Tutup berdasarkan keputusan administratif tanpa mengonfirmasi penyerahan. Jumlah aktual dicatat sebagai belum dikonfirmasi. Alasan diperlukan.',
    },
    states: {
      issuing: 'Menunggu penyerahan',
      exception: 'Pengecualian penerbitan',
      issued: 'Diserahkan',
      forcedClosed: 'Ditutup secara administratif',
    },
    ledgerTitle: 'Buku besar penyerahan perlengkapan',
    requestedQuantity: 'Jumlah diminta',
    actualQuantity: 'Jumlah aktual',
    outcome: 'Hasil',
    recipient: 'Penerima',
    issuer: 'Petugas',
    unconfirmed: 'Belum dikonfirmasi',
    reason: 'Alasan',
    emptyLedger: 'Tidak ada rekaman penyerahan',
    viewRequest: 'Lihat permintaan',
  },
};
