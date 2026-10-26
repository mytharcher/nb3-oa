export default {
  wecomAttendance: {
    title: 'Sumber kehadiran WeCom',
    description:
      'Impor absensi masuk karyawan dipetakan dan tinjau 30 eksekusi sinkronisasi terbaru.',
    sync: 'Sinkronkan',
    refresh: 'Muat ulang',
    runs: 'Eksekusi sinkronisasi',
    retry: 'Coba lagi',
    counts: 'Rekaman disimpan: {{records}} · Batch: {{batches}}',
    runFailed:
      'Beberapa rekaman tidak dapat diimpor. Periksa pemetaan karyawan, penetapan shift, dan akses sumber sebelum mencoba lagi. Batch selesai dipertahankan.',
    denied: 'Anda tidak memiliki akses ke sinkronisasi kehadiran.',
    disabled:
      'Sumber dinonaktifkan. Minta administrator mengonfigurasi aplikasi kehadiran khusus.',
    unconfigured:
      'Sumber memerlukan kredensial dan pemetaan karyawan eksplisit sebelum sinkronisasi.',
    ready_one: 'Siap menyinkronkan {{count}} karyawan dipetakan.',
    ready_other: 'Siap menyinkronkan {{count}} karyawan dipetakan.',
    startedAt: 'Dimulai {{time}}',
    empty: 'Belum ada eksekusi sinkronisasi.',
    rangeHint:
      'Pilih maksimal tujuh hari kalender lokal perusahaan yang telah selesai. Rekaman sumber berulang tidak diduplikasi.',
    start: 'Tanggal mulai',
    end: 'Tanggal akhir',
    reason: 'Alasan',
    cancel: 'Batal',
    syncing: 'Menyinkronkan…',
    states: {
      running: 'Sedang berlangsung',
      completed: 'Selesai',
      failed: 'Perlu perhatian',
    },
  },
};
