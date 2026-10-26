/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Departemen',
      positions: 'Jabatan',
      grades: 'Jenjang',
      dutyRoles: 'Peran tanggung jawab',
    },
    authz: {
      section: 'Organisasi dan orang',
      departments: 'Departemen',
      positions: 'Jabatan',
      grades: 'Jenjang',
      dutyRoles: 'Peran tanggung jawab',
      read: 'Lihat',
      update: 'Kelola',
    },
    subjects: {
      departments: 'Departemen',
      heads: 'Kepala departemen',
      dutyRoles: 'Peran tanggung jawab',
      disabled: 'Dinonaktifkan',
    },
    scopes: {
      mine: 'Departemen saya',
      mineHint:
        'Rekaman milik anggota departemen tempat saya bergabung atau yang saya pimpin.',
      mineAndBelow: 'Departemen saya dan bawahannya',
      mineAndBelowHint:
        'Rekaman milik anggota departemen saya dan setiap departemen di bawahnya.',
      headed: 'Departemen yang saya pimpin dan bawahannya',
      headedHint:
        'Rekaman milik anggota departemen yang saya pimpin dan setiap departemen di bawahnya.',
    },
    dutyRoleTitles: {
      gm: 'Manajer umum',
      cfo: 'Direktur keuangan',
      hr: 'Spesialis SDM',
      hrbp: 'Mitra bisnis SDM',
      hrDirector: 'Direktur SDM',
      admin: 'Administrasi',
      sealKeeper: 'Penjaga stempel',
      finance: 'Akuntan',
      financeManager: 'Manajer keuangan',
      cashier: 'Kasir',
      legal: 'Hukum',
      purchasing: 'Pembelian',
      it: 'TI',
      committeeTech: 'Komite peninjau (posisi teknis)',
    },
    common: {
      active: 'Diaktifkan',
      inactive: 'Dinonaktifkan',
      allStatuses: 'Semua status',
      noResults: 'Tidak ada yang cocok dengan filter Anda.',
      clearFilters: 'Hapus filter',
      clearSearch: 'Hapus pencarian',
      searchByTitleOrCode: 'Cari berdasarkan nama atau kode',
      askAdministrator: 'Minta administrator menyiapkan ini.',
      fields: {
        title: 'Nama',
        code: 'Kode',
        status: 'Status',
        name: 'Nama',
        email: 'Email',
        user: 'Orang',
      },
      actions: {
        label: 'Tindakan',
        more: 'Tindakan untuk {{name}}',
        edit: 'Edit',
        enable: 'Aktifkan',
        disable: 'Nonaktifkan',
      },
      form: {
        titleRequired: 'Masukkan nama.',
        titleTooLong: 'Gunakan maksimal {{max}} karakter.',
        codeRequired: 'Masukkan kode.',
        codeFormat:
          'Gunakan huruf, angka, ".", "_", dan "-", diawali huruf atau angka, maksimal 64 karakter.',
        codeHint: 'Pengenal tetap yang digunakan impor dan sistem lain.',
        integer: 'Masukkan bilangan bulat.',
        userRequired: 'Pilih orang.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Hanya departemen tingkat teratas yang dapat menunjuk eksekutif; departemen anak mewarisinya.',
      codeTaken: 'Kode ini sudah digunakan. Pilih yang lain.',
      parentCycle:
        'Departemen tidak dapat dipindahkan ke bawah dirinya sendiri atau salah satu subdepartemennya.',
      parentNotFound: 'Departemen induk tidak lagi ada. Pilih yang lain.',
      userNotFound: 'Orang ini tidak ada atau dinonaktifkan.',
      notFound: 'Rekaman ini tidak ada atau telah dihapus.',
      forbidden: 'Anda tidak memiliki izin untuk melakukan ini.',
      requestFailed: 'Permintaan gagal. Silakan coba lagi.',
    },
    departmentPicker: {
      placeholder: 'Cari departemen',
      empty: 'Tidak ada departemen yang cocok',
      loadFailed: 'Tidak dapat memuat departemen.',
      inactivePath: '{{path}} (dinonaktifkan)',
    },
    departments: {
      title: 'Departemen',
      description:
        'Kelola pohon departemen, kepala, dan anggota. Menonaktifkan departemen menonaktifkan semua yang di bawahnya.',
      create: 'Departemen baru',
      createChild: 'Subdepartemen baru',
      editTitle: 'Edit departemen',
      formDescription:
        'Mengubah induk memindahkan departemen beserta semua yang di bawahnya.',
      created: 'Departemen "{{name}}" dibuat',
      saved: 'Departemen "{{name}}" disimpan',
      enabled: 'Departemen "{{name}}" diaktifkan',
      disabled: 'Departemen "{{name}}" dinonaktifkan',
      disableTitle: 'Nonaktifkan departemen "{{name}}"?',
      disableDescription:
        'Subdepartemennya juga tidak lagi dihitung, dan anggota tidak lagi mewarisi izinnya. Tidak ada yang dihapus; Anda dapat mengaktifkannya kembali kapan saja.',
      loadFailed: 'Tidak dapat memuat departemen',
      emptyTitle: 'Belum ada departemen',
      emptyDescription:
        'Buat tingkat teratas organisasi Anda, lalu tambahkan departemen di bawahnya.',
      noResults: 'Tidak ada departemen yang cocok dengan pencarian Anda.',
      searchPlaceholder: 'Cari berdasarkan nama atau kode departemen',
      treeLabel: 'Pohon departemen',
      choose: 'Pilih departemen di kiri untuk melihat detailnya.',
      notFound: 'Departemen ini tidak ada atau telah dihapus.',
      backToTree: 'Kembali ke pohon',
      topLevel: 'Departemen tingkat teratas',
      inheritedFrom: '(diwarisi dari "{{name}}")',
      inactiveByAncestor: 'Dinonaktifkan bersama "{{name}}"',
      fields: {
        parent: 'Departemen induk',
        manager: 'Kepala departemen',
        executive: 'Eksekutif penanggung jawab',
        sortOrder: 'Urutan sortir',
      },
      form: {
        codeHint: 'Opsional. Impor memperbarui departemen berdasarkan kode.',
        parentPlaceholder: 'Tingkat teratas (tanpa induk)',
        parentHint: 'Biarkan kosong untuk departemen tingkat teratas.',
        managerHint:
          'Persetujuan diberikan kepada orang ini; tidak harus anggota. Kosong: kepala departemen induk.',
        executiveHint:
          'Hanya diatur pada departemen tingkat teratas. Memilih induk mengosongkan bidang ini; departemen anak mewarisinya.',
        sortOrderHint: 'Angka lebih kecil didahulukan di antara saudara.',
      },
      members: {
        title: 'Anggota ({{count}})',
        description:
          'Anggota langsung. Setiap orang memiliki satu departemen utama yang digunakan persetujuan dan anggaran.',
        add: 'Tambah anggota',
        addTitle: 'Tambah anggota ke "{{name}}"',
        added: '"{{name}}" ditambahkan ke "{{department}}"',
        primary: 'Jenis departemen',
        primaryBadge: 'Utama',
        secondaryBadge: 'Sekunder',
        makePrimary: 'Jadikan departemen utama',
        primarySet: '"{{name}}" kini memiliki ini sebagai departemen utamanya',
        makePrimaryField: 'Jadikan ini departemen utamanya',
        makePrimaryHint:
          'Mengganti departemen utamanya saat ini. Jika tidak dicentang, menjadi utama hanya jika belum memiliki departemen utama.',
        remove: 'Hapus dari departemen',
        removeTitle: 'Hapus "{{name}}" dari "{{department}}"?',
        removeDescription:
          'Mereka berhenti mewarisi izin departemen ini. Jika ini departemen utamanya, mereka tidak memiliki departemen utama sampai Anda menetapkan yang lain.',
        removed: '"{{name}}" dihapus dari "{{department}}"',
        loadFailed: 'Tidak dapat memuat anggota',
        emptyTitle: 'Belum ada anggota',
        emptyDescription: 'Tambahkan orang yang bekerja di departemen ini.',
      },
    },
    positions: {
      title: 'Jabatan',
      description:
        'Jabatan kerja yang dirujuk arsip karyawan. Nonaktifkan jabatan daripada menghapusnya.',
      create: 'Jabatan baru',
      editTitle: 'Edit jabatan',
      formDescription: 'Kode tetap sama saat nama berubah.',
      created: 'Jabatan "{{name}}" dibuat',
      saved: 'Jabatan "{{name}}" disimpan',
      enabled: 'Jabatan "{{name}}" diaktifkan',
      disabled: 'Jabatan "{{name}}" dinonaktifkan',
      disableTitle: 'Nonaktifkan jabatan "{{name}}"?',
      disableDescription:
        'Jabatan tidak lagi ditawarkan untuk penetapan baru. Karyawan yang memilikinya tetap mempertahankannya.',
      loadFailed: 'Tidak dapat memuat jabatan',
      notFound: 'Jabatan ini tidak ada atau telah dihapus.',
      emptyTitle: 'Belum ada jabatan',
      emptyDescription:
        'Tambahkan jabatan tempat karyawan direkrut, seperti "Petugas pembelian".',
      fields: { number: 'Urutan sortir' },
      form: {
        numberRequired: 'Masukkan urutan sortir.',
        numberHint: 'Opsional. Angka lebih kecil didahulukan.',
      },
    },
    grades: {
      title: 'Jenjang',
      description:
        'Jenjang jabatan seperti P5 atau M2. Peringkat menentukan senioritas dalam standar perjalanan dan tingkat persetujuan.',
      create: 'Jenjang baru',
      editTitle: 'Edit jenjang',
      formDescription: 'Kode tetap sama saat nama berubah.',
      created: 'Jenjang "{{name}}" dibuat',
      saved: 'Jenjang "{{name}}" disimpan',
      enabled: 'Jenjang "{{name}}" diaktifkan',
      disabled: 'Jenjang "{{name}}" dinonaktifkan',
      disableTitle: 'Nonaktifkan jenjang "{{name}}"?',
      disableDescription:
        'Jabatan tidak lagi ditawarkan untuk penetapan baru. Karyawan yang memilikinya tetap mempertahankannya.',
      loadFailed: 'Tidak dapat memuat jenjang',
      notFound: 'Jenjang ini tidak ada atau telah dihapus.',
      emptyTitle: 'Belum ada jenjang',
      emptyDescription:
        'Tambahkan jenjang dengan peringkat; peringkat lebih tinggi berarti lebih senior.',
      fields: { number: 'Peringkat' },
      form: {
        numberRequired: 'Masukkan peringkat.',
        numberHint: 'Bilangan bulat; lebih tinggi berarti lebih senior.',
      },
    },
    dutyRoles: {
      title: 'Peran tanggung jawab',
      description:
        'Tahap persetujuan dan penanganan mencari orang melalui peran ini. Tetapkan tindakan yang boleh dilakukan setiap peran dalam pengaturan otorisasi.',
      viewMembers: 'Lihat anggota',
      drawerDescription:
        'Orang yang memegang tanggung jawab ini. Tahap persetujuan yang ditetapkan kepada peran ini diberikan kepada mereka.',
      enabled: 'Peran tanggung jawab "{{name}}" diaktifkan',
      disabled: 'Peran tanggung jawab "{{name}}" dinonaktifkan',
      disableTitle: 'Nonaktifkan peran tanggung jawab "{{name}}"?',
      disableDescription:
        'Anggotanya berhenti memegang peran: tahap persetujuan tidak menemukan siapa pun di dalamnya dan izin yang ditetapkan kepadanya berhenti berlaku. Anggota dipertahankan.',
      loadFailed: 'Tidak dapat memuat peran tanggung jawab',
      detailFailed: 'Tidak dapat memuat peran tanggung jawab ini',
      notFound:
        'Peran tanggung jawab ini tidak ada. Tutup panel untuk kembali ke daftar.',
      emptyTitle: 'Tidak ada peran tanggung jawab',
      emptyDescription:
        'Peran tanggung jawab dipasang bersama aplikasi. Minta administrator memeriksa instalasi.',
      fields: {
        code: 'Kode',
        memberCount: 'Anggota',
        description: 'Deskripsi',
      },
      members: {
        title: 'Anggota ({{count}})',
        add: 'Tambah anggota',
        addTitle: 'Tambah anggota ke "{{role}}"',
        added: '"{{name}}" ditambahkan ke "{{role}}"',
        remove: 'Hapus',
        removeTitle: 'Hapus "{{name}}" dari "{{role}}"?',
        removeDescription:
          'Mereka tidak lagi menerima persetujuan untuk peran ini atau izin yang ditetapkan kepadanya.',
        removed: '"{{name}}" dihapus dari "{{role}}"',
        alreadyRemoved: 'Orang ini sudah dihapus sebelumnya.',
        emptyTitle: 'Belum ada anggota',
        emptyDescription:
          'Tambahkan orang yang memegang tanggung jawab ini. Tahap persetujuan untuknya menunggu sampai seseorang ditambahkan.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;
