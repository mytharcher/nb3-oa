export default {
  meetingRooms: {
    authz: {
      title: 'Ruang rapat',
      bookings: 'Pemesanan rapat',
      view: 'Lihat',
      manage: 'Kelola ruang rapat',
      create: 'Pesan ruang',
      edit: 'Edit pemesanan',
      cancel: 'Batalkan pemesanan',
      confirm: 'Konfirmasi permintaan administratif',
      reject: 'Tolak permintaan administratif',
      checkIn: 'Check-in',
      owned: 'Diselenggarakan oleh saya',
      participating: 'Rapat yang saya hadiri',
      readable: 'Rapat yang saya selenggarakan atau hadiri',
    },
    notifications: {
      title: 'Pembaruan pemesanan rapat',
      body: 'Pemesanan rapat yang melibatkan Anda berubah. Buka pemesanan rapat Anda untuk memeriksa detail yang dapat diakses.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Terlalu banyak rekaman yang cocok. Persempit pencarian sebelum mengurutkan berdasarkan nama.',
      ACCESS_DENIED: 'Operasi atau bidangnya di luar izin Anda.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Arsip karyawan aktif diperlukan.',
      BOOKING_NOT_FOUND: 'Pemesanan tidak tersedia.',
      CAPACITY_EXCEEDED: 'Penyelenggara dan peserta melebihi kapasitas ruang.',
      COMMAND_CONFLICT:
        'Pengenal permintaan ini milik operasi atau pelaku lain.',
      INVALID_BOOKING: 'Masukkan judul dan peserta aktif yang berbeda.',
      INVALID_INTERVAL:
        'Pilih interval mendatang yang berakhir setelah mulainya.',
      INVALID_PARTICIPANT: 'Semua peserta harus karyawan aktif.',
      INVALID_RECURRENCE:
        'Pilih rangkaian harian atau mingguan sebanyak 1 hingga 52 pengulangan.',
      INVALID_REQUEST_ID: 'Pengenal permintaan diperlukan.',
      INVALID_ROOM: 'Masukkan nama ruang, kapasitas, dan alasan perubahan.',
      INVALID_SERIES: 'Pilih rangkaian yang ada.',
      INVALID_STATE:
        'Pemesanan ini tidak dapat melakukan operasi ini pada status atau interval waktunya saat ini.',
      REASON_REQUIRED: 'Masukkan alasan keputusan administratif ini.',
      ROOM_INACTIVE: 'Ruang ini tidak aktif.',
      ROOM_NOT_FOUND: 'Ruang ini tidak tersedia.',
      TIME_CONFLICT:
        'Satu atau beberapa interval yang diminta berkonflik dengan interval terisi.',
      VERSION_CONFLICT:
        'Pemesanan atau ruang berubah. Muat ulang sebelum mencoba lagi.',
      INVALID_LOCAL_TIME:
        'Masukkan tanggal dan waktu lokal perusahaan yang valid.',
      NONEXISTENT_LOCAL_TIME:
        'Waktu lokal ini tidak ada akibat perubahan zona waktu. Pilih waktu lain.',
      AMBIGUOUS_LOCAL_TIME:
        'Waktu lokal ini terjadi dua kali akibat perubahan zona waktu. Pilih waktu yang jelas.',
    },
  },
};
