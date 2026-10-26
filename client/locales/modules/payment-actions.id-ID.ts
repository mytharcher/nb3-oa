export default {
  actionForm: {
    uncertain:
      'Hasil belum dikonfirmasi. Pertahankan input ini dan ulangi operasi identik; jangan kirim permintaan yang diubah.',
    replay: 'Ulangi operasi identik',
    title: '{{action}} permintaan pembayaran “{{name}}”',
    unavailable:
      'Tindakan ini tidak lagi tersedia. Baca permintaan pembayaran terbaru.',
    unsupported:
      'Tindakan ini memerlukan kontrak input yang tidak didukung halaman ini.',
    comment: 'Pendapat atau alasan',
    person: 'Penerima',
    mode: 'Posisi penandatangan',
    place: 'Posisi persetujuan',
    returnTarget: 'Tujuan pengembalian',
    voucher: 'Nomor bukti pembayaran',
    voucherHint:
      'Biarkan kosong hanya saat mencatat penyelesaian administratif tanpa bukti transaksi.',
    amount: 'Jumlah pembayaran',
    amountConfirm: 'Konfirmasi jumlah pembayaran persis',
    voucherAttachments: 'Lampiran bukti pembayaran',
    exactAmount: 'Masukkan jumlah persis yang ditampilkan di atas.',
    confirm: 'Konfirmasi {{action}}',
    confirmDescription:
      'Konfirmasi operasi ini pada “{{name}}”. Pembayaran {{amount}}. {{consequence}}',
    releaseConsequence:
      'Ini melepaskan pencadangan yang belum diselesaikan dan tidak dapat dibatalkan di sini.',
    returnConsequence:
      'Permintaan dikembalikan untuk koreksi dan pekerjaan tertunda saat ini ditutup.',
    paymentConsequence:
      'Catat pembayaran aktual yang selesai menggunakan bukti transaksinya.',
    forcedConsequence:
      'Catat penyelesaian administratif; ini tidak memulai transfer bank.',
    unableConsequence: 'Permintaan masuk ke pengecualian penanganan.',
    submitConsequence:
      'Permintaan masuk ke persetujuan dengan fakta pengajuannya dibekukan.',
    genericConsequence:
      'Server menerapkan operasi yang ditawarkan ke target persetujuan terpilih.',
    latest: 'Baca versi terbaru',
    conflict:
      'Permintaan pembayaran berubah. Input Anda dipertahankan. Baca versi terbaru, tinjau, lalu konfirmasi lagi.',
    completed: '{{action}} selesai untuk “{{name}}”',
    committed:
      'Operasi selesai. Muat ulang permintaan pembayaran sebelum melakukan tindakan lain.',
    before: 'Sebelum',
    after: 'Setelah',
    alongside: 'Bersamaan',
    revision: 'Koreksi pemohon',
    required: 'Lengkapi bidang ini.',
    labels: {
      approve: 'Setujui',
      reject: 'Tolak',
      return: 'Kembalikan untuk koreksi',
      returnTo: 'Kembalikan untuk koreksi',
      submit: 'Ajukan untuk persetujuan',
      withdraw: 'Tarik',
      terminate: 'Hentikan',
      retryCash: 'Ulangi kasir',
      retryCashAsAdmin: 'Percobaan ulang kasir administratif',
      forcePayException: 'Catat penyelesaian pengecualian',
      forceComplete: 'Penyelesaian administratif',
      reviseBusiness: 'Revisi untuk persetujuan',
      claim: 'Klaim',
      release: 'Lepaskan',
      assign: 'Tetapkan',
      complete: 'Konfirmasi pembayaran',
      unable: 'Tidak dapat membayar',
      transfer: 'Alihkan',
      addSigner: 'Tambah penandatangan',
      cc: 'Salin',
      appoint: 'Tunjuk',
      reassign: 'Tetapkan ulang',
      comment: 'Komentar',
      read: 'Tandai dibaca',
      urge: 'Ingatkan',
    },
  },
};
