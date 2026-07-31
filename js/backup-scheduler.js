/* =========================================================
   backup-scheduler.js — Backup Otomatis Terjadwal
   Catatan penting: aplikasi web/PWA TIDAK BISA menulis file ke
   sistem file perangkat secara diam-diam di background tanpa app
   sedang terbuka (keterbatasan browser demi keamanan). Yang
   dilakukan di sini: setiap kali app dibuka, dicek apakah sudah
   waktunya backup berikutnya (berdasarkan interval yang dipilih
   user) — kalau sudah, otomatis unduh file JSON backup.
   ========================================================= */

const BackupScheduler = (() => {

  const KEY = 'tk_backup_schedule';

  function _get(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || { interval: 'off', lastBackupAt: 0 }; }
    catch(e){ return { interval: 'off', lastBackupAt: 0 }; }
  }
  function _set(data){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){ console.error('BackupScheduler write error', e); }
  }

  function getInterval(){
    return _get().interval;
  }

  function setInterval_(interval){
    const data = _get();
    data.interval = interval;
    _set(data);
  }

  function intervalMs(interval){
    if (interval === 'daily') return 1000 * 60 * 60 * 24;
    if (interval === 'weekly') return 1000 * 60 * 60 * 24 * 7;
    return null;
  }

  async function runBackupSilently(){
    try{
      const data = await Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tabungku-auto-backup-${Utils.todayISO()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);

      const scheduleData = _get();
      scheduleData.lastBackupAt = Date.now();
      _set(scheduleData);

      Utils.toast('Backup otomatis tersimpan ke unduhan', 'success');
    }catch(e){
      console.error('Auto backup gagal:', e);
    }
  }

  /* Dipanggil sekali saat app start — cek apakah sudah waktunya backup berikutnya. */
  function checkAndRun(){
    const data = _get();
    const ms = intervalMs(data.interval);
    if (!ms) return; // nonaktif

    const due = !data.lastBackupAt || (Date.now() - data.lastBackupAt) >= ms;
    if (due){
      setTimeout(runBackupSilently, 3000);
    }
  }

  return { getInterval, setInterval: setInterval_, checkAndRun, runBackupSilently };
})();
