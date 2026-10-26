export default {
  invoiceRecognition: {
    currentValues: 'Nilai saat ini yang belum disimpan',
    reload: 'Muat ulang hasil tersimpan',
    receivedAt: 'Hasil diterima: {{time}}',
    notConfigured:
      'Gateway faktur belum terhubung. Anda dapat terus memasukkan detail faktur secara manual.',
    title: 'Pengenalan dan verifikasi faktur',
    readPermission: 'Baca hasil faktur',
    recognizePermission: 'Kenali lampiran faktur yang dapat diedit',
    verifyPermission: 'Verifikasi baris faktur yang diizinkan',
    recognizeAttachment: 'Kenali lampiran {{index}}',
    verifyAttachment: 'Verifikasi faktur · lampiran {{index}}',
    processing: 'Memproses faktur…',
    failed:
      'Tidak dapat menyelesaikan operasi ini. Periksa akses dan konfigurasi gateway Anda, lalu coba lagi. Nilai yang Anda masukkan tidak berubah.',
    changed:
      'Baris ini berubah. Jalankan operasi lagi sebelum menerapkan atau mengandalkan hasil ini.',
    unconfirmed: 'Hasil belum dikonfirmasi.',
    recover: 'Periksa hasil eksternal',
    reference: 'Referensi verifikasi: {{reference}}',
    confirmTitle: 'Tinjau faktur yang dikenali',
    confirmDescription:
      'Bandingkan saran ini dengan lampiran asli. Penerapannya hanya mengubah baris yang belum disimpan ini; tidak menyimpan, mengajukan, atau memverifikasi faktur.',
    number: 'Nomor faktur',
    date: 'Tanggal faktur',
    amount: 'Total termasuk pajak',
    cancel: 'Batal',
    apply: 'Terapkan ke baris ini',
    states: {
      not_checked: 'Belum diperiksa',
      pending: 'Menunggu diproses',
      running: 'Sedang diproses',
      recognized: 'Dikenali; tinjau sebelum menerapkan',
      multiple:
        'Beberapa faktur ditemukan. Pisahkan lampiran atau isi baris ini secara manual.',
      unreadable:
        'Tidak dapat mengenali faktur ini. Masukkan detailnya secara manual.',
      rejected: 'Layanan eksternal tidak dapat memproses faktur ini.',
      valid: 'Verifikasi eksternal sesuai dengan fakta faktur saat ini.',
      mismatch: 'Fakta faktur tidak sesuai dengan verifikasi eksternal.',
      not_found:
        'Tidak ditemukan faktur yang cocok. Minta bagian keuangan meninjau.',
      unknown:
        'Hasil belum dikonfirmasi. Kueri hasil eksternal sebelum mencoba lagi.',
    },
  },
};
