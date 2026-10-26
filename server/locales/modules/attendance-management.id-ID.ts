export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Bukti kehadiran mentah tidak valid.',
      ATTENDANCE_INVALID_TIME:
        'Absensi harus termasuk dalam tanggal kehadiran perusahaan.',
      ATTENDANCE_INVALID_BATCH:
        'Berikan 1–1000 baris dalam batas ukuran bukti.',
      ATTENDANCE_SOURCE_CONFLICT:
        'Kunci sumber mengidentifikasi bukti berbeda yang tidak dapat diubah.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Setiap baris memerlukan orang nyata dengan arsip karyawan.',

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
      importResource: 'Impor kehadiran mentah',
      ingest: 'Impor bukti yang tidak dapat diubah',
      attendanceRecords: 'Rekaman kehadiran mentah',

      resource: 'Konfigurasi kehadiran',
      view: 'Lihat konfigurasi kehadiran',
      manage: 'Kelola konfigurasi kehadiran',
      attendanceShifts: 'Shift kehadiran',
      attendanceShiftRevisions: 'Revisi shift',
      attendanceSchedules: 'Jadwal departemen',
      attendanceScheduleRevisions: 'Revisi jadwal',
    },
  },
};
