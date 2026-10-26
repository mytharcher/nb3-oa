/** Every key the inbox looks up, so each locale is checked against the same list. */
export interface InboxLocale {
  readonly 'inbox.title': string;
  readonly 'inbox.description': string;
  readonly 'inbox.views.all': string;
  readonly 'inbox.views.todo': string;
  readonly 'inbox.kinds.label': string;
  readonly 'inbox.kinds.all': string;
  readonly 'inbox.kinds.decision': string;
  readonly 'inbox.kinds.info': string;
  readonly 'inbox.tabs.decision': string;
  readonly 'inbox.tabs.info': string;
  readonly 'inbox.clearFilter': string;
  readonly 'inbox.noMatchDescription': string;
  readonly 'inbox.readAll': string;
  readonly 'inbox.allRead': string;
  readonly 'inbox.loading': string;
  readonly 'inbox.loadFailed': string;
  readonly 'inbox.loadFailedDescription': string;
  readonly 'inbox.retry': string;
  readonly 'inbox.loadMore': string;
  readonly 'inbox.emptyAll': string;
  readonly 'inbox.empty.todo': string;
  readonly 'inbox.empty.decision': string;
  readonly 'inbox.empty.info': string;
  readonly 'inbox.emptyDescription': string;
  readonly 'inbox.unread': string;
  readonly 'inbox.unreadCount': string;
  readonly 'inbox.pendingDecisions': string;
  readonly 'inbox.resolved': string;
  readonly 'inbox.outcomes.approved': string;
  readonly 'inbox.outcomes.rejected': string;
  readonly 'inbox.outcomes.withdrawn': string;
  readonly 'inbox.count': string;
  readonly 'inbox.actionsFor': string;
  readonly 'inbox.actions.read': string;
  readonly 'inbox.actions.unread': string;
  readonly 'inbox.actions.delete': string;
  readonly 'inbox.deleted': string;
  readonly 'inbox.requestFailed': string;
  readonly 'inbox.forbidden': string;
  readonly 'inbox.nothingSelected': string;
  readonly 'inbox.back': string;
  readonly 'inbox.open': string;
  readonly 'inbox.keyMove': string;
  readonly 'inbox.keyOpen': string;
  readonly 'inbox.cancel': string;
  readonly 'inbox.request.approve': string;
  readonly 'inbox.request.reject': string;
  readonly 'inbox.request.commentPlaceholder': string;
  readonly 'inbox.request.commentFor': string;
  readonly 'inbox.request.quickSend': string;
  readonly 'inbox.request.newLine': string;
}

const enUS: InboxLocale = {
  'inbox.title': 'Kotak masuk',
  'inbox.description': 'Notifikasi dan permintaan yang dikirim kepada Anda.',
  'inbox.views.all': 'Semua',
  'inbox.views.todo': 'Perlu dikerjakan',
  'inbox.kinds.label': 'Jenis',
  'inbox.kinds.all': 'Semua jenis',
  'inbox.kinds.decision': 'Keputusan',
  'inbox.kinds.info': 'Notifikasi',
  'inbox.tabs.decision': 'Perlu keputusan saya',
  'inbox.tabs.info': 'Notifikasi',
  'inbox.clearFilter': 'Hapus filter',
  'inbox.noMatchDescription': 'Hapus filter untuk melihat semua jenis.',
  'inbox.readAll': 'Tandai semua sudah dibaca',
  'inbox.allRead': 'Semua ditandai sudah dibaca.',
  'inbox.loading': 'Memuat',
  'inbox.loadFailed': 'Tidak dapat memuat kotak masuk',
  'inbox.loadFailedDescription': 'Periksa koneksi Anda dan coba lagi.',
  'inbox.retry': 'Coba lagi',
  'inbox.loadMore': 'Muat lainnya',
  'inbox.emptyAll': 'Kosong',
  'inbox.empty.todo': 'Tidak ada yang menunggu Anda',
  'inbox.empty.decision': 'Tidak ada keputusan yang menunggu Anda',
  'inbox.empty.info': 'Tidak ada notifikasi',
  'inbox.emptyDescription':
    'Notifikasi dan permintaan yang dikirim kepada Anda muncul di sini.',
  'inbox.unread': 'Belum dibaca',
  'inbox.unreadCount': '{{count}} belum dibaca',
  'inbox.pendingDecisions': '{{count}} menunggu',
  'inbox.resolved': 'Ditangani',
  'inbox.outcomes.approved': 'Disetujui',
  'inbox.outcomes.rejected': 'Ditolak',
  'inbox.outcomes.withdrawn': 'Ditarik',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Tindakan untuk {{title}}',
  'inbox.actions.read': 'Tandai sudah dibaca',
  'inbox.actions.unread': 'Tandai belum dibaca',
  'inbox.actions.delete': 'Hapus',
  'inbox.deleted': 'Dihapus.',
  'inbox.requestFailed': 'Permintaan gagal. Coba lagi.',
  'inbox.forbidden': 'Anda tidak diizinkan melakukan ini.',
  'inbox.nothingSelected': 'Pilih item untuk melihatnya',
  'inbox.back': 'Kembali ke daftar',
  'inbox.open': 'Buka',
  'inbox.keyMove': 'Pindahkan',
  'inbox.keyOpen': 'Buka',
  'inbox.cancel': 'Batal',
  'inbox.request.approve': 'Setujui',
  'inbox.request.reject': 'Tolak',
  'inbox.request.commentPlaceholder': 'Tulis sesuatu…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'untuk mengirim',
  'inbox.request.newLine': 'untuk baris baru',
};

export default enUS;
