export default {
  attendanceManagement: {
    savedSchedule: 'Jadwal untuk "{{department}}" pada {{date}} disimpan',
    savedShift: 'Shift "{{name}}" disimpan',

    editAction: 'Edit',
    errors: {
      NOT_FOUND: 'Shift ini tidak lagi ada.',
      ACCESS_DENIED: 'Anda tidak memiliki akses ke konfigurasi kehadiran ini.',
      ATTENDANCE_ACCESS_DENIED:
        'Izin rekaman atau bidang saat ini tidak mengizinkan perubahan ini.',
      ATTENDANCE_VERSION_CONFLICT:
        'Konfigurasi berubah. Muat ulang sebelum menyimpan.',
      ATTENDANCE_SHIFT_INVALID: 'Masukkan definisi shift eksplisit yang valid.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'Shift tidak ada atau dinonaktifkan.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: 'Kode shift tidak dapat diubah.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Kode shift ini sudah ada.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Gunakan revisi dalam zona waktu perusahaan saat ini.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Pilih tanggal nyata dan shift atau hari istirahat eksplisit.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Departemen ini tidak tersedia.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'Revisi jadwal saat ini tidak dapat dibaca.',
      ATTENDANCE_LIST_INVALID: 'Parameter halaman tidak valid.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'Waktu lokal dilewati atau berulang akibat waktu musim panas. Pilih batas waktu yang jelas.',
    },
    authz: {
      resource: 'Konfigurasi kehadiran',
      view: 'Lihat konfigurasi kehadiran',
      manage: 'Kelola konfigurasi kehadiran',
      attendanceShifts: 'Shift kehadiran',
      attendanceShiftRevisions: 'Revisi shift',
      attendanceSchedules: 'Jadwal departemen',
      attendanceScheduleRevisions: 'Revisi jadwal',
    },
    nameTooLong: 'Gunakan maksimal 200 karakter.',
    reasonTooLong: 'Gunakan maksimal 2000 karakter.',
    title: 'Konfigurasi kehadiran',
    description:
      'Konfigurasikan shift dan jadwal departemen secara eksplisit. Konfigurasi yang tidak ada menghalangi evaluasi kehadiran.',
    shifts: 'Shift',
    schedules: 'Jadwal departemen',
    create: 'Tambah shift',
    edit: 'Edit shift',
    view: 'Lihat revisi',
    save: 'Simpan',
    saving: 'Menyimpan…',
    cancel: 'Batal',
    refresh: 'Muat ulang',
    retry: 'Coba lagi',
    loading: 'Memuat konfigurasi kehadiran',
    denied: 'Anda tidak memiliki akses ke konfigurasi kehadiran ini.',
    notFound: 'Konfigurasi ini tidak lagi ada. Kembali ke daftar konfigurasi.',
    failed:
      'Konfigurasi kehadiran tidak dapat dimuat atau disimpan. Coba lagi.',
    conflict:
      'Konfigurasi berubah. Muat ulang sebelum menyimpan. Input Anda dipertahankan.',
    code: 'Kode shift',
    name: 'Nama shift',
    enabled: 'Diaktifkan',
    disabled: 'Dinonaktifkan',
    status: 'Status',
    version: 'Revisi',
    revisionLabel: 'Revisi {{revision}}',
    actions: 'Tindakan untuk {{name}}',
    all: 'Semua status',
    clearFilters: 'Hapus filter',
    search: 'Cari berdasarkan kode atau nama shift',
    empty:
      'Belum ada shift dikonfigurasi. Tambahkan shift perusahaan eksplisit untuk memulai.',
    noMatches: 'Tidak ada shift yang cocok dengan filter.',
    department: 'Departemen',
    date: 'Tanggal jadwal',
    chooseDepartmentDate:
      'Pilih departemen dan tanggal untuk memeriksa jadwalnya.',
    unconfigured:
      'Belum ada jadwal untuk departemen dan tanggal ini. Evaluasi kehadiran tetap terhalang.',
    restDay: 'Hari istirahat eksplisit',
    workingDay: 'Hari kerja terjadwal',
    configure: 'Konfigurasi jadwal',
    history: 'Riwayat',
    shiftRevision: 'Revisi shift spesifik',
    reason: 'Alasan perubahan',
    createdBy: 'Diubah oleh',
    createdAt: 'Diubah pada',
    timeZone: 'Zona waktu perusahaan saat ini',
    basic: 'Detail dasar',
    intervals: 'Interval kerja',
    rules: 'Aturan kehadiran',
    addInterval: 'Tambah interval',
    removeInterval: 'Hapus interval {{index}}',
    start: 'Waktu mulai (HH:mm)',
    end: 'Waktu akhir (HH:mm)',
    startDayOffset: 'Hari mulai',
    endDayOffset: 'Hari akhir',
    sameDay: 'Hari yang sama',
    nextDay: 'Hari berikutnya',
    lateToleranceMinutes: 'Toleransi terlambat (menit)',
    earlyToleranceMinutes: 'Toleransi pulang awal (menit)',
    absenceThresholdMinutes: 'Ambang ketidakhadiran (menit)',
    required: 'Bidang ini wajib diisi.',
    invalidShift:
      'Gunakan interval HH:mm valid berurutan dalam 24 jam; masukkan toleransi bilangan bulat di bawah durasi kerja dan ambang ketidakhadiran dalam durasi tersebut.',
    invalidNumber: 'Masukkan bilangan bulat nonnegatif yang valid.',
    invalidCode: 'Gunakan 1–64 huruf, angka, garis bawah, atau tanda hubung.',
    saved: 'Konfigurasi kehadiran disimpan.',
    disableTitle: 'Nonaktifkan shift “{{name}}”?',
    disableDescription:
      'Riwayat jadwal yang ada dipertahankan. Jadwal baru tidak dapat memilih shift ini.',
    disableConfirm: 'Nonaktifkan dan simpan',
    leaveTitle: 'Buang perubahan yang belum disimpan?',
    leaveDescription: 'Perubahan dalam formulir ini belum disimpan.',
    discard: 'Buang perubahan',
    continueEditing: 'Lanjutkan mengedit',
    revisionReadonly:
      'Revisi historis yang tidak dapat diubah. Perubahan membuat revisi baru.',
    noEnabledShifts:
      'Tidak ada shift aktif dalam zona waktu perusahaan saat ini. Konfigurasikan shift terlebih dahulu, atau pilih hari istirahat secara eksplisit.',
    shiftOptionsCap:
      'Hanya 100 shift aktif pertama yang ditampilkan. Cari berdasarkan kode atau nama untuk mempersempit pilihan.',
    oldTimeZone:
      'Revisi historis ini menggunakan zona waktu perusahaan berbeda. Penyimpanan menerbitkan revisi baru dalam zona waktu saat ini.',
    selectShift: 'Pilih shift aktif',
    chooseRevision: 'Pilih revisi yang tidak dapat diubah',
    intervalHint:
      'Gunakan interval terpisah untuk istirahat. Tentukan pergeseran hari berikutnya untuk kerja semalam. Tidak ada jam kerja yang disediakan secara default.',
    restHint:
      'Hari istirahat adalah fakta eksplisit, berbeda dari konfigurasi yang tidak ada.',
    reload: 'Muat ulang konfigurasi terbaru',
    back: 'Kembali ke konfigurasi',
  },
};
