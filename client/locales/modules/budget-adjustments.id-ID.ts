export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Pilih departemen aktif dan tahun anggaran valid.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Masukkan nilai penyesuaian positif dan alasannya.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT: 'Pilih pos anggaran aktif.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Untuk transfer, gunakan pos sumber dan tujuan berbeda. Untuk penambahan, kosongkan pos sumber.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'Kepala departemen tidak tersedia. Minta administrator memperbarui penetapan departemen.',
    },

    authz: {
      resource: 'Penyesuaian anggaran',
      submit: 'Ajukan penyesuaian anggaran',
      delegate: 'Ajukan penyesuaian anggaran untuk karyawan',
      view: 'Baca penyesuaian anggaran',
    },
    new: 'Penyesuaian anggaran baru',
    edit: 'Edit penyesuaian anggaran',
    formDescription: 'Usulkan transfer antarpos atau anggaran tambahan.',
    department: 'Departemen anggaran',
    yearInvalid: 'Masukkan tahun bilangan bulat antara 1900 dan 9999.',
    year: 'Tahun anggaran',
    type: 'Jenis penyesuaian',
    transfer: 'Transfer antarpos',
    increase: 'Anggaran tambahan',
    targetSubject: 'Pos tujuan',
    sourceSubject: 'Pos sumber',
    amount: 'Jumlah (yuan)',
    yuan: 'yuan',
    reason: 'Alasan',
    amountInvalid:
      'Masukkan jumlah desimal positif dengan maksimal dua angka desimal dalam batas aman.',
    sourceInvalid: 'Pilih pos sumber dan tujuan yang berbeda.',
    amountHint:
      'Gunakan yuan desimal. Jumlah disimpan sebagai bilangan bulat sen yang presisi.',
    reserveHint:
      'Pengajuan mencadangkan dana sumber untuk transfer. Anggaran berlaku hanya setelah persetujuan akhir.',
    revisionHold:
      'Pencadangan awal tetap berlaku saat dikembalikan. Mengubah usulan hanya melepaskan dan menggantinya saat diajukan ulang.',
    retainedHold:
      'Pencadangan awal saat ini: {{subject}} · {{amount}} yuan. Ini terpisah dari usulan yang direvisi.',
    actualHold: 'Pencadangan sumber saat ini',
    frozenThreshold:
      'Ambang manajer umum saat pengajuan penambahan: {{amount}} yuan (hanya jika benar-benar melampauinya).',
    applied: 'Persetujuan akhir telah menerapkan penyesuaian anggaran ini.',
    reserved: 'Dana sumber dicadangkan; penyesuaian ini belum berlaku.',
    awaitingEffect:
      'Usulan ini belum berlaku. Anggaran tambahan diterapkan hanya setelah persetujuan akhir.',
    insufficient:
      'Dana tersedia pada anggaran sumber tidak mencukupi. Periksa jumlah dan sumber; input Anda dipertahankan.',
    subjectInactive:
      'Pos ini dinonaktifkan. Pilih pos aktif sebelum mengajukan.',
    disabled: 'Dinonaktifkan',
    inactive: 'Pemohon harus karyawan aktif.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    invalid: 'Periksa akun, jenis penyesuaian, jumlah, dan alasan.',
    uncertainCreate:
      'Hasil penyimpanan tidak pasti. Tutup dan periksa Permintaan saya sebelum membuat draf lain.',
    stages: {
      head: 'Kepala departemen',
      finance: 'Manajer keuangan',
      cfo: 'Direktur keuangan',
      gm: 'Manajer umum',
    },
  },
};
