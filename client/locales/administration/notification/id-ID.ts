import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: 'Notifikasi',
    logs: 'Log notifikasi',
  },
  logs: {
    retry: 'Coba lagi',
    limitNotice:
      'Hanya {{count}} notifikasi terbaru yang ditampilkan; total mencakup rekaman ini.',
    deliveryOperations: 'Operasi pengiriman',
    recipeDescription:
      'Lacak setiap penerusan kanal dan setiap upaya penyedia.',
    redacted: 'Isi pesan, penerima, dan token lease disamarkan.',
    providerAttempts: 'Upaya penyedia',

    eyebrow: 'Notifikasi',
    title: 'Log notifikasi',
    description:
      'Lacak pengiriman notifikasi dan setiap upaya penyedia. Isi pesan, penerima, dan token lease disamarkan.',
    refreshing: 'Memuat ulang…',
    refresh: 'Muat ulang',
    deliveriesShown: 'Pengiriman yang ditampilkan',
    needAttention: 'Perlu perhatian',
    unavailable: 'Log tidak tersedia',
    recent: 'Notifikasi terbaru',
    loading: 'Memuat riwayat pengiriman…',
    emptyTitle: 'Belum ada pengiriman',
    emptyDescription:
      'Rekaman pengiriman akan muncul di sini setelah notifikasi dikirim.',
    expand: 'Perluas notifikasi',
    collapse: 'Ciutkan notifikasi',
    noDeliveries: 'Tidak ada pengiriman yang tercatat.',
    noAttempts: 'Tidak ada upaya yang tercatat.',
    columns: {
      source: 'Sumber',
      notificationId: 'ID notifikasi',
      status: 'Status',
      deliveries: 'Pengiriman',
      created: 'Dibuat',
      channel: 'Kanal',
      provider: 'Penyedia',
      attempts: 'Upaya',
      updated: 'Diperbarui',
    },
  },
  status: {
    pending: 'Menunggu',
    processing: 'Sedang diproses',
    completed: 'Selesai',
    partial: 'Sebagian',
    failed: 'Gagal',
    unknown: 'Tidak dikenal',
    preparing: 'Menyiapkan',
    submitting: 'Mengirim',
    retrying: 'Mencoba ulang',
    accepted: 'Diterima',
  },
  errors: {
    forbidden: 'Akses telah dihapus. Hubungi administrator.',
    notFound: 'Rekaman ini tidak tersedia. Kembali ke beranda kerja.',
    providerFailed:
      'Pengiriman gagal. Periksa pengaturan kanal atau hubungi administrator.',
    requestFailed: 'Permintaan notifikasi gagal.',
    inAppRecipientNotFound: 'Penerima notifikasi dalam aplikasi tidak ada.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
