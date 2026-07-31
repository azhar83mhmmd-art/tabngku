/* =========================================================
   achievements.js — Badge/Achievement & Skor Disiplin Keuangan
   Data tersimpan di key terpisah (tk_achievements) supaya TIDAK
   ikut terhapus saat "Reset Seluruh Data" — sama seperti streak
   dan database produk barcode, ini dianggap "pencapaian" pengguna
   yang layak tetap dikenang.
   ========================================================= */

const Achievements = (() => {

  const KEY = 'tk_achievements';

  /* Daftar semua badge yang bisa didapat. `check(ctx)` mengembalikan
     true/false apakah syarat badge ini sudah terpenuhi berdasarkan
     data transaksi & tabungan saat ini. */
  const DEFS = [
    { id: 'first_saving', name: 'Langkah Pertama', desc: 'Menabung untuk pertama kalinya', icon: '🌱',
      check: (ctx) => ctx.savingCount >= 1 },
    { id: 'saving_100k', name: 'Tabungan Pertama', desc: 'Total tabungan mencapai Rp100.000', icon: '💰',
      check: (ctx) => ctx.savingTotal >= 100000 },
    { id: 'saving_1jt', name: 'Sejuta Pertama', desc: 'Total tabungan mencapai Rp1.000.000', icon: '🏆',
      check: (ctx) => ctx.savingTotal >= 1000000 },
    { id: 'saving_5jt', name: 'Penabung Ulung', desc: 'Total tabungan mencapai Rp5.000.000', icon: '👑',
      check: (ctx) => ctx.savingTotal >= 5000000 },
    { id: 'saving_10jt', name: 'Sultan Tabungan', desc: 'Total tabungan mencapai Rp10.000.000', icon: '💎',
      check: (ctx) => ctx.savingTotal >= 10000000 },
    { id: 'streak_7', name: 'Konsisten Seminggu', desc: 'Streak menabung 7 hari berturut-turut', icon: '🔥',
      check: (ctx) => ctx.bestStreak >= 7 },
    { id: 'streak_30', name: 'Hemat 30 Hari', desc: 'Streak menabung 30 hari berturut-turut', icon: '⚡',
      check: (ctx) => ctx.bestStreak >= 30 },
    { id: 'streak_100', name: 'Legenda Konsistensi', desc: 'Streak menabung 100 hari berturut-turut', icon: '🌟',
      check: (ctx) => ctx.bestStreak >= 100 },
    { id: 'target_1', name: 'Target Tercapai', desc: 'Berhasil mencapai 1 target tabungan', icon: '🎯',
      check: (ctx) => ctx.achievedTargets >= 1 },
    { id: 'target_5', name: 'Kolektor Target', desc: 'Berhasil mencapai 5 target tabungan', icon: '🏅',
      check: (ctx) => ctx.achievedTargets >= 5 },
    { id: 'trx_50', name: 'Pencatat Aktif', desc: 'Mencatat 50 transaksi', icon: '📝',
      check: (ctx) => ctx.trxCount >= 50 },
    { id: 'trx_200', name: 'Pencatat Rajin', desc: 'Mencatat 200 transaksi', icon: '📚',
      check: (ctx) => ctx.trxCount >= 200 },
    { id: 'no_expense_week', name: 'Minggu Hemat', desc: 'Tidak ada pengeluaran selama 7 hari berturut-turut', icon: '🛡️',
      check: (ctx) => ctx.noExpenseStreak >= 7 },
    { id: 'scan_10', name: 'Scanner Pemula', desc: 'Melakukan 10 kali scan barcode', icon: '📷',
      check: (ctx) => ctx.scanCount >= 10 },
    { id: 'scan_50', name: 'Scanner Ahli', desc: 'Melakukan 50 kali scan barcode', icon: '🔍',
      check: (ctx) => ctx.scanCount >= 50 }
  ];

  function _get(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || { unlocked: {} }; }
    catch(e){ return { unlocked: {} }; }
  }
  function _set(data){
    try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){ console.error('Achievements write error', e); }
  }

  /* Kumpulkan semua data yang dibutuhkan untuk mengecek syarat badge. */
  function buildContext(){
    const list = Storage.getTransactions();
    const totals = Storage.computeTotals();
    const targets = Storage.getTargets();
    const savingCount = list.filter(t => t.type === 'saving_in').length;
    const achievedTargets = targets.filter(t => t.achieved).length;
    const bestStreak = (typeof StreakModule !== 'undefined') ? StreakModule.getData().best : 0;
    const scanCount = (typeof ProductDB !== 'undefined') ? ProductDB.getStats().totalScans : 0;

    // Hitung streak "tidak ada pengeluaran" berturut-turut sampai hari ini
    let noExpenseStreak = 0;
    {
      const expenseDates = new Set(list.filter(t => t.type === 'expense').map(t => t.date));
      let d = new Date();
      for (let i = 0; i < 365; i++){
        const iso = d.toISOString().slice(0,10);
        if (expenseDates.has(iso)) break;
        noExpenseStreak++;
        d.setDate(d.getDate() - 1);
      }
    }

    return {
      savingCount,
      savingTotal: Math.max(0, totals.savingTotal),
      bestStreak,
      achievedTargets,
      trxCount: list.length,
      noExpenseStreak,
      scanCount
    };
  }

  /* Cek semua badge, unlock yang baru, kembalikan daftar badge yang baru terbuka. */
  function checkAndUnlock(){
    const data = _get();
    const ctx = buildContext();
    const newlyUnlocked = [];

    DEFS.forEach(def => {
      if (!data.unlocked[def.id] && def.check(ctx)){
        data.unlocked[def.id] = { unlockedAt: Date.now() };
        newlyUnlocked.push(def);
      }
    });

    if (newlyUnlocked.length) _set(data);
    return newlyUnlocked;
  }

  function getUnlockedIds(){
    return Object.keys(_get().unlocked);
  }

  function isUnlocked(id){
    return !!_get().unlocked[id];
  }

  /* ---------- Skor Disiplin Keuangan Bulanan ----------
     Skor 0-100 dihitung dari kombinasi:
     - rasio tabungan terhadap pemasukan bulan ini (bobot 40)
     - konsistensi menabung / jumlah hari ada aktivitas nabung (bobot 30)
     - rasio pengeluaran terhadap pemasukan, semakin rendah semakin baik (bobot 30) */
  function computeMonthlyScore(monthKey){
    const key = monthKey || Utils.todayISO().slice(0,7);
    const list = Storage.getTransactions().filter(t => t.date && t.date.startsWith(key));

    const income = list.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    const savingIn = list.filter(t => t.type === 'saving_in').reduce((s,t) => s + t.amount, 0);
    const savingDays = new Set(list.filter(t => t.type === 'saving_in').map(t => t.date)).size;

    const daysInMonth = new Date(Number(key.slice(0,4)), Number(key.slice(5,7)), 0).getDate();

    let savingRatioScore = 0;
    if (income > 0) savingRatioScore = Math.min(40, Math.round((savingIn / income) * 40));
    else if (savingIn > 0) savingRatioScore = 40; // menabung meski tak ada pemasukan tercatat bulan ini -> tetap diapresiasi

    const consistencyScore = Math.min(30, Math.round((savingDays / daysInMonth) * 30));

    let spendControlScore = 30;
    if (income > 0){
      const ratio = expense / income;
      spendControlScore = Math.max(0, Math.round(30 - (ratio * 30)));
    } else if (expense > 0){
      spendControlScore = 0;
    }

    const total = Math.max(0, Math.min(100, savingRatioScore + consistencyScore + spendControlScore));
    return { score: total, income, expense, savingIn, savingDays, daysInMonth, savingRatioScore, consistencyScore, spendControlScore };
  }

  function scoreLabel(score){
    if (score >= 85) return { label: 'Sangat Disiplin', color: '#0E8F55' };
    if (score >= 65) return { label: 'Disiplin', color: '#5B8A0E' };
    if (score >= 40) return { label: 'Cukup', color: '#B25E09' };
    return { label: 'Perlu Ditingkatkan', color: '#D92D20' };
  }

  return { DEFS, checkAndUnlock, getUnlockedIds, isUnlocked, computeMonthlyScore, scoreLabel, buildContext };
})();
