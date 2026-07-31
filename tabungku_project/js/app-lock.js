/* =========================================================
   app-lock.js — Kunci Aplikasi (PIN)
   PIN di-hash sederhana (bukan enkripsi kuat — ini proteksi privasi
   ringan dari orang iseng, bukan pengaman data sensitif tingkat
   bank) dan disimpan terpisah dari data transaksi, supaya tetap ada
   walau "Reset Seluruh Data" dijalankan (mencegah orang lain reset
   data lalu masuk tanpa PIN).
   ========================================================= */

const AppLock = (() => {

  const KEY = 'tk_app_lock';
  const AUTO_LOCK_MS = 1000 * 60 * 3; // auto-lock setelah 3 menit app di-background/idle

  let unlocked = false;
  let bgTimestamp = null;

  function _get(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || { enabled: false, pinHash: null }; }
    catch(e){ return { enabled: false, pinHash: null }; }
  }
  function _set(data){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){ console.error('AppLock write error', e); }
  }

  /* Hash sederhana non-kriptografis — cukup untuk mencegah PIN
     tersimpan polos di localStorage, bukan untuk keamanan tingkat tinggi. */
  function simpleHash(str){
    let hash = 0;
    for (let i = 0; i < str.length; i++){
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return String(hash);
  }

  function isEnabled(){
    return !!_get().enabled;
  }

  function isUnlocked(){
    return unlocked || !isEnabled();
  }

  function setPin(pin){
    _set({ enabled: true, pinHash: simpleHash(pin) });
    unlocked = true;
  }

  function disable(){
    _set({ enabled: false, pinHash: null });
    unlocked = true;
  }

  function verifyPin(pin){
    const data = _get();
    return data.pinHash === simpleHash(pin);
  }

  /* ---------- Layar Kunci (ditampilkan sebelum #app terlihat) ---------- */
  function showLockScreen(mode = 'unlock'){
    let overlay = document.getElementById('appLockOverlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.id = 'appLockOverlay';
      overlay.className = 'applock-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open');
    renderPinPad(overlay, mode);
  }

  function hideLockScreen(){
    const overlay = document.getElementById('appLockOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function renderPinPad(overlay, mode, opts = {}){
    let entered = '';
    const title = mode === 'setup' ? 'Buat PIN Baru' : (mode === 'confirm' ? 'Konfirmasi PIN' : 'Masukkan PIN');

    overlay.innerHTML = `
      <div class="applock-box">
        <div class="applock-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" stroke-width="1.7"/></svg>
        </div>
        <p class="applock-title">${title}</p>
        <p class="applock-error" id="applockError"></p>
        <div class="applock-dots" id="applockDots">
          <span></span><span></span><span></span><span></span>
        </div>
        <div class="applock-keypad" id="applockKeypad">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" data-key="${n}">${n}</button>`).join('')}
          <button type="button" data-key="clear" class="applock-key-alt">Hapus</button>
          <button type="button" data-key="0">0</button>
          <button type="button" data-key="back" class="applock-key-alt">⌫</button>
        </div>
      </div>
    `;

    const dotsEl = () => overlay.querySelectorAll('.applock-dots span');
    const errorEl = overlay.querySelector('#applockError');

    function updateDots(){
      dotsEl().forEach((dot, i) => dot.classList.toggle('filled', i < entered.length));
    }

    overlay.querySelector('#applockKeypad').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      const key = btn.dataset.key;
      errorEl.textContent = '';

      if (key === 'back'){ entered = entered.slice(0, -1); updateDots(); return; }
      if (key === 'clear'){ entered = ''; updateDots(); return; }
      if (entered.length >= 4) return;
      entered += key;
      updateDots();

      if (entered.length === 4){
        setTimeout(() => handleComplete(entered, mode, overlay, opts, errorEl, () => { entered=''; updateDots(); }), 150);
      }
    });
  }

  function handleComplete(pin, mode, overlay, opts, errorEl, resetFn){
    if (mode === 'unlock'){
      if (verifyPin(pin)){
        unlocked = true;
        hideLockScreen();
        if (opts.onVerified) opts.onVerified();
      } else {
        errorEl.textContent = 'PIN salah, coba lagi.';
        if (navigator.vibrate) navigator.vibrate([80,50,80]);
        resetFn();
      }
    } else if (mode === 'setup'){
      // Simpan PIN pertama sementara, minta konfirmasi
      renderPinPad(overlay, 'confirm', { firstPin: pin });
    } else if (mode === 'confirm'){
      if (pin === opts.firstPin){
        setPin(pin);
        hideLockScreen();
        Utils.toast('PIN berhasil diaktifkan', 'success');
        const checkbox = document.getElementById('appLockToggle');
        if (checkbox) checkbox.checked = true;
      } else {
        errorEl.textContent = 'PIN tidak cocok, ulangi dari awal.';
        setTimeout(() => renderPinPad(overlay, 'setup'), 900);
      }
    }
  }

  /* ---------- Setup PIN dari halaman Pengaturan ---------- */
  function promptSetupPin(){
    showLockScreen('setup');
  }

  function promptDisablePin(){
    let overlay = document.getElementById('appLockOverlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.id = 'appLockOverlay';
      overlay.className = 'applock-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open');
    renderPinPad(overlay, 'unlock', { onVerified: () => {
      disable();
      const checkbox = document.getElementById('appLockToggle');
      if (checkbox) checkbox.checked = false;
      Utils.toast('PIN dinonaktifkan', 'success');
    }});
  }

  /* ---------- Auto-lock saat app kembali dari background ---------- */
  function setupAutoLock(){
    document.addEventListener('visibilitychange', () => {
      if (document.hidden){
        bgTimestamp = Date.now();
      } else {
        if (bgTimestamp && isEnabled() && (Date.now() - bgTimestamp) > AUTO_LOCK_MS){
          unlocked = false;
          showLockScreen('unlock');
        }
        bgTimestamp = null;
      }
    });
  }

  /* Dipanggil sekali di awal App.init() — kalau lock aktif, tampilkan
     layar kunci sebelum apapun lain terlihat. */
  function initialCheck(){
    if (isEnabled()){
      unlocked = false;
      showLockScreen('unlock');
    }
    setupAutoLock();
  }

  return { initialCheck, isEnabled, isUnlocked, promptSetupPin, promptDisablePin, disable };
})();
