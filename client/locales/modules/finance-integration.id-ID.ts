export default {
  financeIntegration: {
    title: 'Sistem keuangan',
    readPermission: 'Lihat sinkronisasi keuangan',
    sendPermission: 'Kirim dan rekonsiliasi entri keuangan',
    send: 'Kirim ke sistem keuangan',
    resend: 'Ulangi pengiriman',
    lookup: 'Periksa hasil eksternal',
    reload: 'Muat ulang status tersimpan',
    retry: 'Coba lagi',
    cancel: 'Batal',
    confirmSend: 'Kirim',
    confirmTitle: 'Kirim permintaan yang telah dibayar ini ke sistem keuangan?',
    confirmDescription:
      'Fakta akuntansi disetujui akan dikirim ke sistem keuangan terhubung. Ini tidak membuat pembayaran lain. Percobaan ulang menggunakan referensi bisnis yang sama.',
    notConfigured:
      'Gateway keuangan belum terhubung. Minta administrator menyelesaikan koneksi.',
    loadFailed:
      'Tidak dapat memuat status keuangan. Periksa akses Anda atau coba lagi.',
    actionFailed:
      'Operasi tidak dapat dikonfirmasi. Muat ulang status sebelum mencoba lagi.',
    conflict:
      'Fakta akuntansi atau tujuan berubah setelah pengiriman pertama. Rekonsiliasi entri yang ada dengan bagian keuangan sebelum melanjutkan.',
    confirmBeforeRetry:
      'Tanda terima bukan bukti pembukuan. Periksa hasil eksternal; jika perlu, ulangi permintaan yang sama.',
    voucher: 'Bukti transaksi eksternal: {{number}}',
    states: {
      not_sent: 'Belum dikirim',
      sending: 'Mengirim atau memeriksa hasil',
      accepted: 'Diterima sistem keuangan; pembukuan belum dikonfirmasi',
      posted: 'Bukti transaksi dibuat',
      rejected: 'Ditolak sistem keuangan',
      unknown: 'Hasil memerlukan konfirmasi',
    },
    results: {
      transport: 'Koneksi berakhir sebelum hasil dapat dikonfirmasi.',
      unconfirmed:
        'Sistem keuangan tidak mengembalikan hasil yang dikonfirmasi.',
      invalid_receipt:
        'Tanda terima tidak dapat dicocokkan dengan permintaan ini.',
      not_found:
        'Tidak ditemukan rekaman eksternal dalam pemeriksaan ini. Tanda terima sebelumnya tetap valid.',
      invalid_mapping:
        'Pemetaan akun keuangan atau pemasok perlu diperhatikan.',
      invalid_document: 'Sistem keuangan menolak fakta dokumen.',
      duplicate_source:
        'Entri eksternal sudah menggunakan referensi bisnis ini.',
      accounting_period_closed: 'Periode akuntansi ditutup.',
      other: 'Minta bagian keuangan meninjau hasil eksternal.',
    },
  },
};
