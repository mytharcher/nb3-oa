export default {
  resourceTitle: 'Aturan Pembatasan',
  navigation: { title: 'Aturan Pembatasan' },
  restrictionRules: {
    noResources:
      'Belum ada sumber daya bisnis yang mendukung cakupan rekaman. Minta AI menentukan izin bisnis dan cakupan rekaman sebelum mengonfigurasi aturan di sini.',
    page: {
      title: 'Aturan Pembatasan',
      description:
        'Aturan pembatasan mempersempit akses, membatasi rekaman yang dapat dijangkau pengguna terpilih tanpa memberikan akses sendiri.',
    },
    notice:
      'Aturan pembatasan hanya mempersempit akses yang ada. Aturan ini tidak pernah memberikan izin sendiri.',
    search: 'Cari berdasarkan nama aturan, kunci, atau sumber daya',
    create: 'Aturan pembatasan baru',
    ruleHeader: 'Aturan',
    appliesToHeader: 'Berlaku untuk',
    restrictedActionsHeader: 'Tindakan yang dibatasi',
    allowedScopeHeader: 'Cakupan yang diizinkan',
    emptyNone:
      'Belum ada aturan pembatasan. Buat untuk mempersempit akses pengguna terpilih.',
    emptySearch:
      'Tidak ada aturan pembatasan yang cocok dengan pencarian Anda.',
    pagerLabel: 'Aturan pembatasan',
    editTitle: 'Edit aturan pembatasan',
    newTitle: 'Aturan pembatasan baru',
    editorDescription: 'Batasi cakupan rekaman efektif untuk suatu audiens.',
    ruleHeading: 'Informasi dasar',
    ruleDescription:
      'Beri nama aturan dan pilih sumber daya yang akan dibatasi.',
    ruleName: 'Nama aturan',
    assignmentsHeading: 'Berlaku untuk',
    assignmentsDescription: 'Pilih siapa yang dikenai pembatasan ini.',
    reason: 'Deskripsi',
    accessHeading: 'Tindakan dan cakupan rekaman',
    accessDescription:
      'Atur cakupan rekaman maksimum secara terpisah untuk setiap tindakan.',
    deleteRule: 'Hapus aturan',
    save: 'Simpan aturan pembatasan',
    confirmDeleteTitle: 'Hapus aturan "{{title}}"?',
    confirmDeleteBody:
      'Hapus aturan pembatasan “{{title}}”. Kumpulan izin dan aturan yang tersisa menentukan akses.',
  },
};
