export default {
  financeAssignments: {
    create: 'Buat',

    saved: 'Penetapan akuntan untuk "{{name}}" disimpan',
    saveFailed:
      'Penetapan tidak dapat disimpan. Coba lagi setelah memeriksa input.',
    disableTitle: 'Nonaktifkan penetapan untuk "{{name}}"?',

    loadLatest: 'Muat penetapan terbaru',
    latestSummary:
      'Terbaru: {{name}} / {{status}}. Nilai formulir Anda tidak berubah.',
    adoptVersion: 'Gunakan versi ini dengan perubahan saya',
    uncertain:
      'Hasil pembuatan tidak pasti. Periksa departemen ini sebelum mencoba lagi.',
    checkExisting: 'Periksa penetapan departemen',
    viewExisting: 'Buka penetapan yang ada',
    required: 'Bidang ini wajib diisi.',
    title: 'Akuntan departemen',
    description:
      'Tetapkan peninjau keuangan untuk setiap departemen. Penetapan yang tidak ada atau tidak aktif menggunakan induk aktif terdekat, lalu manajer keuangan.',
    new: 'Tetapkan akuntan',
    edit: 'Edit penetapan',
    view: 'Detail penetapan',
    department: 'Departemen',
    accountant: 'Akuntan',
    status: 'Status',
    active: 'Aktif',
    inactive: 'Dinonaktifkan',
    updatedAt: 'Diperbarui',
    refresh: 'Muat ulang',
    clear: 'Hapus filter',
    rowActions: 'Tindakan untuk {{name}}',
    save: 'Simpan',
    cancel: 'Batal',
    loading: 'Memuat penetapan',
    retry: 'Coba lagi',
    accountantPlaceholder: 'Cari akuntan yang memenuhi syarat',
    noAccountants: 'Tidak ada anggota peran tanggung jawab keuangan aktif',
    reason: 'Alasan',
    formDescription:
      'Hanya anggota peran tanggung jawab keuangan aktif yang dapat ditetapkan. Perubahan diaudit.',
    departmentPermission:
      'Izin baca departemen diperlukan untuk memilih departemen. Minta administrator memberikannya.',
    conflictAdvice:
      'Simpan perubahan Anda sebagai referensi. Tutup dan buka kembali formulir untuk memeriksa penetapan terbaru sebelum mencoba lagi.',
    disable: 'Nonaktifkan penetapan',
    disableDescription:
      'Persetujuan mendatang menggunakan penetapan induk aktif terdekat, lalu manajer keuangan. Tugas persetujuan yang ada tetap ditetapkan kepada peninjau tercatatnya.',
    authz: {
      title: 'Akuntan departemen',
      read: 'Baca penetapan',
      update: 'Kelola penetapan',
      permissionSet: 'Konfigurasi akuntan oleh manajer keuangan',
    },
    empty: {
      accountsTitle: 'Belum ada akuntan ditetapkan',
      accountsDescription:
        'Tetapkan akuntan ke departemen untuk mengarahkan tinjauan keuangan.',
      readonlyTitle: 'Tidak ada penetapan',
      readonlyDescription:
        'Manajer keuangan dapat mengonfigurasi akuntan departemen.',
      filteredTitle: 'Tidak ada penetapan yang cocok',
      filteredDescription:
        'Hapus filter departemen untuk melihat semua penetapan.',
    },
    error: {
      forbidden: 'Anda tidak memiliki izin untuk mengakses penetapan ini.',
      missing: 'Penetapan ini tidak lagi ada.',
      invalid: 'Periksa nilai formulir.',
      failed: 'Penetapan tidak dapat dimuat. Coba lagi.',
      FINANCE_ASSIGNMENT_NOT_FOUND: 'Penetapan ini tidak lagi ada.',
      FINANCE_ASSIGNMENT_VERSION_CONFLICT:
        'Penetapan ini berubah. Buka kembali formulir untuk memeriksa versi terbaru.',
      FINANCE_ASSIGNMENT_ALREADY_EXISTS:
        'Departemen ini sudah memiliki penetapan. Edit penetapan tersebut.',
      FINANCE_ASSIGNMENT_INVALID_DEPARTMENT: 'Pilih departemen aktif.',
      FINANCE_ASSIGNMENT_INVALID_ACCOUNTANT:
        'Pilih anggota peran tanggung jawab keuangan aktif.',
      FINANCE_ASSIGNMENT_INVALID_COMMAND: 'Pelaku dan alasan diperlukan.',
    },
  },
};
