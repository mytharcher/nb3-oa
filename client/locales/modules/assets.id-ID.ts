export default {
  authz: {
    returnHeld: 'Konfirmasi pengembalian fisik aset lama yang dipegang',
    resource: 'Daftar aset',
    view: 'Baca daftar aset dan nilai awal',
    viewHeld: 'Baca aset yang saya pegang',
    manage: 'Catat dan koreksi deskripsi aset',
    heldScope: 'Aset yang saya pegang',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'Administrator aset aktif harus mengonfirmasi pengembalian fisik.',
    ASSET_REQUEST_REUSED:
      'Kunci permintaan pengembalian ini sudah mengidentifikasi tanda terima lain.',
    ASSET_RETURN_INELIGIBLE:
      'Konfirmasikan barang yang dipegang, karyawan, dan nomor seri aktual.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Selesaikan aset ini melalui permohonan aktualnya sebelum mengonfirmasi pengembalian.',

    ASSET_ACCESS_DENIED: 'Anda tidak memiliki izin untuk operasi aset ini.',
    ASSET_NOT_FOUND: 'Aset tidak ditemukan.',
    ASSET_INVALID_INPUT:
      'Masukkan kode aset, nama, dan nilai presisi nonnegatif dalam sen.',
    ASSET_CATEGORY_INACTIVE: 'Pilih kategori aset aktif.',
    ASSET_INVALID_COMMAND: 'Pelaku dan alasan koreksi diperlukan.',
    ASSET_INVALID_VERSION: 'Masukkan versi aset saat ini.',
    ASSET_VERSION_CONFLICT: 'Aset ini berubah. Muat versi terbarunya.',
    ASSET_CODE_EXISTS: 'Kode aset ini sudah ada.',
    ASSET_INVALID_STORED_AMOUNT:
      'Nilai aset tersimpan di luar rentang presisi yang didukung.',
    ASSET_WRITE_UNCONFIRMED: 'Penulisan aset tidak dapat dikonfirmasi.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Aset yang ditetapkan, dipinjam, atau dicadangkan harus dikembalikan sebelum penyelesaian pemberhentian.',
  },
};
