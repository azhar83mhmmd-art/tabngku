/* =========================================================
   streak-guard.js — proteksi integritas data streak di file backup
   =========================================================
   Kenapa ini ada: data streak (tk_streak) disimpan di file backup
   JSON yang bisa dibuka & diedit siapa saja pakai text editor biasa.
   Modul ini mengenkripsi field "streak" di backup pakai AES-GCM
   (Web Crypto API) sehingga:
     1) Nilainya tidak lagi berupa angka polos yang gampang diubah
        (tersimpan sebagai ciphertext acak, bukan JSON terbaca).
     2) AES-GCM punya "auth tag" bawaan — kalau satu byte saja di
        ciphertext diubah, proses dekripsi otomatis GAGAL. Jadi
        begitu file backup diutak-atik manual, saat direstore
        aplikasi akan MENOLAK memulihkan streak-nya (bukan malah
        memuat nilai yang sudah diubah).

   PENTING — batasan jujur soal "keamanan" ini:
   Ini aplikasi 100% client-side, tidak ada server yang menyimpan
   rahasia. Kunci enkripsi ikut ter-bundle di dalam kode JS ini
   sendiri (lihat SECRET_PARTS di bawah). Artinya proteksi ini
   BUKAN sesuatu yang "tidak bisa ditembus" — orang yang punya
   kemampuan reverse-engineering JavaScript tetap bisa menemukan
   kuncinya dan membuat ciphertext palsu kalau benar-benar niat.
   Yang bisa dijamin: mencegah 99% kasus umum, yaitu user (atau
   orang lain) iseng buka file backup di Notepad/text editor lalu
   ganti-ganti angka streak-nya secara langsung — itu pasti gagal
   dan otomatis ditolak saat restore. Untuk keamanan level lebih
   tinggi (mis. benar-benar rahasia per-user), butuh server dengan
   kunci yang tidak pernah dikirim ke client — di luar cakupan app
   statis/PWA seperti ini.
   ========================================================= */

const StreakGuard = (() => {

  // 'TabNgku-Streak-Guard-v1' disimpan sebagai kode karakter, bukan
  // string polos — sekadar menghambat pencarian teks biasa, BUKAN
  // enkripsi tambahan (lihat catatan batasan keamanan di atas).
  const SECRET_PARTS = [84,97,98,78,103,107,117,45,83,116,114,101,97,107,45,71,117,97,114,100,45,118,49];

  function isSupported(){
    return !!(window.crypto && window.crypto.subtle);
  }

  async function _deriveKey(){
    const secretStr = SECRET_PARTS.map(c => String.fromCharCode(c)).join('');
    const encoded = new TextEncoder().encode(secretStr);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  function _toB64(buf){
    const arr = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin);
  }
  function _fromB64(str){
    const bin = atob(str);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr.buffer;
  }

  /* Mengenkripsi objek streak. Return null kalau Web Crypto tidak
     didukung browser (caller wajib sediakan fallback). */
  async function encrypt(obj){
    if (!isSupported()) return null;
    try{
      const key = await _deriveKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = new TextEncoder().encode(JSON.stringify(obj));
      const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
      return { iv: _toB64(iv), ct: _toB64(ctBuf) };
    }catch(e){
      console.error('StreakGuard: gagal enkripsi', e);
      return null;
    }
  }

  /* Mendekripsi payload { iv, ct }. Selalu return { ok, data } —
     tidak pernah throw, supaya caller bisa menangani "file diubah
     manual / rusak" sebagai kondisi normal, bukan exception. */
  async function decrypt(payload){
    if (!payload || typeof payload !== 'object' || !payload.iv || !payload.ct){
      return { ok: false, data: null };
    }
    if (!isSupported()) return { ok: false, data: null };
    try{
      const key = await _deriveKey();
      const iv = new Uint8Array(_fromB64(payload.iv));
      const ctBuf = _fromB64(payload.ct);
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctBuf);
      const text = new TextDecoder().decode(plainBuf);
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') return { ok: false, data: null };
      return { ok: true, data };
    }catch(e){
      // Auth tag tidak cocok (ciphertext diubah) atau format rusak — dianggap tampered.
      return { ok: false, data: null };
    }
  }

  return { encrypt, decrypt, isSupported };
})();
