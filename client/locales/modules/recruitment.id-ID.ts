export default {
  recruitment: {
    authz: {
      reviewEdit: 'Ubah bidang peninjau yang diizinkan',
      resource: 'Permintaan rekrutmen',
      requisitions: 'Alokasi rekrutmen',
      view: 'Lihat rekrutmen',
      submit: 'Buat dan ajukan rekrutmen',
      operate: 'Tangani persetujuan rekrutmen',
      viewSalary: 'Lihat rentang gaji pribadi',
      close: 'Tutup sisa alokasi rekrutmen',
    },
    identityUnavailable: 'Nama organisasi tidak tersedia',
    catalogRequired:
      'Muat nama departemen dan jabatan sebelum menutup alokasi ini.',
    requisitionName:
      'Permintaan rekrutmen {{year}} / {{department}} / {{position}}',
    preciseAllocationName:
      'Alokasi rekrutmen {{year}} / {{department}} / {{position}}',

    savedRecord: 'Rekrutmen untuk "{{name}}" disimpan',

    allocationName: 'Alokasi rekrutmen {{year}}',

    yearInvalid: 'Masukkan tahun bilangan bulat antara 1900 dan 9999.',
    businessErrors: {
      RECRUITMENT_INVALID_QUANTITY:
        'Masukkan jumlah rekrutmen bilangan bulat positif dalam rentang yang didukung.',
      RECRUITMENT_INVALID_SALARY:
        'Masukkan rentang gaji valid dengan minimum tidak lebih tinggi dari maksimum.',
      RECRUITMENT_INVALID_REPLACEMENTS:
        'Pilih pengganti yang akan atau telah berhenti sesuai jumlah rekrutmen.',
      RECRUITMENT_REPLACEMENT_UNAVAILABLE:
        'Pengganti tidak lagi memenuhi syarat. Muat ulang dan pilih pengganti yang memenuhi syarat.',
      RECRUITMENT_ACCOUNT_MISMATCH:
        'Akun jumlah karyawan harus sesuai dengan departemen, jabatan, dan tahun.',
      RECRUITMENT_YEAR_MISMATCH:
        'Tahun jumlah karyawan berubah. Pilih akun tahunan yang sesuai.',
      RECRUITMENT_DEPARTMENT_UNAVAILABLE: 'Pilih departemen aktif.',
      RECRUITMENT_POSITION_UNAVAILABLE:
        'Pilih jabatan aktif dalam departemen terpilih.',
      RECRUITMENT_GRADE_UNAVAILABLE: 'Pilih jenjang aktif.',
      RECRUITMENT_GRADE_SNAPSHOT_MISMATCH:
        'Jenjang berubah. Muat ulang dan periksa rentang gaji sebelum mengajukan ulang.',
      RECRUITMENT_RESERVATION_UNAVAILABLE:
        'Tidak ada pencadangan jumlah karyawan yang dapat digunakan. Muat ulang akun jumlah karyawan dan periksa kapasitas.',
      RECRUITMENT_REQUISITION_ALREADY_PUBLISHED:
        'Permintaan rekrutmen ini sudah diterbitkan. Muat ulang untuk melihat statusnya.',
      RECRUITMENT_INVALID_INPUT:
        'Lengkapi departemen, jabatan, jenjang, jumlah karyawan, tanggal mulai, uraian pekerjaan, dan alasan.',
    },

    capacityEmpty:
      'Tidak ada jumlah karyawan tahunan terinisialisasi yang sesuai. Minta SDM membuat dan menginisialisasikannya.',
    capacitySelectTarget:
      'Pilih departemen, jabatan, dan tahun terlebih dahulu.',
    capacityLedger: 'Lihat buku besar jumlah karyawan',

    title: 'Permintaan rekrutmen',
    requisitions: 'Permintaan',
    new: 'Permintaan rekrutmen baru',
    detailTitle: 'Permintaan rekrutmen · {{name}}',
    detail: 'Permintaan rekrutmen',
    search: 'Cari uraian pekerjaan atau alasan',
    all: 'Semua status',
    clear: 'Hapus filter',
    empty: 'Belum ada permintaan rekrutmen',
    filteredEmpty: 'Tidak ada permintaan yang cocok dengan filter ini',
    emptyRequisitions: 'Tidak ada permintaan yang diizinkan',
    cancel: 'Batal',
    save: 'Simpan permintaan rekrutmen',
    saved: 'Operasi rekrutmen disimpan',
    refresh: 'Muat ulang',
    retry: 'Coba lagi',
    loadLatest: 'Muat data terbaru',
    noAccess: 'Anda tidak memiliki akses ke rekaman ini.',
    fieldsRestricted: 'Bidang wajib dibatasi.',
    missing: 'Rekaman ini tidak tersedia.',
    conflict: 'Rekaman ini berubah. Muat data terbaru dan coba lagi.',
    invalid:
      'Lengkapi bidang wajib dan pilih akun kapasitas terinisialisasi. Periksa jumlah pengganti dan rentang gaji.',
    failed: 'Operasi gagal. Silakan coba lagi.',
    notAvailable: 'Operasi ini tidak lagi tersedia dengan izin Anda saat ini.',
    commandReason: 'Alasan operasi ini',
    replacementNote:
      'Hanya identitas yang saat ini diizinkan dan akan/sudah berhenti yang tercantum. Pengajuan memverifikasi kelayakan kapasitas aktual.',
    unknown:
      'Hasil tidak pasti. Ulangi perintah persis untuk mengonfirmasi hasilnya.',
    retryExact: 'Ulangi perintah persis',
    progress: 'Kemajuan persetujuan',
    timeline: 'Linimasa',
    recipient: 'Penerima',
    candidatesFailed:
      'Tidak dapat memuat penerima. Coba lagi, atau muat ulang detail persetujuan dan coba lagi.',
    noCandidates:
      'Tidak ada penerima yang memenuhi persyaratan persetujuan saat ini.',
    actionInvalid:
      'Masukkan alasan operasi dan pilih penerima, tahap pengembalian, mode penandatangan, atau posisi yang diwajibkan tindakan ini.',
    recipientSearch: 'Cari penerima yang memenuhi syarat',
    moreCandidates: 'Muat penerima lainnya',
    returnTarget: 'Kembalikan ke tahap',
    signerMode: 'Urutan penandatangan',
    place: 'Posisi belum ditetapkan',
    confirmAction: '{{action}} untuk {{id}}?',
    actionConsequence:
      'Operasi ini mengubah persetujuan atau alokasi saat ini.',
    closeConsequence:
      'Hanya sisa alokasi rekrutmen yang belum digunakan yang dilepaskan. Riwayat karyawan yang telah digunakan tetap ada.',
    discard: 'Buang perubahan yang belum disimpan?',
    discardDescription: 'Perubahan dalam formulir ini akan hilang.',
    discardConfirm: 'Buang perubahan',
    fields: {
      requisitionTitle: 'Judul permintaan',
      id: 'Pengenal',
      requisitionId: 'ID permintaan',
      requestId: 'ID permintaan sumber',
      departmentId: 'Departemen',
      positionId: 'Jabatan',
      gradeId: 'Jenjang',
      accountId: 'Jumlah karyawan tahunan',
      year: 'Tahun kapasitas',
      quantity: 'Jumlah',
      kind: 'Jenis perekrutan',
      replacementEmployeeIds: 'Karyawan pengganti',
      minimumCents: 'Gaji minimum',
      maximumCents: 'Gaji maksimum',
      expectedStartDate: 'Perkiraan tanggal mulai',
      jobDescription: 'Uraian pekerjaan',
      reason: 'Alasan bisnis',
      applicant: 'Pemohon',
      status: 'Status',
      createdAt: 'Dibuat pada',
      statusChangedAt: 'Status diperbarui pada',
      sourceYear: 'Tahun sumber',
      sourceVersion: 'Versi sumber',
      originalQuantity: 'Jumlah disetujui',
      remaining: 'Tersisa',
      consumed: 'Digunakan',
    },
    actions: {
      submit: 'Ajukan',
      withdraw: 'Tarik',
      terminate: 'Hentikan',
      edit: 'Edit draf',
      reviewEdit: 'Ubah bidang peninjau',
      approve: 'Setujui',
      reject: 'Tolak',
      return: 'Kembalikan',
      comment: 'Komentar',
      appoint: 'Tunjuk',
      reassign: 'Tetapkan ulang',
      read: 'Tandai dibaca',
      transfer: 'Alihkan',
      addSigner: 'Tambah penandatangan',
      urge: 'Desak',
      cc: 'Penerima tembusan',
      close: 'Tutup sisa alokasi',
    },
    status: {
      draft: 'Draf',
      revision: 'Revisi',
      head: 'Kepala departemen',
      hrbp: 'Mitra bisnis SDM',
      hrDirector: 'Direktur SDM',
      executive: 'Eksekutif',
      gm: 'Manajer umum',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
      recruiting: 'Dalam perekrutan',
      full: 'Rekrutmen terpenuhi',
      closed: 'Ditutup',
    },
    kinds: {
      additional: 'Tambahan jumlah karyawan',
      replacement: 'Pengganti',
    },
    modes: {
      before: 'Sebelum',
      after: 'Setelah',
      alongside: 'Bersamaan',
    },
  },
};
