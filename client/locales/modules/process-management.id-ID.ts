export default {
  flowDiagram: {
    escapeHint: 'Tekan Esc untuk keluar',
    controls: 'Kontrol diagram',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    fitView: 'Sesuaikan tampilan',
    fullscreen: 'Layar penuh',
    exitFullscreen: 'Keluar dari layar penuh',
    minimap: 'Peta mini',

    empty: 'Tidak ada status untuk ditampilkan.',
    loading: 'Menata diagram…',
    failed:
      'Tidak dapat menata diagram. Lihat parameter proses dan eksekusi terbaru.',
    nodeHelp: 'Status proses. Geser dan perbesar untuk menjelajahi.',
    edgeHelp: 'Transisi proses',
  },
  processManagement: {
    managementReason: 'Alasan',
    normalDescription:
      'Menampilkan alur bisnis utama; kondisi menentukan cabangnya.',
    revealHint:
      'Arahkan kursor ke langkah untuk menampilkan pengembalian dan jalan keluar lain, lalu ke jalan keluar untuk detail.',
    graphLegend: 'Legenda diagram',
    otherExits: 'Jalan keluar lain',
    exitNext: 'Lalu dapat:',
    exitEnds: 'Proses berakhir di sini.',
    nodeTypes: {
      start: 'Mulai',
      approval: 'Persetujuan',
      work: 'Langkah kerja',
      success: 'Selesai',
      negative: 'Berakhir',
      exception: 'Pengembalian atau pengecualian',
    },
    rulesCount_one: '{{count}} aturan',
    rulesCount_other: '{{count}} aturan',
    notReached: 'Belum dicapai',
    parameters: {
      title: 'Parameter alur kerja',
      description:
        'Ambang yang dibaca proses ini pada setiap langkah. Setiap nilai diatur sekali dan berlaku untuk semua langkah yang tercantum di sampingnya.',
      none: 'Proses ini tidak memiliki parameter yang dapat disesuaikan.',
      onNodes:
        'Proses ini dikonfigurasi pada langkahnya. Gunakan tombol pengaturan pada langkah dalam diagram.',
      forbidden: 'Anda tidak memiliki izin untuk melihat parameter proses ini.',
      readOnly: 'Anda dapat melihat parameter ini tetapi tidak mengubahnya.',
      changed: 'Diubah',
      scheduled: 'Berubah menjadi {{value}} pada {{date}}.',
      orderViolated:
        'Tidak berurutan dengan parameter terkait: ambang lebih rendah tidak boleh melebihi yang lebih tinggi. Sesuaikan keduanya di sini dan simpan bersama.',
      discard: 'Buang perubahan',
      save_zero: 'Simpan',
      save_one: 'Simpan 1 perubahan',
      save_other: 'Simpan {{count}} perubahan',
      saved_one: '1 parameter disimpan',
      saved_other: '{{count}} parameter disimpan',
    },
    nodeSettings: {
      edit: 'Edit parameter',
      editNamed: 'Edit parameter untuk {{name}}',
      title: 'Edit parameter untuk {{name}}',
      parameter: 'Parameter',
      effect:
        'Perubahan tidak menulis ulang snapshot permintaan tersimpan atau tugas yang ada. Pengajuan baru menggunakan konfigurasi yang berlaku; pengajuan ulang mengikuti aturan proses pemiliknya.',
      shared: 'Pengaturan bersama. Juga memengaruhi: {{flows}}.',
      unavailable:
        'Simpul ini tidak memiliki parameter yang dapat diedit. Tutup dialog ini dan pilih simpul yang dikonfigurasi.',
      forbidden:
        'Anda tidak memiliki izin untuk mengedit konfigurasi simpul ini.',
      newCommittee: 'Terbitkan struktur komite baru',
      seat: 'Versi {{version}} · orang pada posisi {{name}}',
      committeeContext:
        'Simpul terpilih: versi {{selected}}. Aktif: {{active}}. Terakhir disimpan: {{latest}}.',
    },
    conditionMissing:
      'Cabang ini memerlukan deskripsi kondisi eksplisit; periksa aturan bisnis pemiliknya',
    snapshotConditions:
      'Ambang jumlah, hari, dan jenjang menggunakan aturan yang dibekukan saat pengajuan. Definisi ini menjelaskan kriteria keputusan, bukan snapshot permintaan historis.',
    branchConditions: {
      travelCancellation_unbooking:
        'Perjalanan awal meminta pemesanan, sehingga pembatalan memerlukan pembatalan pemesanan',
      travelCancellation_approved:
        'Perjalanan awal tidak meminta pemesanan, sehingga pembatalan pemesanan tidak diperlukan',
      reimbursement_managerApproved_head:
        'Total penggantian biaya > batas kepala departemen yang dibekukan dan validasi penggabungan tugas manajer/kepala belum lolos',
      reimbursement_managerApproved_finance:
        'Total penggantian biaya tidak melebihi batas kepala, atau tugas persetujuan manajer/kepala digabungkan secara valid',

      training_managerApproved_head:
        'Nilai pelatihan > 0 dan tugas persetujuan manajer/kepala belum digabungkan secara valid',
      training_managerApproved_finance:
        'Nilai pelatihan > 0; manajer dan kepala adalah orang yang sama dan putaran ini lolos validasi penggabungan tugas persetujuan',
      training_managerApproved_approved: 'Nilai pelatihan nol',

      travel_managerApproved_head:
        'Kondisi penggabungan manajer/kepala tidak terpenuhi',
      travel_managerApproved_finance:
        'Manajer dan kepala departemen adalah orang yang sama dan putaran ini lolos validasi penggabungan tugas persetujuan',
      probation_managerApproved_head:
        'Kondisi penggabungan manajer/kepala tidak terpenuhi',
      probation_managerApproved_hr:
        'Manajer dan kepala departemen adalah orang yang sama dan putaran ini lolos validasi penggabungan tugas persetujuan',
      departure_managerApproved_head:
        'Kondisi penggabungan manajer/kepala tidak terpenuhi',
      departure_managerApproved_hr:
        'Manajer dan kepala departemen adalah orang yang sama dan putaran ini lolos validasi penggabungan tugas persetujuan',
      expensePlan_financeApproved_executive:
        'Persetujuan eksekutif diperlukan: jumlah > batas eksekutif yang dibekukan saat pengajuan',
      expensePlan_financeApproved_gm:
        'Persetujuan eksekutif tidak diperlukan; jumlah > batas manajer umum yang dibekukan saat pengajuan',
      expensePlan_financeApproved_approved:
        'Kondisi persetujuan tambahan eksekutif maupun manajer umum tidak berlaku',
      expensePlan_executiveApproved_gm:
        'Persetujuan manajer umum diperlukan dan validasi penggabungan tugas eksekutif/manajer umum belum lolos',
      expensePlan_executiveApproved_approved:
        'Persetujuan manajer umum tidak diperlukan, atau tugas persetujuan eksekutif/manajer umum digabungkan secara valid',
      loan_financeApproved_executive:
        'Persetujuan eksekutif diperlukan: jumlah > batas eksekutif yang dibekukan saat pengajuan',
      loan_financeApproved_gm:
        'Persetujuan eksekutif tidak diperlukan; jumlah > batas manajer umum yang dibekukan saat pengajuan',
      loan_financeApproved_cashier:
        'Kondisi persetujuan tambahan eksekutif maupun manajer umum tidak berlaku',
      loan_executiveApproved_gm:
        'Persetujuan manajer umum diperlukan dan validasi penggabungan tugas eksekutif/manajer umum belum lolos',
      loan_executiveApproved_cashier:
        'Persetujuan manajer umum tidak diperlukan, atau tugas persetujuan eksekutif/manajer umum digabungkan secara valid',
      purchase_financeApproved_executive:
        'Persetujuan eksekutif diperlukan: jumlah > batas eksekutif yang dibekukan saat pengajuan',
      purchase_financeApproved_gm:
        'Persetujuan eksekutif tidak diperlukan; jumlah > batas manajer umum yang dibekukan saat pengajuan',
      purchase_financeApproved_approved:
        'Kondisi persetujuan tambahan eksekutif maupun manajer umum tidak berlaku',
      purchase_executiveApproved_gm:
        'Persetujuan manajer umum diperlukan dan validasi penggabungan tugas eksekutif/manajer umum belum lolos',
      purchase_executiveApproved_approved:
        'Persetujuan manajer umum tidak diperlukan, atau tugas persetujuan eksekutif/manajer umum digabungkan secara valid',
      payment_financeApproved_executive:
        'Persetujuan eksekutif diperlukan: jenjang persetujuan lengkap dan jumlah > batas eksekutif yang dibekukan saat pengajuan',
      payment_financeApproved_gm:
        'Persetujuan eksekutif tidak diperlukan; jumlah > batas manajer umum yang dibekukan saat pengajuan dan persetujuan lengkap diperlukan',
      payment_financeApproved_cashier:
        'Kondisi persetujuan tambahan eksekutif maupun manajer umum tidak berlaku',
      payment_executiveApproved_gm:
        'Persetujuan manajer umum diperlukan dan validasi penggabungan tugas eksekutif/manajer umum belum lolos',
      payment_executiveApproved_cashier:
        'Persetujuan manajer umum tidak diperlukan, atau tugas persetujuan eksekutif/manajer umum digabungkan secara valid',
      travel_financeApproved_executive:
        'Persetujuan eksekutif diperlukan: perjalanan internasional, atau jumlah > batas eksekutif yang dibekukan saat pengajuan',
      travel_financeApproved_gm:
        'Persetujuan eksekutif tidak diperlukan; jumlah > batas manajer umum yang dibekukan saat pengajuan',
      travel_financeApproved_booking:
        'Tidak diperlukan persetujuan eksekutif/manajer umum lebih lanjut dan pemesanan diminta',
      travel_financeApproved_completed:
        'Tidak diperlukan persetujuan eksekutif/manajer umum lebih lanjut dan pemesanan tidak diminta',
      travel_executiveApproved_gm:
        'Persetujuan manajer umum diperlukan dan validasi penggabungan tugas eksekutif/manajer umum belum lolos',
      travel_executiveApproved_booking:
        'Persetujuan manajer umum tidak diperlukan atau digabungkan secara valid; pemesanan diminta',
      travel_executiveApproved_completed:
        'Persetujuan manajer umum tidak diperlukan atau digabungkan secara valid; pemesanan tidak diminta',
      travel_gmApproved_booking: 'Pemesanan diminta',
      travel_gmApproved_completed: 'Pemesanan tidak diminta',
      payment_submit_head:
        'Pemeriksaan sumber dana memerlukan jenjang persetujuan lengkap, termasuk pembayaran berlebih yang memerlukan persetujuan tambahan',
      payment_submit_finance:
        'Pemeriksaan sumber dana tidak memerlukan jenjang persetujuan lengkap',
      budgetAdjustment_cfoApproved_gm:
        'Jumlah penambahan anggaran melebihi batas manajer umum yang dibekukan saat pengajuan',
      budgetAdjustment_cfoApproved_approved:
        'Bukan penambahan anggaran, atau penambahan tidak melebihi batas manajer umum yang dibekukan',
      leave_managerApproved_head:
        'Hari ≥ batas kepala departemen yang dibekukan dan kepala tidak ada atau berbeda dari manajer',
      leave_managerApproved_hr:
        'Tinjauan kepala tidak diperlukan; jenis cuti memerlukan SDM atau hari ≥ batas SDM yang dibekukan',
      leave_managerApproved_approved:
        'Tanpa tinjauan kepala, jenis cuti tidak memerlukan SDM, dan hari di bawah batas SDM yang dibekukan',
      leave_headApproved_hr:
        'Jenis cuti memerlukan SDM atau hari ≥ batas SDM yang dibekukan',
      leave_headApproved_approved:
        'Jenis cuti tidak memerlukan SDM dan hari di bawah batas SDM yang dibekukan',
      overtime_managerApproved_head:
        'Lembur bulanan melebihi batas tinjauan kepala yang dibekukan dan kepala tidak ada atau berbeda dari manajer',
      overtime_managerApproved_hr:
        'Tinjauan kepala tidak diperlukan; diajukan lebih dari 3 hari kerja setelah tanggal lembur',
      overtime_managerApproved_approved:
        'Tinjauan kepala tidak diperlukan; diajukan dalam rentang pelaporan 3 hari kerja',
      overtime_headApproved_hr:
        'Diajukan lebih dari 3 hari kerja setelah tanggal lembur',
      overtime_headApproved_approved:
        'Diajukan dalam 3 hari kerja setelah tanggal lembur',
      supplies_submit_issuing:
        'Diajukan ulang dari pengecualian pemenuhan dengan konten disetujui yang tidak berubah',
      supplies_submit_manager:
        'Permintaan baru, konten yang dicakup persetujuan berubah, atau syarat melanjutkan tidak terpenuhi',
      vehicleRequest_submit_dispatch:
        'Diajukan ulang dari pengecualian pemenuhan dengan konten disetujui yang tidak berubah',
      vehicleRequest_submit_head:
        'Permintaan baru, konten yang dicakup persetujuan berubah, atau syarat melanjutkan tidak terpenuhi',
      purchase_submit_purchasing:
        'Diajukan ulang dari pengecualian pemenuhan dengan konten disetujui yang tidak berubah',
      purchase_submit_head:
        'Permintaan baru, konten yang dicakup persetujuan berubah, atau syarat melanjutkan tidak terpenuhi',
      assetRequest_submit_issuing:
        'Diajukan ulang dari pengecualian pemenuhan dengan konten disetujui tidak berubah; kelayakan melanjutkan lolos; bukan permintaan penghapusan',
      assetRequest_submit_head:
        'Permintaan baru, konten yang dicakup persetujuan berubah, atau syarat melanjutkan tidak terpenuhi',
      sealRequest_submit_stamping:
        'Diajukan ulang dari pengecualian pemenuhan dengan konten disetujui tidak berubah; kelayakan melanjutkan lolos',
      sealRequest_submit_head:
        'Permintaan baru, konten yang dicakup persetujuan berubah, atau syarat melanjutkan tidak terpenuhi',
      purchase_priced_revision:
        'Harga aktual > 120% dari perkiraan awal; konfirmasi pemohon dan pengajuan ulang diperlukan',
      purchase_priced_finance: 'Harga aktual ≤ 120% dari perkiraan awal',
      purchase_forcedPriced_revision:
        'Harga aktual > 120% dari perkiraan awal; konfirmasi pemohon dan pengajuan ulang diperlukan',
      purchase_forcedPriced_finance: 'Harga aktual ≤ 120% dari perkiraan awal',
      probation_hrApproved_gm:
        'Pengangkatan tetap ditolak, atau jenjang yang dikonfirmasi SDM mencapai ambang peringkat manajer yang dibekukan',
      probation_hrApproved_approved:
        'Pengangkatan tetap tidak ditolak dan jenjang yang dikonfirmasi SDM di bawah ambang manajer',
      departure_hrApproved_gm:
        'Jenjang karyawan ≥ ambang peringkat manajer yang dibekukan saat pengajuan',
      departure_hrApproved_handover:
        'Jenjang karyawan di bawah ambang peringkat manajer yang dibekukan',
      departure_cancellationRejected_gm:
        'Pembatalan ditolak; lanjutkan status manajer umum tersimpan sebelum pembatalan',
      departure_cancellationRejected_handover:
        'Pembatalan ditolak; lanjutkan status serah terima tersimpan sebelum pembatalan',
      departure_cancellationRejected_completed:
        'Pembatalan ditolak; lanjutkan status selesai tersimpan sebelum pembatalan',
      recruitment_submit_head:
        'Pemohon bukan kepala departemen, atau kepala tidak ada',
      recruitment_submit_hrbp:
        'Pemohon adalah kepala departemen; lewati persetujuan diri sendiri',
      recruitment_reviewEdit_head:
        'Pemohon bukan kepala departemen, atau kepala tidak ada',
      recruitment_reviewEdit_hrbp:
        'Pemohon adalah kepala departemen; lewati persetujuan diri sendiri',
      recruitment_hrDirectorApproved_executive:
        'Permintaan menggunakan tambahan jumlah karyawan',
      recruitment_hrDirectorApproved_gm:
        'Bukan tambahan jumlah karyawan; jenjang tujuan mencapai ambang peringkat direktur yang dibekukan',
      recruitment_hrDirectorApproved_approved:
        'Bukan tambahan jumlah karyawan; jenjang tujuan di bawah ambang peringkat direktur',
      recruitment_executiveApproved_gm:
        'Tambahan jumlah karyawan atau jenjang tujuan mencapai ambang direktur',
      recruitment_executiveApproved_approved:
        'Bukan tambahan jumlah karyawan dan jenjang tujuan di bawah ambang direktur',
      transfer_submit_manager:
        'Pelaku pengajuan bukan manajer karyawan; tanpa manajer tetap masuk ke tinjauan manajer',
      transfer_submit_sourceHead: 'Pelaku pengajuan adalah manajer karyawan',
      transfer_reviewEdit_manager:
        'Pelaku pengajuan bukan manajer karyawan; tanpa manajer tetap masuk ke tinjauan manajer',
      transfer_reviewEdit_sourceHead:
        'Pelaku pengajuan adalah manajer karyawan',
      transfer_sourceHeadApproved_targetHead:
        'Perubahan mencakup mutasi departemen',
      transfer_sourceHeadApproved_hr:
        'Perubahan tidak mencakup mutasi departemen',
      transfer_hrApproved_executive:
        'Kenaikan gaji melebihi ambang eksekutif yang dibekukan, atau jenjang tujuan mencapai peringkat manajer',
      transfer_hrApproved_gm:
        'Tanpa tinjauan eksekutif; kenaikan melebihi ambang manajer umum yang dibekukan atau jenjang tujuan mencapai peringkat direktur',
      transfer_hrApproved_pendingEffective:
        'Tidak ada kondisi gaji atau jenjang untuk tinjauan tambahan eksekutif/manajer umum yang berlaku',
      transfer_executiveApproved_gm:
        'Kenaikan melebihi ambang manajer umum yang dibekukan atau jenjang tujuan mencapai peringkat direktur',
      transfer_executiveApproved_pendingEffective:
        'Kondisi gaji maupun jenjang untuk tinjauan tambahan manajer umum tidak berlaku',
      assetRequest_headApproved_appraisal: 'Permintaan adalah penghapusan aset',
      assetRequest_headApproved_issuing: 'Permintaan bukan penghapusan aset',
      assetRequest_financeApproved_gm:
        'Permintaan penghapusan; total nilai awal aset melebihi batas manajer umum penghapusan yang dibekukan',
      assetRequest_financeApproved_scrapped:
        'Ambang manajer umum berdasarkan nilai awal penghapusan tidak terlampaui',
      assetRequest_issueCompleted_returning:
        'Permintaan pinjam: serahkan lalu masuk ke pemrosesan pengembalian',
      assetRequest_issueCompleted_issued: 'Permintaan bukan peminjaman',
      sealRequest_stamped_returning:
        'Peminjaman stempel eksternal memerlukan pemrosesan pengembalian',
      sealRequest_stamped_completed: 'Stempel tidak digunakan secara eksternal',
      vendorQualification_submit_removalReview:
        'Operasi menghapus pemasok dari direktori',
      vendorQualification_submit_purchasing: 'Operasi tidak menghapus pemasok',
      contract_headApproved_legalFinance:
        'Pengakhiran kontrak atau templat nonstandar',
      contract_headApproved_standardFinance:
        'Bukan pengakhiran dan templat standar digunakan',
      contract_legalFinanceApproved_executive:
        'Nilai kontrak melebihi batas eksekutif yang dibekukan; bukan pengakhiran',
      contract_legalFinanceApproved_gm:
        'Tanpa tinjauan eksekutif; nilai melebihi batas manajer umum kontrak yang dibekukan atau hukum/keuangan menandainya nonstandar; bukan pengakhiran',
      contract_legalFinanceApproved_approved:
        'Pengakhiran atau tanpa syarat persetujuan lebih lanjut',
      contract_standardFinanceApproved_executive:
        'Nilai kontrak melebihi batas eksekutif yang dibekukan',
      contract_standardFinanceApproved_gm:
        'Tanpa tinjauan eksekutif; nilai melebihi batas manajer umum kontrak yang dibekukan',
      contract_standardFinanceApproved_approved:
        'Ambang eksekutif maupun manajer umum kontrak tidak terlampaui',
      contract_executiveApproved_gm:
        'Nilai melebihi batas manajer umum kontrak yang dibekukan atau kontrak nonstandar',
      contract_executiveApproved_approved:
        'Nilai tidak melebihi batas manajer umum kontrak dan kontrak standar',
      committeeVersion:
        'Gunakan grup komite yang sesuai dengan versi yang dibekukan saat pengajuan',
      returnApplicant:
        'Keputusan pengembalian memilih revisi pemohon dan pengajuan ulang',
      returnEarlier:
        'Keputusan pengembalian memilih tahap persetujuan sebelumnya yang telah dimasuki ini',
      seal_legal:
        'Setelah tinjauan kepala: stempel kontrak atau kontrak tertaut',
      seal_financeManager:
        'Dari tinjauan kepala/hukum: stempel keuangan, setelah prioritas jalur kontrak',
      seal_gm:
        'Tidak ada cabang hukum/keuangan yang berlaku; stempel perwakilan atau penggunaan eksternal, dan peninjau saat ini bukan manajer umum',
      seal_stamping:
        'Tidak ada cabang hukum/keuangan dan tinjauan tambahan manajer umum, atau peninjau saat ini adalah manajer umum',
    },

    conditional: 'Kondisi bisnis berlaku',
    transitionUnknown: 'Tindakan: {{name}}',
    transitionNames: {
      edit: 'Edit konten',
      submit: 'Ajukan',
      approved: 'Persetujuan lolos',
      rejected: 'Tolak',
      returned: 'Kembalikan untuk revisi',
      withdraw: 'Tarik',
      terminate: 'Hentikan',
      booked: 'Pemesanan selesai',
      bookingFailed: 'Pemesanan gagal',
      bookingForced: 'Konfirmasi penyelesaian',
      retryBooking: 'Ulangi pemesanan',
      reviseTrip: 'Revisi perjalanan',
      cancelApproved: 'Pembatalan disetujui',
      issued: 'Penyerahan selesai',
      unavailable: 'Tidak tersedia / pemenuhan gagal',
      forceClosed: 'Tutup paksa',
    },

    place: 'Posisi kosong',
    placeNumber: 'Posisi kosong {{number}}',
    placeRequired: 'Pilih posisi kosong.',
    title: 'Pengelolaan proses',
    description:
      'Lihat definisi proses, eksekusi, dan riwayat persetujuan yang diizinkan',
    definitions: 'Definisi',
    executions: 'Eksekusi',
    refresh: 'Muat ulang',
    search: 'Cari berdasarkan nomor, proses, atau pemohon',
    definitionSearch: 'Cari berdasarkan nama proses',
    clear: 'Hapus filter',
    all: 'Semua',
    name: 'Nama',
    domain: 'Domain bisnis',
    category: 'Kategori',
    capabilities: 'Kemampuan pengelolaan',
    approval: 'Proses persetujuan',
    connected: 'Terhubung',
    readOnly: 'Hanya baca',
    notConnected: 'Tindakan pengelolaan belum terhubung',
    reference: 'Nomor / judul',
    applicant: 'Pemohon',
    status: 'Status',
    stage: 'Tahap saat ini',
    createdAt: 'Dimulai',
    endedAt: 'Berakhir',
    empty: 'Belum ada eksekusi',
    emptyDescription: 'Eksekusi proses terhubung muncul di sini saat dimulai',
    noDefinitions: 'Tidak ada definisi yang dapat dibaca',
    noDefinitionsDescription:
      'Minta administrator mengonfigurasi akses definisi',
    noResults: 'Tidak ada rekaman yang cocok',
    noResultsDescription:
      'Sesuaikan atau hapus filter Anda untuk menemukan rekaman',
    definitionGraph: 'Definisi saat ini',
    graphDescription:
      'Status dan transisi terdaftar saat ini; aturan bisnis menentukan cabang dinamis',
    currentNode: 'Status saat ini',
    visitedNode: 'Dikunjungi',
    unvisitedNode: 'Belum dikunjungi',
    executionHistory: 'Riwayat eksekusi',
    terminationOutcome: 'Hasil pengakhiran',
    actualPath: 'Jalur eksekusi aktual',
    actualDescription:
      'Alur persetujuan dan pemenuhan lengkap dengan simpul dikunjungi, transisi, dan status saat ini disorot. Pengembalian aktual dan jalur historis tetap terlihat.',
    tasks: 'Tugas dan riwayat persetujuan',
    timeline: 'Riwayat persetujuan dan pengelolaan',
    run: 'Eksekusi persetujuan',
    historical: 'Riwayat eksekusi',
    definitionMissing: 'Definisi historis tidak tersedia',
    commentsRestricted:
      'Komentar dapat memuat konten pribadi dan memerlukan akses bisnis terpisah',
    comment: 'Komentar / alasan',
    actor: 'Pelaku',
    assignee: 'Penerima tugas',
    answer: 'Keputusan',
    previousTask: 'Tugas sebelumnya',
    from: 'Dari',
    to: 'Ke',
    initial: 'Awal',
    final: 'Akhir',
    transitions: 'Transisi status',
    definitionDetails: 'Tahap dan transisi',
    viewExecutions: 'Lihat semua rekaman',
    back: 'Kembali',
    manage: 'Tindakan pengelolaan',
    appoint: 'Tetapkan',
    reassign: 'Tetapkan ulang',
    terminate: 'Hentikan',
    unavailable:
      'Tugas atau status bisnis saat ini tidak mengizinkan tindakan ini',
    person: 'Penerima',
    reason: 'Alasan',
    personRequired: 'Pilih penerima',
    reasonRequired: 'Masukkan alasan',
    cancel: 'Batal',
    retry: 'Coba lagi',
    loadFailed: 'Pemuatan gagal. Coba lagi',
    submitFailed: 'Tindakan gagal. Periksa dan coba lagi',
    unknown: 'Hasil tidak diketahui. Muat ulang untuk memeriksa',
    stale: 'Tugas berubah. Muat ulang dan tinjau',
    gone: 'Rekaman tidak ada atau di luar cakupan Anda saat ini',
    forbidden: 'Anda tidak dapat membaca bagian ini. Hubungi administrator',
    loading: 'Memuat',
    noPeople: 'Tidak ada penerima yang memenuhi syarat untuk tugas saat ini',
    peopleSearch: 'Cari penerima yang diizinkan',
    loadMore: 'Muat lainnya',
    reassignTitle: 'Tetapkan ulang tugas untuk "{{recordLabel}}"',
    appointTitle: 'Tetapkan tugas untuk "{{recordLabel}}"',
    terminateTitle: 'Hentikan permintaan "{{recordLabel}}"',
    reassigned: 'Tugas untuk "{{recordLabel}}" ditetapkan ulang',
    appointed: 'Tugas untuk "{{recordLabel}}" ditetapkan',
    terminated: 'Permintaan "{{recordLabel}}" dihentikan',
    recentDescription:
      'Lima eksekusi berizin terbaru. Buka daftar eksekusi untuk riwayat lengkap.',
    vehicleTerminationGuard:
      'Permintaan yang telah diberangkatkan tidak dapat dihentikan langsung. Pemohon aktual harus mencatat penggunaan dan mengikuti proses bisnis kendaraan.',
    terminationConsequences: {
      vehicle:
        'Mengakhiri permintaan yang belum diberangkatkan. Operasi ini tidak dapat menutup permintaan yang telah diberangkatkan.',
      leave:
        'Menutup persetujuan saat ini; layanan cuti menangani pencadangan kuota yang belum selesai.',
      funding:
        'Menutup persetujuan saat ini; layanan bisnis menangani pencadangan anggaran, dana, atau permintaan yang belum selesai. Pembayaran selesai tetap tercatat.',
      stock:
        'Menutup persetujuan saat ini; layanan perlengkapan menangani pencadangan stok yang belum selesai. Pengembalian fisik memerlukan proses bisnisnya.',
      ordinary:
        'Menutup persetujuan saat ini dan menjalankan pengaman pengakhiran bisnis serta pemrosesan keluar.',
    },
    terminationDescription:
      'Pengakhiran menutup tugas saat ini dan melepaskan pencadangan sesuai aturan bisnis, dengan mempertahankan seluruh riwayat. Fakta bisnis yang telah dijalankan memerlukan pembatalan atau penyelesaian penitipannya sendiri.',
    graphView: 'Diagram',
    dateRange: 'Tanggal mulai',
    last7: '7 hari terakhir',
    last30: '30 hari terakhir',
    last90: '90 hari terakhir',
    thisMonth: 'Bulan ini',
    lastMonth: 'Bulan lalu',
    safeHistory:
      'Tampilan ini hanya berisi informasi proses aman yang diizinkan',
    business: 'Konten bisnis',
    businessRestricted:
      'Konten bisnis, lampiran, dan bidang pribadi memerlukan akses terpisah',
    guardedBranch: 'Cabang dipilih berdasarkan kondisi bisnis sumber',
    frozen: 'Bidang dibekukan',
    covered: 'Bidang dicakup',
    management: 'Intervensi administrator',
    kinds: {
      itRepair: 'IT repair',
      leave: 'Cuti',
      overtime: 'Lembur',
      leaveCancellation: 'Pembatalan cuti',
      general: 'Permintaan umum',
      attendanceChange: 'Koreksi kehadiran',
      outing: 'Tugas luar',
      supplies: 'Permintaan perlengkapan',
      budgetAdjustment: 'Penyesuaian anggaran',
      expensePlan: 'Otorisasi biaya',
      training: 'Pelatihan',
      travel: 'Perjalanan',
      travelCancellation: 'Pembatalan perjalanan',
      reimbursement: 'Penggantian biaya',
      purchase: 'Pembelian',
      loan: 'Permintaan pinjaman',
      payment: 'Permintaan pembayaran',
      probation: 'Tinjauan masa percobaan',
      vehicleRequest: 'Permintaan kendaraan',
      contract: 'Kontrak',
      assetRequest: 'Permintaan aset',
      vendorQualification: 'Kualifikasi pemasok',
      recruitment: 'Rekrutmen',
      sealRequest: 'Permintaan stempel',
      transfer: 'Perubahan kepegawaian',
      departure: 'Pemberhentian',
      certificateRequest: 'Permintaan sertifikat',
    },
    domains: {
      office: 'Kantor harian',
      organization: 'Organisasi & SDM',
      finance: 'Keuangan & biaya',
      procurement: 'Pengadaan & kontrak',
      administration: 'Administrasi & aset',
    },
    states: {
      issued: 'Diserahkan',
      forcedClosed: 'Ditutup paksa',
      draft: 'Draf',
      revision: 'Revisi',
      manager: 'Manajer',
      head: 'Kepala departemen',
      hr: 'SDM',
      extra: 'Tinjauan tambahan',
      finance: 'Keuangan',
      cashier: 'Kasir',
      executive: 'Eksekutif',
      gm: 'Manajer umum',
      cfo: 'Direktur keuangan',
      legal: 'Hukum',
      financeManager: 'Manajer keuangan',
      hrbp: 'Mitra bisnis SDM',
      hrDirector: 'Direktur SDM',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      withdrawn: 'Ditarik',
      terminated: 'Dihentikan',
      completed: 'Selesai',
      exception: 'Pengecualian penanganan',
      dispatch: 'Pemberangkatan',
      usage: 'Penggunaan kendaraan',
      issuing: 'Penyerahan',
      returning: 'Pengembalian',
      returnException: 'Pengecualian pengembalian',
      stamping: 'Pembubuhan stempel',
      booking: 'Pemesanan',
      unbooking: 'Batalkan pemesanan',
      paid: 'Dibayar',
      paymentException: 'Pengecualian pembayaran',
      pendingEffective: 'Menunggu tanggal berlaku',
      cancellationReview: 'Tinjauan pembatalan',
      sourceHead: 'Kepala departemen sumber',
      targetHead: 'Kepala departemen tujuan',
      committee: 'Komite',
      purchasing: 'Pembelian',
      inquiry: 'Permintaan penawaran',
      quoting: 'Penawaran',
      pending: 'Menunggu',
      claimed: 'Diklaim',
      waiting: 'Menunggu',
      blocked: 'Terhalang',
      candidate: 'Kandidat',
      suspended: 'Ditangguhkan',
      transferred: 'Dialihkan',
      voided: 'Ditutup',
      open: 'Buka',
      cancelled: 'Dibatalkan',
      returned: 'Dikembalikan',
      concluded: 'Disimpulkan',
      decide: 'Keputusan',
      copy: 'Salin',
      approve: 'Setujui',
      reject: 'Tolak',
      return: 'Kembalikan',
      unknown: 'Status lainnya',
    },
    authz: {
      definitionRead: 'Definisi',
      historyRead: 'Riwayat eksekusi',
      appoint: 'Tetapkan',
      reassign: 'Tetapkan ulang',
      terminate: 'Hentikan',
    },
    otherStage: 'Tahap lain ({{name}})',
    otherEvent: 'Kejadian proses ({{name}})',
    events: {
      approve: 'Disetujui',
      reject: 'Ditolak',
      return: 'Dikembalikan',
      reassign: 'Penetapan ulang administratif',
      appoint: 'Penetapan administratif',
      comment: 'Komentar',
      transfer: 'Dialihkan',
      addSign: 'Penandatangan ditambahkan',
      claim: 'Diklaim',
      release: 'Tugas dilepaskan',
      'stage.unassigned': 'Tahap belum ditetapkan',
      'run.started': 'Persetujuan dimulai',
      'run.ended': 'Persetujuan berakhir',
      'stage.entered': 'Tahap dimasuki',
      remind: 'Pengingat',
      escalate: 'Dieskalasi',
      read: 'Baca',
    },
  },
};
