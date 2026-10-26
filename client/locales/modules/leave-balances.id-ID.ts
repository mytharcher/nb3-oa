export default {
  leaveBalances: {
    navigationDiscardDescription:
      'Buang perubahan ini dan kembali ke daftar saldo. Navigasi awal tidak dilanjutkan.',
    navigationDiscard: 'Buang dan kembali ke saldo',
    clearFilters: 'Hapus filter',
    clearSearch: 'Hapus pencarian',
    title: 'Saldo cuti',
    adminTitle: 'Administrasi saldo cuti',
    description: 'Lihat cuti tersedia, hari ditahan, dan riwayat saldo.',
    adminDescription:
      'Tinjau saldo cuti karyawan dan catat penyesuaian beralasan.',
    employee: 'Karyawan',
    employeePlaceholder: 'Cari karyawan berdasarkan nama atau kode',
    type: 'Jenis cuti',
    selectType: 'Pilih jenis cuti',
    availableUnits: 'Hari tersedia',
    heldUnits: 'Hari ditahan',
    availableDelta: 'Perubahan tersedia (hari)',
    heldDelta: 'Perubahan ditahan (hari)',
    at: 'Waktu',
    kind: 'Jenis',
    reference: 'Sumber',
    actor: 'Pelaku',
    reason: 'Alasan',
    days: 'Hari penyesuaian',
    actions: 'Tindakan untuk "{{name}}"',
    adjust: 'Sesuaikan',
    adjustBalance: 'Sesuaikan saldo',
    refresh: 'Muat ulang',
    retry: 'Coba lagi',
    loading: 'Memuat',
    noResults: 'Tidak ada karyawan yang cocok. Ubah pencarian Anda.',
    searchCap:
      'Hanya 20 karyawan pertama ditampilkan. Persempit pencarian Anda.',
    noTypes:
      'Tidak ada jenis cuti berbasis saldo tersedia. Minta administrator mengonfigurasikannya.',
    unopened:
      '"{{type}}" belum memiliki akun: {{available}} hari tersedia dan {{held}} hari ditahan. Tambahkan saldo untuk membukanya.',
    ledgerTitle: '{{type}} · Riwayat saldo',
    adjustTitle: 'Sesuaikan saldo cuti',
    adjustDescription: 'Sesuaikan saldo {{type}} untuk "{{name}}".',
    currentBalance:
      'Saat ini {{available}} hari tersedia dan {{held}} hari ditahan.',
    afterBalance:
      'Tersedia setelah penyesuaian: {{amount}} hari, bergantung pada validasi server.',
    noExpiry:
      'Saldo tambahan tidak kedaluwarsa. Pengurangan mempertahankan aturan kedaluwarsa yang ada.',
    daysInvalid:
      'Masukkan jumlah hari bukan nol dalam kelipatan setengah hari.',
    reasonRequired: 'Masukkan alasan penyesuaian.',
    reasonLong: 'Batasi alasan hingga 2.000 karakter.',
    adjusted: 'Saldo untuk "{{name}}" disesuaikan.',
    cancel: 'Batal',
    uncertain:
      'Hasil tidak pasti. Ulangi penyesuaian yang sama; nilainya dikunci untuk mencegah rekaman duplikat.',
    retryAdjustment: 'Ulangi penyesuaian',
    discardTitle: 'Buang penyesuaian saldo',
    discardDescription: 'Penyesuaian Anda yang belum disimpan akan hilang.',
    keepEditing: 'Lanjutkan mengedit',
    discard: 'Buang',
    kinds: {
      grant: 'Berikan',
      hold: 'Tahan',
      deduct: 'Kurangi',
      release: 'Lepaskan',
      expire: 'Kedaluwarsakan',
      refund: 'Kembalikan',
    },
    error: {
      insufficient: 'Saldo tersedia tidak mencukupi. Kurangi pengurangannya.',
      forbidden:
        'Anda tidak memiliki izin untuk melihat atau menyesuaikan data ini. Tanyakan administrator; pencarian karyawan juga memerlukan akses arsip.',
      notFound:
        'Arsip karyawan tidak ada atau belum terikat. Tanyakan SDM atau pilih karyawan lain.',
      invalid: 'Penyesuaian tidak valid. Periksa hari, jenis cuti, dan alasan.',
      failed: 'Permintaan tidak dapat diselesaikan. Coba lagi.',
    },
    empty: {
      readonlyAccountsTitle: 'Belum ada saldo cuti',
      readonlyAccountsDescription:
        'Minta administrator SDM berizin memberikan saldo cuti.',
      employeeTitle: 'Pilih karyawan',
      employeeDescription:
        'Cari berdasarkan nama atau kode untuk melihat saldo cuti.',
      accountsTitle: 'Belum ada saldo cuti',
      accountsDescription:
        'Pilih jenis cuti dan tambahkan saldo melalui penyesuaian.',
      mineTitle: 'Belum ada saldo cuti',
      mineDescription:
        'SDM memberikan saldo cuti Anda. Hubungi SDM jika perlu memeriksanya.',
      ledgerTitle: 'Belum ada riwayat saldo',
      ledgerDescription:
        'Pemberian, penahanan, dan pengurangan akan muncul di sini.',
    },
    authz: {
      section: 'Pengelolaan cuti',
      title: 'Saldo cuti',
      read: 'Baca saldo cuti karyawan',
      update: 'Sesuaikan saldo cuti karyawan',
      permissionSet: 'Administrasi saldo cuti SDM',
    },
  },
};
