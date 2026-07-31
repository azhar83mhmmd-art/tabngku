/* =========================================================
   insights.js — Analisis & Wawasan + Gamifikasi UI
   - Skor Disiplin Keuangan bulanan
   - Insight otomatis (perbandingan bulan ini vs bulan lalu)
   - Kalender Keuangan (lihat transaksi per hari dalam 1 bulan)
   - Achievement / Badge display
   ========================================================= */

const InsightsModule = (() => {

  let calMonth = new Date(); // bulan yang sedang ditampilkan di kalender

  function renderAll(){
    renderDisciplineScore();
    renderInsights();
    renderCalendar();
    renderAchievements();
  }

  /* ---------- Skor Disiplin Keuangan ---------- */
  function renderDisciplineScore(){
    const wrap = document.getElementById('disciplineScoreCard');
    if (!wrap || typeof Achievements === 'undefined') return;

    const monthKey = Utils.todayISO().slice(0,7);
    const result = Achievements.computeMonthlyScore(monthKey);
    const meta = Achievements.scoreLabel(result.score);

    wrap.innerHTML = `
      <p class="section-label">Skor Disiplin Keuangan Bulan Ini</p>
      <div class="discipline-score-row">
        <div class="discipline-ring" style="background: conic-gradient(${meta.color} ${result.score * 3.6}deg, var(--surface-2) 0deg);">
          <div class="discipline-ring-inner">
            <b>${result.score}</b>
            <span>/100</span>
          </div>
        </div>
        <div class="discipline-info">
          <p class="discipline-label" style="color:${meta.color}">${meta.label}</p>
          <p class="discipline-desc">Berdasarkan rasio menabung, konsistensi, dan kontrol pengeluaran bulan ini.</p>
        </div>
      </div>
      <div class="discipline-breakdown">
        <div><span>Rasio Menabung</span><b>${result.savingRatioScore}/40</b></div>
        <div><span>Konsistensi Nabung</span><b>${result.consistencyScore}/30</b></div>
        <div><span>Kontrol Pengeluaran</span><b>${result.spendControlScore}/30</b></div>
      </div>
    `;
  }

  /* ---------- Insight Otomatis ---------- */
  function renderInsights(){
    const wrap = document.getElementById('insightsCard');
    if (!wrap) return;

    const list = Storage.getTransactions();
    const now = new Date();
    const thisMonthKey = now.toISOString().slice(0,7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = lastMonthDate.toISOString().slice(0,7);

    const insights = [];

    const thisExpense = sumMonth(list, thisMonthKey, 'expense');
    const lastExpense = sumMonth(list, lastMonthKey, 'expense');
    if (lastExpense > 0){
      const diffPct = Math.round(((thisExpense - lastExpense) / lastExpense) * 100);
      if (Math.abs(diffPct) >= 5){
        insights.push({
          icon: diffPct > 0 ? '📈' : '📉',
          type: diffPct > 0 ? 'warn' : 'good',
          text: `Pengeluaran bulan ini ${diffPct > 0 ? 'naik' : 'turun'} ${Math.abs(diffPct)}% dibanding bulan lalu (${Utils.formatRupiah(thisExpense)} vs ${Utils.formatRupiah(lastExpense)}).`
        });
      }
    }

    const catThis = sumByCategory(list, thisMonthKey);
    const catLast = sumByCategory(list, lastMonthKey);
    let biggestRise = null;
    Object.keys(catThis).forEach(cat => {
      const prev = catLast[cat] || 0;
      const diff = catThis[cat] - prev;
      if (prev > 0 && diff > 0){
        const pct = Math.round((diff / prev) * 100);
        if (pct >= 20 && (!biggestRise || diff > biggestRise.diff)){
          biggestRise = { cat, pct, diff };
        }
      }
    });
    if (biggestRise){
      insights.push({
        icon: '⚠️',
        type: 'warn',
        text: `Pengeluaran kategori ${Utils.escapeHtml(biggestRise.cat)} naik ${biggestRise.pct}% dibanding bulan lalu.`
      });
    }

    const savingThis = sumMonth(list, thisMonthKey, 'saving_in');
    const dayOfMonth = now.getDate();
    if (savingThis > 0){
      const perWeek = Math.round(savingThis / (dayOfMonth / 7));
      insights.push({
        icon: '💡',
        type: 'info',
        text: `Rata-rata kamu menabung ${Utils.formatRupiah(perWeek)} per minggu bulan ini.`
      });
    }

    const incomeThis = sumMonth(list, thisMonthKey, 'income');
    if (incomeThis > 0 && thisExpense > 0){
      const ratio = Math.round((thisExpense / incomeThis) * 100);
      if (ratio >= 80){
        insights.push({
          icon: '🚨',
          type: 'warn',
          text: `${ratio}% dari pemasukan bulan ini sudah terpakai untuk pengeluaran. Coba kurangi pengeluaran tidak penting.`
        });
      }
    }

    if (!insights.length){
      insights.push({ icon: '📊', type: 'info', text: 'Belum cukup data untuk membuat insight. Terus catat transaksimu!' });
    }

    wrap.innerHTML = `
      <p class="section-label">Insight Otomatis</p>
      ${insights.map(i => `
        <div class="insight-row insight-${i.type}">
          <span class="insight-icon">${i.icon}</span>
          <span>${i.text}</span>
        </div>
      `).join('')}
    `;
  }

  function sumMonth(list, monthKey, type){
    return list.filter(t => t.type === type && t.date && t.date.startsWith(monthKey)).reduce((s,t)=>s+t.amount,0);
  }

  function sumByCategory(list, monthKey){
    const out = {};
    list.filter(t => t.type === 'expense' && t.date && t.date.startsWith(monthKey)).forEach(t => {
      const cat = t.category || 'Lainnya';
      out[cat] = (out[cat] || 0) + t.amount;
    });
    return out;
  }

  /* ---------- Kalender Keuangan ---------- */
  function renderCalendar(){
    const wrap = document.getElementById('financeCalendarCard');
    if (!wrap) return;

    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const monthKey = `${year}-${String(month+1).padStart(2,'0')}`;
    const monthLabel = calMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const list = Storage.getTransactions().filter(t => t.date && t.date.startsWith(monthKey));
    const byDay = {};
    list.forEach(t => {
      const day = Number(t.date.slice(8,10));
      if (!byDay[day]) byDay[day] = { income: 0, expense: 0 };
      if (t.type === 'income') byDay[day].income += t.amount;
      else if (t.type === 'expense') byDay[day].expense += t.amount;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayIso = Utils.todayISO();

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div class="fincal-cell empty"></div>`;
    for (let d = 1; d <= totalDays; d++){
      const iso = `${monthKey}-${String(d).padStart(2,'0')}`;
      const data = byDay[d];
      const isToday = iso === todayIso;
      let dotClass = '';
      if (data){
        if (data.expense > 0 && data.income > 0) dotClass = 'both';
        else if (data.expense > 0) dotClass = 'expense';
        else if (data.income > 0) dotClass = 'income';
      }
      cells += `
        <button type="button" class="fincal-cell ${isToday ? 'today' : ''}" data-fincal-day="${iso}">
          <span>${d}</span>
          ${dotClass ? `<i class="fincal-dot ${dotClass}"></i>` : ''}
        </button>
      `;
    }

    wrap.innerHTML = `
      <div class="fincal-head">
        <p class="section-label" style="margin:0;">Kalender Keuangan</p>
        <div class="fincal-nav">
          <button type="button" class="icon-btn small" id="fincalPrevBtn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span class="fincal-month-label">${Utils.escapeHtml(monthLabel)}</span>
          <button type="button" class="icon-btn small" id="fincalNextBtn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      <div class="fincal-legend">
        <span><i class="fincal-dot income"></i> Pemasukan</span>
        <span><i class="fincal-dot expense"></i> Pengeluaran</span>
        <span><i class="fincal-dot both"></i> Keduanya</span>
      </div>
      <div class="fincal-grid fincal-weekday">
        <span>M</span><span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span>
      </div>
      <div class="fincal-grid">${cells}</div>
      <div id="fincalDayDetail"></div>
    `;

    document.getElementById('fincalPrevBtn').addEventListener('click', () => {
      calMonth = new Date(year, month - 1, 1);
      renderCalendar();
    });
    document.getElementById('fincalNextBtn').addEventListener('click', () => {
      calMonth = new Date(year, month + 1, 1);
      renderCalendar();
    });
    wrap.querySelectorAll('[data-fincal-day]').forEach(btn => {
      btn.addEventListener('click', () => showDayDetail(btn.dataset.fincalDay));
    });
  }

  function showDayDetail(iso){
    const detail = document.getElementById('fincalDayDetail');
    const list = Storage.getTransactions().filter(t => t.date === iso);
    if (!list.length){
      detail.innerHTML = `<p class="scanner-hint" style="margin-top:14px;">Tidak ada transaksi pada ${Utils.formatDate(iso)}.</p>`;
      return;
    }
    detail.innerHTML = `
      <p class="scan-top-list-title" style="margin-top:16px;">Transaksi ${Utils.formatDate(iso)}</p>
      ${TxRenderer.renderList(list, { compact: true, swipe: false })}
    `;
  }

  /* ---------- Achievement / Badge ---------- */
  function renderAchievements(){
    const wrap = document.getElementById('achievementsCard');
    if (!wrap || typeof Achievements === 'undefined') return;

    const unlockedIds = new Set(Achievements.getUnlockedIds());
    const total = Achievements.DEFS.length;
    const unlockedCount = unlockedIds.size;

    wrap.innerHTML = `
      <div class="fincal-head">
        <p class="section-label" style="margin:0;">Pencapaian</p>
        <span class="cycle-badge good">${unlockedCount}/${total}</span>
      </div>
      <div class="achievement-grid">
        ${Achievements.DEFS.map(def => `
          <div class="achievement-badge ${unlockedIds.has(def.id) ? 'unlocked' : 'locked'}" title="${Utils.escapeHtml(def.desc)}">
            <span class="achievement-icon">${def.icon}</span>
            <span class="achievement-name">${Utils.escapeHtml(def.name)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function checkAchievements(){
    if (typeof Achievements === 'undefined') return;
    const newly = Achievements.checkAndUnlock();
    if (newly.length){
      newly.forEach((def, i) => {
        setTimeout(() => {
          Utils.toast(`🎉 Pencapaian baru: ${def.icon} ${def.name}`, 'success');
        }, i * 1200);
      });
    }
  }

  return { renderAll, checkAchievements };
})();
