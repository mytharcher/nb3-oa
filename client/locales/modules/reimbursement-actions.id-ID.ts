export default {
  actionForm: {
    uncertain:
      'Hasil belum dikonfirmasi. Pertahankan input ini dan ulangi operasi identik; jangan kirim permintaan yang diubah.',
    replay: 'Ulangi operasi identik',
    ownedScope: 'Penggantian biaya milik saya atau yang saya buat',
    title: '{{action}} penggantian biaya “{{name}}”',
    unavailable:
      'Tindakan ini tidak lagi tersedia. Baca penggantian biaya terbaru.',
    unsupported:
      'Tindakan ini memerlukan kontrak input yang tidak didukung halaman ini.',
    submitRequirements:
      'Persetujuan menggunakan alasan dan baris biaya yang disimpan dalam draf. Edit penggantian biaya untuk memasukkan alasan, kategori biaya, tanggal, jumlah, dan nomor faktur, serta pilih file bukti untuk setiap baris.',
    reasonRequired:
      'Draf tidak memiliki alasan penggantian biaya. Edit penggantian biaya terlebih dahulu.',
    linesRequired:
      'Draf tidak memiliki baris biaya. Edit penggantian biaya dan unggah file bukti terlebih dahulu.',
    lineIncomplete:
      'Baris biaya {{number}} belum lengkap. Tambahkan kategori, tanggal, jumlah positif, nomor faktur, dan file bukti.',
    duplicateLines:
      'Baris biaya duplikat. Edit penggantian biaya dan periksa barisnya.',
    editDraft: 'Edit penggantian biaya',
    comment: 'Pendapat atau alasan',
    person: 'Penerima',
    mode: 'Posisi penandatangan',
    place: 'Posisi persetujuan',
    returnTarget: 'Tujuan pengembalian',
    voucher: 'Nomor bukti pembayaran',
    voucherHint:
      'Biarkan kosong hanya saat mencatat penyelesaian administratif tanpa bukti transaksi.',
    grossConfirm: 'Konfirmasi penggantian biaya bruto',
    offsetConfirm: 'Konfirmasi pengimbangan pinjaman',
    netConfirm: 'Konfirmasi kas neto',
    exactAmount: 'Masukkan jumlah persis yang ditampilkan di atas.',
    confirm: 'Konfirmasi {{action}}',
    confirmDescription:
      'Konfirmasi operasi ini pada “{{name}}”. Bruto {{gross}}, pengimbangan pinjaman {{offset}}, kas neto {{net}}. {{consequence}}',
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
    line: 'Baris biaya terpilih',
    noLine: 'Baris persetujuan terpilih tidak tersedia.',
    latest: 'Baca versi terbaru',
    conflict:
      'Penggantian biaya berubah. Input Anda dipertahankan. Baca versi terbaru, tinjau, lalu konfirmasi lagi.',
    completed: '{{action}} selesai untuk “{{name}}”',
    committed:
      'Operasi selesai. Muat ulang penggantian biaya sebelum melakukan tindakan lain.',
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
      returnItem: 'Kembalikan baris biaya',
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
