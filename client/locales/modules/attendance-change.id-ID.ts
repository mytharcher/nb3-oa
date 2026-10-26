export default {
  attendanceChange: {
    authz: { resource: 'Koreksi absensi' },
    navigation: 'Koreksi absensi',
    new: 'Koreksi absensi baru',
    edit: 'Edit koreksi absensi',
    emptyMissing:
      'Tidak ada absensi yang hilang dan memenuhi syarat. Hubungi SDM jika bukti kehadiran impor tidak benar.',
    uploadAfterDraft: 'Simpan draf, lalu buka Edit untuk mengunggah bukti.',
    formDescription:
      'Periksa bukti dan ajukan untuk ditinjau, atau simpan draf.',
    description:
      'Berikan waktu absensi yang hilang beserta bukti untuk ditinjau manajer Anda.',
    date: 'Tanggal absensi hilang',
    original: 'Absensi hilang awal',
    correctionAt: 'Waktu absensi yang dikoreksi',
    proof: 'Pernyataan bukti',
    attachments: 'Lampiran bukti',
    punchKinds: { in: 'Absen masuk', out: 'Absen keluar' },
    missing: 'Pilih absensi yang hilang',
    policyHint:
      'Absensi yang hilang harus dalam tujuh hari kalender. Permintaan tertunda dan disetujui dihitung dalam batas bulanan.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'Rekaman absensi hilang berubah. Muat ulang dan pilih kembali.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Hanya absensi hilang dalam tujuh hari kalender yang dapat diajukan. Hubungi SDM untuk rekaman lebih lama.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'Koreksi harus pada tanggal absensi yang hilang dan tidak boleh di masa mendatang.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Koreksi tertunda dan disetujui telah mencapai batas bulanan.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Koreksi tertunda atau disetujui sudah ada untuk absensi hilang ini.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Berikan pernyataan bukti atau unggah bukti.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'Pemohon harus karyawan aktif. Hubungi SDM untuk memeriksa arsip.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Berikan alasan koreksi.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Lampiran tidak boleh kosong dan maksimal 5 MB.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Gunakan file PDF, JPEG, PNG, atau WebP dengan isi dan format yang sesuai.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'Anda tidak memiliki izin untuk melihat atau mengunggah bukti ini.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'Tautan lampiran tidak valid. Pilih bukti yang diunggah ke draf ini.',
      ATTENDANCE_BASELINE_CHANGED:
        'Bukti kehadiran awal berubah. Persetujuan dibatalkan; muat ulang untuk meninjaunya.',
    },
  },
};
