import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Izin halaman',
    page: 'Halaman',
    business: 'Izin bisnis',
    administration: 'Administrasi',
    other: 'Lainnya',
  },
  options: {
    defaultAndSharing: 'Gunakan cakupan data default',
    actions: {
      assign: 'Kelola penetapan',
      configure: 'Konfigurasi',
      inspect: 'Periksa izin',

      read: 'Baca',
      create: 'Buat',
      update: 'Perbarui',
      delete: 'Hapus',
      access: 'Akses',
    },
    settingsModules: { authorization: 'Otorisasi' },
    pages: {
      all: 'Semua halaman',
      allDescription:
        'Izinkan akses ke setiap halaman, termasuk halaman yang ditambahkan nanti.',
    },
    settings: {
      inspector: 'Pemeriksa izin',
      'permission-sets': 'Kumpulan Izin',
    },
    subjectTypes: {
      authenticated: 'Semua pengguna yang masuk',
      authenticatedDescription:
        'Berlaku bagi setiap pengguna dengan sesi masuk yang valid.',
      user: 'Pengguna',
    },
    recordAccessPolicies: {
      allRecords: 'Semua Rekaman',
      recordsIOwn: 'Rekaman Milik Saya',
      recordsICreated: 'Rekaman yang Saya Buat',
      customFilter: 'Filter Khusus',
      customFilterHint: 'Pilih rekaman dengan kondisi filter khusus.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;
