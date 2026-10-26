export default {
  contracts: {
    errors: {
      CONTRACT_SEAL_EVIDENCE_REQUIRED:
        'Bukti pembubuhan stempel aktual yang selesai diperlukan.',
      CONTRACT_SEAL_EVIDENCE_CONFLICT:
        'Bukti stempel ini milik fakta kontrak berbeda.',
      CONTRACT_ACCESS_DENIED:
        'Kontrak ini di luar akses yang diberikan kepada Anda.',
      CONTRACT_ACTION_NOT_ALLOWED:
        'Tindakan ini tidak tersedia untuk kontrak ini.',
      CONTRACT_AMOUNT_BELOW_COMMITTED:
        'Nilai kontrak tidak boleh kurang dari jumlah dibayar ditambah pembayaran dicadangkan.',
      CONTRACT_ATTACHMENT_DENIED:
        'Bidang lampiran atau rekaman kontrak di luar akses yang diberikan kepada Anda.',
      CONTRACT_ATTACHMENT_INVALID:
        'Pilih lampiran valid milik permintaan kontrak ini.',
      CONTRACT_CANDIDATE_REMOVED:
        'Kandidat kontrak yang belum diterbitkan ini dihapus. Buat permohonan baru.',
      CONTRACT_CATEGORY_INACTIVE: 'Pilih jenis kontrak aktif.',
      CONTRACT_CORRUPT_BALANCE:
        'Total pembayaran kontrak tidak konsisten. Hubungi administrator.',
      CONTRACT_EMPLOYEE_REQUIRED:
        'Karyawan aktif dengan departemen utama diperlukan.',
      CONTRACT_FIELDS_RESTRICTED:
        'Bidang kontrak wajib di luar akses yang diberikan kepada Anda.',
      CONTRACT_FILE_SIZE:
        'Pilih file kontrak yang tidak kosong dan maksimal 5 MiB.',
      CONTRACT_FILE_TYPE:
        'Teks kontrak harus PDF; bukti boleh PDF, JPEG, PNG, atau WebP dengan isi file yang sesuai.',
      CONTRACT_IDEMPOTENCY_CONFLICT:
        'Kunci permintaan ini sudah digunakan dengan detail berbeda. Muat ulang sebelum mengajukan lagi.',
      CONTRACT_INACTIVE_SOURCE: 'Pilih sumber kontrak disetujui yang berlaku.',
      CONTRACT_INCOMPLETE_PROPOSAL:
        'Lengkapi alasan kontrak, ketentuan pembayaran, dan versi teks yang tidak dapat diubah.',
      CONTRACT_INPUT_INVALID:
        'Periksa bidang input kontrak yang dideklarasikan.',
      CONTRACT_INVALID_AMOUNT:
        'Masukkan jumlah nonnegatif sebagai bilangan bulat sen presisi dalam rentang yang didukung.',
      CONTRACT_INVALID_ID: 'Identitas valid dengan batasan diperlukan.',
      CONTRACT_INVALID_TIME: 'Cap waktu kontrak tidak valid.',
      CONTRACT_LIMIT_EXCEEDED:
        'Jumlah tertunda dan dibayar melebihi batas kontrak.',
      CONTRACT_NOT_CANDIDATE:
        'Hanya kandidat kontrak belum diterbitkan milik permohonan ini yang dapat dihapus.',
      CONTRACT_NOT_FOUND: 'Sumber kontrak tidak ditemukan.',
      CONTRACT_OUTSTANDING_PAYMENTS:
        'Lepaskan pembayaran tertunda sebelum mengakhiri kontrak.',
      CONTRACT_REASON_REQUIRED:
        'Masukkan alasan dalam batas panjang yang didukung.',
      CONTRACT_REBASE_NOT_ALLOWED:
        'Hanya pemohon yang boleh memperbarui versi dasar perubahan yang dikembalikan secara eksplisit.',
      CONTRACT_REQUEST_KEY_REQUIRED: 'Kunci permintaan tetap diperlukan.',
      CONTRACT_RESERVATION_CLOSED: 'Pencadangan pembayaran sudah ditutup.',
      CONTRACT_RULE_INVALID:
        'Kebijakan persetujuan kontrak tidak ada atau tidak valid. Hubungi administrator.',
      CONTRACT_SLA_UNSUPPORTED:
        'Adaptor persetujuan terpasang hanya mendukung jam 24/48 yang dikonfigurasi.',
      CONTRACT_SOURCE_CONFLICT: 'Referensi ini milik sumber kontrak lain.',
      CONTRACT_STORED_ID_INVALID:
        'Identitas kontrak tersimpan tidak valid. Hubungi administrator.',
      CONTRACT_SUPPLIER_INVALID:
        'Pemasok harus aktif dan memiliki kualifikasi disetujui. Perbarui kualifikasinya sebelum persetujuan.',
      CONTRACT_TARGET_MISMATCH:
        'Target persetujuan milik permintaan kontrak lain.',
      CONTRACT_TEXT_INVALID:
        'Pilih versi teks PDF yang tidak dapat diubah dan milik permohonan ini.',
      CONTRACT_TEXT_NOT_EDITABLE:
        'Versi teks kontrak hanya boleh ditambahkan pada draf sendiri atau revisi yang dikembalikan.',
      CONTRACT_TEXT_REQUIRED:
        'Pilih versi teks kontrak yang valid dan tidak dapat diubah.',
      CONTRACT_TRANSITION_NOT_ALLOWED:
        'Gunakan operasi kontrak khusus yang dilindungi.',
      CONTRACT_VERSION_CONFLICT:
        'Kontrak disetujui berubah. Kembalikan permintaan, perbarui versi dasarnya secara eksplisit, dan ajukan ulang untuk ditinjau.',
    },
    authz: {
      resource: 'Kontrak dan perubahan',
      view: 'Lihat permintaan kontrak',
      submit: 'Buat dan edit permintaan kontrak sendiri',
      ledger:
        'Baca buku besar kontrak disetujui dan versi yang tidak dapat diubah',
      historicalEntry:
        'Daftarkan kontrak historis dengan rekaman hukum yang diaudit',
    },
  },
};
