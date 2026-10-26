export default {
  vendorQualifications: {
    authz: {
      resource: 'Kualifikasi pemasok',
      view: 'Lihat kualifikasi pemasok',
      submit: 'Buat dan edit permintaan kualifikasi pemasok',
      paymentAccount: 'Baca rekening bank pemasok dilindungi',
      updatePaymentAccount: 'Perbarui rekening bank pemasok pada draf sendiri',
      manage: 'Konfigurasi komite kualifikasi pemasok',
    },
    schedule: {
      expiryReminder:
        'Kualifikasi pemasok {{supplierName}} kedaluwarsa pada {{expiry}}. Atur perpanjangannya.',
      title: 'Pengingat kedaluwarsa kualifikasi pemasok',
      description:
        'Ingatkan bagian pembelian 30 hari kalender perusahaan sebelum kualifikasi kedaluwarsa.',
    },
  },
};
