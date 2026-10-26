export default {
  outings: {
    authz: { resource: 'Permintaan tugas luar' },
    navigation: 'Permintaan tugas luar',
    new: 'Permintaan tugas luar baru',
    edit: 'Edit permintaan tugas luar',
    formDescription:
      'Periksa periode dan ajukan untuk ditinjau, atau simpan draf.',
    description:
      'Catat periode, lokasi, dan tujuan tugas luar untuk ditinjau manajer Anda.',
    startAt: 'Waktu mulai',
    endAt: 'Waktu akhir',
    location: 'Lokasi',
    reason: 'Tujuan',
    timeZone: 'Waktu dicatat dalam {{zone}}',
    policyHint:
      'Setelah tugas luar dimulai, hanya atasan Anda yang dapat menghentikannya dengan alasan.',
    nonexistentTime:
      'Waktu lokal ini tidak ada karena perubahan jam. Pilih waktu lain.',
    daylightSavingPolicy:
      'Jika perubahan jam mengulang waktu lokal ini, kejadian yang lebih awal digunakan.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'Pemohon harus karyawan aktif. Hubungi SDM untuk memeriksa arsip.',
      OUTING_INVALID_PERIOD:
        'Waktu akhir harus setelah waktu mulai. Periksa periode tugas luar.',
      OUTING_REQUIRED_FIELDS: 'Berikan lokasi dan tujuan.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Fakta kehadiran berubah. Muat ulang untuk meninjaunya.',
    },
  },
};
