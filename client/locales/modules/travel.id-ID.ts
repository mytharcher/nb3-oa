export default {
  travel: {
    fieldInvalid: 'Periksa {{field}}.',

    confirmRetryBooking: 'Ulangi pemesanan untuk perjalanan disetujui ini?',
    confirmReviseTrip: 'Revisi perjalanan ini dan mulai ulang persetujuannya?',
    states: {
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      exception: 'Pengecualian pemesanan',
    },
    businessErrors: {
      TRAVEL_ITINERARY_REQUIRED:
        'Perjalanan internasional memerlukan lampiran rencana perjalanan. Unggah atau pilih sebelum mengajukan.',
      TRAVEL_OVERLAP:
        'Periode ini bertumpang tindih dengan perjalanan disetujui. Sesuaikan tanggal perjalanan.',
      TRAVEL_COMPANIONS_INVALID: 'Pilih pendamping berbeda selain pemohon.',
      TRAVEL_COMPANION_INACTIVE:
        'Pelaku perjalanan terpilih tidak lagi aktif. Pilih kembali karyawan saat ini.',
      TRAVEL_DEPARTMENT_REQUIRED:
        'Pemohon memerlukan departemen utama aktif. Minta SDM memperbarui rekaman karyawan.',
      TRAVEL_INVALID_DATE:
        'Akhir perjalanan harus setelah mulainya. Periksa kedua tanggal dan waktu.',
      TRAVEL_INVALID_INPUT:
        'Lengkapi tujuan dan alasan, serta masukkan biaya perjalanan nonnegatif valid.',
    },

    requestLoan: 'Minta pinjaman tertaut',
    reviseTrip: 'Revisi perjalanan dan mulai ulang persetujuan',
    revisionWarning:
      'Revisi menutup alokasi penggantian biaya lama dan mengakhiri aktivitas kehadiran lama sebelum persetujuan baru. Pokok pinjaman yang ada dan tanggal jatuh tempo awal tetap tidak berubah; tangani pinjaman terpisah.',
    cancelTrip: 'Minta pembatalan perjalanan',
    complete: 'Selesaikan pemesanan',
    unable: 'Tidak dapat memesan',
    forceComplete: 'Tutup paksa pemesanan',
    retryBooking: 'Ulangi pemesanan',
    standard: 'Standar perjalanan dibekukan',
    lodgingPerNight: 'Standar penginapan per malam (yuan)',
    allowancePerDay: 'Standar tunjangan per hari (yuan)',
    companions: 'Pendamping',
    addCompanion: 'Tambah pendamping',
    removeCompanion: 'Hapus',
    companionsInvalid: 'Pendamping harus berbeda',
    peopleUnavailable:
      'Izin Anda tidak mengizinkan pencarian karyawan. Hubungi administrator.',
    destination: 'Tujuan',
    international: 'Perjalanan internasional',
    needsBooking: 'Pemesanan administratif',
    needsLoan: 'Pinjaman diminta',
    transportCents: 'Transportasi',
    lodgingCents: 'Penginapan',
    allowanceCents: 'Tunjangan',
    bookingInformation: 'Detail pemesanan',
    exceptionReason: 'Alasan pengecualian',
    cc: 'Tambah penerima tembusan',
    authz: {
      resource: 'Permintaan perjalanan',
      submit: 'Ajukan permintaan perjalanan',
      delegate: 'Ajukan atas nama karyawan',
      view: 'Lihat permintaan perjalanan',
    },
    new: 'Permintaan perjalanan baru',
    edit: 'Edit permintaan perjalanan',
    formDescription: 'Ajukan perjalanan dinas.',
    name: 'Nama perjalanan',
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
      'Persetujuan mencatat kehadiran perjalanan dan membuat alokasi penggantian biaya untuk perkiraan positif. Pemesanan dan pencairan pinjaman terpisah.',
    approvedFacts:
      'Persetujuan perjalanan selesai; kemajuan pemesanan ditampilkan terpisah.',
    attendanceRecorded: 'Aktivitas kehadiran perjalanan dicatat.',
    authorizationIssued:
      'Alokasi penggantian biaya disetujui: {{amount}} yuan. Klaim mengikuti kebijakan alokasi.',
    zeroNoAuthorization:
      'Perkiraan biaya nol tidak membuat alokasi; tinjauan keuangan tetap diperlukan.',
    uncertainCreate:
      'Hasil penyimpanan tidak diketahui. Periksa Permintaan saya sebelum membuat permintaan lain.',
    inactive: 'Arsip karyawan aktif diperlukan.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    invalid:
      'Periksa bidang permintaan dan muat ulang rekaman terbaru jika perlu.',
    stages: {
      completed: 'Selesai',
      manager: 'Manajer langsung',
      head: 'Kepala departemen',
      finance: 'Keuangan',
      executive: 'Eksekutif',
      gm: 'Manajer umum',
      booking: 'Pemesanan administratif',
    },
  },
};
