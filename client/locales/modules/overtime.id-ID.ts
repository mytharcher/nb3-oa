export default {
  overtime: {
    businessErrors: {
      OVERTIME_INVALID_DATE: 'Pilih tanggal lembur valid.',
    },

    authz: { resource: 'Permintaan lembur' },
    navigation: 'Permintaan lembur',
    description: 'Ajukan lembur dan pantau persetujuan serta penyelesaiannya.',
    new: 'Permintaan lembur baru',
    edit: 'Edit permintaan lembur',
    date: 'Tanggal lembur',
    minutes: 'Durasi (menit)',
    monthlyMinutes: 'Total bulanan (menit)',
    settlement: 'Penyelesaian',
    compensatory: 'Cuti pengganti',
    pay: 'Upah lembur',
    durationInvalid: 'Masukkan bilangan bulat antara 1 dan 1.440 menit.',
    formDescription: 'Tinjau permintaan dan ajukan, atau simpan draf.',
    policyHint:
      'Satu permintaan per tanggal. Permintaan terlambat memerlukan tinjauan SDM. Cuti pengganti diselesaikan setelah persetujuan akhir.',
    emptyDescription:
      'Lengkapi permintaan lembur dan ajukan, atau simpan draf.',
    uncertainCreate:
      'Hasil penyimpanan tidak pasti. Tutup formulir ini dan periksa Permintaan saya sebelum membuat draf lain.',
    duplicate:
      'Permintaan lembur aktif atau disetujui sudah ada untuk tanggal ini.',
    inactive: 'Pemohon harus karyawan aktif.',
    configuration:
      'Persetujuan tidak dapat diajukan. Hubungi administrator untuk memeriksa tenggat persetujuan.',
    invalid: 'Periksa tanggal lembur, durasi, penyelesaian, dan alasan.',
    schemaUnavailable:
      'Skema database lembur perlu diperbarui. Operasi ini belum dapat diselesaikan. Hubungi administrator.',
  },
};
