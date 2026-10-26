export default {
  electronicSignatures: {
    archivedHint:
      'Layanan penandatanganan mengonfirmasi penyelesaian. PDF bertanda tangan yang diverifikasi telah diarsipkan dengan permintaan ini.',
    reference: 'Referensi penandatanganan: {{value}}',
    completedAction: 'Tanda tangan elektronik diarsipkan',
    title: 'Penandatanganan elektronik',
    readPermission: 'Lihat dokumen bertanda tangan',
    sendPermission: 'Kirim dan pulihkan penandatanganan',
    channel: 'Kanal eksekusi',
    physical: 'Stempel fisik',
    electronic: 'Tanda tangan elektronik',
    channelHint:
      'Pilih sebelum persetujuan. Penandatanganan elektronik memerlukan satu PDF disetujui dan tidak memiliki jumlah salinan kertas.',
    hint: 'PDF disetujui dikirim ke layanan penandatanganan yang dikonfigurasi. Penyelesaian dikonfirmasi hanya setelah dokumen bertanda tangannya diverifikasi dan diarsipkan.',
    notConfigured:
      'Penandatanganan elektronik belum terhubung. Hubungi administrator Anda.',
    notEligible:
      'Penandatanganan memerlukan dokumen terkini yang disetujui dalam format PDF. Permintaan stempel elektronik harus memuat tepat satu PDF.',
    loadFailed:
      'Status tanda tangan tidak dapat dimuat, atau Anda tidak dapat melihatnya.',
    actionFailed:
      'Tindakan tidak dapat diselesaikan. Muat ulang status sebelum mencoba lagi.',
    retry: 'Coba lagi',
    send: 'Kirim untuk ditandatangani',
    refresh: 'Periksa status / pulihkan',
    open: 'Lanjutkan penandatanganan',
    download: 'Unduh PDF bertanda tangan',
    recovery:
      'Hasil jarak jauh atau arsip memerlukan konfirmasi. Periksa status untuk memulihkan permintaan penandatanganan yang sama.',
    signedAt: 'Ditandatangani {{at}}',
    confirmTitle: 'Kirim PDF disetujui ini untuk ditandatangani?',
    confirmHint:
      'Layanan penandatanganan yang dikonfigurasi menerima dokumen disetujui. Percobaan ulang menggunakan permintaan penandatanganan yang sama.',
    cancel: 'Batal',
    states: {
      not_sent: 'Belum dikirim',
      pending: 'Menunggu pengajuan',
      sending: 'Mengirim',
      accepted: 'Diterima layanan penandatanganan',
      signing: 'Menunggu tanda tangan',
      unknown: 'Hasil menunggu konfirmasi',
      archivePending: 'Ditandatangani — arsip perlu dipulihkan',
      archived: 'Dokumen bertanda tangan diarsipkan',
      rejected: 'Ditolak layanan penandatanganan',
      cancelled: 'Dibatalkan layanan penandatanganan',
    },
  },
};
