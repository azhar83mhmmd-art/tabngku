/* =========================================================
   ai-assistant.js — "AI Keuangan" LOKAL, tanpa API key/internet
   Menggunakan analisis rule-based + NLP sederhana (keyword
   matching) atas data transaksi yang sudah ada di Local Storage.
   ========================================================= */

const AIAssistant = (() => {

  let panelOpen = false;

  /* ---------- Setup UI ---------- */
  function init(){
    injectUI();
    document.getElementById('aiFab').addEventListener('click', togglePanel);
    document.getElementById('aiCloseBtn').addEventListener('click', togglePanel);
    document.getElementById('aiSendBtn').addEventListener('click', handleSend);
    document.getElementById('aiInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter'){ e.preventDefault(); handleSend(); }
    });
    document.getElementById('aiSuggestions').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-ai-q]');
      if (chip){
        document.getElementById('aiInput').value = chip.dataset.aiQ;
        handleSend();
      }
    });
    greet();
  }

  function injectUI(){
    const fab = document.createElement('button');
    fab.id = 'aiFab';
    fab.className = 'ai-fab ripple';
    fab.setAttribute('aria-label', 'Asisten AI Keuangan');
    fab.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="9.5" cy="6.5" r=".9" fill="currentColor"/><circle cx="14.5" cy="6.5" r=".9" fill="currentColor"/></svg>`;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'aiPanel';
    panel.className = 'ai-panel';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <div class="ai-panel-title">
          <span class="ai-avatar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></span>
          </span>
          <div>
            <p class="ai-name">Asisten TabungKu</p>
            <p class="ai-status">Analisis lokal · Privat &amp; offline</p>
          </div>
        </div>
        <button class="icon-btn small" id="aiCloseBtn" aria-label="Tutup">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="ai-messages" id="aiMessages"></div>
      <div class="ai-suggestions" id="aiSuggestions">
        <button class="ai-chip" data-ai-q="Bagaimana kondisi keuanganku bulan ini?">Kondisi bulan ini</button>
        <button class="ai-chip" data-ai-q="Apa pengeluaran terbesarku?">Pengeluaran terbesar</button>
        <button class="ai-chip" data-ai-q="Berikan tips hemat">Tips hemat</button>
        <button class="ai-chip" data-ai-q="Berapa saldo saya?">Cek saldo</button>
        <button class="ai-chip" data-ai-q="Bandingkan pengeluaran bulan ini dengan bulan lalu">Bandingkan bulan lalu</button>
        <button class="ai-chip" data-ai-q="Prediksi pengeluaran bulan depan">Prediksi bulan depan</button>
        <button class="ai-chip" data-ai-q="Berapa budget aman per hari sisa bulan ini?">Budget harian aman</button>
      </div>
      <div class="ai-input-row">
        <input type="text" id="aiInput" placeholder="Tanya soal keuanganmu...">
        <button class="ai-send-btn ripple" id="aiSendBtn" aria-label="Kirim">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M4 12l16-8-6 8 6 8-16-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(panel);

    const overlay = document.createElement('div');
    overlay.id = 'aiOverlay';
    overlay.className = 'ai-overlay';
    overlay.addEventListener('click', togglePanel);
    document.body.appendChild(overlay);
  }

  function togglePanel(){
    panelOpen = !panelOpen;
    document.getElementById('aiPanel').classList.toggle('open', panelOpen);
    document.getElementById('aiOverlay').classList.toggle('open', panelOpen);
    document.getElementById('aiFab').classList.toggle('open', panelOpen);
    if (panelOpen) document.getElementById('aiInput').focus();
  }

  function greet(){
    const settings = Storage.getSettings();
    const name = settings.username ? `, ${settings.username}` : '';
    addMessage('ai', `Halo${name}! Saya asisten keuangan lokal kamu. Saya bisa analisis pemasukan, pengeluaran, tabungan, kasih tips, dan sekarang juga bisa hitung-hitungan langsung — mis. "500rb + 2 juta - 150rb", "20% dari saldo saya", atau "kalau nabung 300rb/bulan kapan target liburan tercapai?" — semua diproses langsung di HP kamu tanpa internet.`);
  }

  function addMessage(role, text){
    const wrap = document.getElementById('aiMessages');
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    el.innerHTML = `<div class="ai-bubble">${text}</div>`;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function handleSend(){
    const input = document.getElementById('aiInput');
    const q = input.value.trim();
    if (!q) return;
    addMessage('user', Utils.escapeHtml(q));
    input.value = '';

    const typingEl = showTyping();
    setTimeout(() => {
      typingEl.remove();
      const answer = generateAnswer(q);
      addMessage('ai', answer);
    }, 450 + Math.random()*350);
  }

  function showTyping(){
    const wrap = document.getElementById('aiMessages');
    const el = document.createElement('div');
    el.className = 'ai-msg ai';
    el.innerHTML = `<div class="ai-bubble ai-typing"><span></span><span></span><span></span></div>`;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  /* ---------- "Otak" AI: rule-based NLP sederhana ---------- */
  function generateAnswer(question){
    const q = question.toLowerCase();

    const totals = Storage.computeTotals();
    const balance = Storage.computeBalance();
    const list = Storage.getTransactions();
    const expenses = list.filter(t => t.type === 'expense');
    const incomes = list.filter(t => t.type === 'income');

    const now = new Date();
    const thisMonthKey = now.toISOString().slice(0,7);
    const monthExpenses = expenses.filter(t => t.date && t.date.startsWith(thisMonthKey));
    const monthIncomes = incomes.filter(t => t.date && t.date.startsWith(thisMonthKey));
    const monthExpenseTotal = monthExpenses.reduce((s,t) => s+t.amount, 0);
    const monthIncomeTotal = monthIncomes.reduce((s,t) => s+t.amount, 0);
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const daysLeftInMonth = totalDaysInMonth - dayOfMonth;

    const calcContext = { balance, totals, monthExpenseTotal, monthIncomeTotal };

    // ===== 0. KALKULASI & ANALISIS ANGKA (mesin AIMath) =====
    if (typeof AIMath !== 'undefined'){

      // 0a. "X% dari Y" / "X persen dari Y" — Y bisa kata kunci (saldo/pengeluaran/
      // pemasukan/tabungan) atau angka bebas ("500rb", "2 juta", dst).
      const pctMatch = AIMath.matchPercentOf(q);
      if (pctMatch && pctMatch.percent !== null){
        const ofValue = resolveAmountKeyword(pctMatch.ofText, calcContext);
        if (ofValue !== null && !isNaN(ofValue)){
          const result = AIMath.percentOf(pctMatch.percent, ofValue);
          return `<b>${pctMatch.percent}%</b> dari ${Utils.formatRupiah(ofValue)} adalah <b>${Utils.formatRupiah(result)}</b>.`;
        }
      }

      // 0b. Ekspresi aritmatika langsung, mis. "500000+250000-100000",
      // "2 juta dikali 3", "20% dari 1.5 juta" (tanpa kata "dari" di atas
      // sudah tertangkap 0a; ini untuk operasi murni +,-,*,/,%).
      if (AIMath.looksLikeExpression(q)){
        const result = AIMath.evalExpression(q);
        if (result !== null){
          return `Hasil perhitungannya adalah <b>${Utils.formatRupiah(result)}</b> (${formatPlainNumber(result)}).`;
        }
      }

      // 0c. Median / sebaran / variasi pengeluaran
      if (/(median|standar deviasi|sebaran|variasi).*(pengeluaran|belanja|transaksi)|(pengeluaran|belanja).*(median|sebaran|variasi)/.test(q)){
        if (!expenses.length) return 'Belum ada data pengeluaran untuk dianalisis.';
        const amounts = expenses.map(t => t.amount);
        const med = AIMath.median(amounts);
        const sd = AIMath.stdDev(amounts);
        return `Median pengeluaranmu (nilai tengah dari semua transaksi) adalah <b>${Utils.formatRupiah(med)}</b>, dengan standar deviasi <b>${Utils.formatRupiah(sd)}</b> — semakin besar angka ini, semakin bervariasi nominal pengeluaranmu tiap transaksi.`;
      }

      // 0d. Rata-rata harian / mingguan bulan ini
      if (/rata.rata.*(harian|per\s*hari)/.test(q) || /(pengeluaran|belanja).*(per\s*hari|harian)/.test(q)){
        const avgDaily = dayOfMonth > 0 ? monthExpenseTotal / dayOfMonth : 0;
        return `Rata-rata pengeluaranmu bulan ini adalah <b>${Utils.formatRupiah(avgDaily)}</b> per hari (dihitung dari total pengeluaran bulan ini dibagi ${dayOfMonth} hari yang sudah berjalan).`;
      }
      if (/rata.rata.*(mingguan|per\s*minggu)/.test(q) || /(pengeluaran|belanja).*(per\s*minggu|mingguan)/.test(q)){
        const avgWeekly = dayOfMonth > 0 ? monthExpenseTotal / (dayOfMonth/7) : 0;
        return `Rata-rata pengeluaranmu bulan ini adalah <b>${Utils.formatRupiah(avgWeekly)}</b> per minggu.`;
      }

      // 0e. Bandingkan bulan ini vs bulan lalu (total & persentase kenaikan/penurunan)
      if (/(bandingkan|dibanding|dibandingkan|vs).*(bulan lalu|bulan sebelumnya)|(naik|turun).*(berapa persen|berapa%)/.test(q)){
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const lastMonthKey = lastMonthDate.toISOString().slice(0,7);
        const lastExpense = expenses.filter(t => t.date && t.date.startsWith(lastMonthKey)).reduce((s,t)=>s+t.amount,0);
        const lastIncome = incomes.filter(t => t.date && t.date.startsWith(lastMonthKey)).reduce((s,t)=>s+t.amount,0);
        if (!lastExpense && !lastIncome) return 'Data bulan lalu belum ada, jadi belum bisa dibandingkan.';
        const expPct = AIMath.growthPercent(lastExpense, monthExpenseTotal);
        const incPct = AIMath.growthPercent(lastIncome, monthIncomeTotal);
        const expArrow = expPct >= 0 ? 'naik' : 'turun';
        const incArrow = incPct >= 0 ? 'naik' : 'turun';
        return `Dibanding bulan lalu: pengeluaran ${expArrow} <b>${Math.abs(Math.round(expPct))}%</b> (${Utils.formatRupiah(lastExpense)} → ${Utils.formatRupiah(monthExpenseTotal)}), pemasukan ${incArrow} <b>${Math.abs(Math.round(incPct))}%</b> (${Utils.formatRupiah(lastIncome)} → ${Utils.formatRupiah(monthIncomeTotal)}).`;
      }

      // 0f. Prediksi/perkiraan PENGELUARAN bulan depan (regresi linear 6 bulan terakhir)
      if (/(prediksi|proyeksi|perkiraan|forecast).*(pengeluaran|belanja|bulan depan)/.test(q)){
        const months = TxRenderer.lastNMonths(6);
        const perMonth = months.map(m => expenses.filter(t => t.date && t.date.startsWith(m.key)).reduce((s,t)=>s+t.amount,0));
        if (perMonth.filter(v=>v>0).length < 2) return 'Data pengeluaran beberapa bulan terakhir masih terlalu sedikit untuk membuat prediksi yang akurat.';
        const forecast = AIMath.forecastNext(perMonth);
        return `Berdasarkan tren 6 bulan terakhir, perkiraan pengeluaranmu bulan depan adalah sekitar <b>${Utils.formatRupiah(forecast)}</b>. Ini hanya perkiraan berdasarkan pola lalu, bukan jaminan.`;
      }

      // 0g. Budget aman per hari untuk sisa bulan ini
      if (/budget.*(aman|harian|per\s*hari)|berapa.*(bisa|boleh).*(belanja|pakai).*(hari|sehari)|sisa.*(hari|budget).*bulan/.test(q)){
        if (daysLeftInMonth <= 0) return 'Bulan ini sudah hampir berakhir, jadi sisa budget harian tidak relevan lagi — saatnya evaluasi untuk bulan depan.';
        const safeDaily = AIMath.safeDailyBudget(balance, daysLeftInMonth);
        return `Sisa <b>${daysLeftInMonth} hari</b> lagi di bulan ini. Dengan saldo saat ini, kamu bisa membelanjakan sekitar <b>${Utils.formatRupiah(safeDaily)}</b> per hari agar saldo tidak habis sebelum akhir bulan (perhitungan kasar, belum menghitung kebutuhan wajib mendatang).`;
      }

      // 0h. Simulasi "kalau nabung Rp X per bulan, kapan target Y tercapai?"
      if (/(kalau|jika|misal).*(nabung|menabung|tabung)/.test(q) && /(target|kapan|tercapai)/.test(q)){
        const targets = Storage.getTargets().filter(t => !t.achieved);
        if (!targets.length) return 'Kamu belum punya target tabungan aktif untuk disimulasikan. Buat target baru dulu di menu Target Tabungan.';
        const monthlyAmount = AIMath.findFirstAmount(q);
        if (!monthlyAmount){
          return 'Sebutkan juga nominalnya, misalnya: "kalau saya nabung 500rb per bulan, kapan target liburan tercapai?"';
        }
        // Cocokkan nama target yang disebut di pertanyaan, kalau tidak ketemu pakai semua target aktif
        const matched = targets.filter(t => q.includes(t.name.toLowerCase()));
        const targetList = matched.length ? matched : targets;
        const lines = targetList.map(t => {
          const sisa = Math.max(0, t.nominal - t.saved);
          const months = AIMath.monthsToReachTarget(sisa, monthlyAmount);
          if (months === Infinity) return `• <b>${Utils.escapeHtml(t.name)}</b>: nominal per bulan terlalu kecil untuk mencapai target.`;
          if (months === 0) return `• <b>${Utils.escapeHtml(t.name)}</b>: sudah tercapai!`;
          return `• <b>${Utils.escapeHtml(t.name)}</b>: butuh sekitar <b>${months} bulan</b> lagi (perkiraan tercapai ${AIMath.addMonthsLabel(months)}) jika konsisten menabung ${Utils.formatRupiah(monthlyAmount)}/bulan.`;
        }).join('<br>');
        return `Simulasi menabung ${Utils.formatRupiah(monthlyAmount)}/bulan:<br>${lines}`;
      }
    }

    // 1. Saldo
    if (/(saldo|uang saya|uang saat ini|sisa uang)/.test(q)){
      return `Saldo kamu saat ini adalah <b>${Utils.formatRupiah(balance)}</b>.`;
    }

    // 2. Kondisi bulan ini
    if (/(kondisi|bagaimana|gimana).*(bulan ini|sekarang)|ringkasan bulan/.test(q)){
      const selisih = monthIncomeTotal - monthExpenseTotal;
      const statusText = selisih >= 0
        ? `Bagus, pemasukan bulan ini masih lebih besar dari pengeluaran sebesar <b>${Utils.formatRupiah(selisih)}</b>.`
        : `Perlu diwaspadai, pengeluaran bulan ini lebih besar dari pemasukan sebesar <b>${Utils.formatRupiah(Math.abs(selisih))}</b>.`;
      return `Bulan ini kamu sudah mencatat pemasukan <b>${Utils.formatRupiah(monthIncomeTotal)}</b> dan pengeluaran <b>${Utils.formatRupiah(monthExpenseTotal)}</b>. ${statusText}`;
    }

    // 3. Pengeluaran terbesar
    if (/(pengeluaran|belanja).*(terbesar|paling besar|paling banyak)/.test(q)){
      if (!expenses.length) return 'Belum ada data pengeluaran yang bisa dianalisis.';
      const biggest = expenses.reduce((a,b) => a.amount > b.amount ? a : b);
      return `Pengeluaran terbesarmu adalah <b>${Utils.escapeHtml(biggest.name)}</b> (${biggest.category}) sebesar <b>${Utils.formatRupiah(biggest.amount)}</b> pada ${Utils.formatDate(biggest.date)}.`;
    }

    // 4. Kategori boros
    if (/(kategori|jenis pengeluaran).*(banyak|boros|sering)/.test(q)){
      if (!expenses.length) return 'Belum ada data pengeluaran.';
      const catTotal = {};
      expenses.forEach(t => { catTotal[t.category] = (catTotal[t.category]||0) + t.amount; });
      const top = Object.entries(catTotal).sort((a,b)=>b[1]-a[1])[0];
      return `Kategori pengeluaran terbesarmu adalah <b>${top[0]}</b> dengan total <b>${Utils.formatRupiah(top[1])}</b>. Coba tinjau ulang pengeluaran di kategori ini jika ingin lebih hemat.`;
    }

    // 5. Tips hemat
    if (/(tips|saran|cara).*(hemat|nabung|menabung|irit)/.test(q) || /hemat/.test(q)){
      return generateSavingTips(expenses, balance, totals);
    }

    // 6. Progress target
    if (/(target|goal)/.test(q)){
      const targets = Storage.getTargets().filter(t => !t.achieved);
      if (!targets.length) return 'Kamu belum punya target tabungan aktif. Yuk buat target baru di menu Target Tabungan!';
      const lines = targets.map(t => {
        const pct = Math.min(100, Math.round((t.saved/t.nominal)*100));
        return `• <b>${Utils.escapeHtml(t.name)}</b>: ${pct}% (${Utils.formatRupiah(t.saved)} dari ${Utils.formatRupiah(t.nominal)})`;
      }).join('<br>');
      return `Progress target tabunganmu:<br>${lines}`;
    }

    // 7. Prediksi / proyeksi
    if (/(prediksi|proyeksi|perkiraan|kapan).*(target|tabungan|cukup)/.test(q)){
      return generateProjection();
    }

    // 8. Rata-rata
    if (/rata.rata/.test(q)){
      const avgExp = expenses.length ? totals.expense/expenses.length : 0;
      const avgInc = incomes.length ? totals.income/incomes.length : 0;
      return `Rata-rata pengeluaran per transaksi: <b>${Utils.formatRupiah(avgExp)}</b>. Rata-rata pemasukan per transaksi: <b>${Utils.formatRupiah(avgInc)}</b>.`;
    }

    // 9. Total tabungan
    if (/(total|jumlah).*(tabungan)/.test(q)){
      return `Total tabunganmu saat ini adalah <b>${Utils.formatRupiah(totals.savingTotal)}</b>.`;
    }

    // 10. Sapaan
    if (/(halo|hai|hi|hello|pagi|siang|malam)/.test(q)){
      return 'Halo! Ada yang bisa saya bantu soal keuanganmu? Kamu bisa tanya soal saldo, pengeluaran, tips hemat, atau progress target tabungan.';
    }

    // 11. Terima kasih
    if (/(terima kasih|makasih|thanks)/.test(q)){
      return 'Sama-sama! Semangat terus mengelola keuanganmu 💪';
    }

    // Default fallback — beri ringkasan umum + arahkan
    return `Maaf, saya belum paham pertanyaan itu. Tapi ini ringkasan singkat keuanganmu: saldo <b>${Utils.formatRupiah(balance)}</b>, total tabungan <b>${Utils.formatRupiah(totals.savingTotal)}</b>. Coba tanya soal "saldo", "pengeluaran terbesar", "tips hemat", "target tabungan", atau langsung hitung seperti "1.5 juta - 300rb" dan "20% dari pengeluaran bulan ini".`;
  }

  // Terjemahkan kata kunci ("saldo", "pengeluaran bulan ini", "tabungan", dst.)
  // atau angka bebas ("500rb") jadi Number, dipakai oleh perhitungan persen.
  function resolveAmountKeyword(text, ctx){
    const t = (text || '').toLowerCase();
    if (/saldo/.test(t)) return ctx.balance;
    if (/pengeluaran|belanja/.test(t)) return /bulan ini|sekarang|bulan berjalan/.test(t) ? ctx.monthExpenseTotal : ctx.totals.expense;
    if (/pemasukan|penghasilan|gaji/.test(t)) return /bulan ini|sekarang|bulan berjalan/.test(t) ? ctx.monthIncomeTotal : ctx.totals.income;
    if (/tabungan/.test(t)) return ctx.totals.savingTotal;
    return AIMath.findFirstAmount(t);
  }

  // Format angka polos dengan pemisah ribuan ala Indonesia, tanpa prefix "Rp".
  function formatPlainNumber(num){
    return Math.round(num).toLocaleString('id-ID');
  }

  function generateSavingTips(expenses, balance, totals){
    const tips = [];
    const catTotal = {};
    expenses.forEach(t => { catTotal[t.category] = (catTotal[t.category]||0) + t.amount; });
    const sorted = Object.entries(catTotal).sort((a,b)=>b[1]-a[1]);

    if (sorted.length){
      const [topCat, topAmount] = sorted[0];
      tips.push(`Kategori <b>${topCat}</b> adalah pengeluaran terbesarmu (${Utils.formatRupiah(topAmount)}). Coba kurangi 10-20% di kategori ini bulan depan.`);
    }
    if (totals.expense > totals.income && totals.income > 0){
      tips.push('Pengeluaran totalmu melebihi pemasukan. Pertimbangkan menunda pembelian non-esensial.');
    }
    if (balance > 0){
      const suggestedSaving = Math.round(balance * 0.1 / 1000) * 1000;
      tips.push(`Coba sisihkan sekitar <b>${Utils.formatRupiah(suggestedSaving)}</b> (10% dari saldo) untuk ditabung minggu ini.`);
    }
    tips.push('Gunakan aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan/investasi.');
    tips.push('Catat setiap pengeluaran sekecil apapun — kebiasaan kecil ini membantu kamu lebih sadar soal uang.');

    return tips.map(t => `• ${t}`).join('<br>');
  }

  function generateProjection(){
    const targets = Storage.getTargets().filter(t => !t.achieved);
    if (!targets.length) return 'Kamu belum punya target aktif untuk diproyeksikan.';

    const list = Storage.getTransactions();
    const savingIns = list.filter(t => t.type === 'saving_in');
    if (savingIns.length < 2){
      return 'Data tabunganmu masih sedikit, tambahkan beberapa transaksi menabung lagi supaya saya bisa memproyeksikan waktu pencapaian target dengan akurat.';
    }

    // Rata-rata menabung per bulan (6 bulan terakhir)
    const months = TxRenderer.lastNMonths(6);
    const perMonth = months.map(m => savingIns.filter(t => t.date.startsWith(m.key)).reduce((s,t)=>s+t.amount,0));
    const avgMonthly = perMonth.reduce((a,b)=>a+b,0) / perMonth.length;

    if (avgMonthly <= 0){
      return 'Belum ada aktivitas menabung rutin dalam 6 bulan terakhir, sehingga proyeksi belum bisa dihitung. Coba mulai menabung rutin tiap bulan.';
    }

    const lines = targets.map(t => {
      const sisa = Math.max(0, t.nominal - t.saved);
      const bulanLagi = Math.ceil(sisa / avgMonthly);
      return `• <b>${Utils.escapeHtml(t.name)}</b>: dengan rata-rata menabung ${Utils.formatRupiah(avgMonthly)}/bulan, diperkirakan tercapai dalam ~${bulanLagi} bulan lagi.`;
    }).join('<br>');

    return `Proyeksi target tabungan (berdasarkan rata-rata 6 bulan terakhir):<br>${lines}`;
  }

  return { init };
})();
