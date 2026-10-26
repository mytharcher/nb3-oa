export default {
  vendors: {
    saved: 'Pemasok "{{name}}" disimpan',

    title: 'Pemasok',
    description:
      'Pengadaan mengelola pemasok manual. Pesanan disetujui mempertahankan fakta pemasok yang tercatat.',
    new: 'Pemasok baru',
    edit: 'Edit pemasok',
    view: 'Detail pemasok',
    refresh: 'Muat ulang',
    search: 'Cari nama, kode, atau kategori',
    clear: 'Hapus filter',
    rowActions: 'Tindakan untuk {{name}}',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuat pemasok',
    retry: 'Coba lagi',
    active: 'Aktif',
    status: 'Status',
    statuses: {
      manual: 'Pemasok manual',
      qualified: 'Berkualifikasi',
      disabled: 'Dinonaktifkan',
    },
    updatedAt: 'Diperbarui',
    reason: 'Alasan perubahan ini',
    formDescription:
      'Perubahan pemasok dan detail bank diaudit. Penonaktifan mencegah pembelian dan pembayaran baru.',
    disableHint: 'Pembelian baru dan detail rekening pembayaran akan diblokir.',
    required: 'Bidang ini wajib diisi.',
    invalidCode: 'Gunakan huruf, angka, titik, tanda hubung, atau garis bawah.',
    invalidEmail: 'Masukkan alamat email yang valid.',
    noChanges: 'Ubah setidaknya satu bidang sebelum menyimpan.',
    unknownCreate:
      'Hasil pembuatan tidak diketahui. Periksa daftar pemasok dan kodenya sebelum membuat pemasok lain.',
    unknownEdit:
      'Hasil tidak diketahui. Muat pemasok terbaru sebelum mencoba lagi; perubahan Anda yang belum tersimpan akan dipertahankan.',
    loadLatest: 'Muat pemasok terbaru',
    fields: {
      code: 'Kode',
      name: 'Nama',
      category: 'Kategori',
      contactName: 'Kontak',
      contactPhone: 'Telepon',
      contactEmail: 'Email',
      bankName: 'Bank',
      bankAccount: 'Rekening bank',
      bankAccountName: 'Nama rekening',
    },
    authz: {
      resource: 'Pemasok',
      view: 'Baca detail pemasok',
      manage: 'Kelola pemasok',
      bankRead: 'Baca informasi bank',
      createdScope: 'Pemasok yang dibuat pengguna saat ini',
    },
    empty: {
      accountsTitle: 'Tidak ada pemasok',
      accountsDescription: 'Tambahkan pemasok manual untuk pengadaan.',
      readonlyTitle: 'Tidak ada pemasok yang dapat dibaca',
      readonlyDescription:
        'Tidak ada pemasok dalam cakupan yang diberikan kepada Anda. Minta bagian pembelian menambahkan pemasok, atau minta izin Kelola pemasok kepada administrator.',
      filteredTitle: 'Tidak ada pemasok yang cocok',
      filteredDescription: 'Ubah atau hapus pencarian.',
    },
    error: {
      forbidden: 'Anda tidak memiliki izin untuk mengakses pemasok ini.',
      missing: 'Pemasok ini tidak tersedia. Muat ulang daftar induknya.',
      invalid: 'Periksa bidang pemasok.',
      failed: 'Pemasok tidak dapat dimuat atau disimpan. Coba lagi.',
      VENDOR_INVALID_INPUT: 'Periksa bidang kontak dan bank pemasok.',
      VENDOR_INVALID_COMMAND: 'Pelaku dan alasan perubahan diperlukan.',
      VENDOR_CODE_EXISTS: 'Kode ini sudah milik pemasok.',
      VENDOR_VERSION_CONFLICT:
        'Pemasok ini berubah. Muat versi terbaru sebelum mencoba lagi.',
      VENDOR_NOT_FOUND: 'Pemasok ini tidak tersedia.',
      VENDOR_INACTIVE: 'Pilih pemasok aktif.',
      VENDOR_FIELDS_RESTRICTED:
        'Bidang pemasok di luar izin yang diberikan kepada Anda.',
      VENDOR_ACCESS_DENIED:
        'Anda tidak memiliki izin untuk tindakan pemasok ini.',
      VENDOR_PAYMENT_ACCOUNT_REQUIRED:
        'Lengkapi detail bank pemasok sebelum pembayaran.',
    },
  },
};
