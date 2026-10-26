import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Tutup',
  nav: { users: 'Pengelolaan pengguna' },
  assignment: {
    saved: 'Izin untuk "{{name}}" diperbarui',
    inspect: 'Periksa izin efektif',
    keepEditing: 'Lanjutkan mengedit',
    discardChanges: 'Buang perubahan',
    showMore: 'Tampilkan lainnya',
    title: 'Penetapan izin',
    description:
      'Kelola izin yang ditetapkan langsung kepada pengguna ini. Perubahan berlaku setelah disimpan.',
    search: 'Cari nama atau deskripsi',
    selectedOnly: 'Hanya yang dipilih',
    selected: '{{count}} dipilih',
    changes: '{{added}} ditambahkan, {{removed}} dihapus',
    noChanges: 'Tidak ada perubahan',
    empty: 'Tidak ada opsi yang cocok',
    protected: 'Penetapan ini dilindungi dan tidak dapat diubah di sini',
    failed: 'Tidak dapat menyimpan. Silakan coba lagi.',
    discard: 'Buang perubahan yang belum disimpan?',
  },
  sessions: {
    title: 'Cabut sesi untuk "{{name}}"?',
    description: 'Pengguna harus masuk kembali di setiap perangkat.',
    confirm: 'Cabut',
    success: 'Sesi untuk "{{name}}" dicabut',
  },
  page: {
    noMatches: 'Tidak ada pengguna yang cocok dengan filter Anda.',
    clearFilters: 'Hapus filter',
    emptyDescription:
      'Buat pengguna di sini atau minta administrator menambahkan akun.',
    retry: 'Coba lagi',
    loading: 'Memuat',
    title: 'Pengguna',
    description: 'Kelola akun, penetapan izin, dan sesi aktif.',
    add: 'Tambah pengguna',
    search: 'Cari nama, nama pengguna, atau email',
    allStatuses: 'Semua status',
    allRoles: 'Semua kumpulan izin',
    enabled: 'Aktif',
    disabled: 'Dibekukan',
    noUsers: 'Tidak ada pengguna ditemukan.',
    total: '{{count}} pengguna',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    selectRole: 'Pilih kumpulan izin',
    roles: 'Kumpulan izin',
    systemAdministrator: 'Administrator sistem',
    noDirectRoles: 'Tidak ditetapkan langsung',
    protectedRole: 'Penetapan dilindungi',
    authenticatedDefaultAccess:
      'Hanya penetapan langsung yang ditampilkan di sini. Izin dari semua pengguna yang masuk, tim, atau subjek lainnya tidak ditampilkan.',
    columns: { user: 'Pengguna', status: 'Status', actions: 'Tindakan' },
    actions: {
      menuFor: 'Tindakan untuk {{name}}',
      edit: 'Edit',
      resetPassword: 'Atur ulang kata sandi',
      revokeSessions: 'Cabut sesi',
      enable: 'Aktifkan akun',
      delete: 'Hapus',
      disable: 'Bekukan akun',
    },
  },
  form: {
    roleRequired: 'Pilih nilai untuk {{name}}.',
    nameRequired: 'Masukkan nama.',
    emailInvalid: 'Masukkan alamat email yang valid.',
    passwordRequired: 'Masukkan kata sandi.',
    saved: 'Pengguna "{{name}}" disimpan',
    addTitle: 'Tambah pengguna',
    editTitle: 'Edit pengguna',
    addDescription: 'Buat akun dan tetapkan izin.',
    editDescription: 'Perbarui profil akun.',
    name: 'Nama',
    username: 'Nama pengguna',
    email: 'Email',
    password: 'Kata sandi',
    cancel: 'Batal',
    save: 'Simpan',
    create: 'Buat',
  },
  password: {
    saved: 'Atur ulang kata sandi untuk "{{name}}"',
    title: 'Atur ulang kata sandi',
    description:
      'Atur kata sandi baru untuk {{name}}. Semua sesi akan dicabut.',
    newPassword: 'Kata sandi baru',
    submit: 'Atur ulang kata sandi',
  },
  state: {
    enabled: 'Akun "{{name}}" diaktifkan',
    disabled: 'Akun "{{name}}" dibekukan',
    enableTitle: 'Aktifkan akun "{{name}}"?',
    disableTitle: 'Bekukan akun "{{name}}"?',
    enableDescription:
      'Pembekuan login {{name}} akan dihapus. Aturan akses yang ada tetap berlaku.',
    disableDescription:
      '{{name}} akan diblokir dari masuk dan dikeluarkan dari setiap perangkat. Konfigurasi otorisasi dipertahankan; pembekuan tidak berarti pemberhentian.',
    enable: 'Aktifkan akun',
    disable: 'Bekukan akun',
  },
  deletion: {
    title: 'Hapus pengguna "{{name}}"?',
    description:
      'Semua sesi dan Kunci API {{name}} akan dicabut. Aktivitas historis dipertahankan. Tindakan ini tidak dapat dibatalkan.',
    success: 'Pengguna "{{name}}" dihapus',
  },
  invite: {
    open: 'Undang pengguna',
    title: 'Undang pengguna',
    description:
      'Setiap alamat yang belum memiliki akun menerima email dengan tautan untuk membuat akun.',
    emails: 'Alamat email',
    emailsHint:
      'Satu per baris, atau pisahkan dengan koma atau spasi. Maksimum 50 sekaligus.',
    emailsRequired: 'Masukkan setidaknya satu alamat email.',
    emailsInvalid: 'Alamat email tidak valid: {{emails}}',
    emailsTooMany: 'Undang maksimal 50 alamat sekaligus.',
    roles: 'Izin setelah bergabung',
    send: 'Kirim undangan',
    sent: 'Undangan dikirim.',
    done: 'Selesai',
    link: 'Tautan undangan',
    copy: 'Salin tautan',
    copied: 'Disalin',
    copyFailed: 'Tidak dapat menyalin tautan.',
    outcome: {
      sent: 'Email dikirim',
      notSent: 'Email tidak dikirim: salin tautan di bawah',
      existingUser: 'Sudah memiliki akun',
    },
  },
  invitations: {
    title: 'Undangan tertunda',
    empty: 'Tidak ada undangan tertunda.',
    email: 'Email',
    invitedBy: 'Diundang oleh',
    expires: 'Kedaluwarsa',
    status: 'Status',
    pending: 'Menunggu',
    expired: 'Kedaluwarsa',
    notSent: 'Belum dikirim',
    resend: 'Kirim lagi',
    revoke: 'Cabut',
    actionsFor: 'Tindakan untuk undangan ke {{email}}',
    resent: 'Undangan dikirim lagi.',
    revoked: 'Undangan dicabut.',
    revokeTitle: 'Cabut undangan untuk "{{email}}"?',
    revokeDescription:
      'Tautan yang dikirim ke {{email}} tidak akan berfungsi lagi.',
  },
  accept: {
    title: 'Terima undangan',
    description: '{{inviter}} mengundang Anda.',
    summary: 'Anda juga akan bergabung: {{items}}',
    loading: 'Memuat undangan…',
    email: 'Email',
    name: 'Nama',
    password: 'Kata sandi',
    nameRequired: 'Masukkan nama Anda.',
    passwordTooShort: 'Kata sandi harus memiliki setidaknya {{min}} karakter.',
    submit: 'Buat akun dan bergabung',
    submitting: 'Bergabung…',
    signedIn:
      'Anda masuk sebagai {{name}}. Keluar untuk menerima undangan ini dengan akun baru.',
    signOut: 'Keluar',
    signOutFailed: 'Tidak dapat keluar.',
    existingAccount:
      'Alamat ini sudah memiliki akun. Masuk dengan akun tersebut untuk melanjutkan.',
    goToLogin: 'Buka halaman masuk',
    errors: {
      notFound: 'Tautan undangan ini tidak valid.',
      expired: 'Undangan ini kedaluwarsa. Minta undangan baru.',
      accepted: 'Undangan ini sudah diterima.',
      revoked: 'Undangan ini telah dicabut.',
      password: 'Kata sandi tidak memenuhi persyaratan.',
      accountConflict: 'Akun dengan alamat ini tidak dapat dibuat.',
      failed: 'Terjadi kesalahan. Silakan coba lagi.',
    },
  },
  errors: {
    loadFailed: 'Tidak dapat memuat pengguna. Silakan coba lagi.',
    loadForbidden:
      'Anda tidak lagi dapat melihat pengguna. Hubungi administrator.',
    loadNotFound:
      'Pengelolaan pengguna tidak tersedia. Kembali ke beranda kerja.',
    SELF_DELETE_NOT_ALLOWED: 'Anda tidak dapat menghapus akun sendiri.',
    LAST_ASSIGNMENT:
      'Pengguna ini satu-satunya pemegang kumpulan izin yang harus tetap ditetapkan.',
    USER_HAS_APPS:
      'Alihkan atau hapus aplikasi milik pengguna ini sebelum menghapus pengguna.',
    HUB_ADMIN_REQUIRED:
      'Hanya administrator platform yang dapat menghapus pengguna.',
    PROTECTED_ROLE_ASSIGNMENT:
      'Peran ini tidak dapat ditetapkan atau dihapus dari Pengelolaan pengguna.',
    USER_NOT_FOUND: 'Pengguna tidak lagi ada.',
    USER_DELETION_NOT_CONFIGURED:
      'Penghapusan pengguna belum dikonfigurasi untuk aplikasi ini.',
    USER_EMAIL_CONFLICT: 'Pengguna dengan email ini sudah ada.',
    USER_USERNAME_CONFLICT: 'Pengguna dengan nama pengguna ini sudah ada.',
    USER_IDENTITY_CONFLICT:
      'Pengguna dengan email atau nama pengguna ini sudah ada.',
    PASSWORD_TOO_SHORT: 'Kata sandi terlalu pendek.',
    PASSWORD_TOO_LONG: 'Kata sandi terlalu panjang.',
    operationFailed: 'Operasi pengguna gagal.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
