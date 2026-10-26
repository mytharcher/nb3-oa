export default {
  reportsExpense: {
    firstPage: 'Ke halaman pertama',

    pageEmpty: 'Tidak ada grup biaya pada halaman ini',
    pageEmptyHint:
      'Sumber saat ini memiliki lebih sedikit grup. Ke halaman pertama, atau gunakan Sebelumnya untuk kembali ke halaman tersedia.',

    exportStarted: 'Pengunduhan Excel dimulai',
    reloading:
      'Memuat ulang… Hasil sebelumnya tetap terlihat hingga filter saat ini selesai dimuat.',
    exportLock:
      'Mengekspor… Filter dan navigasi dikunci hingga pengunduhan selesai.',

    title: 'Biaya diselesaikan per bulan',
    description:
      'Biaya bruto diselesaikan berdasarkan tanggal biaya awal dan kategori; ini bukan kas neto yang dibayar.',
    month: 'Bulan biaya (1–12, opsional)',
    effectiveYear: 'Tahun kalender perusahaan: {{year}}',
    sourceNotice:
      'Maksimum 10.000 permintaan diselesaikan yang diizinkan dapat diperiksa. Mengubah tahun atau bulan tidak mengurangi pemindaian sumber ini.',
    precondition:
      'Bukti penyelesaian tidak dapat diverifikasi atau batas laporan terlampaui. Minta administrator memeriksa bukti sumber dan ukuran laporan.',
    forbidden:
      'Anda tidak memiliki akses ke sumber penggantian biaya saat ini. Hubungi administrator untuk memeriksa izin sumber.',
    empty: 'Belum ada biaya diselesaikan pada tahun ini',
    emptyHint:
      'Hanya permintaan berizin dengan bukti penyelesaian terverifikasi yang disertakan. Periksa tahun dan bulan, atau minta administrator memeriksa akses sumber.',
    fields: {
      year: 'Tahun',
      month: 'Bulan biaya',
      category: 'Kode kategori',
      settledRequestCount: 'Permintaan diselesaikan',
      settledExpenseCents: 'Biaya bruto diselesaikan (CNY, bukan kas)',
    },
  },
};
