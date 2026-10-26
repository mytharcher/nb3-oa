export default {
  authz: {
    ownedScope: 'Permohonan aset sendiri',
    resource: 'Permohonan aset',
    view: 'Baca permohonan aset',
    viewValue: 'Baca nilai awal aset',
    create: 'Buat permohonan aset sendiri',
    edit: 'Edit permohonan aset sendiri',
    operate: 'Lakukan tindakan persetujuan dan penanganan aset yang diizinkan',
    returnIssued:
      'Konfirmasi pengembalian fisik aset penggunaan yang diserahkan',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Masukkan alasan penerimaan fisik.',
    ASSET_ACCESS_DENIED: 'Anda tidak dapat mengakses permintaan aset ini.',
    ASSET_ACTION_INVALID: 'Tindakan ini tidak tersedia untuk permintaan ini.',
    ASSET_REQUEST_NOT_FOUND: 'Permintaan aset tidak ditemukan.',
    ASSET_INVALID_COMMAND:
      'Masukkan pengenal permintaan tetap dan alasan wajib.',
    ASSET_REQUEST_REUSED: 'Pengenal permintaan ini terikat pada operasi lain.',
    ASSET_REQUIRED_FIELDS: 'Lengkapi tujuan, jumlah, dan pilihan aset.',
    ASSET_CATEGORY_INACTIVE: 'Pilih kategori aset aktif.',
    ASSET_EMPLOYEE_INACTIVE: 'Pemohon harus memiliki rekaman karyawan aktif.',
    ASSET_DEPARTMENT_MISSING: 'Pemohon memerlukan departemen utama aktif.',
    ASSET_HEAD_MISSING:
      'Departemen memerlukan kepala aktif sebagai pemberi persetujuan.',
    ASSET_BORROW_DATE_INVALID:
      'Pilih tanggal pengembalian mendatang yang valid menurut waktu lokal perusahaan.',
    ASSET_SCRAP_REQUIRED:
      'Pilih satu aset, masukkan alasan penghapusan, dan lampirkan foto.',
    ASSET_SCRAP_INELIGIBLE:
      'Hanya aset yang dipegang dan memenuhi syarat atau stok yang dikendalikan administrator yang dapat dihapuskan.',
    ASSET_PHOTO_DENIED: 'Permintaan atau bidang fotonya tidak dapat diakses.',
    ASSET_PHOTO_INVALID:
      'Pilih maksimal sepuluh foto valid yang tertaut pada permintaan ini.',
    ASSET_PHOTO_SIZE: 'Setiap foto maksimal 5 MiB.',
    ASSET_PHOTO_TYPE: 'Unggah gambar JPEG, PNG, atau WebP yang valid.',
    ASSET_STOCK_SHORTAGE:
      'Unit tersedia tidak mencukupi untuk seluruh permintaan ini.',
    ASSET_INVALID_QUANTITY: 'Konfirmasikan jumlah bulat antara 1 dan 100.',
    ASSET_INVALID_AMOUNT:
      'Nilai aset tersimpan di luar rentang presisi yang didukung.',
    ASSET_NOT_FOUND: 'Aset dalam permintaan ini tidak ditemukan.',
    ASSET_INVALID_VERSION: 'Muat versi aset saat ini.',
    ASSET_VERSION_CONFLICT: 'Aset berubah. Muat ulang sebelum mengonfirmasi.',
    ASSET_ALREADY_RESERVED: 'Aset dicadangkan oleh permohonan lain.',
    ASSET_EXISTING_HOLD:
      'Selesaikan pencadangan yang ada sebelum mengubah stok.',
    ASSET_HOLD_MISMATCH:
      'Pencadangan aktual tidak sesuai dengan permintaan ini.',
    ASSET_BASELINE_CONFLICT:
      'Fakta aset berubah setelah persetujuan. Kembalikan untuk ditinjau sebelum eksekusi.',
    ASSET_UNITS_INCOMPLETE:
      'Konfirmasikan setiap unit yang dialokasikan beserta nomor seri aktualnya.',
    ASSET_SERIAL_MISMATCH: 'Nomor seri berbeda dari aset aktual.',
    ASSET_RETURN_MISMATCH:
      'Barang yang dikembalikan tidak sesuai dengan penitipan barang yang diserahkan.',
    ASSET_ALREADY_RETURNED: 'Aset ini sudah dikembalikan.',
    ASSET_RETURN_FORBIDDEN:
      'Administrator aset aktif harus mengonfirmasi pengembalian fisik.',
    ASSET_RETURN_INELIGIBLE:
      'Permintaan ini bukan permintaan penggunaan yang telah diserahkan dan memenuhi syarat.',
    ASSET_ALLOCATION_MISSING: 'Alokasi aktual lengkap tidak ada.',
    ASSET_SOURCE_UNAVAILABLE: 'Sumber permohonan aset tidak tersedia.',
    ASSET_SOURCE_MISSING: 'Permohonan aset pemilik tidak lagi ada.',
    ASSET_SOURCE_FORBIDDEN: 'Sumber belum mengizinkan operasi stok ini.',
    ASSET_SOURCE_MISMATCH: 'Sumber stok tidak sesuai dengan permohonan aktual.',
    ASSET_TARGET_MISMATCH: 'Target persetujuan milik permintaan lain.',
    ASSET_DIRECTORY_UNAVAILABLE: 'Direktori persetujuan terbaru diperlukan.',
    ASSET_SLA_UNSUPPORTED:
      'Rilis ini hanya mendukung jam persetujuan default 24/48 jam kerja.',
  },
  schedule: {
    title: 'Pengingat pengembalian aset pinjaman',
    description:
      'Pengingat jatuh tempo harian berdasarkan waktu lokal perusahaan dan pengingat mingguan untuk keterlambatan. Pengiriman tertunda dilaporkan sebagai kejadian gagal.',
  },
  reminders: {
    before:
      'Permohonan aset {{number}}: {{quantity}} barang pinjaman jatuh tempo pada {{date}}. Atur pengembalian fisiknya.',
    overdue:
      'Permohonan aset {{number}}: {{quantity}} barang pinjaman jatuh tempo pada {{date}} dan belum dikembalikan.',
  },
};
