import actionCopy from './reimbursement-actions.id-ID.js';
import formCopy from './reimbursement-forms.id-ID.js';
export default {
  reimbursementRequests: {
    relatedUnavailable: 'Rekaman terkait tidak tersedia',
    categoryUnavailable: 'Kategori tidak tersedia',

    businessErrors: {
      REIMBURSEMENT_INVALID_LINE_AMOUNT:
        'Setiap baris biaya harus memiliki jumlah positif dalam rentang yang didukung.',
      REIMBURSEMENT_INVALID_LINE_DATE:
        'Pilih tanggal biaya valid untuk setiap baris.',
      REIMBURSEMENT_VOUCHER_REQUIRED:
        'Masukkan nomor bukti pembayaran sebelum mengonfirmasi pembayaran.',
      REIMBURSEMENT_PAYMENT_CONFIRMATION_REQUIRED:
        'Masukkan alasan dan konfirmasikan total penggantian biaya, pengimbangan pinjaman, serta pembayaran tunai secara persis.',
      REIMBURSEMENT_HANDLING_REASON_REQUIRED:
        'Masukkan alasan pembayaran tidak dapat diselesaikan.',
      REIMBURSEMENT_PAYMENT_ACCOUNT_STALE:
        'Rekening pembayaran berubah. Muat rekening terbaru sebelum mengoreksinya.',
      REIMBURSEMENT_AUTHORIZATION_CHANGED:
        'Alokasi disetujui berubah. Muat ulang dan periksa total penggantian biaya.',
      REIMBURSEMENT_INVOICES_CHANGED:
        'Bukti faktur berubah. Muat ulang permintaan dan pilih kembali faktur tersedia.',
      REIMBURSEMENT_LOAN_CHANGED:
        'Pengimbangan pinjaman berubah. Muat ulang pinjaman dan konfirmasikan jumlah pengimbangan.',
      REIMBURSEMENT_TOTAL_TOO_LARGE:
        'Total biaya melebihi jumlah yang didukung. Kurangi total atau pisahkan permintaan.',
      REIMBURSEMENT_FILE_SIZE:
        'Pilih lampiran yang tidak kosong dan maksimal 5 MB.',
      REIMBURSEMENT_FILE_TYPE:
        'Unggah file PDF, JPEG, PNG, atau WebP dengan jenis file yang sesuai.',
    },

    ...formCopy,
    ...actionCopy,
    title: 'Penggantian biaya',
    description:
      'Tinjau bukti biaya dan lacak persetujuan baris serta penanganan pembayaran.',
    new: 'Penggantian biaya baru',
    edit: 'Edit penggantian biaya',
    details: 'Lihat detail',
    number: 'Angka',
    reason: 'Alasan',
    gross: 'Penggantian biaya bruto',
    offset: 'Pengimbangan pinjaman',
    net: 'Kas neto',
    search: 'Cari nomor, alasan, atau pemohon',
    view: 'Tampilan rekaman',
    allStatuses: 'Semua status',
    refresh: 'Muat ulang penggantian biaya',
    clearFilters: 'Hapus filter',
    emptyTitle: 'Belum ada penggantian biaya',
    emptyDescription: 'Buat draf, lalu tambahkan baris biaya dan bukti.',
    noResults: 'Tidak ada penggantian biaya yang cocok. Sesuaikan filter.',
    rowActions: 'Tindakan untuk {{name}}',
    views: {
      mine: 'Milik saya',
      pending: 'Menunggu',
      done: 'Selesai',
      copied: 'Disalin',
    },
    statuses: {
      draft: 'Draf',
      revision: 'Revisi',
      manager: 'Tinjauan manajer',
      head: 'Tinjauan departemen',
      finance: 'Tinjauan keuangan',
      executive: 'Tinjauan eksekutif',
      gm: 'Tinjauan manajer umum',
      cashier: 'Penanganan kasir',
      exception: 'Pengecualian penanganan',
      paid: 'Dibayar',
      forcedPaid: 'Penyelesaian dicatat secara administratif',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
    },
    errors: {
      invoiceDuplicate:
        'Nomor faktur harus unik dalam penggantian biaya ini. Periksa setiap baris biaya.',
      overrunReasonRequired:
        'Klaim kumulatif melebihi alokasi disetujui tertaut lebih dari 20%. Masukkan penjelasan kelebihan.',
      invoiceUnavailable:
        'Faktur dicadangkan atau digunakan penggantian biaya lain. Periksa nomor faktur dan permintaan.',
      paymentAccountRequired:
        'Rekening pembayaran karyawan belum lengkap. Minta SDM melengkapi nama bank, nomor rekening, dan pemilik rekening sebelum mengajukan.',
      employeeInactive:
        'Pemohon memerlukan profil karyawan aktif. Hubungi SDM untuk memeriksanya.',
      departmentRequired:
        'Pemohon tidak memiliki departemen utama aktif. Minta SDM atau administrator organisasi menetapkannya.',
      categoryInvalid:
        'Kategori biaya tidak aktif atau tidak tersedia. Pilih kategori aktif untuk setiap baris.',
      sourceInvalid:
        'Alokasi tertaut tidak tersedia, belum disetujui, atau milik pemohon lain. Periksa permintaan tertaut.',
      sourceRebind:
        'Penggantian biaya yang diajukan tidak dapat mengubah alokasi atau pinjaman tertautnya. Pertahankan tautan awal.',
      loanRequired:
        'Pilih pinjaman untuk jumlah pengimbangan, atau masukkan 0 jika tidak ada pinjaman yang diimbangi.',
      loanInvalid:
        'Pinjaman terpilih tidak tersedia atau milik pemohon lain. Pilih pinjaman lain.',
      loanInsufficient:
        'Saldo pinjaman tersedia tidak mencukupi. Kurangi pengimbangan dan periksa saldo.',
      invalidOffset:
        'Pengimbangan pinjaman tidak boleh melebihi total penggantian biaya. Periksa jumlahnya.',
      attachmentInvalid:
        'Beberapa bukti tidak tersedia atau milik penggantian biaya lain. Pilih atau unggah bukti untuk permintaan ini.',
      slaConfiguration:
        'Batas waktu persetujuan tidak didukung. Hubungi administrator alur kerja.',
      inputInvalid:
        'Masukkan alasan penggantian biaya dan lengkapi baris biaya berbeda dengan bukti.',
      configuration:
        'Struktur data penggantian biaya belum lengkap. Minta administrator sistem memperbaikinya sebelum mencoba lagi.',
      forbidden: 'Anda tidak dapat mengakses penggantian biaya ini.',
      notFound: 'Penggantian biaya ini tidak lagi ada.',
      conflict:
        'Penggantian biaya ini berubah. Muat ulang dan tinjau sebelum bertindak lagi.',
      standardReason:
        'Jelaskan setiap baris pada hari yang melebihi standar disetujui.',
      standardCategoryChanged:
        'Kategori ini di luar kebijakan awal. Buat permintaan baru untuk menggunakan kebijakan saat ini.',
      standardConfiguration:
        'Standar perjalanan disetujui belum lengkap. Minta administrator memeriksa konfigurasi.',
      invalid: 'Periksa konten penggantian biaya dan bukti wajib.',
      failed: 'Permintaan tidak selesai. Coba lagi.',
    },
    standard: {
      title: 'Kebijakan biaya dibekukan',
      unsubmitted: 'Kebijakan dibekukan pada pengajuan pertama.',
      frozenHint:
        'Klasifikasi tersimpan dan batas perjalanan disetujui ini tetap tidak berubah saat revisi. Jumlah harian diagregasi menurut jenis standar.',
      gradeCode: 'Jenjang perjalanan',
      gradeRank: 'Peringkat jenjang',
      lodging: 'Penginapan per malam (yuan)',
      allowance: 'Tunjangan per hari (yuan)',
      notApplicable:
        'Tidak ada standar perjalanan disetujui yang berlaku untuk permintaan ini.',
      kinds: {
        none: 'Tanpa batas harian perjalanan',
        lodging: 'Batas harian penginapan',
        allowance: 'Batas harian tunjangan',
      },
    },
    detail: {
      lines: 'Baris biaya',
      failure: 'Kegagalan penanganan',
      voucher: 'Bukti pembayaran',
      forcedReason: 'Alasan penyelesaian administratif',
      noLines: 'Belum ada baris biaya.',
      line: 'Baris biaya {{number}}',
      financeResult: 'Hasil keuangan',
      lineStates: {
        approved: 'Disetujui',
        returned: 'Dikembalikan untuk koreksi',
        pending: 'Menunggu tinjauan',
      },
    },
    bank: {
      title: 'Rekening pembayaran pribadi',
      bankName: 'Bank',
      bankAccount: 'Rekening bank',
      bankAccountName: 'Pemilik rekening',
      missing: 'Tidak ada rekening pembayaran tersimpan.',
      correct: 'Koreksi rekening pembayaran',
      saved: 'Rekening pembayaran dikoreksi',
      denied: 'Akses rekening pembayaran ditolak.',
      unavailable:
        'Koreksi rekening tidak tersedia. Muat ulang penggantian biaya ini dan periksa rekening tersimpannya.',
    },
    authz: {
      resource: 'Penggantian biaya',
      submit: 'Buat dan ajukan penggantian biaya saya',
      delegate: 'Buat penggantian biaya untuk karyawan',
      view: 'Lihat penggantian biaya',
      paymentAccount: 'Baca dan koreksi rekening pembayaran yang diizinkan',
    },
  },
};
