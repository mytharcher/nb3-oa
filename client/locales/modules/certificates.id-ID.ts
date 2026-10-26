export default {
  certificates: {
    authz: {
      readable: 'Permintaan sendiri dan yang diikuti',
      requests: 'Permintaan sertifikat',
      view: 'Lihat',
      create: 'Buat',
      edit: 'Edit',
      operate: 'Operasikan',
      issue: 'Terbitkan',
      income: 'Pendapatan',
      owned: 'Dimiliki',
    },
    savedRecord: 'Permintaan sertifikat untuk "{{name}}" disimpan',
    issuedRecord: 'Sertifikat untuk "{{name}}" diterbitkan',
    submittedRecord: 'Permintaan sertifikat untuk "{{name}}" diajukan',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED: 'Operasi sertifikat ditolak: akses ditolak',
      CERTIFICATE_APPROVAL_REFUSED:
        'Operasi sertifikat ditolak: persetujuan ditolak',
      CERTIFICATE_ARTIFACT_MISSING:
        'Operasi sertifikat ditolak: artefak tidak ada',
      CERTIFICATE_CLAIM_REQUIRED:
        'Operasi sertifikat ditolak: klaim diperlukan',
      CERTIFICATE_COMMAND_CONFLICT:
        'Operasi sertifikat ditolak: konflik perintah',
      CERTIFICATE_COMMAND_INVALID:
        'Operasi sertifikat ditolak: perintah tidak valid',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Operasi sertifikat ditolak: departemen diperlukan',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Operasi sertifikat ditolak: karyawan diperlukan',
      CERTIFICATE_HEAD_REQUIRED:
        'Operasi sertifikat ditolak: kepala diperlukan',
      CERTIFICATE_HR_REQUIRED: 'Operasi sertifikat ditolak: SDM diperlukan',
      CERTIFICATE_INCOME_DENIED:
        'Operasi sertifikat ditolak: pendapatan ditolak',
      CERTIFICATE_INCOME_INVALID:
        'Operasi sertifikat ditolak: pendapatan tidak valid',
      CERTIFICATE_INVALID: 'Operasi sertifikat ditolak: tidak valid',
      CERTIFICATE_PREPARATION_INVALID:
        'Operasi sertifikat ditolak: persiapan tidak valid',
      CERTIFICATE_PREPARATION_MISSING:
        'Operasi sertifikat ditolak: persiapan tidak ada',
      CERTIFICATE_PREPARATION_STALE:
        'Operasi sertifikat ditolak: persiapan kedaluwarsa',
      CERTIFICATE_SOURCE_STALE:
        'Operasi sertifikat ditolak: sumber kedaluwarsa',
      CERTIFICATE_TARGET_MISMATCH:
        'Operasi sertifikat ditolak: target tidak cocok',
      CERTIFICATE_TEMPLATE_DENIED:
        'Operasi sertifikat ditolak: templat ditolak',
    },

    title: 'Sertifikat',
    description: 'Minta dan terbitkan sertifikat karyawan',
    new: 'Permintaan sertifikat baru',
    edit: 'Edit permintaan sertifikat',
    detail: 'Detail sertifikat',
    issue: 'Terbitkan sertifikat',
    refresh: 'Muat ulang',
    clear: 'Hapus filter',
    search: 'Cari tujuan',
    all: 'Semua status',
    name: 'Sertifikat',
    recordName: 'Sertifikat · {{name}}',
    type: 'Jenis',
    purpose: 'Tujuan',
    copies: 'Salinan',
    delivery: 'Metode pengiriman',
    applicant: 'Pemohon',
    createdAt: 'Diminta pada',
    status: 'Status',
    number: 'Nomor sertifikat',
    issueDate: 'Tanggal penerbitan',
    oldest: 'Terlama dahulu',
    newest: 'Terbaru dahulu',
    empty: 'Tidak ada permintaan sertifikat',
    noMatch: 'Tidak ada permintaan yang cocok',
    failed: 'Tidak dapat menyelesaikan operasi ini',
    unavailable: 'Rekaman atau tindakan ini tidak lagi tersedia',
    retry: 'Coba lagi',
    cancel: 'Batal',
    save: 'Simpan draf',
    saved: 'Disimpan',
    loading: 'Memuat detail sertifikat',
    moreActions: 'Tindakan lainnya',
    backToList: 'Kembali ke daftar sertifikat',
    consequences: {
      withdraw:
        'Tarik permintaan ini; permintaan akan keluar dari antrean tinjauan aktif.',
      terminate: 'Hentikan permintaan ini; pemrosesan normal akan berhenti.',
      forceComplete:
        'Akhiri permintaan ini sebagai pengecualian; sertifikat tidak akan diterbitkan.',
      reject:
        'Tolak permintaan ini; permintaan tidak dilanjutkan ke penerbitan.',
      return: 'Kembalikan permintaan ini kepada pemohon untuk diubah.',
      unable:
        'Catat bahwa SDM tidak dapat menerbitkan sertifikat ini; permintaan memerlukan penyelesaian.',
    },
    invalidInput: 'Periksa bidang yang ditunjukkan dan masukkan nilai valid.',
    invalidCopies: 'Masukkan bilangan bulat antara 1 dan 100.',
    invalidPurpose: 'Tujuan maksimal 2.000 karakter.',
    required: 'Wajib',
    confirm: 'Konfirmasi',
    discard: 'Buang perubahan',
    discardDescription: 'Perubahan Anda yang belum disimpan akan hilang.',
    confirmDescription:
      'Terapkan tindakan ini pada sertifikat yang diminta {{name}}? Ini mengubah permintaan saat ini.',
    history: 'Riwayat persetujuan',
    mode: 'Penempatan peninjau',
    modes: {
      before: 'Sebelum keputusan saya',
      alongside: 'Bersamaan dengan keputusan saya',
    },
    recipient: 'Penerima',
    reason: 'Alasan atau komentar',
    download: 'Unduh DOCX',
    income: 'Pendapatan bulanan (CNY)',
    template: 'Templat',
    selectTemplate: 'Pilih templat',
    revision: 'Revisi tetap',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    prepare: 'Siapkan penerbitan',
    generate: 'Buat dokumen',
    confirmIssue: 'Konfirmasi penerbitan',
    issued: 'Sertifikat diterbitkan',
    issueDescription:
      'Siapkan revisi templat tetap, buat dokumen aktual, lalu konfirmasi penerbitan dan arsipkan.',
    invalidIssue:
      'Pilih tanggal penerbitan dan masukkan pendapatan valid dengan maksimal dua angka desimal.',
    generateDescription:
      'Pembuatan mungkin memerlukan waktu. Jika gagal, ulangi persiapan ini; sertifikat belum diterbitkan.',
    confirmIssueDescription:
      'Dokumen yang dibuat akan diterbitkan dan dicatat permanen dalam arsip karyawan.',
    types: {
      employment: 'Kepegawaian',
      income: 'Pendapatan',
      other: 'Lainnya',
    },
    deliveries: { pickup: 'Pengambilan', mail: 'Pos', digital: 'Digital' },
    states: {
      draft: 'Draf',
      revision: 'Perlu revisi',
      head: 'Tinjauan manajer',
      issuing: 'Penanganan SDM',
      issued: 'Diserahkan',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
      issueException: 'Pengecualian penerbitan',
      administrativelyClosed: 'Ditutup secara administratif',
    },
    actions: {
      edit: 'Edit',
      submit: 'Ajukan',
      withdraw: 'Tarik',
      terminate: 'Hentikan',
      forceComplete: 'Penutupan administratif',
      retry: 'Ulangi penanganan',
      approve: 'Setujui',
      reject: 'Tolak',
      return: 'Kembalikan untuk revisi',
      claim: 'Klaim',
      release: 'Lepaskan',
      assign: 'Tetapkan',
      transfer: 'Alihkan',
      appoint: 'Tunjuk',
      reassign: 'Tetapkan ulang',
      comment: 'Komentar',
      read: 'Tandai sudah dibaca',
      cc: 'Salin',
      addSigner: 'Tambah peninjau',
      addSign: 'Tambah peninjau',
      urge: 'Ingatkan',
      complete: 'Konfirmasi penerbitan',
      unable: 'Tidak dapat menerbitkan',
      delegate: 'Penerima kuasa',
      recall: 'Tarik kembali',
    },
  },
};
