export default {
  announcements: {
    authz: {
      title: 'Pengumuman',
      owned: 'Diterbitkan oleh saya',
      readable: 'Publikasi saya dan pemberitahuan yang diterima',
      view: 'Baca pengumuman',
      create: 'Buat draf pengumuman',
      edit: 'Edit draf sendiri',
      publish: 'Terbitkan pengumuman sendiri',
      revoke: 'Tarik pengumuman sendiri',
      remind: 'Ingatkan penerima yang belum mengonfirmasi',
      receipts: 'Baca daftar penerima sendiri',
      confirm: 'Konfirmasi penerimaan sendiri',
    },
    notifications: {
      title: 'Pengumuman perusahaan',
      body: 'Pengumuman tersedia. Buka aplikasi untuk membacanya.',
    },
    errors: {
      ACCESS_DENIED: 'Pengumuman atau operasi ini tidak dapat diakses.',
      NOT_FOUND: 'Pengumuman tidak ditemukan.',
      INVALID_INPUT: 'Input pengumuman atau interval berlaku tidak valid.',
      INVALID_AUDIENCE:
        'Audiens memuat departemen atau peran tanggung jawab yang tidak tersedia.',
      EMPTY_AUDIENCE: 'Pengumuman tidak memiliki penerima aktif.',
      INVALID_ATTACHMENT: 'Lampiran tidak valid atau tidak tersedia.',
      INVALID_STATE: 'Operasi ini tidak tersedia pada status saat ini.',
      VERSION_CONFLICT: 'Pengumuman berubah. Muat ulang dan coba lagi.',
      COMMAND_CONFLICT:
        'Pengenal permintaan ini sudah digunakan dengan input berbeda.',
      KNOWLEDGE_UNAVAILABLE:
        'Dokumen tertaut tidak tersedia atau tidak dapat dibaca.',
    },
  },
};
