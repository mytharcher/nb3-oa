export default {
  jobGrades: {
    authz: {
      resource: 'Tabel jenjang gaji',
      view: 'Lihat riwayat publikasi',
      viewSalary: 'Baca rentang gaji',
      manage: 'Terbitkan tabel jenjang gaji',
    },

    title: 'Tabel jenjang gaji',
    description:
      'Periksa riwayat publikasi yang tidak dapat diubah dan terbitkan interval gaji lengkap.',
    publish: 'Terbitkan versi baru',
    publishing: 'Menerbitkan…',
    search: 'Cari nomor versi persis',
    empty: 'Belum ada tabel gaji diterbitkan',
    emptyDescription: 'Terbitkan tabel jenjang gaji lengkap pertama.',
    emptyReadonly: 'Minta SDM menerbitkan tabel jenjang gaji pertama.',
    noMatches: 'Tidak ada versi yang cocok',
    noMatchesDescription:
      'Hapus pencarian versi untuk melihat riwayat publikasi.',
    replacement:
      'Penerbitan mengganti seluruh tabel saat ini. Dokumen yang diajukan sebelumnya mempertahankan versinya.',
    privateDenied:
      'Anda tidak dapat membaca interval gaji. Minta akses kepada administrator.',
    publishDenied:
      'Anda tidak dapat menerbitkan tabel jenjang gaji. Minta akses kepada administrator.',
    unknown: 'Hasil publikasi belum dikonfirmasi. Ulangi publikasi awal.',
    conflict: 'Tabel saat ini berubah. Muat tabel terbaru sebelum menerbitkan.',
    inactive: 'Jenjang ini tidak tersedia. Hapus atau pilih jenjang aktif.',
    success: 'Tabel gaji “Versi {{version}}” diterbitkan',
    version: 'Versi {{version}}',
    versionColumn: 'Versi',
    publisher: 'Diterbitkan oleh',
    publishedAt: 'Diterbitkan pada',
    refresh: 'Muat ulang',
    retry: 'Coba lagi',
    retryPublication: 'Ulangi publikasi awal',
    clear: 'Hapus filter',
    loading: 'Memuat tabel jenjang gaji',
    view: 'Lihat versi',
    rowActions: 'Tindakan untuk versi {{version}}',
    grade: 'Jenjang',
    gradeCode: 'Kode jenjang',
    gradeTitle: 'Nama jenjang',
    rank: 'Peringkat dibekukan',
    minimum: 'Minimum',
    maximum: 'Maksimum',
    reason: 'Alasan publikasi',
    addGrade: 'Tambah jenjang',
    remove: 'Hapus jenjang {{index}}',
    selectGrade: 'Pilih jenjang aktif',
    removeDescription:
      'Menghapus baris hanya mengubah tabel baru yang diusulkan. Versi historis tetap tidak berubah.',
    cancel: 'Batal',
    loadLatest: 'Muat tabel terbaru',
    currentVersion: 'Versi sumber: {{version}}',
    notFound:
      'Tabel jenjang gaji ini tidak tersedia. Kembali ke riwayat publikasi.',
    failed: 'Tidak dapat memuat tabel jenjang gaji. Silakan coba lagi.',
    writeFailed: 'Publikasi ditolak. Periksa bidang dan coba lagi.',
    storageFailure:
      'Publikasi awal tidak dapat disimpan dengan aman di tab ini. Publikasi diblokir; periksa penyimpanan browser dan muat ulang.',
    unsavedTitle: 'Buang perubahan tabel gaji?',
    unsavedDescription: 'Perubahan Anda yang belum diterbitkan akan hilang.',
    discard: 'Buang perubahan',
    stay: 'Lanjutkan mengedit',
    replaceTitle: 'Ganti tabel yang diusulkan?',
    replaceDescription:
      'Memuat tabel terbaru membuang usulan ini dan memulai dari tabel saat ini yang lengkap.',
    confirmReplace: 'Ganti dan muat yang terbaru',
    noGrades:
      'Tidak ada jenjang aktif tersedia. Minta administrator organisasi mengonfigurasi jenjang.',
    reasonHint: 'Jelaskan publikasi tabel lengkap (maksimal 2.000 karakter).',
    immutable:
      'Versi yang diterbitkan ini tidak dapat diubah. Identitas dan interval jenjangnya dibekukan.',
    validation: {
      required: 'Bidang ini wajib diisi.',
      amount:
        'Masukkan jumlah nonnegatif dengan maksimal dua desimal dalam rentang yang didukung.',
      range: 'Maksimum harus lebih besar atau sama dengan minimum.',
      duplicate: 'Setiap jenjang hanya boleh muncul sekali.',
      inactive: 'Jenjang ini tidak tersedia. Hapus atau pilih jenjang aktif.',
      nonempty: 'Sertakan setidaknya satu jenjang aktif.',
      reasonLength: 'Gunakan maksimal 2.000 karakter.',
      server: 'Periksa bidang ini dan coba lagi.',
    },
  },
};
