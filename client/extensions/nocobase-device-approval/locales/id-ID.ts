/** Every key the device approval looks up, so each locale is checked against the same list. */
export interface DeviceApprovalLocale {
  readonly 'deviceApproval.title': string;
  readonly 'deviceApproval.description': string;
  readonly 'deviceApproval.enterCode': string;
  readonly 'deviceApproval.codeLabel': string;
  readonly 'deviceApproval.continue': string;
  readonly 'deviceApproval.checking': string;
  readonly 'deviceApproval.confirm': string;
  readonly 'deviceApproval.client': string;
  readonly 'deviceApproval.approve': string;
  readonly 'deviceApproval.approving': string;
  readonly 'deviceApproval.deny': string;
  readonly 'deviceApproval.denying': string;
  readonly 'deviceApproval.approved': string;
  readonly 'deviceApproval.denied': string;
  readonly 'deviceApproval.expired': string;
  readonly 'deviceApproval.invalid': string;
  readonly 'deviceApproval.notYours': string;
  readonly 'deviceApproval.error': string;
  readonly 'deviceApproval.retry': string;
  readonly 'deviceApproval.otherCode': string;
}

const enUS: DeviceApprovalLocale = {
  'deviceApproval.title': 'Izinkan perangkat',
  'deviceApproval.description':
    'Baris perintah atau perangkat lain meminta masuk atas nama Anda. Setujui hanya jika Anda sendiri memulai proses masuk.',
  'deviceApproval.enterCode': 'Masukkan kode yang ditampilkan perangkat Anda.',
  'deviceApproval.codeLabel': 'Kode',
  'deviceApproval.continue': 'Lanjutkan',
  'deviceApproval.checking': 'Memeriksa kode…',
  'deviceApproval.confirm':
    'Periksa bahwa kode ini sesuai dengan yang ditampilkan perangkat Anda.',
  'deviceApproval.client': 'Diminta oleh {{client}}',
  'deviceApproval.approve': 'Setujui',
  'deviceApproval.approving': 'Menyetujui…',
  'deviceApproval.deny': 'Tolak',
  'deviceApproval.denying': 'Menolak…',
  'deviceApproval.approved':
    'Perangkat disetujui. Kembali ke terminal untuk melanjutkan; Anda dapat menutup halaman ini.',
  'deviceApproval.denied':
    'Permintaan ditolak. Perangkat tidak masuk; Anda dapat menutup halaman ini.',
  'deviceApproval.expired':
    'Kode ini kedaluwarsa. Mulai proses masuk di perangkat Anda lagi.',
  'deviceApproval.invalid':
    'Kode ini tidak valid. Cocokkan dengan perangkat Anda dan coba lagi.',
  'deviceApproval.notYours': 'Kode ini sedang disetujui akun lain.',
  'deviceApproval.error': 'Terjadi kesalahan. Coba lagi.',
  'deviceApproval.retry': 'Coba lagi',
  'deviceApproval.otherCode': 'Masukkan kode lain',
};

export default enUS;
