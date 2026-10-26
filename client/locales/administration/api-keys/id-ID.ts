import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Tutup',
  nav: { apiKeys: 'Kunci API' },
  page: {
    search: 'Cari berdasarkan nama kunci',
    retry: 'Coba lagi',
    clear: 'Hapus filter',
    noResults: 'Tidak ada kunci yang cocok dengan pencarian Anda.',
    loading: 'Memuat',
    title: 'Kunci API',
    description:
      'Buat kunci agar skrip dan integrasi dapat mengakses aplikasi ini atas nama Anda.',
    add: 'Buat kunci',
    empty: 'Anda belum memiliki kunci API.',
    unnamed: 'Kunci tanpa nama',
    never: 'Tidak pernah',
    unused: 'Belum pernah digunakan',
    active: 'Aktif',
    expired: 'Kedaluwarsa',
    disabled: 'Dinonaktifkan',
    columns: {
      name: 'Nama',
      key: 'Kunci',
      status: 'Status',
      lastUsed: 'Terakhir digunakan',
      expires: 'Kedaluwarsa',
      actions: 'Tindakan',
    },
    actions: { revoke: 'Cabut', menu: 'Tindakan untuk "{{name}}"' },
  },
  form: {
    title: 'Buat kunci API',
    description:
      'Kunci ini bertindak atas nama Anda dan memiliki izin yang sama persis dengan akun Anda.',
    name: 'Nama',
    namePlaceholder: 'Tugas ekspor malam hari',
    expiry: 'Kedaluwarsa',
    expiryChoices: {
      never: 'Tidak pernah',
      '7': 'Dalam 7 hari',
      '30': 'Dalam 30 hari',
      '90': 'Dalam 90 hari',
      '365': 'Dalam 1 tahun',
    },
    cancel: 'Batal',
    create: 'Buat',
  },
  reveal: {
    title: 'Salin kunci Anda sekarang',
    description:
      '“{{name}}” telah dibuat. Kunci ini hanya ditampilkan sekali ini.',
    usage: 'Kirim sebagai header permintaan x-api-key.',
    copy: 'Salin kunci',
    done: 'Selesai',
  },
  revoke: {
    success: 'Kunci "{{name}}" dicabut',
    title: 'Cabut kunci "{{name}}"?',
    description:
      'Permintaan yang menggunakan “{{name}}” akan langsung gagal. Tindakan ini tidak dapat dibatalkan.',
    cancel: 'Batal',
    confirm: 'Cabut',
  },
  errors: {
    forbidden: 'Anda tidak lagi dapat melihat kunci. Hubungi administrator.',
    notFound: 'Pengelolaan kunci API tidak tersedia. Kembali ke beranda kerja.',
    nameRequired: 'Masukkan nama kunci.',
    copyFailed: 'Tidak dapat menyalin kunci. Pilih dan salin secara manual.',
    loadFailed: 'Tidak dapat memuat kunci API Anda.',
    createFailed: 'Tidak dapat membuat kunci API.',
    revokeFailed: 'Tidak dapat mencabut kunci API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;
