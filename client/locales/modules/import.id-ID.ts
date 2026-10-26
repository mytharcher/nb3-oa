/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Impor data' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Impor data',
      read: 'Lihat riwayat dan templat',
      update: 'Impor',
    },
    title: 'Impor data',
    description:
      'Impor departemen, jabatan, jenjang, arsip karyawan, dan anggota peran tanggung jawab dari templat Excel.',
    kinds: {
      departments: 'Departemen',
      positions: 'Jabatan',
      grades: 'Jenjang',
      employees: 'Arsip karyawan',
      dutyRoleMembers: 'Anggota peran tanggung jawab',
    },
    kindHints: {
      departments:
        'Dicocokkan berdasarkan kode departemen. Induk dapat ditentukan lebih bawah dalam lembar.',
      positions: 'Dicocokkan berdasarkan kode jabatan.',
      grades: 'Dicocokkan berdasarkan kode jenjang.',
      employees:
        'Dicocokkan berdasarkan nomor karyawan. Impor departemen, jabatan, dan jenjang terlebih dahulu; manajer dapat ditentukan dalam lembar yang sama.',
      dutyRoleMembers:
        'Dicocokkan berdasarkan kode peran dan akun. "No" pada kolom aktif menghapus anggota.',
    },
    actions: {
      new: 'Impor baru',
      templates: 'Unduh templat',
      templateFor: 'Unduh templat {{kind}}',
      check: 'Periksa',
      checking: 'Memeriksa…',
      confirm: 'Impor',
      importing: 'Mengimpor…',
      chooseAgain: 'Pilih file lain',
      back: 'Kembali',
      chooseFile: 'Pilih file',
      downloadFile: 'Unduh file asli',
      refresh: 'Muat ulang',
      clearFilters: 'Hapus filter',
    },
    fields: {
      kind: 'Jenis',
      file: 'File',
      createdAt: 'Dimulai',
      finishedAt: 'Selesai',
      status: 'Hasil',
      summary: 'Ringkasan',
      actor: 'Oleh',
      rowCount: 'Baris dibaca',
      createdCount: 'Dibuat',
      updatedCount: 'Diperbarui',
      unchangedCount: 'Tidak berubah',
      errorCount: 'Masalah',
      row: 'Baris',
      column: 'Kolom',
      problem: 'Masalah',
    },
    filters: { allKinds: 'Semua jenis' },
    status: { succeeded: 'Berhasil', failed: 'Gagal' },
    summary: {
      succeeded:
        '{{created}} dibuat · {{updated}} diperbarui · {{unchanged}} tidak berubah',
      failed: 'Masalah: {{count}}',
    },
    noFile: 'Belum ada file dipilih',
    templateFile: 'templat impor {{kind}}.xlsx',
    fileHint: 'Buku kerja .xlsx maksimal 5 MB, disusun sesuai templat.',
    notice: {
      title: 'Sebelum mengimpor',
      accounts:
        'Impor tidak pernah membuat akun: setiap akun yang disebutkan dalam file (nama pengguna atau email) harus sudah ada dan aktif, atau barisnya dilaporkan.',
      atomic:
        'Seluruh file diperiksa terlebih dahulu dan ditulis sekaligus: jika ada baris bermasalah, tidak ada yang ditulis.',
    },
    validation: {
      kindRequired: 'Pilih isi file.',
      fileRequired: 'Pilih file .xlsx.',
      fileType: 'Hanya buku kerja .xlsx yang dapat diimpor.',
      fileSize: 'File lebih besar dari 5 MB. Pisahkan menjadi beberapa file.',
    },
    report: {
      invalidTitle: 'Masalah ditemukan: {{count}}. Tidak ada yang diimpor.',
      invalidDescription:
        'Koreksi baris di bawah dalam file, lalu periksa lagi.',
      truncated:
        'Hanya {{shown}} masalah pertama dari {{count}} yang ditampilkan.',
      okTitle: 'File lolos pemeriksaan',
      okDescription:
        '{{rows}} baris dibaca: {{created}} akan dibuat, {{updated}} diperbarui, dan {{unchanged}} dibiarkan tidak berubah.',
      wholeFile: 'File',
    },
    toast: {
      imported: '"{{name}}" diimpor',
      templateFailed: 'Tidak dapat mengunduh templat. Coba lagi.',
    },
    failure: {
      forbidden: 'Anda tidak memiliki izin untuk mengimpor.',
      tooLarge: 'File lebih besar dari 5 MB. Pisahkan menjadi beberapa file.',
      invalidFile: 'File tidak dapat dikirim. Pilih buku kerja .xlsx.',
      generic: 'Permintaan gagal. Periksa koneksi Anda dan coba lagi.',
    },
    empty: {
      title: 'Belum ada impor',
      description:
        'Unduh templat, isi, dan impor untuk memasukkan departemen, orang, dan peran.',
      readOnly:
        'Belum ada impor. Minta administrator mengimpor data organisasi.',
    },
    noResults: 'Tidak ada impor yang cocok dengan filter.',
    loadFailedTitle: 'Tidak dapat memuat riwayat impor',
    detail: {
      title: 'Detail impor · {{name}}',
      titleLoading: 'Detail impor',
      notFound: 'Impor ini tidak ada atau telah dihapus.',
      problems: 'Masalah',
    },
    common: {
      forbidden: 'Anda tidak memiliki izin untuk melihat ini.',
      notFound: 'Rekaman ini tidak ada atau telah dihapus.',
      loadFailed:
        'Tidak dapat memuat data. Periksa koneksi Anda dan coba lagi.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'File bukan buku kerja .xlsx yang dapat dibaca. Simpan sebagai buku kerja Excel dan coba lagi.',
      SHEET_EMPTY:
        'Lembar pertama tidak memiliki baris data. Isi baris di bawah header.',
      TOO_MANY_ROWS:
        'File memiliki lebih dari {{max}} baris. Pisahkan menjadi beberapa file.',
      HEADER_MISSING: 'Kolom wajib "{{header}}" tidak ada pada baris header.',
      HEADER_DUPLICATE: 'Kolom "{{header}}" muncul lebih dari sekali.',
      REQUIRED: 'Wajib.',
      INVALID_CODE:
        '"{{value}}" bukan kode valid: gunakan huruf, angka, ".", "_", dan "-", maksimal 64 karakter.',
      TOO_LONG: 'Lebih panjang dari {{max}} karakter.',
      INVALID_INTEGER: '"{{value}}" bukan bilangan bulat.',
      INVALID_BOOLEAN: '"{{value}}" bukan 是 / 否 (ya / tidak).',
      CAREER_START_FUTURE:
        'Tanggal pertama bekerja tidak boleh setelah hari ini dalam zona waktu kalender kerja.',
      CAREER_START_AFTER_HIRE:
        'Tanggal pertama bekerja tidak boleh setelah tanggal mulai bekerja.',
      INVALID_DATE:
        '"{{value}}" bukan tanggal valid. Gunakan sel tanggal atau YYYY-MM-DD.',
      INVALID_STATUS:
        '"{{value}}" bukan status: gunakan 试用, 正式, 离职中, atau 已离职.',
      INVALID_EMAIL: '"{{value}}" bukan alamat email.',
      DUPLICATE_IN_FILE: '"{{value}}" sudah muncul pada baris {{firstRow}}.',
      USER_NOT_FOUND:
        'Tidak ada akun "{{value}}". Impor tidak pernah membuat akun: buat dahulu di halaman Pengguna.',
      USER_DISABLED:
        'Akun "{{value}}" dinonaktifkan. Aktifkan dahulu di halaman Pengguna.',
      USER_TAKEN: 'Akun "{{value}}" sudah milik karyawan {{code}}.',
      USER_MISMATCH:
        'Nomor karyawan ini terikat pada akun lain; arsip mempertahankan akunnya.',
      PARENT_NOT_FOUND:
        'Tidak ada departemen dengan kode "{{value}}" dalam file atau sistem.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Hanya departemen tingkat teratas yang dapat menunjuk eksekutif; departemen anak mewarisinya.',
      PARENT_CYCLE: 'Departemen induk membentuk siklus.',
      DEPARTMENT_NOT_FOUND:
        'Tidak ada departemen dengan kode "{{value}}". Impor departemen terlebih dahulu.',
      DEPARTMENT_INACTIVE: 'Departemen "{{value}}" dinonaktifkan.',
      POSITION_NOT_FOUND: 'Tidak ada jabatan dengan kode "{{value}}".',
      POSITION_INACTIVE: 'Jabatan "{{value}}" dinonaktifkan.',
      GRADE_NOT_FOUND: 'Tidak ada jenjang dengan kode "{{value}}".',
      GRADE_INACTIVE: 'Jenjang "{{value}}" dinonaktifkan.',
      MANAGER_NOT_FOUND:
        'Tidak ada nomor karyawan "{{value}}" dalam file atau sistem.',
      MANAGER_SELF: 'Karyawan tidak dapat menjadi manajer dirinya sendiri.',
      MANAGER_INACTIVE: 'Manajer "{{value}}" sudah berhenti.',
      MANAGER_CYCLE: 'Manajer membentuk siklus.',
      DUTY_ROLE_INACTIVE:
        'Peran ini tidak aktif; anggota baru tidak dapat ditambahkan.',
      DUTY_ROLE_NOT_FOUND:
        'Tidak ada peran tanggung jawab dengan kode "{{value}}".',
      WRITE_FAILED:
        'Baris ini tidak dapat ditulis ({{reason}}), sehingga tidak ada yang diimpor. Periksa baris dan coba lagi.',
      unknown: 'Baris ini tidak dapat diimpor.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;
