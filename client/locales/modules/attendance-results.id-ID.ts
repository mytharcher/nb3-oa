export default {
  attendanceResults: {
    title: 'Hasil kehadiran',
    description:
      'Tinjau kehadiran harian, selesaikan absensi hilang, dan periksa ringkasan bulanan Anda.',
    month: 'Bulan',
    employee: 'Karyawan',
    department: 'Departemen',
    date: 'Tanggal',
    status: 'Status',
    dailyResult: 'Kehadiran harian',
    normalDays: 'Hari normal',
    exceptionDays: 'Hari dengan pengecualian',
    blockedDays: 'Hari yang perlu ditinjau',
    restDays: 'Hari istirahat',
    lateMinutes: 'Terlambat (menit)',
    earlyMinutes: 'Pulang awal (menit)',
    missingPunches: 'Absensi hilang',
    absentMinutes: 'Ketidakhadiran tanpa izin (menit)',
    approvedOvertimeMinutes: 'Lembur disetujui (menit)',
    statuses: {
      normal: 'Normal',
      exception: 'Pengecualian',
      blocked: 'Perlu ditinjau',
      rest: 'Hari istirahat',
    },
    timeZone: 'Tanggal kehadiran mengikuti zona waktu perusahaan: {{zone}}.',
    refresh: 'Muat ulang',
    clear: 'Hapus filter',
    empty: 'Belum ada hasil kehadiran',
    noResults: 'Tidak ada hasil yang cocok',
    emptyDescription:
      'Hasil muncul setelah perhitungan harian. Anda dapat menghitung hari yang telah berakhir, atau meminta SDM memeriksa jadwal.',
    unnamed: 'Nama karyawan tidak tersedia',
    denied: 'Anda tidak memiliki akses ke operasi kehadiran ini.',
    calculate: 'Hitung kehadiran saya',
    recalculate: 'Hitung ulang',
    calculateDescription:
      'Pilih hari yang telah berakhir dan jelaskan alasannya. Hasil yang ada tetap dalam riwayat perhitungan.',
    reason: 'Alasan',
    cancel: 'Batal',
    confirmCalculate: 'Hitung',
    calculating: 'Menghitung…',
    calculated: 'Perhitungan kehadiran selesai.',
    calculateFailed:
      'Tidak dapat menghitung kehadiran. Periksa bahwa shift telah berakhir dan jadwal valid tersedia, lalu coba lagi.',
    correctIn: 'Minta koreksi absen masuk',
    correctOut: 'Minta koreksi absen keluar',
    export: 'Ekspor bulan',
    exporting: 'Mengekspor…',
    exported: 'Ekspor kehadiran diunduh.',
    needsReview: 'Minta SDM memeriksa jadwal dan rekaman kehadiran.',
    prefillUnavailable:
      'Absensi hilang ini tidak lagi dapat dikoreksi. Pilih rekaman lain yang memenuhi syarat atau minta bantuan SDM.',
    reasons: {
      missingPrimaryDepartment: 'Departemen utama Anda perlu diatur.',
      missingSchedule: 'Tidak ada jadwal tersedia untuk hari ini.',
      missingShiftRevision: 'Shift perlu diperiksa.',
      calendarTimeZoneChanged:
        'Pengaturan waktu kehadiran berubah. Minta SDM mengonfirmasinya.',
      unresolvableLocalTime: 'Waktu jam perlu diperiksa.',
      missingCorrectionFact: 'Koreksi yang disetujui perlu direkonsiliasi.',
      invalidActivityTime:
        'Ketidakhadiran yang disetujui memiliki rentang waktu tidak valid.',
      unverifiedActivitySource:
        'Ketidakhadiran memerlukan verifikasi sebelum dapat digunakan.',
    },
  },
};
