export default {
  seals: {
    authz: {
      requests: 'Permintaan stempel',
      view: 'Lihat',
      create: 'Buat',
      edit: 'Edit',
      operate: 'Operasikan',
      actualReturn: 'Pengembalian pengecualian aktual',
      ledger: 'Buku besar stempel',
      instances: 'Instans stempel',
      manage: 'Kelola metadata stempel',
      owned: 'Rekaman sendiri',
      readable: 'Rekaman sendiri dan yang diikuti',
    },
    errors: {
      REVIEWER_REQUIRED:
        'Peninjau aktual yang ditetapkan harus tetap memiliki peran tanggung jawab aktif yang diwajibkan.',
      APPROVAL_REFUSED:
        'Aturan persetujuan atau penanganan saat ini menolak operasi ini.',
      ACCESS_DENIED:
        'Anda tidak dapat mengakses rekaman atau bidang stempel ini.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Akun karyawan aktif diperlukan.',
      ADMIN_KEEPER_REQUIRED:
        'Pengembalian pengecualian aktual memerlukan peran tanggung jawab administrator dan penjaga stempel.',
      ADMIN_REQUIRED: 'Peran tanggung jawab administrasi aktif diperlukan.',
      BODY_TOO_LARGE: 'Lampiran melebihi batas ukuran unggahan.',
      COMMAND_CONFLICT:
        'Kunci permintaan ini sudah digunakan untuk konten berbeda.',
      CONTRACT_ACCESS_DENIED: 'Anda tidak dapat melihat kontrak tertaut.',
      CONTRACT_NOT_EFFECTIVE: 'Kontrak tertaut tidak berlaku.',
      CONTRACT_VERSION_CONFLICT: 'Kontrak tertaut berubah setelah persetujuan.',
      DEPARTMENT_REQUIRED: 'Pemohon harus memiliki departemen utama.',
      INVALID_COMMAND: 'Kunci permintaan valid diperlukan.',
      INVALID_COPIES:
        'Salinan aktual yang distempel harus positif dan tidak melebihi jumlah disetujui.',
      INVALID_FILE:
        'Lampiran tidak ada, tidak aman, atau di luar permintaan ini.',
      INVALID_INPUT: 'Bidang permintaan stempel tidak valid.',
      INVALID_OUTPUT: 'Hasil penanganan fisik tidak valid.',
      INVALID_RETURN:
        'Pengembalian aktual memerlukan peminjaman eksternal yang ditutup administratif beserta alasan.',
      INVALID_SEAL_TYPE:
        'Jenis stempel tidak aktif atau tidak sesuai dengan permintaan disetujui.',
      INVALID_TIME: 'Waktu fisik atau tenggat pengembalian tidak valid.',
      KEEPER_REQUIRED: 'Peran tanggung jawab penjaga stempel aktif diperlukan.',
      OUTSTANDING_CUSTODY:
        'Stempel ini memiliki penitipan fisik yang belum selesai.',
      PHYSICAL_ALREADY_REGISTERED:
        'Penggunaan atau pengembalian fisik sudah didaftarkan.',
      REQUEST_NOT_FOUND: 'Permintaan tidak tersedia.',
      SEAL_EVIDENCE_REQUIRED:
        'Bukti pembubuhan stempel aktual yang tidak dapat diubah diperlukan.',
      SEAL_NOT_FOUND: 'Stempel tidak tersedia.',
      SEAL_UNAVAILABLE: 'Stempel ini sedang dipinjam.',
      SLA_UNSUPPORTED: 'Jadwal pengingat yang dikonfigurasi tidak didukung.',
      TARGET_MISMATCH: 'Tugas yang ditawarkan bukan milik permintaan ini.',
      VERSION_CONFLICT: 'Rekaman berubah. Muat ulang sebelum mencoba lagi.',
    },
    schedule: {
      title: 'Pengingat pengembalian stempel',
      description:
        'Ingatkan penitipan stempel yang belum selesai setiap hari menurut waktu perusahaan.',
    },
    notifications: {
      overdue: 'Stempel pinjaman terlambat dikembalikan.',
    },
  },
};
