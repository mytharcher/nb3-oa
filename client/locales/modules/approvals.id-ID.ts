import registryLocale from '../../extensions/nocobase-approval-ui/locales/id-ID.js';
import { approvalLocaleIdID as pluginLocale } from '@nocobase/app-plugin-approval/client';
const existing = {
  approvals: {
    printPdf: 'Cetak / Simpan PDF',
    printFailed: 'Pencetakan gagal. Silakan coba lagi.',
    saving: 'Menyimpan…',
    noAvailableAction: 'Saat ini tidak ada tindakan yang tersedia',
    authz: {
      cancellation: 'Pembatalan cuti',
      section: 'Persetujuan OA',
      leave: 'Permintaan cuti',
      submit: 'Ajukan permintaan sendiri',
      delegate: 'Ajukan permintaan untuk karyawan',
      view: 'Baca permintaan',
      delegations: 'Delegasi persetujuan',
      read: 'Baca',
      update: 'Kelola',
    },
    permissionSets: { delegations: 'Administrasi delegasi persetujuan' },
  },
};

const copy = {
  actionErrors: {
    REASON_REQUIRED: 'Masukkan alasan operasi ini.',
    CLAIM_FIRST: 'Klaim tugas penanganan ini sebelum mencatat hasilnya.',
    TASK_CLOSED:
      'Tugas ini telah berakhir. Muat ulang permintaan dan gunakan tindakan yang tersedia saat ini.',
    ALREADY_ANSWERED:
      'Tugas ini sudah memiliki tanggapan Anda. Muat ulang untuk melihat hasil yang tercatat.',
    NOT_YOUR_TURN:
      'Persetujuan sebelumnya masih tertunda. Tunggu giliran Anda.',
    STALE: 'Persetujuan berubah. Muat permintaan terbaru sebelum melanjutkan.',
    CONTENT_CHANGED:
      'Konten yang ditinjau berubah. Muat ulang dan tinjau kembali sebelum bertindak.',
    STALE_CONTENT:
      'Konten yang ditinjau berubah. Muat ulang dan tinjau kembali sebelum bertindak.',
    INVALID_ANSWER:
      'Keputusan ini tidak tersedia pada tahap saat ini. Muat ulang dan pilih tindakan yang tersedia.',
    NOT_ALLOWED:
      'Tindakan ini tidak lagi tersedia. Muat ulang dan pilih tindakan saat ini.',
    NO_ASSIGNEE:
      'Belum ada petugas yang memenuhi syarat ditetapkan. Minta administrator persetujuan menetapkannya.',
    NO_STAGE:
      'Tidak ada tahap persetujuan aktif tersedia. Muat ulang dan minta administrator persetujuan memeriksa permintaan.',
    ASSIGNMENT_LOOP:
      'Penetapan ulang ini akan mengembalikan tugas kepada petugas sebelumnya. Pilih penerima lain yang memenuhi syarat.',
  },
  businessErrorFields: '{{message}} Periksa bidang ini: {{fields}}.',
  invalidFields: 'Periksa bidang ini: {{fields}}.',
  fieldSeparator: ', ',
  businessErrors: {
    LEAVE_EMPLOYEE_INACTIVE:
      'Pemohon memerlukan data karyawan aktif. Minta HR memeriksa data karyawan dan akun yang terhubung.',
    LEAVE_HANDOVER_INACTIVE:
      'Penerima serah terima yang dipilih tidak tersedia. Pilih orang lain, atau kosongkan kolom jika delegasi persetujuan dinonaktifkan.',
    LEAVE_MAX_DAYS:
      'Cuti yang diminta melebihi maksimum jenis cuti ini. Persingkat periode.',
    LEAVE_NO_WORKDAYS:
      'Periode yang dipilih tidak memiliki setengah hari kerja. Sesuaikan tanggalnya.',
    LEAVE_TYPE_UNAVAILABLE:
      'Jenis cuti ini tidak tersedia. Pilih jenis cuti yang aktif.',
    LEAVE_DELEGATE_REQUIRED:
      'Pilih karyawan aktif lain untuk permintaan yang didelegasikan.',
  },

  creationUnknown:
    'Hasil penyimpanan tidak diketahui. Ulangi penyimpanan yang sama atau periksa draf yang ada.',
  resubmit: 'Ajukan ulang',
  submitted: '{{name}} diajukan',
  draftSavedSubmitFailed:
    'Draf disimpan. Pengajuan belum selesai. Atasi masalah dan coba lagi.',
  submissionUnknown:
    'Hasil pengajuan tidak diketahui. Coba Ajukan lagi dengan konten yang sama sebelum membuat perubahan.',
  transfer: 'Alihkan',
  addSigner: 'Tambah penandatangan',
  urge: 'Ingatkan',
  recipientSearch: 'Cari penerima yang memenuhi syarat',
  moreRecipients: 'Muat penerima lainnya',
  signerMode: 'Mode penandatangan',
  signerbefore: 'Sebelum keputusan saya',
  signeralongside: 'Bersamaan dengan keputusan saya',
  emptyTodoTitle: 'Tidak ada persetujuan tertunda',
  emptyTodoDescription:
    'Persetujuan yang memerlukan tindakan Anda akan muncul di sini.',
  emptyDoneTitle: 'Tidak ada persetujuan selesai',
  emptyDoneDescription:
    'Persetujuan yang telah Anda tangani akan muncul di sini.',
  emptyCopiedTitle: 'Tidak ada tembusan persetujuan',
  emptyCopiedDescription:
    'Permintaan yang ditembuskan kepada Anda akan muncul di sini.',
  emptyMineTitle: 'Belum ada permintaan yang dimulai',
  emptyMineDescription: 'Lengkapi permintaan dan ajukan, atau simpan draf.',
  calendarTimeZone: 'Tanggal menggunakan kalender kerja di {{zone}}.',
  refreshAfterSuccess:
    'Tindakan berhasil, tetapi detail terbaru tidak dapat dimuat. Muat ulang tanpa mengulangi tindakan.',
  domainInvalid:
    'Permintaan tidak memenuhi ketentuan bisnis. Periksa jenis cuti, tanggal, petugas serah terima, dan detail permintaan.',
  confirmSubmit:
    'Pengajuan memulai proses persetujuan. Konfirmasikan detail permintaan.',
  confirmWithdraw: 'Penarikan mengakhiri proses persetujuan saat ini.',
  confirmReject:
    'Penolakan mengakhiri permintaan ini beserta proses persetujuannya.',
  confirmReturn:
    'Pengembalian memungkinkan pemohon merevisi permintaan. Pengajuan ulang dimulai dari tahap pertama.',
  confirmTerminate:
    'Penghentian administratif mengakhiri proses persetujuan ini.',

  navigation: {
    center: 'Pusat tugas',
    delegations: 'Delegasi persetujuan',
  },
  description: 'Proses tugas persetujuan dan pantau permintaan Anda.',
  tabs: {
    todo: 'Perlu dikerjakan',
    done: 'Selesai',
    copied: 'Tembusan kepada saya',
    mine: 'Permintaan saya',
  },
  newLeave: 'Permintaan cuti baru',
  editLeave: 'Edit permintaan cuti',
  draft: 'Draf',
  search: 'Cari berdasarkan referensi atau pemohon',
  clear: 'Hapus filter',
  all: 'Semua',
  noResults: 'Tidak ada rekaman yang cocok',
  emptyTitle: 'Belum ada permintaan',
  emptyDescription:
    'Tugas persetujuan dan permintaan baru akan muncul di sini.',
  refresh: 'Muat ulang',
  loading: 'Memuat',
  reference: 'Nomor permintaan',
  applicant: 'Pemohon',
  type: 'Jenis cuti',
  days: 'Hari',
  status: 'Status',
  createdAt: 'Diminta pada',
  actions: 'Tindakan untuk "{{name}}"',
  detail: 'Lihat',
  edit: 'Edit',
  saveDraft: 'Simpan draf',
  save: 'Simpan',
  cancel: 'Batal',
  close: 'Tutup',
  submit: 'Ajukan',
  withdraw: 'Tarik',
  terminate: 'Hentikan',
  read: 'Tandai sudah dibaca',
  approve: 'Setujui',
  reject: 'Tolak',
  return: 'Kembalikan',
  comment: 'Komentar',
  appoint: 'Tetapkan',
  reassign: 'Tetapkan ulang',
  reason: 'Alasan',
  opinion: 'Komentar',
  person: 'Pemberi persetujuan',
  place: 'Posisi belum ditetapkan',
  startDate: 'Tanggal mulai',
  endDate: 'Tanggal akhir',
  startHalf: 'Paruh hari mulai',
  endHalf: 'Paruh hari akhir',
  am: 'Pagi',
  pm: 'Sore',
  handover: 'Petugas serah terima',
  delegate: 'Delegasikan persetujuan selama cuti',
  attachmentMissing:
    'Beberapa lampiran tidak tersedia. Muat ulang permintaan atau hubungi pemohonnya.',
  attachments: 'Lampiran',
  attachmentRequired:
    'Tambahkan lampiran pendukung yang diwajibkan jenis cuti yang dipilih.',
  attachmentUnavailable:
    'Unggahan lampiran sementara tidak tersedia. Coba lagi nanti atau hubungi administrator.',
  attachmentInvalid:
    'Beberapa lampiran yang dipilih tidak valid atau bukan milik permintaan ini. Muat ulang permintaan dan pilih kembali.',
  attachmentLimit:
    'Lampiran: PDF, JPEG, PNG, atau WebP, maksimal 5 MB per file dan 10 file. Draf valid disimpan sebelum unggahan pertama.',
  attachmentSize: 'Pilih file yang tidak kosong dan maksimal 5 MB.',
  attachmentType:
    'Pilih file PDF, JPEG, PNG, atau WebP dengan format yang sesuai.',
  attachmentCount: 'Maksimum 10 lampiran diperbolehkan.',
  attachmentDenied:
    'Anda tidak dapat mengakses lampiran permintaan ini. Muat ulang permintaan untuk memeriksa akses.',
  attachmentFailed:
    'Unggahan gagal. Periksa formulir dan koneksi, lalu pilih file lagi.',
  attachmentUploading: 'Menyimpan draf dan mengunggah…',
  attachmentRemove: 'Hapus lampiran {{number}}',
  balanceInsufficient:
    'Saldo cuti tersedia tidak mencukupi. Kurangi hari atau hubungi SDM.',
  balanceLimit:
    'Cuti tahunan dan cuti pengganti akan tersedia melalui saldo cuti.',
  unavailable: 'Tindakan ini tidak tersedia. Periksa penghambatnya.',
  formDescription: 'Lengkapi permintaan dan ajukan, atau simpan draf.',
  preview: 'Pratinjau rute persetujuan',
  facts: 'Detail permintaan',
  progress: 'Kemajuan persetujuan',
  timeline: 'Riwayat persetujuan',
  saved: 'Permintaan cuti "{{name}}" disimpan',
  completed: '{{action}}: "{{name}}"',
  actionTitle: '{{action}} permintaan "{{name}}"',
  returnHint:
    'Kembalikan kepada pemohon; pengajuan ulang dimulai dari tahap pertama.',
  confirmDescription:
    'Ini mengakhiri tugas persetujuan saat ini. Konfirmasikan konten yang ditinjau.',
  discard: 'Buang perubahan?',
  discardDescription: 'Perubahan yang belum disimpan akan hilang.',
  discardConfirm: 'Buang perubahan',
  readOnly: 'Rekaman ini hanya dapat dibaca.',
  hrPreview:
    'Untuk permintaan atas nama karyawan, rute dihitung saat pengajuan.',
  dateRange: 'Waktu akhir tidak boleh sebelum waktu mulai.',
  required: 'Masukkan nilai.',
  limit: 'Gunakan maksimal 10.000 karakter.',
  handoverRequired: 'Pilih petugas serah terima untuk mengaktifkan delegasi.',
  unknownPerson: 'Nama tidak tersedia',
  yes: 'Ya',
  no: 'Tidak',
  error: {
    invalid:
      'Konten atau tindakan tidak memenuhi persyaratan. Periksa dan sesuaikan.',
    overlap:
      'Permintaan cuti aktif atau disetujui sudah bertumpang tindih dengan periode ini. Sesuaikan tanggalnya.',
    configuration:
      'Konfigurasi tenggat persetujuan saat ini tidak didukung. Hubungi administrator.',
    inactive:
      'Karyawan yang diperlukan tidak tersedia. Periksa status karyawan.',

    failed: 'Permintaan gagal. Silakan coba lagi.',
    forbidden: 'Akses ditolak. Hubungi administrator.',
    notFound: 'Rekaman ini tidak ada atau dihapus. Kembali ke daftar.',
    conflict: 'Permintaan ini berubah. Muat konten terbaru sebelum bertindak.',
    stale: 'Tugas ini ditutup atau tindakannya tidak lagi tersedia.',
  },
  loadLatest: 'Muat yang terbaru',
  retry: 'Coba lagi',
  states: {
    draft: 'Draf',
    revision: 'Perlu revisi',
    manager: 'Tinjauan manajer',
    head: 'Tinjauan kepala departemen',
    hr: 'Tinjauan SDM',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    withdrawn: 'Ditarik',
    terminated: 'Dihentikan',
  },
  stages: {
    manager: 'Manajer langsung',
    head: 'Kepala departemen',
    hr: 'SDM',
    revision: 'Revisi pemohon',
  },
  delegations: {
    create: 'Buat',
    description:
      'Izinkan delegasi memproses persetujuan selama periode tertentu.',
    new: 'Delegasi baru',
    edit: 'Edit delegasi',
    disable: 'Nonaktifkan',
    principal: 'Pemberi kuasa',
    delegate: 'Penerima kuasa',
    scope: 'Cakupan',
    from: 'Mulai',
    to: 'Akhir',
    source: 'Sumber',
    active: 'Aktif',
    inactive: 'Tidak aktif',
    manual: 'Manual',
    leave: 'Cuti',
    search: 'Cari berdasarkan pemberi atau penerima kuasa',
    sourceLeave: 'Dibuat dari cuti. Kelola melalui permintaan terkait.',
    invalid:
      'Pilih karyawan aktif yang berbeda dan waktu akhir setelah waktu mulai.',
    overlap:
      'Delegasi sudah mencakup cakupan dan periode ini. Sesuaikan periode atau cakupannya.',
    disableTitle:
      'Nonaktifkan delegasi dari "{{principal}}" kepada "{{delegate}}"?',
    disableDescription:
      'Penerima kuasa tidak lagi memproses persetujuan dalam cakupan ini.',
    saved: 'Delegasi untuk "{{name}}" disimpan',
    empty: 'Belum ada delegasi persetujuan',
    emptyDescription:
      'Buat delegasi agar seseorang memproses persetujuan selama suatu periode.',
    timeZone: 'Waktu menggunakan {{zone}}. Waktu akhir tidak termasuk.',
  },
  typeUnavailable: 'Jenis cuti tidak tersedia',
  noPickerPermission:
    'Pemilihan orang memerlukan izin baca pengguna. Hubungi administrator.',
};
export default {
  ...registryLocale,
  ...pluginLocale,
  approvals: {
    ...existing.approvals,
    ...copy,
    authz: {
      ...existing.approvals.authz,
      ownScope: 'Rekaman saya',
      readableScope: 'Permintaan persetujuan yang dapat dibaca',
    },
    delegations: {
      ...copy.delegations,
      allScope: 'Semua persetujuan',
      leaveScope: 'Persetujuan cuti',
      fromTime: 'Waktu mulai (HH:mm)',
      toTime: 'Waktu akhir (HH:mm)',
      timeInvalid: 'Pilih tanggal dan masukkan waktu 24 jam yang valid.',
      disabled: 'Delegasi persetujuan untuk "{{name}}" dinonaktifkan',
      readOnly: 'Delegasi ini hanya dapat dibaca.',
    },
  },
};
