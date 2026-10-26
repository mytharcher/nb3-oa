export default {
  exported: 'Pengunduhan Excel dimulai.',
  title: 'Waktu berlalu tugas keputusan cuti',
  description:
    'Tugas keputusan cuti selesai: dari pembuatan hingga penutupan dalam milidetik kalender, termasuk penantian dan pengajuan ulang historis; dikelompokkan berdasarkan bulan mulai permintaan awal, bukan waktu kerja, SLA, tingkat pengembalian, atau durasi seluruh proses.',
  year: 'Tahun mulai',
  month: 'Bulan mulai (opsional)',
  clear: 'Hapus filter',
  export: 'Ekspor Excel',
  exporting: 'Mengekspor…',
  refresh: 'Muat ulang',
  selectYear: 'Pilih tahun mulai permintaan awal untuk memuat laporan ini.',
  invalid:
    'Masukkan tahun antara 1900 dan 9998 serta bulan opsional antara 1 dan 12.',
  forbidden:
    'Izin rekaman atau bidang cuti saat ini tidak mengizinkan laporan ini. Hubungi administrator.',
  precondition:
    'Pemeriksaan batas sumber atau cap waktu tugas gagal. Persempit rentang tahun/bulan, atau minta administrator memeriksa cap waktu sumber.',
  failed: 'Laporan tidak dapat dimuat. Coba lagi.',
  retry: 'Coba lagi',
  exportFailed: 'Ekspor Excel gagal. Coba lagi.',
  empty: 'Tidak ada tugas keputusan selesai',
  noResults: 'Tidak ada tugas yang cocok dengan bulan ini',
  emptyHint:
    'Hanya tugas keputusan selesai dari permintaan cuti yang saat ini dapat dibaca yang dihitung. Pilih tahun atau bulan mulai lain.',
  total: '{{count}} grup tahap',
  generatedAt: 'Dibuat {{value}}',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  fields: {
    stage: 'Tahap',
    completedTaskCount: 'Tugas keputusan selesai',
    totalElapsedMs: 'Total milidetik kalender berlalu',
    averageElapsedMs: 'Rata-rata milidetik kalender berlalu',
  },
  stages: { manager: 'Manajer', head: 'Kepala departemen', hr: 'SDM' },
};
