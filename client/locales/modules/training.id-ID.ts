export default {
  // Existing permission titles use the collection name.
  trainingRequests: {
    authz: {
      resource: 'Pelatihan dan pembelajaran',
      submit: 'Ajukan permintaan pelatihan',
      delegate: 'Ajukan atas nama karyawan',
      view: 'Lihat permintaan pelatihan',
    },
  },
  training: {
    actionForm: {
      title: '{{action}} permintaan pelatihan "{{name}}"',
      completed: '{{action}} selesai untuk permintaan pelatihan "{{name}}"',
      saved: 'Permintaan pelatihan "{{name}}" disimpan',
    },
    businessErrors: {
      TRAINING_INVALID_INPUT:
        'Lengkapi nama pelatihan, institusi, dan alasan, serta masukkan biaya nonnegatif valid.',
      TRAINING_INVALID_DATE:
        'Akhir pelatihan harus setelah mulainya. Periksa tanggal dan waktu.',
      TRAINING_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
    },

    cc: 'Tambah penerima tembusan',
    authz: {
      resource: 'Pelatihan dan pembelajaran',
      submit: 'Ajukan permintaan pelatihan',
      delegate: 'Ajukan atas nama karyawan',
      view: 'Lihat permintaan pelatihan',
    },
    new: 'Permintaan pelatihan baru',
    edit: 'Edit permintaan pelatihan',
    formDescription: 'Ajukan pelatihan atau pembelajaran eksternal.',
    name: 'Nama pelatihan',
    institution: 'Institusi',
    startAt: 'Mulai pada',
    endAt: 'Berakhir pada',
    usesWorkingTime: 'Menggunakan waktu kerja',
    amount: 'Biaya (yuan)',
    yuan: 'yuan',
    yes: 'Ya',
    no: 'Tidak',
    timeZone: 'Zona waktu perusahaan: {{zone}}',
    amountHint:
      'Masukkan yuan dengan maksimal dua angka desimal. Biaya nol diperbolehkan.',
    amountInvalid:
      'Masukkan jumlah nonnegatif dengan maksimal dua angka desimal.',
    dateInvalid: 'Pilih interval valid dengan akhir setelah mulai.',
    approvalHint:
      'Persetujuan mencatat kehadiran pelatihan jika menggunakan waktu kerja. Pelatihan berbayar membuat alokasi penggantian biaya disetujui; belum ada pembayaran dilakukan.',
    approvedFacts: 'Pelatihan ini disetujui. SDM menerima tembusan.',
    attendanceRecorded: 'Aktivitas kehadiran pelatihan dicatat.',
    authorizationIssued:
      'Alokasi penggantian biaya disetujui: {{amount}} yuan. Klaim mengikuti kebijakan alokasi.',
    zeroNoAuthorization:
      'Tidak ada alokasi biaya dibuat untuk pelatihan gratis.',
    uncertainCreate:
      'Hasil penyimpanan tidak diketahui. Periksa Permintaan saya sebelum membuat permintaan lain.',
    inactive: 'Arsip karyawan aktif diperlukan.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    invalid:
      'Periksa bidang permintaan dan muat ulang rekaman terbaru jika perlu.',
    stages: {
      manager: 'Manajer langsung',
      head: 'Kepala departemen',
      finance: 'Keuangan',
      executive: 'Eksekutif',
      gm: 'Manajer umum',
    },
  },
};
