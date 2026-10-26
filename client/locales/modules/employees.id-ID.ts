/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Muat ulang',
    personal: {
      title: 'Arsip pribadi',
      description:
        'Lihat detail karyawan Anda; hubungi SDM untuk memperbaiki kesalahan.',
      identity: '{{name}} · {{code}}',
      basic: 'Informasi dasar',
      profile: 'Detail pribadi',
      bank: 'Rekening pembayaran',
      emptyTitle: 'Belum ada arsip karyawan',
      emptyDescription:
        'Hubungi SDM untuk membuat arsip karyawan bagi akun Anda.',
      profileMissing:
        'Detail pribadi tidak ditemukan; hubungi SDM untuk memeriksa arsip Anda.',
      forbidden:
        'Tidak dapat mengakses arsip Anda; hubungi administrator untuk memeriksa akses.',
      refresh: 'Muat ulang',
    },
    authz: {
      section: 'Karyawan',
      settings: 'Halaman arsip karyawan',
      settingsRead: 'Buka',
      collections: {
        employees: 'Arsip karyawan',
        employeeProfiles: 'Informasi karyawan terbatas',
        employeeCompensation: 'Kompensasi karyawan',
      },
      archive: {
        title: 'Arsip karyawan',
        view: 'Lihat',
        manage: 'Buat dan edit',
        correctStatus: 'Koreksi status',
      },
      profile: {
        title: 'Informasi karyawan terbatas',
        view: 'Lihat semua',
        viewBank: 'Lihat rekening bank',
        update: 'Edit',
      },
      compensation: {
        title: 'Kompensasi karyawan',
        view: 'Lihat',
      },
      directory: {
        title: 'Direktori',
        view: 'Lihat orang',
        viewContact: 'Lihat telepon dan email',
      },
      scopes: {
        reports: 'Bawahan saya (semua tingkat)',
        selfAndReports: 'Saya dan bawahan saya',
        reportsHint:
          'Orang di bawah pengguna dalam garis pelaporan, pada kedalaman apa pun; manajer tidak aktif di antaranya tidak memutus hubungan.',
      },
      subjects: {
        position: 'Jabatan',
        reportingManager: 'Manajer langsung',
      },
    },
    permissionSets: {
      hr: 'SDM: arsip karyawan',
      compensation: 'Kompensasi karyawan (manajer umum, direktur keuangan)',
      bank: 'Rekening bank karyawan (keuangan)',
      manager: 'Manajer langsung: arsip bawahan',
      head: 'Kepala departemen: arsip departemen',
      admin: 'Koreksi data arsip karyawan',
      directory: 'Direktori',
    },
    navigation: {
      archive: 'Karyawan',
      directory: 'Direktori',
    },
    title: 'Karyawan',
    description:
      'Kelola akun, garis pelaporan, jabatan, dan informasi terbatas setiap karyawan.',
    fields: {
      name: 'Nama',
      code: 'Kode karyawan',
      user: 'Akun',
      primaryDepartment: 'Departemen utama',
      position: 'Jabatan',
      grade: 'Jenjang',
      manager: 'Manajer langsung',
      status: 'Status',
      careerStartDate: 'Tanggal pertama bekerja',
      hireDate: 'Tanggal mulai bekerja',
      probationEndDate: 'Tanggal akhir masa percobaan',
      lastWorkingDay: 'Hari kerja terakhir',
      phone: 'Telepon',
      email: 'Email',
      workLocation: 'Lokasi kerja',
      emergencyContact: 'Kontak darurat',
      active: 'Aktif',
      updatedAt: 'Diperbarui',
      idType: 'Jenis identitas',
      idNumber: 'Nomor identitas',
      birthDate: 'Tanggal lahir',
      address: 'Alamat',
      education: 'Pendidikan',
      school: 'Sekolah',
      major: 'Jurusan',
      bankName: 'Bank',
      bankAccount: 'Rekening bank',
      bankAccountName: 'Pemilik rekening',
      effectiveFrom: 'Berlaku sejak',
      baseSalary: 'Gaji pokok',
      sourceApplication: 'Permohonan sumber',
      note: 'Catatan',
      kind: 'Perubahan',
      effectiveAt: 'Tanggal berlaku',
      changes: 'Perubahan',
    },
    status: {
      probation: 'Dalam masa percobaan',
      regular: 'Tetap',
      leaving: 'Akan berhenti',
      left: 'Sudah berhenti',
    },
    historyKind: {
      hire: 'Penerimaan',
      regularization: 'Pengangkatan tetap',
      transfer: 'Alihkan',
      salaryChange: 'Perubahan gaji',
      departure: 'Pemberhentian',
      correction: 'Koreksi data',
    },
    boolean: {
      yes: 'Ya',
      no: 'Tidak',
    },
    search: {
      placeholder: 'Cari berdasarkan nama atau kode karyawan',
      label: 'Cari karyawan',
    },
    filters: {
      department: 'Departemen',
      allDepartments: 'Semua departemen',
      status: 'Status',
      allStatuses: 'Semua status',
      clear: 'Hapus filter',
    },
    empty: {
      title: 'Belum ada arsip karyawan',
      description:
        'Buat arsip untuk menautkan akun, garis pelaporan, dan jabatan.',
      descriptionReadOnly:
        'Belum ada arsip yang terlihat bagi Anda. Tanyakan kepada SDM jika seharusnya ada.',
      noResults: 'Tidak ada karyawan yang cocok dengan filter.',
    },
    error: {
      title: 'Tidak dapat memuat karyawan',
      requestFailed: 'Permintaan gagal. Periksa koneksi dan coba lagi.',
      forbidden: 'Anda tidak memiliki izin untuk melihat ini.',
      notFound: 'Arsip karyawan ini tidak ada atau telah dihapus.',
      tabForbidden: 'Anda tidak memiliki izin untuk melihat bagian ini.',
    },
    actions: {
      label: 'Tindakan',
      more: 'Tindakan untuk {{name}}',
      edit: 'Edit',
      correctStatus: 'Koreksi status',
      editProfile: 'Edit',
      moreActions: 'Tindakan lainnya',
    },
    create: {
      action: 'Karyawan baru',
      title: 'Karyawan baru',
      description: 'Tautkan akun dan isi arsip.',
      submit: 'Buat',
      success: 'Karyawan “{{name}}” dibuat',
    },
    edit: {
      title: 'Edit karyawan',
      success: 'Karyawan “{{name}}” disimpan',
    },
    form: {
      basicSection: 'Informasi dasar',
      contactSection: 'Kontak',
      nameRequired: 'Masukkan nama.',
      codeRequired: 'Masukkan kode karyawan.',
      userRequired: 'Pilih akun untuk ditautkan.',
      careerStartInvalid: 'Pilih tanggal pertama bekerja yang valid.',
      careerStartFuture:
        'Tanggal pertama bekerja tidak boleh di masa mendatang.',
      careerStartAfterHire:
        'Tanggal pertama bekerja tidak boleh setelah tanggal mulai bekerja.',
      hireDateRequired: 'Pilih tanggal mulai bekerja.',
      tooLong: 'Gunakan maksimal {{max}} karakter.',
      emailInvalid: 'Format email tidak valid.',
      userTaken: 'Akun ini sudah memiliki arsip.',
      codeTaken: 'Kode karyawan ini sudah digunakan.',
      userInvalid: 'Akun ini tidak ada atau dinonaktifkan.',
      managerInvalid: 'Pilih karyawan aktif yang bukan bawahan orang ini.',
      positionInvalid: 'Jabatan ini tidak ada atau dinonaktifkan.',
      gradeInvalid: 'Jenjang ini tidak ada atau dinonaktifkan.',
      initialStatus: 'Status awal',
      managerPlaceholder: 'Cari berdasarkan nama atau kode karyawan',
      managerEmpty: 'Tidak ada karyawan yang cocok',
      none: 'Tidak ada',
      positionPlaceholder: 'Pilih jabatan',
      gradePlaceholder: 'Pilih jenjang',
      optionsFailed: 'Opsi tidak dapat dimuat.',
      userPlaceholder: 'Cari akun berdasarkan nama atau email',
    },
    page: {
      title: 'Karyawan',
      tabsLabel: 'Bagian karyawan',
    },
    tabs: {
      basic: 'Informasi dasar',
      profile: 'Informasi terbatas',
      compensation: 'Kompensasi',
      history: 'Riwayat perubahan',
    },
    profile: {
      title: 'Informasi terbatas',
      description:
        'Identitas, alamat, pendidikan, dan rekening bank; hanya terlihat bagi peran berizin.',
      bankOnly: 'Anda hanya dapat melihat rekening bank.',
      editTitle: 'Edit informasi terbatas',
      success: 'Informasi terbatas “{{name}}” disimpan',
      identitySection: 'Identitas',
      educationSection: 'Pendidikan',
      bankSection: 'Rekening bank',
    },
    compensation: {
      title: 'Kompensasi',
      description:
        'Setiap pengangkatan tetap dan perubahan gaji menambah baris; baris tidak pernah diedit.',
      empty: 'Belum ada rekaman kompensasi.',
    },
    history: {
      referenceNotice:
        'Nama referensi menggunakan direktori saat ini; nama pada saat perubahan tidak disimpan.',
      sources: {
        onboarding: 'Penerimaan karyawan',
        departure: 'Pemberhentian',
        transfer: 'Perubahan kepegawaian',
        probation: 'Pengangkatan tetap',
        other: 'Operasi bisnis lainnya',
      },
      referenceUnavailable: 'Referensi historis tidak tersedia',
      personUnavailable: 'Orang historis tidak tersedia',
      otherField: 'Perubahan lainnya',
      title: 'Riwayat perubahan',
      description:
        'Penerimaan, pengangkatan tetap, mutasi, pemberhentian, dan koreksi data.',
      empty: 'Belum ada perubahan tercatat.',
    },
    correction: {
      title: 'Koreksi status',
      description:
        'Koreksi data di luar alur persetujuan. Ini diaudit beserta alasan Anda.',
      reason: 'Alasan',
      reasonPlaceholder: 'Mengapa status tercatat salah',
      reasonRequired: 'Masukkan alasan koreksi.',
      submit: 'Koreksi',
      unchanged: 'Koreksi tidak mengubah apa pun.',
      success: 'Status “{{name}}” dikoreksi',
    },
    directory: {
      title: 'Direktori',
      description:
        'Temukan kolega berdasarkan departemen atau nama, beserta kontaknya.',
      searchPlaceholder: 'Cari berdasarkan nama atau kode karyawan',
      searchLabel: 'Cari direktori',
      contactHidden: 'Tidak terlihat',
      emptyTitle: 'Direktori kosong',
      emptyDescription:
        'Orang muncul di sini setelah SDM membuat arsip mereka.',
      noResults: 'Tidak ada kolega yang cocok dengan filter.',
      errorTitle: 'Tidak dapat memuat direktori',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;
