export default {
  recordName: 'Perubahan kepegawaian untuk "{{name}}"',
  namedAction: '{{action}} untuk "{{name}}"?',
  savedRecord: 'Perubahan kepegawaian untuk "{{name}}" disimpan',

  businessErrors: {
    TRANSFER_INVALID_DATE:
      'Pilih tanggal berlaku valid untuk perubahan kepegawaian.',
    TRANSFER_NO_CHANGE:
      'Tidak ada detail bisnis berubah. Ubah setidaknya satu bidang yang diizinkan.',
    TRANSFER_SALARY_INVALID:
      'Masukkan jumlah gaji valid dalam rentang yang didukung.',
    TRANSFER_RATIO_INVALID:
      'Periksa rasio penyesuaian gaji terhadap batas yang dikonfigurasi.',
    TRANSFER_INVALID_PROMOTION:
      'Jenjang terpilih tidak memenuhi syarat promosi. Periksa jenjang saat ini dan tujuan.',
    TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE: 'Pilih departemen tujuan aktif.',
    TRANSFER_TARGET_POSITION_UNAVAILABLE:
      'Pilih jabatan aktif dalam departemen tujuan.',
    TRANSFER_ACCOUNT_UNAVAILABLE:
      'Pilih akun jumlah karyawan terinisialisasi yang sesuai dengan kapasitas mencukupi.',
    TRANSFER_YEAR_REBIND_REQUIRED:
      'Tahun berubah. Alihkan ikatan permintaan ke akun jumlah karyawan tahunan yang sesuai.',
    TRANSFER_SOURCE_CHANGED:
      'Penetapan karyawan saat ini berubah. Muat ulang dan revisi usulan.',
    TRANSFER_COMPENSATION_CHANGED:
      'Gaji karyawan berubah. Muat ulang sebelum merevisi kompensasi.',
    TRANSFER_NOT_DUE:
      'Tanggal berlaku belum tiba. Tunggu hingga tanggal terjadwal.',
    TRANSFER_INVALID_KINDS:
      'Pilih jenis perubahan kepegawaian yang sesuai dengan bidang yang diubah.',
  },

  moreActions: 'Tindakan lainnya',
  return: 'Kembalikan',
  destructiveConsequence:
    'Tindakan ini mengakhiri atau mengubah persetujuan saat ini. Periksa konsekuensinya sebelum mengonfirmasi.',
  searchPeople: 'Cari nama kandidat',
  title: 'Perubahan kepegawaian',
  description: 'Lacak persetujuan dan pemberlakuan perubahan kepegawaian.',
  create: 'Permintaan baru',
  search: 'Cari berdasarkan alasan atau ID permintaan',
  searchEmployees: 'Cari nama atau kode karyawan',
  empty: 'Tidak ada permintaan perubahan kepegawaian',
  noResults: 'Tidak ada permintaan yang cocok',
  refresh: 'Muat ulang',
  clear: 'Hapus filter',
  allStatuses: 'Semua status',
  employeeInDetail: 'Lihat detail',
  salary: 'Gaji pribadi',
  currentSalary: 'Gaji saat ini',
  salaryDenied: 'Anda tidak dapat melihat gaji untuk permintaan ini',
  failedToExecute:
    'Pemberlakuan gagal. Selesaikan fakta karyawan atau akun kapasitas sebelum mencoba lagi.',
  loading: 'Memuat…',
  saved: 'Operasi selesai',
  saving: 'Menyimpan…',
  save: 'Simpan',
  cancel: 'Batal',
  confirm: 'Konfirmasi tindakan',
  retry: 'Coba lagi',
  loadLatest: 'Muat yang terbaru',
  reviewEditWarning:
    'Perubahan memulai ulang persetujuan dan menutup tugas yang ada.',
  cancelConsequence:
    'Kapasitas tetap dialokasikan hingga SDM independen mengonfirmasi pembatalan.',
  rebindConsequence:
    'Alihkan ikatan akun tahun berjalan aktual. Pemberlakuan tetap menunggu pemeliharaan.',
  confirmAction:
    'Periksa permintaan dan tindakan saat ini, serta berikan alasan.',
  unavailable: 'Tugas atau izin berubah. Kembali ke detail dan muat ulang.',
  recipient: 'Penerima',
  select: 'Pilih opsi',
  none: 'Tidak ada',
  required: 'Bidang ini wajib diisi',
  tooLong: 'Konten terlalu panjang',
  noChanges: 'Ubah setidaknya satu bidang yang diizinkan',
  capacityResolved:
    'Identitas akun kapasitas ditemukan. Pencadangan divalidasi dalam transaksi persetujuan.',
  capacityRequired:
    'Pilih karyawan, departemen tujuan, jabatan, dan tanggal berlaku untuk menemukan akun kapasitas aktual.',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  discardTitle: 'Buang perubahan yang belum disimpan?',
  discardDescription: 'Keluar akan membuang input Anda saat ini.',
  keepEditing: 'Lanjutkan mengedit',
  discard: 'Buang perubahan',

  fields: {
    id: 'ID permintaan',
    employeeId: 'Karyawan',
    kinds: 'Jenis perubahan',
    targetDepartmentId: 'Departemen tujuan',
    targetPositionId: 'Jabatan tujuan',
    targetGradeId: 'Jenjang tujuan',
    targetManagerId: 'Manajer tujuan',
    effectiveDate: 'Tanggal berlaku',
    targetSalary: 'Gaji tujuan (CNY)',
    reason: 'Alasan',
    status: 'Status',
    applicantId: 'Pemohon',
    createdAt: 'Dibuat pada',
  },
  factFields: {
    employee: 'Karyawan',
    department: 'Departemen tujuan',
    position: 'Jabatan tujuan',
    grade: 'Jenjang tujuan',
    manager: 'Manajer tujuan',
  },
  status: {
    completed: 'Berlaku',
    draft: 'Draf',
    revision: 'Dikembalikan untuk revisi',
    manager: 'Tinjauan manajer',
    sourceHead: 'Tinjauan departemen sumber',
    targetHead: 'Tinjauan departemen tujuan',
    hr: 'Tinjauan SDM',
    executive: 'Tinjauan eksekutif',
    gm: 'Tinjauan manajer umum',
    pendingEffective: 'Menunggu pemberlakuan',
    cancellationReview: 'Pembatalan menunggu konfirmasi',
    executed: 'Berlaku',
    cancelled: 'Dibatalkan',
    rejected: 'Ditolak',
    withdrawn: 'Ditarik',
    terminated: 'Dihentikan',
  },
  operations: {
    submit: 'Ajukan',
    edit: 'Edit permintaan',
    reviewEdit: 'Revisi bidang tinjauan',
    withdraw: 'Tarik',
    terminate: 'Hentikan',
    requestCancellation: 'Minta pembatalan',
    rebind: 'Alihkan ikatan kapasitas tahun berjalan',
  },
  kinds: {
    transfer: 'Alihkan',
    salaryChange: 'Perubahan gaji',
    promotion: 'Promosi',
  },
  authz: {
    rebind: 'Alihkan ikatan kapasitas untuk tahun berjalan',
    resource: 'Perubahan kepegawaian',
    view: 'Lihat permintaan',
    operate: 'Lakukan tindakan persetujuan',
    viewSalary: 'Lihat gaji',
    submit: 'Ajukan dan edit permintaan',
    reviewEdit: 'Revisi bidang tinjauan yang diizinkan',
    cancel: 'Minta pembatalan sebelum pemberlakuan',
    readable: 'Permintaan sendiri dan yang diikuti',
  },
  errors: {
    missing: 'Permintaan ini tidak tersedia. Kembali ke daftar dan muat ulang.',
    conflict: 'Permintaan berubah. Muat detail terbaru dan coba lagi.',
    precondition:
      'Kondisi bisnis tidak tersedia. Periksa fakta karyawan dan akun kapasitas.',
    salary:
      'Masukkan gaji dalam rentang yang diizinkan dengan maksimal dua angka desimal.',

    denied: 'Anda tidak memiliki izin untuk perubahan kepegawaian ini.',
    failed:
      'Perubahan kepegawaian tidak dapat diselesaikan. Muat ulang dan coba lagi.',
  },
};
