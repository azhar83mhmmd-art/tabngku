/* =========================================================
   whatsnew.js — Popup "Apa yang Baru di v2" (muncul otomatis
   saat pertama kali buka setelah update) + data untuk halaman
   "Cara Penggunaan" (menu bantuan lengkap semua fitur).
   ========================================================= */

const WhatsNew = (() => {

  const KEY_SEEN = 'tk_whatsnew_v2_seen';
  const WHATSNEW_VERSION = 'v2.1';

  /* ---------- Ikon kecil bergaya sama dengan ikon lain di app ---------- */
  const ICONS = {
    ai: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/></svg>',
    reminder: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 7v5l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" stroke="currentColor" stroke-width="1.7"/></svg>',
    cycle: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    tag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M20.6 12.4L12.4 20.6a2 2 0 01-2.8 0l-6.2-6.2a2 2 0 010-2.8L11.6 3.4A2 2 0 0113 3h5.5A2.5 2.5 0 0121 5.5V11a2 2 0 01-.4 1.4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16" cy="8" r="1.4" fill="currentColor"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="6" y="2.5" width="12" height="19" rx="2.2" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 18.5h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12l8-8 8 8M6 10v10h12V10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    inout: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    piggy: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 21c-4.5-2.3-8-5.7-8-10a8 8 0 1116 0c0 4.3-3.5 7.7-8 10z" stroke="currentColor" stroke-width="1.6"/></svg>',
    target: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    streak: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 22a7 7 0 007-7c0-3-2-5-3-8-1 2-2 3-3.5 3C10 8 10.5 5.5 9 3c-2 3-5 6-5 12a8 8 0 008 7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    scan: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3M4 12h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.6"/></svg>',
    stats: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    report: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 19V6a2 2 0 012-2h9l5 5v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.6"/><path d="M8 13h8M8 16.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 10.5V7a4 4 0 018 0v3.5" stroke="currentColor" stroke-width="1.6"/></svg>',
    backup: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    theme: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 3v1M12 20v1M4.2 4.2l.7.7M19.1 19.1l.7.7M3 12h1M20 12h1M4.2 19.8l.7-.7M19.1 4.9l.7-.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 15a8 8 0 1116 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12 15l3.5-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="15" r="1.3" fill="currentColor"/></svg>',
    insight: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.6"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="3.5" y="5" width="17" height="16" rx="2.2" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    badge: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="9" r="5.5" stroke="currentColor" stroke-width="1.6"/><path d="M9 13.5L7 21l5-2.5L17 21l-2-7.5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    calc: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 8h8M8 12h2M12.5 12h2M17 12h.01M8 16h2M12.5 16h2M17 16h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  /* ---------- Data fitur baru v2 (untuk popup) ---------- */
  const NEW_FEATURES = [
    {
      icon: ICONS.ai,
      title: 'Asisten AI Keuangan (Lokal)',
      location: 'Tombol bulat ungu di pojok kiri bawah, muncul di semua halaman.',
      howto: 'Tap tombolnya lalu ketik pertanyaan seperti "berapa saldo saya?", "pengeluaran terbesar?", "tips hemat", atau "kapan target tabungan tercapai?". Semua dianalisis langsung dari data di HP kamu — tanpa internet, tanpa API key.'
    },
    {
      icon: ICONS.reminder,
      title: 'Pengingat Pembayaran',
      location: 'Menu "Pengingat" di tombol tambah (+) atau kartu "Pengingat Pembayaran" di halaman Pengaturan.',
      howto: 'Tambahkan tagihan/cicilan (sekali atau bulanan berulang), atur tanggal jatuh tempo & jam pengingat. Saat mendekati jatuh tempo akan muncul banner di Dashboard, dan setelah ditandai lunas otomatis tercatat sebagai pengeluaran.'
    },
    {
      icon: ICONS.cycle,
      title: 'Siklus Keuangan Bulanan',
      location: 'Kartu baru di Dashboard, tepat di bawah kartu saldo.',
      howto: 'Otomatis menampilkan status Surplus/Defisit bulan berjalan, proyeksi pengeluaran sampai akhir bulan, dan saran "budget aman per hari" untuk sisa bulan ini — tidak perlu diatur manual.'
    },
    {
      icon: ICONS.tag,
      title: 'Auto-kategori Pengeluaran',
      location: 'Form "Uang Keluar", pada kolom nama pengeluaran.',
      howto: 'Ketik nama pengeluaran (misal "nasi goreng" atau "bensin"), kategori akan terisi otomatis berdasarkan kata kunci yang cocok. Tetap bisa diubah manual kapan saja.'
    },
    {
      icon: ICONS.bolt,
      title: 'Quick Amount Chips',
      location: 'Di bawah kolom nominal pada form Uang Masuk & Uang Keluar.',
      howto: 'Tap salah satu chip nominal cepat (Rp10rb, 50rb, 100rb, dst.) untuk langsung mengisi nominal tanpa mengetik manual.'
    },
    {
      icon: ICONS.phone,
      title: 'Tampilan Lebih Rapi & Responsif',
      location: 'Berlaku di seluruh halaman, terutama Riwayat.',
      howto: 'Tombol mengambang (FAB, AI, navigasi bawah) tidak lagi bergeser di layar kecil, dan tabel Riwayat kini pakai format angka singkat (rb/jt) supaya tetap rapi dari HP kecil sampai tablet/desktop.'
    },
    {
      icon: ICONS.gauge,
      title: 'Skor Disiplin Keuangan',
      location: 'Kartu baru di halaman Statistik.',
      howto: 'Otomatis menghitung skor 0-100 tiap bulan dari rasio menabung, konsistensi nabung, dan kontrol pengeluaran, lengkap dengan ring visual dan label (Sangat Disiplin/Disiplin/Cukup/Perlu Ditingkatkan).'
    },
    {
      icon: ICONS.insight,
      title: 'Insight Otomatis',
      location: 'Kartu "Insight" di halaman Statistik.',
      howto: 'Muncul otomatis berupa perbandingan pengeluaran bulan ini vs bulan lalu, kategori yang naik signifikan, rata-rata tabungan per minggu, dan peringatan kalau pengeluaran sudah makan porsi besar dari pemasukan.'
    },
    {
      icon: ICONS.calendar,
      title: 'Kalender Keuangan',
      location: 'Kartu "Kalender Keuangan" di halaman Statistik.',
      howto: 'Tampilan kalender bulanan dengan titik warna per hari (hijau=pemasukan, merah=pengeluaran). Tap tanggal untuk lihat detail transaksi hari itu, atau navigasi ke bulan sebelumnya/berikutnya.'
    },
    {
      icon: ICONS.badge,
      title: 'Achievement / Badge',
      location: 'Kartu "Pencapaian" di halaman Statistik.',
      howto: '15 badge tersedia, dari "Langkah Pertama" (nabung pertama kali) sampai "Sultan Tabungan" (tabungan Rp10 juta). Notifikasi toast otomatis muncul saat badge baru terbuka.'
    },
    {
      icon: ICONS.lock,
      title: 'Kunci Aplikasi (PIN)',
      location: 'Kartu "Kunci Aplikasi" di halaman Pengaturan.',
      howto: 'Aktifkan toggle lalu buat PIN 4 digit. App otomatis terkunci lagi jika dibiarkan di background lebih dari 3 menit. PIN tidak ikut terhapus oleh Reset Seluruh Data.'
    },
    {
      icon: ICONS.backup,
      title: 'Backup Otomatis Terjadwal',
      location: 'Kartu "Backup & Restore" di halaman Pengaturan.',
      howto: 'Pilih interval Harian atau Mingguan. Selama aplikasi dibuka dan sudah waktunya, file JSON backup akan otomatis terunduh ke perangkatmu.'
    },
    {
      icon: ICONS.calc,
      title: 'Kalkulator Nabung Otomatis',
      location: 'Tiap kartu Target Tabungan.',
      howto: 'Otomatis menghitung dan menampilkan "Perlu nabung per hari" dan "Perlu nabung per minggu" berdasarkan sisa nominal target dan sisa waktu ke deadline.'
    },
    {
      icon: ICONS.filter,
      title: 'Filter Kategori Multi-select',
      location: 'Halaman Riwayat, di bawah filter Jenis & Periode.',
      howto: 'Tap satu atau beberapa chip kategori sekaligus untuk menyaring transaksi — bisa dikombinasikan dengan pencarian dan filter periode yang sudah ada.'
    }
  ];

  /* ---------- Data lengkap untuk halaman "Cara Penggunaan" ---------- */
  const GUIDE_SECTIONS = [
    {
      icon: ICONS.dashboard,
      title: 'Dashboard & Saldo',
      badge: null,
      steps: [
        'Buka tab "Beranda" untuk melihat saldo saat ini, total uang masuk & keluar.',
        'Kartu "Siklus Keuangan Bulanan" menampilkan status Surplus/Defisit, proyeksi akhir bulan, dan saran budget harian — otomatis terisi.',
        'Widget streak menunjukkan konsistensi mencatat harian kamu.',
        'Grafik Pemasukan vs Pengeluaran, Riwayat Bulanan, dan Perkembangan Tabungan bisa digeser/dilihat langsung di Beranda.',
        'Bagian "Transaksi Terbaru" menampilkan 5 transaksi terakhir, tap "Lihat semua" untuk membuka Riwayat.'
      ]
    },
    {
      icon: ICONS.inout,
      title: 'Uang Masuk & Uang Keluar',
      badge: null,
      steps: [
        'Tap tombol (+) di kanan bawah lalu pilih "Uang Masuk" atau "Uang Keluar".',
        'Isi nominal — gunakan Quick Amount Chips di bawah kolom nominal untuk isi cepat (10rb/50rb/100rb, dst).',
        'Di form Uang Keluar, ketik nama pengeluaran dan kategori akan terisi otomatis (Auto-kategori) berdasarkan kata kunci — bisa diedit manual.',
        'Untuk pengeluaran belanja, tap "Scan Barcode" untuk memakai Smart Barcode Scanner (lihat bagian tersendiri di bawah).',
        'Tap "Simpan" untuk mencatat transaksi.'
      ]
    },
    {
      icon: ICONS.piggy,
      title: 'Tabungan',
      badge: null,
      steps: [
        'Tap tombol (+) lalu pilih "Tabungan" untuk mencatat setor atau tarik tabungan.',
        'Total tabungan otomatis terlihat di kartu "Total Tabungan" pada Beranda dan halaman Statistik.'
      ]
    },
    {
      icon: ICONS.target,
      title: 'Target Tabungan',
      badge: 'Baru di v2',
      steps: [
        'Tap tombol (+) lalu pilih "Target Baru" untuk membuat target tabungan (misal: dana darurat, gadget, liburan).',
        'Progress target tampil sebagai bar di kartu "Target Tabungan" pada Beranda, tap "Lihat semua" untuk kelola semua target.',
        'Tiap target kini menampilkan Kalkulator Nabung Otomatis: "Perlu nabung per hari" dan "per minggu" dihitung otomatis dari sisa nominal dan sisa waktu ke deadline.'
      ]
    },
    {
      icon: ICONS.streak,
      title: 'Streak & Pencapaian',
      badge: null,
      steps: [
        'Widget streak di Dashboard menghitung berapa hari berturut-turut kamu mencatat transaksi.',
        'Buka tab "Statistik" untuk melihat kartu Pencapaian (achievements) dan Skor Disiplin keuangan secara lengkap.'
      ]
    },
    {
      icon: ICONS.scan,
      title: 'Smart Barcode Scanner',
      badge: null,
      steps: [
        'Buka form "Uang Keluar" lalu tap tombol "Scan Barcode".',
        'Arahkan kamera ke barcode produk — nama & kategori produk akan otomatis terisi dari database Open Food Facts/database lokal.',
        'Kalau produk tidak ketemu, kamu bisa isi nama manual, atau tambahkan API Key BarcodeLookup (opsional) di Pengaturan > Smart Barcode Scanner sebagai sumber cadangan.',
        'Statistik & riwayat hasil scan bisa dilihat di halaman Statistik dan diexport lewat halaman Laporan.'
      ]
    },
    {
      icon: ICONS.ai,
      title: 'Asisten AI Keuangan',
      badge: 'Baru di v2',
      steps: [
        'Tap tombol bulat ungu di pojok kiri bawah (muncul di semua halaman).',
        'Ketik pertanyaan bebas seputar keuanganmu, misalnya "berapa saldo saya?", "pengeluaran terbesar bulan ini?", "tips hemat", atau "progress target tabungan".',
        'Semua jawaban dihitung langsung dari data transaksi di perangkatmu (rule-based, tanpa internet/API key), jadi tetap privat.'
      ]
    },
    {
      icon: ICONS.reminder,
      title: 'Pengingat Pembayaran',
      badge: 'Baru di v2',
      steps: [
        'Akses lewat tombol (+) > "Pengingat", atau kartu "Pengingat Pembayaran" di halaman Pengaturan.',
        'Isi nama tagihan, nominal, tanggal jatuh tempo, jam pengingat, dan pilih pengulangan (sekali/bulanan).',
        'Banner pengingat otomatis muncul di Dashboard saat mendekati jatuh tempo.',
        'Tandai "lunas" saat sudah dibayar — otomatis tercatat sebagai transaksi pengeluaran.'
      ]
    },
    {
      icon: ICONS.history,
      title: 'Riwayat & Pencarian',
      badge: null,
      steps: [
        'Buka tab "Riwayat" untuk melihat semua transaksi, dikelompokkan per waktu.',
        'Gunakan kolom pencarian untuk cari nama, nominal, atau kategori secara realtime.',
        'Filter berdasarkan Jenis (Masuk/Keluar/Tabungan), Periode (hari ini, minggu ini, bulan ini, tahun ini, atau custom rentang tanggal), dan Kategori — tap satu atau beberapa chip kategori sekaligus untuk menyaring transaksi.',
        'Geser (swipe) sebuah transaksi ke kiri untuk memunculkan tombol hapus.',
        'Ikon kaca pembesar di header juga bisa dipakai untuk pencarian cepat dari halaman mana saja.'
      ]
    },
    {
      icon: ICONS.stats,
      title: 'Statistik & Insight',
      badge: null,
      steps: [
        'Buka tab "Statistik" untuk melihat total pemasukan/pengeluaran, pengeluaran terbesar, kategori terbanyak, hari paling boros/hemat, dan rata-rata harian.',
        'Kartu Skor Disiplin, Insight, Kalender Keuangan, dan Pencapaian tersedia di halaman yang sama.'
      ]
    },
    {
      icon: ICONS.gauge,
      title: 'Skor Disiplin Keuangan',
      badge: 'Baru di v2',
      steps: [
        'Buka tab "Statistik", kartu "Skor Disiplin" muncul otomatis di bagian atas.',
        'Skor 0-100 dihitung tiap bulan dari rasio menabung, konsistensi mencatat, dan kontrol pengeluaran — ditampilkan sebagai ring visual dengan label Sangat Disiplin/Disiplin/Cukup/Perlu Ditingkatkan.'
      ]
    },
    {
      icon: ICONS.insight,
      title: 'Insight Otomatis',
      badge: 'Baru di v2',
      steps: [
        'Buka tab "Statistik", kartu "Insight" menampilkan analisis otomatis tanpa perlu diatur.',
        'Berisi perbandingan pengeluaran bulan ini vs bulan lalu, kategori yang naik signifikan, rata-rata tabungan per minggu, dan peringatan jika pengeluaran sudah makan porsi besar dari pemasukan.'
      ]
    },
    {
      icon: ICONS.calendar,
      title: 'Kalender Keuangan',
      badge: 'Baru di v2',
      steps: [
        'Buka tab "Statistik", scroll ke kartu "Kalender Keuangan".',
        'Tiap tanggal punya titik warna (hijau=pemasukan, merah=pengeluaran, gradasi=keduanya). Tap tanggal untuk lihat detail transaksi hari itu.',
        'Gunakan tombol panah untuk navigasi ke bulan sebelumnya/berikutnya.'
      ]
    },
    {
      icon: ICONS.badge,
      title: 'Achievement / Badge',
      badge: 'Baru di v2',
      steps: [
        'Buka tab "Statistik", kartu "Pencapaian" menampilkan semua badge (15 total) beserta status terkunci/terbuka.',
        'Badge terbuka otomatis saat syarat tercapai — misalnya nabung pertama kali, streak tertentu, target tercapai, jumlah transaksi, atau jumlah scan barcode.',
        'Notifikasi toast muncul otomatis begitu badge baru terbuka.'
      ]
    },
    {
      icon: ICONS.report,
      title: 'Laporan (Export & Import)',
      badge: null,
      steps: [
        'Buka menu Laporan (lewat Statistik atau navigasi) untuk Export PDF, CSV, JSON, atau Print data transaksi.',
        'Riwayat scan barcode bisa diexport terpisah dalam format Excel (CSV) atau PDF.',
        'Untuk pindah data dari HP lain, gunakan "Pilih File JSON" pada bagian Import Data.'
      ]
    },
    {
      icon: ICONS.lock,
      title: 'Kunci Aplikasi (PIN)',
      badge: 'Baru di v2',
      steps: [
        'Buka Pengaturan > "Kunci Aplikasi", aktifkan lalu buat PIN 4 digit.',
        'PIN hanya tersimpan di perangkat ini dan tidak ikut terhapus oleh Reset Seluruh Data.',
        'Aplikasi otomatis terkunci lagi kalau dibiarkan di background lebih dari 3 menit.'
      ]
    },
    {
      icon: ICONS.backup,
      title: 'Backup & Restore Otomatis',
      badge: 'Baru di v2',
      steps: [
        'Buka Pengaturan > "Backup & Restore" untuk backup manual (unduh file JSON) atau restore dari file backup.',
        'Aktifkan "Backup Otomatis Terjadwal" (harian/mingguan) agar file backup terunduh otomatis selama aplikasi dibuka.'
      ]
    },
    {
      icon: ICONS.theme,
      title: 'Tema, Warna Latar & Install Aplikasi',
      badge: 'Baru di v2',
      steps: [
        'Ganti tema Light/Dark/System lewat Pengaturan > "Tema", atau tap ikon matahari/bulan di header.',
        'Aktifkan "Custom Background" di Pengaturan, pilih Warna 1 & Warna 2 lewat color picker, pilih arah gradasi, lihat preview langsung, lalu tekan Terapkan — gradasi akan menggantikan warna tema bawaan di seluruh aplikasi. Tombol "Kembalikan Default" untuk reset.',
        'Untuk memasang TabungKu sebagai aplikasi di HP, buka Pengaturan lalu tap "Install Aplikasi" (atau gunakan menu browser "Add to Home Screen").'
      ]
    }
  ];

  /* ---------- Render popup "Apa yang Baru" ---------- */
  function renderPopup(){
    const box = document.getElementById('wnBox');
    if (!box) return;

    const itemsHtml = NEW_FEATURES.map(f => `
      <div class="wn-item">
        <div class="wn-item-icon">${f.icon}</div>
        <div class="wn-item-body">
          <p class="wn-item-title">${f.title}</p>
          <p class="wn-item-loc"><b>Letak:</b> ${f.location}</p>
          <p class="wn-item-how"><b>Cara pakai:</b> ${f.howto}</p>
        </div>
      </div>
    `).join('');

    box.innerHTML = `
      <button class="wn-close-btn" id="wnCloseBtn" aria-label="Tutup">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="wn-badge">TabungKu v2</div>
      <h3 class="wn-title">Apa yang Baru di v2</h3>
      <p class="wn-subtitle">Berikut fitur-fitur yang baru ditambahkan, lengkap dengan letak dan cara pakainya.</p>
      <div class="wn-list">${itemsHtml}</div>
      <div class="wn-actions">
        <button class="btn-outline ripple" id="wnGuideBtn">Buka Panduan Lengkap</button>
        <button class="btn-primary ripple" id="wnOkBtn">Mengerti</button>
      </div>
    `;

    document.getElementById('wnCloseBtn').onclick = close;
    document.getElementById('wnOkBtn').onclick = close;
    document.getElementById('wnGuideBtn').onclick = () => {
      close();
      if (typeof App !== 'undefined') App.navigateTo('guide');
    };
  }

  function show(){
    renderPopup();
    document.getElementById('wnOverlay').classList.add('open');
  }

  function close(){
    const overlay = document.getElementById('wnOverlay');
    if (overlay) overlay.classList.remove('open');
    localStorage.setItem(KEY_SEEN, WHATSNEW_VERSION);
  }

  function forceShow(){
    show();
  }

  /* ---------- Render halaman "Cara Penggunaan" ---------- */
  function renderGuidePage(){
    const wrap = document.getElementById('guideAccordion');
    if (!wrap || wrap.dataset.rendered === '1') return;

    wrap.innerHTML = GUIDE_SECTIONS.map((sec, i) => `
      <details class="guide-item" ${i === 0 ? 'open' : ''}>
        <summary class="guide-item-summary">
          <span class="guide-item-icon">${sec.icon}</span>
          <span class="guide-item-title">${sec.title}</span>
          ${sec.badge ? `<span class="guide-item-badge">${sec.badge}</span>` : ''}
          <svg class="guide-item-caret" viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </summary>
        <ol class="guide-item-steps">
          ${sec.steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </details>
    `).join('');

    wrap.dataset.rendered = '1';
  }

  function init(){
    renderGuidePage();

    const reopenBtn = document.getElementById('reopenWhatsNewBtn');
    if (reopenBtn) reopenBtn.addEventListener('click', forceShow);

    const seen = localStorage.getItem(KEY_SEEN);
    if (seen !== WHATSNEW_VERSION){
      setTimeout(show, 700);
    }
  }

  return { init, show, forceShow };
})();
