export default {
  headcounts: {
    authz: {
      title: 'Kapasitas jumlah karyawan',
      view: 'Lihat kapasitas',
      manage: 'Kelola kapasitas tahunan',
      viewJournal: 'Lihat jurnal sumber',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Daftar karyawan lengkap tidak dapat dibaca. Minta administrator memeriksa izin baca karyawan.',
      HEADCOUNT_ACCESS_DENIED:
        'Anda tidak memiliki izin untuk melakukan operasi jumlah karyawan ini.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Bidang ringkasan kapasitas di luar izin Anda.',
      HEADCOUNT_NOT_FOUND: 'Akun jumlah karyawan tidak tersedia.',
      HEADCOUNT_ALREADY_EXISTS:
        'Departemen, jabatan, dan tahun ini sudah memiliki akun.',
      HEADCOUNT_NOT_INITIALIZED:
        'Rekonsiliasi daftar karyawan lengkap sebelum mencadangkan kapasitas.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Pilih daftar karyawan masa percobaan, tetap, dan yang akan berhenti secara lengkap dan aktual.',
      HEADCOUNT_ROSTER_DRIFT:
        'Daftar karyawan aktual berubah. Rekonsiliasi fakta sumbernya sebelum melanjutkan.',
      HEADCOUNT_VERSION_CONFLICT: 'Akun berubah. Muat ulang sebelum menyimpan.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT:
        'Pengenal permintaan ini sudah milik operasi lain.',
      HEADCOUNT_INSUFFICIENT:
        'Batas tahunan tidak dapat mencakup jumlah karyawan yang terisi dan dicadangkan secara aktual.',
      HEADCOUNT_INVALID_NUMBER:
        'Masukkan jumlah orang bilangan bulat dalam batas yang didukung.',
      HEADCOUNT_INVALID_ACCOUNT: 'Pilih departemen, jabatan, dan tahun nyata.',
      HEADCOUNT_INVALID_IDENTITY:
        'Pilih departemen dan jabatan organisasi aktif.',
      HEADCOUNT_INVALID_COMMAND:
        'Pelaku, pengenal permintaan, dan alasan diperlukan.',
      HEADCOUNT_INVALID_SOURCE: 'Jenis dan pengenal sumber nyata diperlukan.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Setiap posisi pengganti memerlukan karyawan berbeda yang akan berhenti.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Sumber pengganti harus sesuai dengan pengisian nyata yang akan atau sudah berhenti.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Pengisian pengganti ini tidak ada atau sudah diklaim.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Karyawan sumber yang dipulihkan memblokir pengganti ini.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Arsip karyawan tidak tersedia.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Karyawan aktual tidak sesuai dengan departemen dan jabatan yang dialokasikan.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Karyawan ini sudah mengisi akun tahunan ini.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Alihkan ikatan ke tahun perusahaan saat ini secara eksplisit sebelum digunakan.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Sumber kapasitas tidak tersedia.',
      HEADCOUNT_SOURCE_EXISTS: 'Sumber ini sudah memiliki pencadangan.',
      HEADCOUNT_SOURCE_STATE: 'Kondisi sumber tidak mengizinkan operasi ini.',
      HEADCOUNT_SOURCE_CLOSED: 'Sumber kapasitas sudah ditutup.',
      HEADCOUNT_SEAT_STATE: 'Posisi pencadangan tidak tertunda.',
      HEADCOUNT_STATE_CONFLICT: 'Posisi pencadangan berubah.',
      HEADCOUNT_NO_ALLOCATION:
        'Tidak ada posisi tersedia yang disetujui tersisa.',
      HEADCOUNT_NOT_LEFT:
        'Pemberhentian aktual diperlukan sebelum melepaskan kapasitas terisi.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Pengisian karyawan nyata yang belum dilepaskan diperlukan.',
      HEADCOUNT_NOT_RESTORED:
        'Pemulihan aktual diperlukan sebelum memblokir pengganti mendatang.',
      HEADCOUNT_INVALID_REBIND:
        'Pengalihan ikatan tahunan harus mempertahankan departemen dan jabatan serta bergerak maju.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Kredit pengganti memerlukan sumber tahun tujuan eksplisit.',
      HEADCOUNT_INVALID_TRANSFER:
        'Pencadangan tujuan disetujui yang berbeda diperlukan.',
      HEADCOUNT_INVALID_PAGE: 'Pilih ukuran halaman antara 1 dan 100.',
      HEADCOUNT_GUARD_UNAVAILABLE:
        'Pengaman transaksi kapasitas tidak tersedia.',
    },
  },
};
