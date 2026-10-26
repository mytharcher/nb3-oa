export default {
  hrMasterData: {
    mappingSearch:
      'Temukan rekaman dipetakan berdasarkan ID eksternal yang persis (100 terbaru ditampilkan tanpa filter)',
    title: 'Sinkronisasi SDM',
    description:
      'Terima data induk organisasi dan karyawan dari gateway integrasi disetujui. Ikatan akun yang ada diperlukan; sinkronisasi tidak mengaktifkan masuk.',
    read: 'Lihat sinkronisasi',
    sync: 'Sinkronkan dan jalankan ulang',
    manage: 'Kelola sumber dan kepemilikan',
    addSource: 'Tambah sumber',
    editSource: 'Edit sumber',
    sourceCode: 'Kode sumber (huruf kecil, angka, dan tanda hubung)',
    sourceName: 'Nama sumber',
    principal: 'Akun integrasi yang diizinkan',
    enabled: 'Diaktifkan',
    disabled: 'Dinonaktifkan',
    noSources: 'Belum ada sumber SDM dikonfigurasi untuk akun Anda.',
    recent: 'Sinkronisasi terbaru',
    latest: 'Menampilkan 50 batch terbaru untuk sumber ini.',
    items_one: '{{count}} rekaman',
    items_other: '{{count}} rekaman',
    actions: 'Tindakan',
    replay: 'Ulangi batch awal',
    refresh: 'Muat ulang',
    noRuns: 'Belum ada batch diterima.',
    mappings: 'Rekaman dipetakan',
    revision: 'Revisi {{revision}}',
    reclaim: 'Pulihkan kepemilikan eksternal',
    reclaimHelp:
      'Edit lokal dilindungi. Pemulihan kepemilikan mengizinkan sumber eksternal mengganti bidang ini pada pembaruan valid berikutnya. Periksa rekaman lokal dan jelaskan keputusan Anda terlebih dahulu.',
    confirmReclaim: 'Konfirmasi kepemilikan eksternal',
    reason: 'Alasan',
    cancel: 'Batal',
    save: 'Simpan',
    failed:
      'Operasi gagal. Periksa izin dan pengaturan sumber Anda, lalu coba lagi.',
    localConflict:
      'Rekaman ini diubah secara lokal. SDM harus meninjau dan memulihkan kepemilikan eksternal secara eksplisit sebelum mencoba lagi.',
    businessConflict:
      'Rekaman tidak dapat diterapkan. Koreksi data sumber atau selesaikan pembatasan bisnis, lalu ulangi batch awal.',
    states: { pending: 'Menunggu', completed: 'Selesai', failed: 'Gagal' },
    entities: {
      department: 'Departemen',
      grade: 'Jenjang',
      employee: 'Karyawan',
    },
  },
};
