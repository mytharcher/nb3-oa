export default {
  paymentRequestsForm: {
    new: 'Permintaan pembayaran baru',
    edit: 'Edit permintaan pembayaran',
    description:
      'Ajukan permintaan yang telah lengkap, atau simpan draf. Fakta bisnis wajib diperiksa kembali saat pengajuan.',
    save: 'Simpan draf',
    saved: 'Draf pembayaran disimpan',
    draft: 'Draf',
    maxFiles: 'Pilih maksimal 10 file bukti.',
    limit: 'Teks ini melebihi batas panjang.',
    required: 'Bidang ini wajib diisi.',
    amountInvalid:
      'Masukkan jumlah nonnegatif dengan maksimal dua angka desimal dalam rentang sen presisi yang didukung.',
    invalid: 'Periksa bidang ini.',
    notEditable: 'Rekaman ini tidak lagi tersedia untuk diedit.',
    inactive: 'Tidak tersedia — pilih opsi yang memenuhi syarat',
    select: 'Pilih opsi',
    unknown:
      'Hasil belum dikonfirmasi. Pertahankan input Anda dan ulangi permintaan yang persis sama.',
    replay: 'Rekonsiliasi permintaan awal',
    latest:
      'Versi terbaru dimuat. Input Anda dipertahankan; bandingkan dengan opsi sumber terbaru sebelum menyimpan lagi.',
    leaveReady:
      'Klik tujuan awal Anda lagi untuk keluar. Pengeditan lebih lanjut membatalkan konfirmasi ini.',
    applicantId: 'Pemohon',
    reason: 'Alasan pembayaran',
    sourceMode: 'Sumber persetujuan sebelumnya',
    contract: 'Kontrak',
    contractVersion: 'Versi kontrak',
    contractId: 'Kontrak',
    counterparty: 'Pihak lawan kontrak',
    customerAccountHint:
      'Kontrak pelanggan tidak memiliki rekening bank pemasok. Jika diperlukan, rekening dilindungi dapat dikoreksi setelah kasir melaporkan pengecualian.',
    purchase: 'Pesanan pembelian disetujui',
    none: 'Tanpa persetujuan sebelumnya',
    purchaseOrderId: 'Pesanan pembelian',
    noPriorApprovalReason: 'Penjelasan pembayaran tanpa persetujuan sebelumnya',
    vendorId: 'Penerima pembayaran',
    amount: 'Jumlah (yuan)',
    invoiceNumber: 'Nomor faktur',
    paymentMethod: 'Metode pembayaran',
    orderStatus: 'Status pesanan',
    approved: 'Jumlah disetujui',
    paid: 'Sudah dibayar',
    pending: 'Pembayaran tertunda',
    available: 'Jumlah tersedia',
    cents: 'sen',
    overApproval:
      'Jumlah di atas batas kumulatif disetujui, termasuk pembayaran tertunda, memerlukan persetujuan lengkap. Permintaan pembayaran berlebih diizinkan.',
    frozenHint:
      'Sumber, penerima pembayaran, jumlah, dan faktur dibekukan saat pengajuan.',
    voucherAttachments: 'Bukti pembayaran',
    attachments: 'Bukti faktur',
    uploadHint:
      'PDF, JPEG, PNG, atau WebP; maksimal 5 MB. Menghapus pilihan mempertahankan bukti tersimpan.',
    fileSize: 'Pilih file yang tidak kosong dan maksimal 5 MB.',
    fileType: 'Pilih file PDF, JPEG, PNG, atau WebP dengan ekstensi sesuai.',
    selectEvidence: 'Pilih bukti tersimpan / rekonsiliasi unggahan',
    uploading: 'Mengunggah atau membaca bukti…',
    uploadUnknown:
      'Hasil unggahan belum dikonfirmasi. Baca bukti tersimpan dan periksa sebelum mengunggah lagi. Tidak ada percobaan ulang unggahan otomatis.',
    emptyEvidence: 'Tidak ada bukti tersimpan.',
    evidenceMissing:
      'Beberapa bukti tidak lagi dapat diakses. Muat ulang atau periksa izin Anda.',
    removeEvidence: 'Hapus {{name}} dari pilihan ini',
    bank: {
      title: 'Rekening pribadi penerima pembayaran',
      denied: 'Anda tidak memiliki akses ke rekening pembayaran ini.',
      missing: 'Belum ada rekening pembayaran direkam.',
      correct: 'Koreksi rekening pembayaran',
      unavailable:
        'Koreksi rekening hanya tersedia bagi pemohon atau pembuat saat menangani pengecualian.',
      bankName: 'Bank',
      bankAccount: 'Nomor rekening',
      bankAccountName: 'Pemilik rekening',
      reason: 'Alasan koreksi',
      saved: 'Rekening pembayaran dikoreksi',
      unknown:
        'Hasil penulisan belum dikonfirmasi. Baca rekening terbaru dan bandingkan sebelum mengajukan lagi secara eksplisit.',
      conflict:
        'Rekening atau versi pembayaran berubah. Muat fakta terbaru; edit Anda dipertahankan.',
      reconciled:
        'Fakta terbaru dimuat. Bandingkan input yang dipertahankan dan konfirmasikan penulisan baru secara eksplisit.',
    },
  },
};
