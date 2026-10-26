import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/id-ID';
import inboxEnUS from '#extensions/nocobase-inbox/locales/id-ID';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Pesan',
  'inbox.loadFailed': 'Tidak dapat memuat pesan',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Pesan',
  'inboxButton.pending': 'Pesan, {{count}} menunggu',
  'inboxButton.unread': 'Pesan, {{count}} belum dibaca',
  'inboxButton.pendingHint':
    '{{count}} menunggu Anda; jumlah berkurang setelah ditangani.',
  'inboxButton.unreadHint':
    '{{count}} belum dibaca; jumlah berkurang saat Anda membacanya.',
  'auth.welcome': 'Selamat datang kembali',
  'auth.loginDescription':
    'Masuk dengan nama pengguna atau email dan kata sandi Anda.',
  'auth.registerTitle': 'Buat akun',
  'auth.registerDescription': 'Buat akun untuk memulai.',
  'auth.forgotTitle': 'Lupa kata sandi',
  'auth.forgotDescription':
    'Masukkan email dan kami akan mengirim tautan pengaturan ulang jika akun ada.',
  'auth.resetDescription': 'Pilih kata sandi baru untuk akun Anda.',
  'auth.resetTitle': 'Atur ulang kata sandi',
  'auth.identifier': 'Nama pengguna atau email',
  'auth.password': 'Kata sandi',
  'auth.signIn': 'Masuk',
  'auth.signingIn': 'Masuk…',
  'auth.hidePassword': 'Sembunyikan kata sandi',
  'auth.showPassword': 'Tampilkan kata sandi',
  'auth.forgotLink': 'Lupa kata sandi?',
  'auth.noAccount': 'Belum memiliki akun?',
  'auth.signUp': 'Daftar',
  'auth.createAccount': 'Buat akun',
  'auth.creatingAccount': 'Membuat akun…',
  'auth.name': 'Nama',
  'auth.username': 'Nama pengguna',
  'auth.email': 'Email',
  'auth.confirmPassword': 'Konfirmasi kata sandi',
  'auth.existingAccount': 'Sudah memiliki akun?',
  'auth.passwordMismatch': 'Kata sandi tidak cocok.',
  'auth.resetting': 'Mengatur ulang…',
  'auth.newPassword': 'Kata sandi baru',
  'auth.confirmNewPassword': 'Konfirmasi kata sandi baru',
  'auth.invalidResetLink':
    'Tautan pengaturan ulang kata sandi ini tidak valid atau kedaluwarsa.',
  'auth.backToSignIn': 'Kembali ke halaman masuk',
  'auth.sendResetLink': 'Kirim tautan pengaturan ulang',
  'auth.sending': 'Mengirim…',
  'auth.resetSent': 'Jika akun ada, tautan pengaturan ulang telah dikirim.',
  'auth.rememberPassword': 'Ingat kata sandi Anda?',
  'auth.methods': 'Metode masuk',
  'auth.or': 'Atau lanjutkan dengan',
  'auth.continueWith': 'Lanjutkan dengan {provider}',
  'auth.about': 'Tentang aplikasi ini',
  'auth.platform': 'Platform aplikasi berbasis AI',
  'auth.marketingTitleFirst': 'Biarkan AI membangun dengan bebas.',
  'auth.marketingTitleSecond': 'NocoBase menjaganya',
  'auth.marketingTitleThird': 'andal.',
  'auth.marketingDescription':
    'Berikan AI kerangka frontend fleksibel untuk membentuk setiap pengalaman, sementara NocoBase mengamankan data, izin, dan tata kelola di bawahnya.',
  'auth.frontend': 'Frontend berbasis AI',
  'auth.frontendDescription':
    'Susun antarmuka dengan bebas pada kerangka fleksibel.',
  'auth.foundation': 'Fondasi NocoBase',
  'auth.foundationDescription':
    'Data, kontrol akses, dan tata kelola yang andal.',
  'auth.marketingFooter': 'Kebebasan di atas. Keyakinan di bawah.',
  'status.loading': 'Memuat',
  'status.loadingPage': 'Memuat halaman',
  'status.denied': 'Akses ditolak',
  'status.pageFailed': 'Tidak dapat memuat halaman',
  'status.retry': 'Coba lagi',
  'navigation.brandHome': 'Beranda NocoBase',
  'navigation.brandApps': 'Aplikasi NocoBase',
  'routeOverlay.close': 'Tutup',
  'status.backHome': 'Kembali ke beranda kerja',
  'status.deniedDescription':
    'Anda tidak memiliki izin untuk mengakses halaman ini.',
  'status.routeFailedDescription':
    'Halaman ini tidak dapat dimuat. Silakan coba lagi.',
  shell: {
    buildFreely: 'AI membangun dengan bebas.',
    reliability: '<brand>NocoBase</brand> menjaganya tetap andal.',
  },
  home: {
    platform: 'NocoBase · Platform aplikasi berbasis AI',
    title: 'Jelaskan, dan agen Anda membangunnya',
    description:
      'Aplikasi ini dikembangkan dengan berbicara kepada agen pemrograman Anda. Jelaskan kebutuhan bisnis dengan kata-kata sederhana, dan agen menulis halaman, model data, API, serta proses bisnis dalam proyek ini.',
    steps: {
      describe: {
        title: 'Jelaskan kebutuhan',
        description:
          'Sebutkan siapa penggunanya, data yang disimpan, dan apa yang harus terjadi.',
      },
      build: {
        title: 'Biarkan agen membangun',
        description:
          'Agen membaca proyek ini beserta kemampuan bawaannya, lalu menulis kode.',
      },
      review: {
        title: 'Periksa dan sempurnakan',
        description:
          'Muat ulang halaman untuk mencobanya, lalu minta perubahan dengan cara yang sama.',
      },
    },
    example: {
      title: 'Coba permintaan seperti ini',
      text: 'Buat aplikasi pesanan pembelian.\n\nPesanan memiliki nomor, barang, pemohon, jumlah, dan status persetujuan. Pemohon membuat pesanan dan hanya melihat miliknya sendiri; peninjau melihat semua pesanan tertunda dan menyetujui atau menolaknya.\nSetelah keputusan, beri tahu pemohon melalui kotak masuk dengan tautan ke pesanan.',
      hint: 'Tempel ke Claude Code, Codex, Cursor, atau agen pemrograman apa pun yang dibuka dalam proyek ini.',
    },
    capabilitiesTitle: 'Kemampuan bawaan',
    capabilitiesDescription:
      'Agen Anda menggunakannya langsung alih-alih membangun dari awal. Buka salah satu untuk mendapatkan prompt yang dapat diedit dan disalin.',
    viewPrompts: 'Lihat prompt ({{count}})',
    prompt: {
      label: 'Prompt',
      hint: 'Edit prompt sesuai bisnis Anda sebelum menyalin. Perubahan tidak disimpan setelah dialog ditutup.',
      copy: 'Salin',
      copiedShort: 'Disalin',
      copied: 'Prompt disalin',
      copyFailed: 'Tidak dapat menyalin. Pilih teks dan salin secara manual.',
      reset: 'Pulihkan default',
    },
    capabilities: {
      auth: {
        title: 'Autentikasi',
        description:
          'Masuk, pendaftaran, pengaturan ulang kata sandi, dan masuk tunggal perusahaan.',
        prompts: {
          disableSignUp: {
            label: 'Tutup pendaftaran',
            text: 'Aplikasi ini hanya untuk karyawan perusahaan. Administrator membuat semua akun.\nNonaktifkan pendaftaran mandiri dan hapus tautan pendaftaran dari halaman masuk.\nKaryawan yang ada harus tetap dapat masuk dengan akun dan kata sandi mereka.\nPertahankan tautan lupa kata sandi.',
          },
          passwordRules: {
            label: 'Aturan kata sandi',
            text: 'Wajibkan minimal 12 karakter saat mendaftar atau mengatur ulang kata sandi.\nTampilkan persyaratan ini pada kedua formulir dan gunakan pesan validasi yang konsisten.\nPertahankan kemampuan akun yang ada untuk masuk tanpa mewajibkan perubahan kata sandi segera.',
          },
          companySso: {
            label: 'SSO perusahaan',
            text: 'Izinkan karyawan masuk dengan platform identitas perusahaan kami menggunakan OIDC.\n\nPertahankan masuk dengan akun-kata sandi dan tambahkan tombol Akun perusahaan.\nTombol membuka platform identitas perusahaan. Setelah berhasil masuk, kembali ke beranda aplikasi.\n\nIzinkan masuk pertama membuat akun aplikasi, diidentifikasi oleh pengenal pengguna tetap platform.\nJangan tautkan akun otomatis berdasarkan kecocokan nama atau email. Akun baru menggunakan izin default aplikasi.\n\nCantumkan informasi yang harus disediakan administrator platform identitas dan URL callback yang perlu mereka daftarkan.',
          },
        },
      },
      authorization: {
        title: 'Izin',
        description:
          'Atur siapa yang dapat membuka halaman, menjalankan tindakan, dan melihat rekaman tertentu.',
        prompts: {
          jobs: {
            label: 'Pekerjaan',
            text: 'Buat pekerjaan Pemohon pembelian dan Peninjau pesanan untuk aplikasi.\nPemohon pembelian dapat masuk ke halaman pesanan dan melihat pesanan yang mereka ajukan.\nPeninjau pesanan dapat masuk ke halaman pesanan, melihat pesanan, serta menyetujui atau menolak pesanan tertunda.\nHanya administrator aplikasi yang dapat mengubah izin dan penetapan.\nGunakan kemampuan otorisasi aplikasi yang ada agar administrator dapat menyesuaikan izin dan menetapkan orang kemudian.',
          },
          dataScopes: {
            label: 'Cakupan data',
            text: 'Izinkan pemohon pembelian hanya melihat pesanan miliknya sendiri, menggunakan bidang pemohon pesanan untuk menentukan kepemilikan.\nPeninjau pesanan dapat melihat semua pesanan dan memproses persetujuan tertunda.\nAdministrator dapat menyesuaikan cakupan tampilan pesanan setiap pekerjaan dalam kumpulan izinnya.',
          },
          sharing: {
            label: 'Berbagi',
            text: 'Bagikan pesanan Bob PO-2026-004 kepada Alice agar ia dapat meninjaunya.\nAlice sudah memiliki izin melihat pesanan; tambahkan akses melihat pesanan ini.\nPertahankan tanggung jawabnya yang ada. Peninjau pesanan tetap memproses persetujuan.\nIzinkan administrator mengelola aturan berbagi ini.',
          },
        },
      },
      scheduler: {
        title: 'Tugas terjadwal',
        description:
          'Jalankan pekerjaan bisnis pada waktu tertentu, dan lihat eksekusi berikutnya beserta hasilnya.',
        prompts: {
          reminder: {
            label: 'Pengingat harian',
            text: 'Tambahkan Pengingat pesanan tertunda ke aplikasi pesanan yang ada.\n\nPada pukul 09:00 waktu Beijing setiap hari kerja, temukan pesanan menunggu persetujuan, kelompokkan berdasarkan peninjau, dan kirim satu notifikasi dalam aplikasi kepada setiap peninjau.\nSertakan jumlah pesanan tertunda dan tautan ke daftar pesanan tertunda. Jangan kirim apa pun jika tidak ada pesanan tertunda.\nAdministrator dapat melihat jadwal dan rekaman eksekusi, serta menjeda atau melanjutkan pengingat.',
          },
          weeklyReport: {
            label: 'Laporan mingguan',
            text: 'Pada pukul 08:00 waktu Beijing setiap Senin, buat ringkasan penjualan pekan lalu dan beri tahu manajer penjualan.\nSertakan pendapatan penjualan, jumlah pesanan, dan total per wilayah. Administrator dapat melihat tugas dan rekaman eksekusi.',
          },
        },
      },
      notification: {
        title: 'Notifikasi',
        description:
          'Kirim pesan dalam aplikasi, email, atau pesan bot grup saat sesuatu terjadi.',
        prompts: {
          inApp: {
            label: 'Pesan dalam aplikasi',
            text: 'Tambahkan persetujuan pesanan ke aplikasi saat ini dan beri tahu pemohon tentang hasilnya melalui pesan dalam aplikasi.\n\nPesanan memuat nomor, nama, pemohon, jumlah, dan status persetujuan.\nPemohon dapat melihat pesanan sendiri. Peninjau dapat melihat pesanan tertunda dan menyetujui atau menolaknya. Gunakan kembali fitur pesanan dan persetujuan yang ada jika tersedia.\n\nSetelah persetujuan atau penolakan, kirim satu pesan dalam aplikasi hanya kepada pemohon pesanan.\nJudul menunjukkan apakah pesanan disetujui atau ditolak. Isi memuat nomor pesanan, nama, dan hasil persetujuan.\nMengklik pesan membuka detail pesanan terkait.\nJangan kirim saat persetujuan tertunda. Beri tahu hanya sekali untuk hasil persetujuan yang sama.\nKegagalan notifikasi tidak memengaruhi hasil persetujuan tersimpan.',
          },
          email: {
            label: 'Email',
            text: 'Tambahkan email ke notifikasi persetujuan pesanan yang ada, menggunakan kanal email aplikasi yang dikonfigurasi.\n\nSetelah pesanan disetujui atau ditolak, kirim hasil ke email akun pemohon.\nSertakan nomor pesanan pada subjek serta nama pesanan dan hasil pada isi.\nPertahankan pesan dalam aplikasi yang ada. Jika pemohon tidak memiliki email, kirim hanya pesan dalam aplikasi.\nKegagalan email tidak boleh memengaruhi hasil persetujuan atau pesan dalam aplikasi.',
          },
        },
      },
      mail: {
        title: 'Pos',
        description:
          'Hubungkan kotak surat pribadi, lalu baca, balas, dan kirim email bisnis.',
        prompts: {
          mailCenter: {
            label: 'Pusat email',
            text: 'Tambahkan pusat email dan entri pengelolaan akun kotak surat ke aplikasi. Pengguna dapat menghubungkan kotak surat sendiri, memilih kotak surat, menyinkronkan pesan masuk, membaca pesan dan lampiran, serta membalas.\n\nSaat perwakilan penjualan menerima permintaan penawaran, mereka dapat membalas dari pusat email. Pertahankan subjek awal dan konteks percakapan, serta tujukan balasan kepada pengirim awal. Setiap pengguna bekerja dengan kotak surat terhubungnya sendiri.',
          },
          correspondence: {
            label: 'Email pelanggan',
            text: 'Tambahkan bagian korespondensi ke detail pelanggan. Tampilkan pesan yang pengirim atau penerimanya cocok dengan alamat email kontak pelanggan saat ini. Perwakilan penjualan dapat membaca pesan, melihat lampiran, dan membalas menggunakan kotak surat terhubungnya sendiri.',
          },
        },
      },
      file: {
        title: 'File',
        description:
          'Unggah file, lampirkan ke rekaman, dan pratinjau atau unduh.',
        prompts: {
          attachments: {
            label: 'Lampiran',
            text: 'Tambahkan lampiran pembelian ke aplikasi pengelolaan pesanan saya yang ada.\n\nTambahkan area lampiran ke detail pesanan. Setiap pesanan dapat memiliki beberapa file, termasuk PDF, gambar, dan DOCX.\nTampilkan nama dan ukuran file, dengan tindakan pratinjau, unduh, dan hapus lampiran.\nSetelah mengunggah, izinkan pengguna menyimpan lampiran ke pesanan saat ini. Pertahankan ketersediaannya saat pesanan dibuka kembali.\nSiapa pun yang memiliki akses pesanan dapat melihat dan mengunduh lampirannya. Pemohon dan peninjau dapat menambah atau menghapus lampiran.\nPenghapusan lampiran hanya melepaskan tautannya dari pesanan saat ini; pertahankan file.',
          },
          avatar: {
            label: 'Avatar',
            text: 'Tambahkan avatar ke setiap karyawan, satu gambar per karyawan.\nDukung pengunggahan dan penggantian avatar, serta tampilkan dalam daftar dan detail karyawan.\nGunakan avatar baru setelah penggantian dan pertahankan tampilannya setelah halaman dimuat ulang.',
          },
        },
      },
      templatePrint: {
        title: 'Pencetakan templat',
        description:
          'Isi data bisnis ke templat Word atau Excel dan buat file.',
        prompts: {
          approvalForm: {
            label: 'Formulir persetujuan',
            text: 'Tambahkan tindakan “Buat formulir persetujuan” ke detail pesanan.\n\nGunakan templat Word yang saya sediakan untuk mengisi nomor pesanan saat ini, permintaan pembelian, pemohon, jumlah, hasil persetujuan, dan waktu pemrosesan.\nPertahankan judul, tata letak tabel, dan area tanda tangan templat. Beri nama keluaran “Persetujuan-pembelian-nomor-pesanan” dan sediakan unduhan Word.\nSiapa pun yang memiliki akses pesanan dapat membuat formulir persetujuannya. Gunakan data pesanan saat ini saat membuat file.',
          },
          pdf: {
            label: 'Keluaran PDF',
            text: 'Tambahkan unduhan PDF untuk formulir persetujuan pembelian, dengan mempertahankan font, tabel, dan area tanda tangan templat Word.',
          },
        },
      },
      i18n: {
        title: 'Bahasa',
        description:
          'Ganti bahasa antarmuka, tambahkan bahasa, dan atur bahasa default.',
        prompts: {
          addLanguage: {
            label: 'Tambah bahasa',
            text: 'Tambahkan bahasa Spanyol ke aplikasi saya. Terjemahkan antarmuka dan pesan server, serta tambahkan bahasa Spanyol ke menu bahasa.',
          },
          defaultLanguage: {
            label: 'Bahasa default',
            text: 'Jadikan Tionghoa Sederhana bahasa default aplikasi bagi orang yang belum memilih bahasa. Pertahankan bahasa Inggris dalam menu bahasa.',
          },
        },
      },
      theme: {
        title: 'Tema',
        description:
          'Sesuaikan warna, font, dan kepadatan, serta beralih antara terang dan gelap.',
        prompts: {
          changeTheme: {
            label: 'Ubah tema',
            text: 'Perbarui tema Ringkas: gunakan biru sebagai warna utama dan sedikit perbesar radius sudut. Pertahankan font, ukuran teks, dan jarak ringkas saat ini.',
          },
          newTheme: {
            label: 'Tema baru',
            text: 'Buat tema Hutan dengan hijau sebagai warna utama, latar lembut, sudut cukup membulat, dan bayangan halus.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Tampilan',
    mode: 'Mode warna',
    preset: 'Tema',
    light: 'Terang',
    dark: 'Gelap',
    system: 'Sistem',
    themes: { default: 'Lapang', compact: 'Ringkas' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Tutup',
    save: 'Simpan',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    language: 'Bahasa',
  },
  notices: {
    serverLocaleFallback:
      'Server tidak mendukung bahasa ini, sehingga pesan server menggunakan bahasa Inggris.',
    languageChangeFailed:
      'Tidak dapat menyelesaikan perubahan bahasa. Silakan coba lagi.',
  },
  account: {
    signOutFailed: 'Tidak dapat keluar. Silakan coba lagi.',
    openMenu: 'Buka menu akun',
    fallback: 'Akun',
    signOut: 'Keluar',
    signingOut: 'Keluar…',
  },
  navigation: {
    home: 'Beranda',
    open: 'Buka navigasi',
    close: 'Tutup navigasi',
    expand: 'Perluas navigasi',
    collapse: 'Ciutkan navigasi',
    toggle: 'Perluas atau ciutkan navigasi',
    label: 'Navigasi aplikasi',
    description: 'Buka halaman aplikasi ini.',
    breadcrumb: 'Jejak navigasi',
    breadcrumbMore: 'Tampilkan tingkat di antaranya',
    back: 'Kembali',
  },
  dataTable: {
    emptyDescription:
      'Tidak ada rekaman tersedia dalam cakupan saat ini. Coba cakupan lain atau periksa lagi nanti.',
    noResults: 'Tidak ada hasil.',
    sortAscending: 'Naik',
    sortDescending: 'Turun',
    hideColumn: 'Sembunyikan',
    view: 'Lihat',
    toggleColumns: 'Alihkan kolom',
    selectedCount: '{{selected}} dari {{total}} baris dipilih.',
    rowsPerPage: 'Baris per halaman',
    pageOf: 'Halaman {{page}} dari {{pageCount}}',
    firstPage: 'Ke halaman pertama',
    previousPage: 'Ke halaman sebelumnya',
    nextPage: 'Ke halaman berikutnya',
    lastPage: 'Ke halaman terakhir',
  },
  datePicker: {
    placeholder: 'Pilih tanggal',
    rangePlaceholder: 'Pilih rentang tanggal',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;
