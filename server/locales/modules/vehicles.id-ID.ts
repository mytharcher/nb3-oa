export default {
  vehicles: {
    authz: {
      requests: 'Permintaan kendaraan',
      garage: 'Garasi kendaraan',
      manage: 'Kelola daftar kendaraan',
      viewCost: 'Lihat biaya bahan bakar pribadi',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Persempit pencarian sebelum mengurutkan rekaman sebanyak ini.',
      VEHICLE_ACCESS_DENIED:
        'Pembaruan pengemudi di luar kebijakan yang diberikan kepadanya.',
      VEHICLE_ALREADY_DISPATCHED:
        'Sumber ini sudah memiliki fakta pemberangkatan yang tidak dapat diubah.',
      VEHICLE_APPROVAL_REFUSED:
        'Operasi kendaraan tidak tersedia; muat ulang permintaan dan periksa izin Anda.',
      VEHICLE_CONTENT_CHANGED:
        'Pemberangkatan memerlukan konten disetujui yang tidak berubah dan payload tindakan pribadinya.',
      VEHICLE_COST_NOT_FOUND: 'Biaya penggunaan tidak dapat dibaca.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'Tugas pemberangkatan aktual yang diizinkan diperlukan.',
      VEHICLE_DRIVER_INACTIVE: 'Pengemudi saat ini tidak memenuhi syarat.',
      VEHICLE_DRIVER_REQUIRED:
        'Pilihan pengemudi harus sesuai dengan permintaan disetujui.',
      VEHICLE_EMPLOYEE_INACTIVE: 'Arsip karyawan aktif diperlukan.',
      VEHICLE_FIELDS_RESTRICTED:
        'Bidang permintaan nonkeuangan lengkap diperlukan untuk fasad persetujuan.',
      VEHICLE_GARAGE_DENIED:
        'Anggota tanggung jawab administrasi aktif diperlukan.',
      VEHICLE_INTERVAL_CONFLICT:
        'Kendaraan atau pengemudi sudah diberangkatkan dalam interval ini.',
      VEHICLE_INVALID_COMMAND: 'Sumber dan kunci permintaan tetap diperlukan.',
      VEHICLE_INVALID_INPUT:
        'Berikan identifikasi kendaraan, kapasitas positif, dan status valid.',
      VEHICLE_INVALID_INTERVAL:
        'Berikan interval waktu berurutan dan jumlah penumpang positif.',
      VEHICLE_INVALID_USAGE:
        'Jarak tempuh dan bahan bakar harus bilangan bulat nonnegatif presisi.',
      VEHICLE_INVALID_VERSION: 'Versi tersimpan tidak dapat bertambah.',
      VEHICLE_NOT_DISPATCHED:
        'Tidak ada pemberangkatan nyata untuk permohonan ini.',
      VEHICLE_NOT_FOUND: 'Kendaraan atau pengemudi tidak ditemukan.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Tidak ada kendaraan saat ini dengan kapasitas mencukupi dalam interval ini. Pengajuan tidak mencadangkannya.',
      VEHICLE_OUTSTANDING_USE:
        'Selesaikan penggunaan aktual sebelum menonaktifkan pengemudi ini.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Payload eksekusi bisnis harus menggunakan fasad pribadi.',
      VEHICLE_REQUEST_KEY_REQUIRED: 'Kunci permintaan tetap diperlukan.',
      VEHICLE_REQUEST_REUSED:
        'Kunci permintaan ini terikat pada pelaku atau payload lain.',
      VEHICLE_SLA_UNSUPPORTED:
        'Rilis ini memerlukan jam persetujuan jam kerja default.',
      VEHICLE_SOURCE_DENIED:
        'Operasi persetujuan nyata yang diizinkan dalam transaksinya diperlukan.',
      VEHICLE_SOURCE_MISMATCH:
        'Perintah tidak sesuai dengan sumber persetujuannya.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'Adaptor sumber persetujuan nyata tidak tersedia.',
      VEHICLE_TARGET_MISMATCH: 'Target tindakan milik permintaan lain.',
      VEHICLE_TYPE_INACTIVE: 'Pilih jenis kendaraan aktif.',
      VEHICLE_UNAVAILABLE: 'Pilih kendaraan aktif dengan kapasitas mencukupi.',
      VEHICLE_USAGE_OWNER:
        'Hanya pemohon aktual yang boleh mencatat penggunaan.',
      VEHICLE_VERSION_CONFLICT: 'Muat versi kendaraan saat ini.',
    },
  },
};
