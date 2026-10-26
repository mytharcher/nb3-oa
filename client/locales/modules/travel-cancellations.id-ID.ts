export default {
  // Existing permission titles use the collection name.
  travelCancellations: {
    authz: {
      resource: 'Permintaan pembatalan perjalanan',
      submit: 'Ajukan permintaan pembatalan perjalanan',
      delegate: 'Ajukan atas nama karyawan',
      view: 'Lihat permintaan pembatalan perjalanan',
    },
  },
  travelCancellation: {
    fieldInvalid: 'Periksa {{field}}.',

    sourceUnavailable: 'Perjalanan sumber tidak tersedia',
    exceptionReason: 'Alasan pengecualian',
    exception: 'Pengecualian pembatalan pemesanan',
    businessErrors: {
      TRAVEL_CANCELLATION_REASON_REQUIRED:
        'Masukkan alasan pembatalan perjalanan.',
      TRAVEL_CANCELLATION_ALREADY_PENDING:
        'Pembatalan sudah tertunda untuk perjalanan ini. Buka permintaan yang ada.',
      TRAVEL_CANCELLATION_BASELINE_CHANGED:
        'Perjalanan disetujui berubah. Muat ulang dan revisi pembatalan sebelum mengajukan ulang.',
      TRAVEL_CANCELLATION_INVALID_SOURCE:
        'Perjalanan awal tidak lagi memenuhi syarat pembatalan. Pilih perjalanan disetujui yang berlaku.',
    },

    retryUnbooking: 'Ulangi pembatalan administratif',
    bookingInformation: 'Pesanan pembatalan dan pengaturan pengembalian dana',
    unbookingHint:
      'Perjalanan awal dicabut setelah persetujuan kepala departemen. Administrasi harus mencatat pengaturan pembatalan dan pengembalian dana; ini tidak mengonfirmasi pembayaran pengembalian dana.',
    complete: 'Selesaikan pembatalan administratif',
    unable: 'Tidak dapat membatalkan pemesanan',
    forceComplete: 'Tutup paksa pembatalan',
    source: 'Perjalanan awal',
    chooseSource: 'Pilih perjalanan disetujui',
    effectHint:
      'Kepala departemen awal harus menyetujui sebelum kehadiran dan otorisasi penggantian biaya dicabut. Pinjaman tertaut ditangani sesuai status pencairannya.',
    cc: 'Tambah penerima tembusan',
    authz: {
      resource: 'Permintaan pembatalan perjalanan',
      submit: 'Ajukan permintaan pembatalan perjalanan',
      delegate: 'Ajukan atas nama karyawan',
      view: 'Lihat permintaan pembatalan perjalanan',
    },
    new: 'Permintaan pembatalan perjalanan baru',
    edit: 'Edit permintaan pembatalan perjalanan',
    formDescription: 'Minta pembatalan perjalanan yang disetujui.',
    name: 'Nama pembatalan perjalanan',
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
      'Persetujuan mencatat kehadiran pembatalan perjalanan jika menggunakan waktu kerja. Pembatalan perjalanan berbayar membuat alokasi penggantian biaya disetujui; belum ada pembayaran dilakukan.',
    approvedFacts:
      'Pembatalan perjalanan ini disetujui. SDM menerima tembusan.',
    attendanceRecorded: 'Aktivitas kehadiran pembatalan perjalanan dicatat.',
    authorizationIssued:
      'Alokasi penggantian biaya disetujui: {{amount}} yuan. Klaim mengikuti kebijakan alokasi.',
    zeroNoAuthorization:
      'Tidak ada alokasi biaya dibuat untuk pembatalan perjalanan gratis.',
    uncertainCreate:
      'Hasil penyimpanan tidak diketahui. Periksa Permintaan saya sebelum membuat permintaan lain.',
    inactive: 'Arsip karyawan aktif diperlukan.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    invalid:
      'Periksa bidang permintaan dan muat ulang rekaman terbaru jika perlu.',
    stages: {
      unbooking: 'Pembatalan pemesanan administratif',
      manager: 'Manajer langsung',
      head: 'Kepala departemen',
      finance: 'Keuangan',
      executive: 'Eksekutif',
      gm: 'Manajer umum',
    },
  },
};
