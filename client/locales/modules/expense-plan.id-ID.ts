export default {
  expensePlans: {
    relatedUnavailable: 'Rekaman terkait tidak tersedia',
    businessErrors: {
      EXPENSE_PLAN_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
      EXPENSE_PLAN_INVALID_DATE: 'Pilih perkiraan tanggal biaya yang valid.',
      EXPENSE_PLAN_INVALID_DICTIONARY:
        'Pilih jenis urusan dan pos anggaran aktif.',
      EXPENSE_PLAN_INVALID_INPUT:
        'Masukkan jumlah positif, peserta, dan alasan biaya.',
    },

    new: 'Persetujuan awal biaya baru',
    edit: 'Edit persetujuan awal biaya',
    formDescription:
      'Rencanakan jamuan, kegiatan tim, atau acara sebelum membelanjakan dana.',
    matterType: 'Jenis urusan',
    subject: 'Pos anggaran',
    amount: 'Perkiraan biaya (yuan)',
    yuan: 'yuan',
    participants: 'Peserta',
    eventDate: 'Tanggal acara',
    budgetYear: 'Tahun anggaran saat pengajuan',
    department: 'Departemen utama saat pengajuan',
    primaryDepartment:
      'Departemen utama saat ini: {{department}}. Ini diperiksa kembali saat pengajuan.',
    departmentMissing: 'Belum dikonfigurasi',
    departmentPending: 'Ditentukan saat pengajuan',
    departmentUnavailable: 'Departemen saat ini tidak tersedia',
    year: 'Tahun anggaran: {{year}} · kalender perusahaan: {{timeZone}}',
    amountHint:
      'Masukkan yuan desimal; jumlah disimpan sebagai bilangan bulat sen presisi.',
    amountInvalid:
      'Masukkan jumlah positif dengan maksimal dua angka desimal dalam batas aman.',
    participantsInvalid: 'Masukkan bilangan bulat antara 1 dan 100000.',
    dateInvalid: 'Pilih tanggal valid.',
    disabled: 'Dinonaktifkan',
    subjectInactive: 'Pilih jenis urusan dan pos anggaran aktif.',
    optionsEmpty:
      'Jenis urusan dan pos anggaran aktif harus dikonfigurasi sebelum menyimpan.',
    reserveHint:
      'Pengajuan mencadangkan anggaran. Persetujuan akhir memberikan kuota penggantian biaya.',
    revisionHold:
      'Pencadangan anggaran awal dipertahankan selama revisi. Ini berubah hanya saat diajukan ulang.',
    retainedHold:
      'Pencadangan awal: {{subject}} · {{amount}} yuan. Ini terpisah dari usulan yang direvisi.',
    actualHold: 'Pencadangan saat persetujuan',
    holdFactHint:
      'Ini fakta pencadangan sumber, bukan sisa saldo setelah penggantian biaya berikutnya.',
    frozenThreshold:
      'Ambang saat pengajuan: eksekutif > {{vp}} yuan; manajer umum > {{gm}} yuan.',
    applied:
      'Kuota disetujui telah diterbitkan. Ini tidak menunjukkan penggantian biaya atau pembayaran.',
    reserved: 'Anggaran dicadangkan saat permohonan ini menunggu persetujuan.',
    awaitingEffect:
      'Belum ada kuota disetujui yang diterbitkan untuk permohonan ini.',
    uncertainCreate:
      'Hasil penyimpanan tidak pasti. Tutup dan periksa Permintaan saya sebelum membuat draf lain.',
    unknownEdit:
      'Hasil penyimpanan tidak pasti. Input Anda dikunci sampai rekaman terbaru dimuat.',
    authorization: 'Kuota disetujui',
    quotaId: 'Referensi kuota',
    grantedAmount: 'Jumlah diberikan',
    quotaState: 'Status kuota',
    deadline: 'Tanggal kedaluwarsa',
    quotaHint:
      'Penggantian biaya menyelesaikan kuota ini. Penutupan atau kedaluwarsa tidak membatalkan persetujuan ini.',
    mergedTitle: 'Penggabungan orang yang sama',
    quotaStates: { open: 'Buka', closed: 'Ditutup', expired: 'Kedaluwarsa' },
    createdBy: 'Dibuat oleh',
    authz: {
      resource: 'Persetujuan awal biaya',
      submit: 'Ajukan persetujuan awal biaya',
      delegate: 'Ajukan persetujuan awal biaya untuk karyawan',
      view: 'Baca persetujuan awal biaya',
    },
    stages: {
      head: 'Kepala departemen',
      finance: 'Keuangan',
      executive: 'Eksekutif penanggung jawab',
      gm: 'Manajer umum',
    },
    states: { approved: 'Kuota disetujui diterbitkan' },
    merged:
      'Eksekutif dan manajer umum digabung: orang yang sama menyetujui dalam kapasitasnya sendiri.',
    errors: {
      invalid: 'Periksa tanggal, peserta, jumlah, jenis urusan, dan pos.',
      department: 'Pemohon memerlukan departemen utama aktif.',
      insufficient: 'Dana tersedia dalam akun anggaran ini tidak mencukupi.',
      inactive: 'Pemohon harus memiliki arsip karyawan aktif.',
      configuration:
        'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    },
  },
};
