export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Tugas penerimaan karyawan lewat tenggat',
      overdueBody:
        'Tugas penerimaan karyawan lewat tenggat. Periksa pekerjaan yang saat ini ditugaskan kepada Anda.',
    },
    authz: {
      resource: 'Penerimaan karyawan',
      readable: 'Peserta penerimaan karyawan',
      view: 'Lihat penerimaan karyawan',
      create: 'Buat penerimaan karyawan',
      cancel: 'Batalkan penerimaan karyawan',
      claim: 'Klaim tugas',
      reassignMentor: 'Tetapkan ulang kepala departemen',
      transfer: 'Alihkan',
      release: 'Lepaskan tugas',
      complete: 'Selesaikan tugas',
      forceComplete: 'Paksa penyelesaian',
      viewSalary: 'Lihat gaji penerimaan karyawan',
      viewBank: 'Lihat detail perbankan penerimaan karyawan',
    },
    errors: {
      employeeSourceConflict:
        'Sumber penerimaan karyawan sudah terikat pada detail karyawan berbeda.',
      employeeAccountEnabled:
        'Akun penerimaan karyawan harus tetap nonaktif selama arsip karyawannya dibuat.',
      forbidden:
        'Anda tidak memiliki izin untuk melakukan operasi penerimaan karyawan ini.',
      sourceInvalid:
        'Alokasi rekrutmen atau fakta bisnis penerimaan karyawan tidak lagi valid.',
      idempotencyConflict:
        'Pengenal perintah ini sudah digunakan dengan detail berbeda.',
    },
  },
};
