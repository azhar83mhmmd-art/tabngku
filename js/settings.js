/* =========================================================
   settings.js — halaman Pengaturan + tema + PWA install
   ========================================================= */

const SettingsModule = (() => {

  let deferredInstallPrompt = null;

  function init(){
    const settings = Storage.getSettings();
    document.getElementById('settingUsername').value = settings.username || '';
    document.getElementById('settingInitialBalance').value = settings.initialBalance ? Number(settings.initialBalance).toLocaleString('id-ID') : '';
    Utils.attachRupiahMask(document.getElementById('settingInitialBalance'));
    const barcodeKeyInput = document.getElementById('settingBarcodeLookupKey');
    if (barcodeKeyInput) barcodeKeyInput.value = settings.barcodeLookupApiKey || '';

    applyTheme(settings.theme);
    highlightThemeButton(settings.theme);
    initCustomBg(settings);
    applyCustomBg(settings.customBg);

    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    const saveBarcodeKeyBtn = document.getElementById('saveBarcodeKeyBtn');
    if (saveBarcodeKeyBtn) saveBarcodeKeyBtn.addEventListener('click', () => {
      const key = document.getElementById('settingBarcodeLookupKey').value.trim();
      Storage.saveSettings({ barcodeLookupApiKey: key });
      Utils.toast(key ? 'API Key Barcode Lookup disimpan' : 'API Key dikosongkan', 'success');
    });

    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        Storage.saveSettings({ theme });
        applyTheme(theme);
        highlightThemeButton(theme);
      });
    });

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const current = Storage.getSettings().theme;
      const resolved = resolveTheme(current);
      const next = resolved === 'dark' ? 'light' : 'dark';
      Storage.saveSettings({ theme: next });
      applyTheme(next);
      highlightThemeButton(next);
    });

    document.getElementById('backupBtn').addEventListener('click', async () => {
      const data = await Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tabungku-backup-${Utils.todayISO()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      Utils.toast('Backup berhasil diunduh', 'success');
    });

    const appLockToggle = document.getElementById('appLockToggle');
    if (appLockToggle && typeof AppLock !== 'undefined'){
      appLockToggle.checked = AppLock.isEnabled();
      appLockToggle.addEventListener('change', () => {
        if (appLockToggle.checked) AppLock.promptSetupPin();
        else { appLockToggle.checked = true; AppLock.promptDisablePin(); }
      });
    }

    const autoBackupSelect = document.getElementById('autoBackupInterval');
    if (autoBackupSelect && typeof BackupScheduler !== 'undefined'){
      autoBackupSelect.value = BackupScheduler.getInterval();
      autoBackupSelect.addEventListener('change', () => {
        BackupScheduler.setInterval(autoBackupSelect.value);
        Utils.toast(
          autoBackupSelect.value === 'off' ? 'Backup otomatis dinonaktifkan' : 'Backup otomatis diaktifkan',
          'success'
        );
      });
    }

    document.getElementById('restoreInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const data = JSON.parse(reader.result);
          Utils.modal({
            title: 'Restore Data?',
            message: 'Semua data saat ini akan digantikan oleh data backup ini. Lanjutkan?',
            type: 'warn', confirmText: 'Restore', cancelText: 'Batal',
            onConfirm: async () => {
              const { streakResult } = await Storage.importAll(data);
              if (streakResult === 'rejected'){
                Utils.toast('Data berhasil direstore, tapi streak di file backup terindikasi rusak/diubah manual sehingga tidak dipulihkan', 'warn');
              } else {
                Utils.toast('Data berhasil direstore', 'success');
              }
              if (window.App) App.refreshGlobalViews();
              init();
            }
          });
        }catch(err){ Utils.toast('File backup tidak valid', 'error'); }
        e.target.value = '';
      };
      reader.readAsText(file);
    });

    document.getElementById('resetAllBtn').addEventListener('click', () => {
      Utils.modal({
        title: 'Reset Seluruh Data?',
        message: 'Semua transaksi, tabungan, dan target akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
        type: 'error', confirmText: 'Ya, Reset', cancelText: 'Batal',
        onConfirm: () => {
          Storage.resetAll();
          Utils.toast('Seluruh data telah direset', 'success');
          if (window.App) App.refreshGlobalViews();
          init();
        }
      });
    });

    setupInstallPrompt();
  }

  function saveProfile(){
    const username = document.getElementById('settingUsername').value.trim();
    const initialBalance = Utils.parseRupiahInput(document.getElementById('settingInitialBalance').value);
    Storage.saveSettings({ username, initialBalance });
    Utils.toast('Profil disimpan', 'success');
    if (window.App) App.refreshGlobalViews();
  }

  function resolveTheme(theme){
    if (theme === 'system'){
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  /* ---------- Custom Background (2 warna kustom) ---------- */
  function initCustomBg(settings){
    const toggle = document.getElementById('customBgToggle');
    const fields = document.getElementById('customBgFields');
    const color1 = document.getElementById('customBgColor1');
    const color2 = document.getElementById('customBgColor2');
    const direction = document.getElementById('customBgDirection');
    const preview = document.getElementById('customBgPreview');
    const applyBtn = document.getElementById('applyCustomBgBtn');
    const resetBtn = document.getElementById('resetCustomBgBtn');
    if (!toggle) return;

    const cfg = settings.customBg || { enabled:false, color1:'#0B2A1F', color2:'#12B76A', direction:'135deg' };
    toggle.checked = !!cfg.enabled;
    color1.value = cfg.color1 || '#0B2A1F';
    color2.value = cfg.color2 || '#12B76A';
    direction.value = cfg.direction || '135deg';
    fields.style.display = toggle.checked ? 'block' : 'none';
    updateBgPreview();

    toggle.addEventListener('change', () => {
      fields.style.display = toggle.checked ? 'block' : 'none';
      if (!toggle.checked){
        Storage.saveSettings({ customBg: { ...cfg, enabled: false } });
        applyCustomBg({ enabled: false });
        Utils.toast('Latar kustom dinonaktifkan, kembali ke tema bawaan', 'success');
      }
    });

    [color1, color2, direction].forEach(el => el.addEventListener('input', updateBgPreview));

    function updateBgPreview(){
      preview.style.background = `linear-gradient(${direction.value}, ${color1.value}, ${color2.value})`;
    }

    applyBtn.addEventListener('click', () => {
      const newCfg = { enabled: true, color1: color1.value, color2: color2.value, direction: direction.value };
      Storage.saveSettings({ customBg: newCfg });
      applyCustomBg(newCfg);
      Utils.toast('Latar belakang kustom diterapkan', 'success');
    });

    resetBtn.addEventListener('click', () => {
      const defaultCfg = { enabled: false, color1: '#0B2A1F', color2: '#12B76A', direction: '135deg' };
      color1.value = defaultCfg.color1; color2.value = defaultCfg.color2; direction.value = defaultCfg.direction;
      toggle.checked = false;
      fields.style.display = 'none';
      updateBgPreview();
      Storage.saveSettings({ customBg: defaultCfg });
      applyCustomBg(defaultCfg);
      Utils.toast('Latar belakang dikembalikan ke default', 'success');
    });
  }

  /* Menerapkan gradasi 2 warna ke #app (bukan body), karena #app menutupi
     seluruh viewport dengan background solid sendiri (var(--bg)) — kalau
     hanya body yang diubah, gradasinya tidak akan pernah terlihat.
     Tidak mengubah warna teks/kartu/komponen lain sama sekali. */
  function applyCustomBg(cfg){
    const appEl = document.getElementById('app');
    if (cfg && cfg.enabled){
      const gradient = `linear-gradient(${cfg.direction || '135deg'}, ${cfg.color1}, ${cfg.color2})`;
      document.body.style.background = gradient;
      document.body.style.backgroundAttachment = 'fixed';
      if (appEl){
        appEl.style.background = gradient;
        appEl.style.backgroundAttachment = 'fixed';
      }
    } else {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      if (appEl){
        appEl.style.background = '';
        appEl.style.backgroundAttachment = '';
      }
    }
  }

  function applyTheme(theme){
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolved);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', resolved === 'dark' ? '#0A1712' : '#F4FAF7');
  }

  function highlightThemeButton(theme){
    document.querySelectorAll('.theme-opt-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function setupInstallPrompt(){
    const wrap = document.getElementById('installPromptWrap');
    if (!wrap) return;

    if (isStandalone()){
      wrap.innerHTML = '';
      return;
    }

    deferredInstallPrompt = window.__installPromptEvent || null;
    renderInstallCard(wrap);

    window.addEventListener('installpromptready', () => {
      deferredInstallPrompt = window.__installPromptEvent || null;
      renderInstallCard(wrap);
    });
  }

  function renderInstallCard(wrap){
    if (isStandalone()){ wrap.innerHTML = ''; return; }

    if (deferredInstallPrompt){
      wrap.innerHTML = `
        <div class="card install-card">
          <p class="section-label">Install Aplikasi</p>
          <p>Pasang TabungKu di layar utama untuk akses lebih cepat, seperti aplikasi Android.</p>
          <button class="btn-primary full ripple" id="installAppBtn">Install Aplikasi</button>
        </div>
      `;
      document.getElementById('installAppBtn').addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') Utils.toast('Aplikasi berhasil dipasang', 'success');
        deferredInstallPrompt = null;
        window.__installPromptEvent = null;
        wrap.innerHTML = '';
      });
    } else {
      wrap.innerHTML = `
        <div class="card install-card">
          <p class="section-label">Install Aplikasi</p>
          <p>Browser ini belum mendukung install otomatis. Ketuk tombol di bawah untuk lihat caranya.</p>
          <button class="btn-outline full ripple" id="installAppBtn">Cara Install</button>
        </div>
      `;
      document.getElementById('installAppBtn').addEventListener('click', () => {
        Utils.modal({
          title: 'Cara Install TabungKu',
          message: 'Buka link ini di browser Chrome (bukan di dalam aplikasi lain seperti TikTok/Instagram), lalu ketuk menu titik tiga di pojok kanan atas dan pilih "Tambahkan ke Layar Utama" atau "Install aplikasi". Untuk iPhone, gunakan Safari lalu ketuk ikon Bagikan dan pilih "Tambah ke Layar Utama".',
          type: 'warn', confirmText: 'Mengerti'
        });
      });
    }
  }

  return { init, applyTheme, resolveTheme, applyCustomBg };
})();
