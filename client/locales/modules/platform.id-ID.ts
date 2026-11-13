/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Kalender kerja',
      dictionaries: 'Kamus',
      rules: 'Ringkasan dan riwayat aturan',
      sequences: 'Nomor dokumen',
      auditLogs: 'Log audit',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'Platform OA',
      calendar: 'Kalender kerja',
      dictionaries: 'Kamus',
      rules: 'Ringkasan dan riwayat aturan',
      sequences: 'Nomor dokumen',
      auditLogs: 'Log audit',
      actions: { read: 'Lihat', update: 'Edit' },
    },
    common: {
      actions: 'Tindakan',
      actionsFor: 'Tindakan untuk {{name}}',
      edit: 'Edit',
      delete: 'Hapus',
      refresh: 'Muat ulang',
      clearFilters: 'Hapus filter',
      noResults: 'Tidak ada yang cocok dengan filter.',
      forbidden: 'Anda tidak memiliki izin untuk melihat ini.',
      notFound: 'Rekaman ini tidak ada atau telah dihapus.',
      loadFailed:
        'Tidak dapat memuat data. Periksa koneksi Anda dan coba lagi.',
      writeForbidden: 'Anda tidak memiliki izin untuk membuat perubahan ini.',
      saveFailed: 'Tidak dapat menyimpan perubahan. Coba lagi.',
    },
    calendar: {
      title: 'Kalender kerja',
      description:
        'Atur jam kerja dan kelola hari libur nasional serta hari kerja pengganti setiap tahun.',
      loadFailedTitle: 'Tidak dapat memuat pengaturan kalender',
      kinds: {
        holiday: 'Hari libur nasional',
        adjustedWorkday: 'Hari kerja pengganti',
        workday: 'Hari kerja',
        weekend: 'Hari libur',
      },
      workHours: {
        title: 'Jam kerja',
        description:
          'Pengingat dan eskalasi persetujuan hanya menghitung jam ini pada hari kerja.',
        start: 'Mulai pada',
        end: 'Berakhir pada',
        range: '{{start}}–{{end}}',
        invalidTime: 'Masukkan waktu seperti 09:00.',
        endBeforeStart: 'Waktu akhir harus setelah waktu mulai.',
        scheduled: 'Dari {{date}}: {{start}}–{{end}}',
        saved: 'Jam kerja disimpan',
      },
      timeZone: {
        title: 'Zona waktu',
        description:
          'Zona waktu yang digunakan kalender dan nomor dokumen. Perubahan langsung berlaku.',
        label: 'Zona waktu',
        hint: 'Nama zona waktu IANA, seperti Asia/Shanghai.',
        required: 'Masukkan zona waktu.',
        invalid:
          'Zona waktu ini tidak dikenal server. Gunakan nama seperti Asia/Shanghai.',
        saved: 'Zona waktu disimpan',
      },
      days: {
        remove: 'Hapus',
        title: 'Hari khusus',
        description:
          'Hari yang tidak tercantum mengikuti pekan: Senin hingga Jumat adalah hari kerja.',
        previousYear: 'Tahun sebelumnya',
        nextYear: 'Tahun berikutnya',
        add: 'Tambah hari',
        addTitle: 'Tambah hari',
        addDescription: 'Tanggal yang sudah tercantum diganti.',
        addSubmit: 'Tambah',
        editTitle: 'Edit {{date}}',
        import: 'Impor',
        date: 'Tanggal',
        weekday: 'Hari dalam pekan',
        kind: 'Jenis',
        note: 'Catatan',
        dateRequired: 'Pilih tanggal.',
        noteTooLong: 'Gunakan maksimal {{max}} karakter.',
        emptyTitle: 'Belum ada hari khusus pada {{year}}',
        emptyDescription:
          'Impor hari libur nasional dan hari kerja pengganti tahun ini, atau tambahkan satu per satu.',
        emptyReadOnly:
          'Setiap hari mengikuti pekan. Minta administrator mengimpor hari libur.',
        saved: '"{{date}}" disimpan',
        removed: '"{{date}}" dihapus',
        removeTitle: 'Hapus "{{date}}"?',
        removeDescription: 'Tanggal kembali mengikuti pekan.',
        notFound: 'Hari ini tidak lagi tercantum. Mungkin telah dihapus.',
      },
      import: {
        title: 'Impor hari khusus {{year}}',
        description:
          'Tempel satu hari per baris: tanggal, jenis, dan catatan opsional.',
        lines: 'Hari',
        placeholder:
          '{{year}}-10-01,holiday,Hari Nasional\n{{year}}-10-10,adjustedWorkday',
        hint: 'Pisahkan dengan koma atau tab. Jenis: holiday, adjustedWorkday, workday, weekend (atau 休 / 班).',
        replace: 'Ganti tahun',
        replacePreview:
          'Berdasarkan kalender saat ini, {{count}} hari khusus yang ada pada {{year}} tidak ada dalam impor ini dan akan dihapus. Pengguna lain dapat mengubah kalender sebelum Anda menyimpan.',
        previewFailed:
          'Tidak dapat memuat tahun kalender lengkap. Coba lagi sebelum menggantinya.',
        confirmReplaceTitle: 'Ganti hari khusus {{year}}?',
        replaceHint: 'Hapus hari khusus {{year}} yang tidak ada dalam daftar.',
        submit: 'Impor',
        emptyText: 'Tempel setidaknya satu hari.',
        success:
          'Diimpor: {{created}} ditambahkan, {{updated}} diubah, {{removed}} dihapus',
        problems: {
          format: 'Baris {{line}} memerlukan tanggal dan jenis.',
          date: 'Baris {{line}} memiliki tanggal tidak valid.',
          kind: 'Baris {{line}} memiliki jenis tidak dikenal.',
          year: 'Baris {{line}} bukan dalam {{year}}.',
          duplicate: 'Baris {{line}} mengulang tanggal.',
        },
      },
    },
    dictionaries: {
      title: 'Kamus',
      description:
        'Kelola opsi yang ditawarkan formulir permintaan. Entri dinonaktifkan, tidak pernah dihapus.',
      loadFailedTitle: 'Tidak dapat memuat kamus',
      searchPlaceholder: 'Cari berdasarkan nama atau kode',
      searchLabel: 'Cari entri',
      notFound: 'Entri ini tidak ada atau telah dihapus.',
      enable: 'Aktifkan',
      enabled: '"{{name}}" diaktifkan',
      disable: 'Nonaktifkan',
      disabled: '"{{name}}" dinonaktifkan',
      disableTitle: 'Nonaktifkan "{{name}}"?',
      disableDescription:
        'Permintaan yang ada tetap menampilkannya, tetapi permintaan baru tidak lagi dapat memilihnya. Anda dapat mengaktifkannya kembali.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: tanpa batas',
      fields: {
        type: 'Jenis kamus',
        label: 'Nama',
        labelZh: 'Nama (Tionghoa)',
        labelEn: 'Nama (Inggris)',
        code: 'Kode',
        extra: 'Atribut',
        sortOrder: 'Urutan',
        status: 'Status',
      },
      status: {
        all: 'Semua status',
        active: 'Diaktifkan',
        inactive: 'Dinonaktifkan',
      },
      empty: {
        title: 'Belum ada entri jenis ini',
        description:
          'Tambahkan entri pertama agar formulir dapat menawarkannya.',
        readOnly: 'Minta administrator menambahkan entri.',
      },
      create: {
        action: 'Entri baru',
        title: 'Entri baru: {{type}}',
        success: 'Entri "{{name}}" dibuat',
      },
      edit: { title: 'Edit entri', success: 'Entri "{{name}}" disimpan' },
      form: {
        description: 'Entri {{type}}. Beri nama dalam setidaknya satu bahasa.',
        codeHint:
          'Huruf, angka, _ dan -, diawali huruf. Tidak dapat diubah kemudian.',
        codeFixed: 'Rekaman menyimpan kode, sehingga tidak dapat diubah.',
        codeInvalid:
          'Gunakan huruf, angka, _ dan -, diawali huruf (maksimal 64).',
        codeTaken: 'Jenis ini sudah memiliki entri dengan kode ini.',
        labelRequired: 'Masukkan nama dalam setidaknya satu bahasa.',
        labelTooLong: 'Gunakan maksimal {{max}} karakter.',
        sortOrderHint: 'Angka lebih kecil didahulukan dalam formulir.',
        sortOrderInvalid: 'Masukkan bilangan bulat antara 0 dan 1.000.000.',
        numberRequired: 'Masukkan angka.',
        numberMin: 'Masukkan angka minimal {{min}}.',
        integerMin: 'Masukkan bilangan bulat minimal {{min}}.',
        blankUnlimited: 'Biarkan kosong untuk tanpa batas.',
        extraInvalid: 'Nilai ini tidak diterima.',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: 'Urusan permintaan biaya',
        officeItem: 'Perlengkapan kantor',
        leaveType: 'Jenis cuti',
        annualLeaveTier: 'Cuti tahunan berdasarkan masa kerja',
        paymentMethod: 'Metode pembayaran',
        expenseCategory: 'Kategori biaya',
        budgetSubject: 'Pos anggaran',
        sealType: 'Jenis stempel',
        contractType: 'Jenis kontrak',
        assetCategory: 'Kategori aset',
        supplierCategory: 'Kategori pemasok',
        vehicleType: 'Jenis kendaraan',
        departureType: 'Jenis pemberhentian',
        resignationReason: 'Alasan pengunduran diri',
        recruitmentReason: 'Alasan perekrutan',
        certificateType: 'Jenis sertifikat',
        travelStandard: 'Standar perjalanan',
      },
      travelStandardKindHelp:
        'Gunakan kategori terkait untuk penginapan dan tunjangan. Kategori perjalanan agregat tidak mewakili keduanya dan tidak memiliki standar harian.',
      invalidStandardKind: 'Pilih klasifikasi standar perjalanan valid.',
      extraOptions: {
        travelStandardKind: {
          none: 'Tidak berlaku',
          lodging: 'Penginapan per malam',
          allowance: 'Tunjangan per hari',
        },
      },
      extra: {
        travelStandardKind: 'Klasifikasi standar perjalanan',
        requiresPrintInfo: 'Memerlukan detail pencetakan',
        deductsBalance: 'Mengurangi saldo',
        requiresAttachment: 'Memerlukan lampiran',
        attachmentAboveDays: 'Lampiran di atas (hari)',
        maxDays: 'Hari maksimum',
        requiresHr: 'Persetujuan SDM',
        minYears: 'Dari tahun masa kerja',
        days: 'Hari',
        voluntary: 'Sukarela',
        replacement: 'Menggantikan karyawan yang berhenti',
        involvesSalary: 'Menampilkan gaji',
        minRank: 'Dari peringkat jenjang',
        lodgingPerNight: 'Penginapan per malam (yuan)',
        allowancePerDay: 'Tunjangan per hari (yuan)',
      },
    },
    rules: {
      relatedFlows: 'Proses terkait (edit pada simpul)',
      editAtNode: 'Edit pada simpul proses',
      title: 'Ringkasan dan riwayat aturan',
      description:
        'Lihat aturan saat ini, perubahan terjadwal, dan riwayat. Buka simpul proses terkait untuk mengedit; aturan bersama memengaruhi beberapa proses.',
      loadFailedTitle: 'Tidak dapat memuat aturan persetujuan',
      notFound: 'Aturan ini tidak ada.',
      change: 'Perubahan',
      history: 'Riwayat',
      changeTitle: 'Ubah "{{name}}"',
      changeDescription:
        'Nilai baru berlaku untuk permintaan yang diajukan sejak mulai berlaku.',
      changed: '"{{name}}" diubah',
      historyTitle: 'Riwayat "{{name}}"',
      currentValue: 'Sekarang: {{value}}',
      scheduledValue: 'Dari {{date}}: {{value}}',
      defaultVersion: 'Default',
      withdraw: 'Tarik',
      withdrawn: 'Perubahan terjadwal "{{name}}" ditarik',
      withdrawTitle: 'Tarik perubahan "{{name}}" mulai {{date}}?',
      withdrawDescription: 'Nilai terjadwal {{value}} tidak akan berlaku.',
      versionStatus: { current: 'Berlaku', scheduled: 'Terjadwal' },
      fields: {
        rule: 'Aturan',
        current: 'Nilai saat ini',
        scheduled: 'Terjadwal',
        newValue: 'Nilai baru',
        value: 'Nilai',
        note: 'Catatan',
        effectiveFrom: 'Mulai berlaku',
        changedBy: 'Diubah oleh',
      },
      effective: {
        label: 'Mulai berlaku',
        now: 'Segera',
        fromDate: 'Dari tanggal',
        dateLabel: 'Tanggal berlaku',
        hint: 'Dari pukul 00:00 pada hari tersebut.',
        dateRequired: 'Pilih tanggal mulai berlaku.',
        pastError: 'Pilih tanggal mulai besok.',
      },
      errors: {
        valueRequired: 'Masukkan nilai.',
        notANumber: 'Masukkan angka.',
        minimum: 'Masukkan minimal {{min}}.',
        percentRange: 'Masukkan persentase antara {{min}} dan {{max}}.',
        integer: 'Masukkan bilangan bulat.',
        halfDays: 'Masukkan hari dalam kelipatan 0,5.',
        noteTooLong: 'Gunakan maksimal {{max}} karakter.',
        invalidValue: 'Nilai ini tidak diterima.',
        orderViolated:
          'Nilai ini tidak berurutan dengan aturan terkait (misalnya ambang wakil presiden di atas ambang manajer umum). Ubah aturan terkait terlebih dahulu.',
        versionExists:
          'Perubahan sudah mulai berlaku pada saat itu. Pilih tanggal lain.',
        inEffect: 'Perubahan ini sudah berlaku dan kini menjadi riwayat.',
      },
      domains: {
        spend: {
          title: 'Pengeluaran',
          description:
            'Ambang jumlah pada jenjang pengeluaran dan persetujuan keuangan lainnya.',
        },
        leave: {
          title: 'Cuti',
          description: 'Lama cuti yang memerlukan kepala departemen atau SDM.',
        },
        attendance: {
          title: 'Kehadiran',
          description: 'Batas lembur dan koreksi kehadiran.',
        },
        hr: {
          title: 'SDM',
          description: 'Tingkat jenjang dan ambang kenaikan gaji.',
        },
        sla: {
          title: 'Waktu persetujuan',
          description: 'Pengingat dan eskalasi, dihitung dalam jam kerja.',
        },
        committee: {
          title: 'Komite peninjau',
          description: 'Default suara komite.',
        },
        calendar: {
          title: 'Kalender kerja',
          description: 'Jam kerja dan zona waktu.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} kali',
        integer: '{{value}}',
        days: '{{value}} hari',
        hours: '{{value}} jam',
        workingHours: '{{value}} jam kerja',
        rank: 'Peringkat {{value}}',
      },
      unitSuffix: {
        money: 'yuan',
        count: 'kali',
        integer: '',
        days: 'hari',
        hours: 'jam',
        workingHours: 'jam kerja',
        ratio: '%',
        rank: 'peringkat',
      },
      keys: {
        itRepair_securityTransfer: {
          label: 'Restricted transfer (0 off, 1 on)',
          description:
            'Enable only after isolation verification; production configuration needs separate authorization.',
        },
        itRepair_acceptanceDays: {
          label: 'Acceptance reminder (working days)',
          description:
            'Frozen on submission; never closes a repair automatically.',
        },
        itRepair_followUpDays: {
          label: 'Follow-up interval (working days)',
          description: 'Frozen interval after a waiting reminder.',
        },
        itRepair_morning: {
          label: 'IT repair morning hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_afternoon: {
          label: 'IT repair afternoon hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_P1_response: {
          label: 'P1 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P1_resolution: {
          label: 'P1 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_response: {
          label: 'P2 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_resolution: {
          label: 'P2 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_response: {
          label: 'P3 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_resolution: {
          label: 'P3 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_response: {
          label: 'P4 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_resolution: {
          label: 'P4 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        leave_annualAccrualEnabled: {
          label: 'Penambahan cuti tahunan otomatis',
          description:
            '0 menonaktifkan pemberian otomatis; 1 mengaktifkan penambahan harian. Isi tanggal mulai karier karyawan sebelum mengaktifkan.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Bulan kedaluwarsa sisa cuti tahunan',
          description:
            'Bulan pada tahun berikutnya ketika cuti tahunan yang tidak digunakan kedaluwarsa (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Hari kedaluwarsa sisa cuti tahunan',
          description:
            'Hari terakhir yang valid dalam bulan kedaluwarsa (1–31); bulan lebih pendek menggunakan hari terakhirnya.',
        },
        spend_vp: {
          label: 'Ambang wakil presiden',
          description:
            'Jumlah di atas ini memerlukan wakil presiden penanggung jawab.',
        },
        spend_gm: {
          label: 'Ambang manajer umum',
          description: 'Jumlah di atas ini memerlukan manajer umum.',
        },
        expense_head: {
          label: 'Klaim biaya yang melewati kepala departemen',
          description:
            'Klaim dengan total hingga jumlah ini disetujui manajer langsung sebagai gantinya.',
        },
        loan_head: {
          label: 'Ambang kepala departemen untuk pinjaman',
          description: 'Pinjaman di atas ini memerlukan kepala departemen.',
        },
        loan_personalMax: {
          label: 'Batas pinjaman pribadi',
          description: 'Utang maksimum satu orang pada satu waktu.',
        },
        purchase_quotes: {
          label: 'Tiga penawaran diwajibkan di atas',
          description:
            'Pembelian di atas ini memerlukan tiga penawaran bersaing.',
        },
        contract_gm: {
          label: 'Ambang manajer umum untuk kontrak',
          description: 'Kontrak di atas ini memerlukan manajer umum.',
        },
        asset_scrapGm: {
          label: 'Ambang penghapusan aset',
          description:
            'Penghapusan aset dengan nilai awal di atas ini memerlukan manajer umum.',
        },
        budget_increaseGm: {
          label: 'Ambang penambahan anggaran',
          description:
            'Penambahan anggaran di atas ini memerlukan manajer umum.',
        },
        leave_head: {
          label: 'Cuti yang memerlukan kepala departemen',
          description:
            'Cuti minimal sebanyak hari ini memerlukan kepala departemen.',
        },
        leave_hr: {
          label: 'Cuti yang memerlukan SDM',
          description: 'Cuti minimal sebanyak hari ini memerlukan SDM.',
        },
        overtime_monthlyHead: {
          label: 'Lembur bulanan yang memerlukan kepala departemen',
          description:
            'Lembur di atas jumlah jam ini dalam sebulan memerlukan kepala departemen.',
        },
        attendance_fixPerMonth: {
          label: 'Koreksi kehadiran per bulan',
          description:
            'Jumlah koreksi yang dapat diminta satu orang dalam sebulan.',
        },
        grade_managerRank: {
          label: 'Peringkat jenjang manajer',
          description:
            'Jenjang minimal pada peringkat ini dianggap tingkat manajer.',
        },
        grade_directorRank: {
          label: 'Peringkat jenjang direktur',
          description:
            'Jenjang minimal pada peringkat ini dianggap tingkat direktur.',
        },
        raise_vp: {
          label: 'Kenaikan gaji yang memerlukan wakil presiden',
          description:
            'Kenaikan di atas proporsi ini memerlukan wakil presiden.',
        },
        raise_gm: {
          label: 'Kenaikan gaji yang memerlukan manajer umum',
          description: 'Kenaikan di atas proporsi ini memerlukan manajer umum.',
        },
        sla_remindHours: {
          label: 'Pengingat setelah',
          description:
            'Ingatkan pemberi persetujuan setelah waktu kerja sebanyak ini.',
        },
        sla_escalateHours: {
          label: 'Eskalasi setelah',
          description:
            'Eskalasi ke manajer pemberi persetujuan setelah waktu kerja sebanyak ini.',
        },
        sla_urgeCooldownHours: {
          label: 'Jeda desakan',
          description: 'Lama pemohon menunggu di antara desakan.',
        },
        committee_min: {
          label: 'Suara lolos komite',
          description: 'Jumlah default suara setuju yang diperlukan komite.',
        },
        calendar_workHours: {
          label: 'Jam kerja',
          description: 'Rentang kerja harian.',
        },
        calendar_timeZone: {
          label: 'Zona waktu',
          description: 'Zona waktu kalender.',
        },
      },
    },
    sequences: {
      title: 'Nomor dokumen',
      description:
        'Jumlah nomor yang telah diterbitkan setiap prefiks dokumen per bulan. Nomor diterbitkan saat pengajuan.',
      loadFailedTitle: 'Tidak dapat memuat nomor dokumen',
      searchPlaceholder: 'Filter berdasarkan prefiks, seperti LV',
      searchLabel: 'Filter berdasarkan prefiks',
      fields: {
        prefix: 'Prefiks',
        period: 'Bulan',
        issued: 'Diserahkan',
        next: 'Nomor berikutnya',
      },
      empty: {
        title: 'Belum ada nomor diterbitkan',
        description: 'Nomor muncul di sini setelah permintaan diajukan.',
      },
    },
    auditLogs: {
      title: 'Log audit',
      description:
        'Rekaman hanya baca atas perubahan sensitif pada organisasi, orang, aturan, dan konfigurasi.',
      loadFailedTitle: 'Tidak dapat memuat log audit',
      system: 'Sistem',
      notFound: 'Entri ini tidak ada.',
      detailTitle: 'Entri audit: {{action}}',
      detailTitleLoading: 'Entri audit',
      changes: 'Yang berubah',
      noChanges: 'Tidak ada nilai tercatat.',
      changed: 'Diubah',
      wholeValue: 'Nilai',
      fields: {
        at: 'Waktu',
        actor: 'Oleh',
        action: 'Tindakan',
        targetType: 'Jenis objek',
        targetId: 'Objek',
        reason: 'Alasan',
        field: 'Bidang',
        before: 'Sebelum',
        after: 'Setelah',
      },
      filters: {
        allTargetTypes: 'Semua jenis objek',
        allActions: 'Semua tindakan',
        actor: 'Siapa saja',
        dateRange: 'Tanggal apa saja',
        presets: 'Rentang cepat',
      },
      presets: {
        last7: '7 hari terakhir',
        last30: '30 hari terakhir',
        thisMonth: 'Bulan ini',
        lastMonth: 'Bulan lalu',
        last90: '90 hari terakhir',
      },
      empty: {
        title: 'Belum ada entri audit',
        description: 'Perubahan sensitif dicatat di sini saat dilakukan.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;
