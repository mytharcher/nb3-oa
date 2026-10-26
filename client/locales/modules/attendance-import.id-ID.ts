export default {
  attendanceImport: {
    title: 'Impor bukti kehadiran',
    description:
      'Pratinjau dan impor bukti mentah yang tidak dapat diubah. Ini tidak mengevaluasi kehadiran atau menghitung penggajian.',
    template: 'Unduh templat Excel',
    downloadStarted: 'Pengunduhan templat Excel dimulai.',
    downloadFailed: 'Templat Excel tidak dapat diunduh. Coba lagi.',
    file: 'File bukti Excel',
    empty: 'Pilih file .xlsx untuk memulai pratinjau.',
    help: 'Gunakan templat dengan satu lembar dan sel teks. Kolom wajib: userId, date, punchKind, source, sourceKey, dan sourceData (objek JSON). punchedAt boleh kosong atau teks UTC ISO seperti 2035-01-02T01:00:00Z. date adalah tanggal lokal perusahaan. userId adalah ID pengguna tetap milik karyawan nyata, bukan nama. Maksimum 4 MiB dan 1.000 baris. Rumus dan tanggal numerik ditolak. Kunci objek JSON harus unik; angka harus mempertahankan nilai desimalnya saat diserialisasi dan bilangan bulat harus aman. Nyatakan ID lebih besar atau desimal presisi sebagai string.',
    parsing: 'Mengurai Excel',
    preview: 'Pratinjau: {{count}} baris',
    confirm:
      'Saya telah meninjau bukti ini dan mengonfirmasi impor seluruh batch',
    submit: 'Konfirmasi impor batch',
    submitting: 'Mengimpor',
    success: '{{count}} baris bukti diimpor.',
    evidence: 'Perluas bukti awal',
    denied: 'Anda tidak memiliki izin untuk mengimpor bukti kehadiran.',
    failed: 'Batch tidak dapat diimpor. Periksa file dan coba lagi.',
    invalid:
      'Server menolak bukti ini. Periksa ID karyawan, tanggal perusahaan, dan data sumber.',
    conflict:
      'Kunci sumber sudah memiliki bukti berbeda. Tidak ada baris batch ini yang diimpor.',
    retry: 'Coba impor lagi',
    discard: 'Buang pratinjau bukti yang belum diajukan?',
    continue: 'Lanjutkan meninjau',
    discardConfirm: 'Buang pratinjau',
    discardHelp:
      'Setelah membuang pratinjau, klik tujuan Anda kembali untuk melanjutkan navigasi.',
    columns: {
      userId: 'ID pengguna',
      date: 'Tanggal perusahaan',
      punchKind: 'Jenis absensi',
      punchedAt: 'Waktu UTC',
      source: 'Sumber',
      sourceKey: 'Kunci sumber',
      sourceData: 'Bukti awal',
    },
    errors: {
      file: 'Pilih file .xlsx berukuran maksimal 4 MiB.',
      archive: 'Arsip Excel tidak valid atau melebihi batas ekstraksi aman.',
      template:
        'Gunakan header templat yang diunduh secara persis dan satu lembar saja.',
      cell: 'Baris {{row}}: gunakan sel teks tanpa rumus dan hanya tujuh kolom templat.',
      rows: 'Gunakan 1–1.000 baris bukti berurutan setelah header.',
      identity:
        'Baris {{row}}: berikan ID pengguna tetap serta sumber dan kunci sumber yang valid.',
      date: 'Baris {{row}}: berikan tanggal perusahaan nyata, jenis in/out, serta waktu UTC ISO eksplisit atau kosong.',
      evidence:
        'Baris {{row}}: berikan objek JSON terbatas dengan kunci objek unik, angka yang tetap aman setelah serialisasi ulang, dan kunci sumber unik.',
    },
  },
};
