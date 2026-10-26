export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'Tabel gaji saat ini berubah. Muat ulang sebelum menerbitkan.',
      IDEMPOTENCY_CONFLICT:
        'Kunci publikasi sudah digunakan dengan konten berbeda.',
      TABLE_UNAVAILABLE: 'Tabel gaji belum diinisialisasi.',
      GRADE_UNAVAILABLE: 'Jenjang wajib tidak tersedia atau tidak aktif.',
      INVALID_PUBLICATION: 'Input publikasi tidak valid.',
      STORED_DATA_INVALID: 'Data tabel gaji tersimpan tidak valid.',
      INVALID_RANGE: 'Rentang gaji harus memuat jumlah bilangan bulat valid.',
      DUPLICATE_GRADE: 'Setiap jenjang harus muncul sekali.',
      OUTSIDE_RANGE: 'Gaji yang ditawarkan di luar interval yang diterbitkan.',

      ACCESS_DENIED:
        'Operasi jenjang gaji ini di luar cakupan yang diberikan kepada Anda.',
      NOT_FOUND: 'Revisi jenjang gaji tidak tersedia.',
    },
    authz: {
      resource: 'Tabel jenjang gaji',
      view: 'Lihat riwayat publikasi',
      viewSalary: 'Baca rentang gaji',
      manage: 'Terbitkan tabel jenjang gaji',
    },
  },
};
