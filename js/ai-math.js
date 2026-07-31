/* =========================================================
   ai-math.js — "Otak Kalkulasi" untuk Asisten AI TabungKu
   Mesin parsing angka Bahasa Indonesia + evaluator ekspresi
   matematika aman (tanpa eval/Function) + statistik keuangan
   (rata-rata, median, std-dev, tren/regresi, proyeksi, growth%).
   100% lokal — tidak ada API key, tidak ada koneksi internet.
   ========================================================= */

const AIMath = (() => {

  /* ---------------------------------------------------------
     1. PARSING ANGKA GAYA INDONESIA
     Mendukung: "500rb", "500 ribu", "2jt", "2 juta", "1,5jt",
     "2.5 juta", "1 miliar", "1.500.000" (titik = pemisah ribuan),
     "1.500,50" (koma = desimal), angka polos "500000".
     --------------------------------------------------------- */
  const UNIT_MULTIPLIERS = [
    { re: /^(m|miliar|milyar|milyard)$/i, mul: 1_000_000_000 },
    { re: /^(jt|juta|jeti)$/i, mul: 1_000_000 },
    { re: /^(rb|ribu|k)$/i, mul: 1_000 },
  ];

  // Ubah "1.500.000" / "1.500,50" / "500.000" jadi angka JS yang benar,
  // dengan asumsi format Indonesia (titik=ribuan, koma=desimal).
  function normalizePlainNumber(str){
    let s = str.trim();
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot){
      // titik = ribuan, koma = desimal -> hapus titik, ganti koma jadi titik
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot){
      // koma dianggap desimal jika 1-2 digit di belakang, selain itu ribuan
      const parts = s.split(',');
      if (parts.length === 2 && parts[1].length <= 2){
        s = parts[0] + '.' + parts[1];
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (hasDot && !hasComma){
      // titik dianggap ribuan jika grup 3 digit berulang (1.500.000 / 500.000),
      // selain itu dianggap desimal (3.5)
      const parts = s.split('.');
      const looksLikeThousands = parts.length > 1 && parts.slice(1).every(p => p.length === 3);
      if (looksLikeThousands) s = parts.join('');
      // else biarkan sebagai desimal biasa
    }
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  // Parse satu token angka (dengan opsional suffix rb/jt/m) jadi Number.
  function parseNumberToken(token){
    if (token == null) return null;
    const m = String(token).trim().match(/^([\d.,]+)\s*([a-zA-Z]+)?$/);
    if (!m) return null;
    const base = normalizePlainNumber(m[1]);
    if (base === null) return null;
    if (!m[2]) return base;
    const unit = UNIT_MULTIPLIERS.find(u => u.re.test(m[2]));
    return unit ? base * unit.mul : base;
  }

  // Cari & parse angka Indonesia pertama dalam sebuah string bebas.
  // Contoh: "kalau nabung 500rb per bulan" -> 500000
  function findFirstAmount(text){
    if (!text) return null;
    const re = /(\d[\d.,]*)\s*(ribu|rb|juta|jt|miliar|milyar|m)?\b/i;
    const m = text.match(re);
    if (!m) return null;
    return parseNumberToken(m[1] + (m[2] ? m[2] : ''));
  }

  // Ambil SEMUA angka (dengan satuan) dalam teks, urut kemunculan.
  function findAllAmounts(text){
    if (!text) return [];
    const re = /(\d[\d.,]*)\s*(ribu|rb|juta|jt|miliar|milyar|m)?\b/gi;
    const out = [];
    let m;
    while ((m = re.exec(text)) !== null){
      const val = parseNumberToken(m[1] + (m[2] ? m[2] : ''));
      if (val !== null) out.push(val);
    }
    return out;
  }

  /* ---------------------------------------------------------
     2. EVALUATOR EKSPRESI MATEMATIKA (aman, tanpa eval/Function)
     Recursive-descent parser: mendukung + - * / % ( ) dan angka
     desimal. Presedensi operator standar, % sebagai operator
     "modulo/persen dari 100" bila berdiri sendiri di antara dua
     angka (mis. "50%3"), tapi biasanya sudah ditangani terpisah
     oleh percentOf() untuk kasus "X% dari Y".
     --------------------------------------------------------- */
  function evalExpression(raw){
    // Normalisasi kata operator Bahasa Indonesia -> simbol
    let expr = String(raw)
      .toLowerCase()
      .replace(/ditambah|tambah|plus/g, '+')
      .replace(/dikurangi|dikurang|kurangi|kurang|minus/g, '-')
      .replace(/dikali|kali\s*dengan|kali/g, '*')
      .replace(/dibagi|bagi/g, '/')
      .replace(/persen/g, '%')
      .replace(/x/g, '*');

    // Ubah satuan rb/jt/juta/miliar jadi angka penuh. Angka di depan satuan
    // di-parse lewat normalizePlainNumber() (bukan parseFloat langsung) supaya
    // format ribuan Indonesia ("1.500rb") tetap benar, bukan terpotong di titik.
    const unitPatterns = [
      { re: /(\d[\d.,]*)\s*(ribu|rb)\b/gi, mul: 1000 },
      { re: /(\d[\d.,]*)\s*(juta|jt)\b/gi, mul: 1000000 },
      { re: /(\d[\d.,]*)\s*(miliar|milyar)\b/gi, mul: 1000000000 },
    ];
    unitPatterns.forEach(p => {
      expr = expr.replace(p.re, (full, numStr) => {
        const n = normalizePlainNumber(numStr);
        return n === null ? full : String(n * p.mul);
      });
    });

    // Normalisasi SISA angka polos yang masih pakai format ribuan/desimal
    // Indonesia (mis. "1.500.000" atau "500,5") jadi angka standar JS
    // (titik = desimal, tanpa pemisah ribuan) sebelum di-parse operator.
    expr = expr.replace(/\d[\d.,]*/g, (m) => {
      const n = normalizePlainNumber(m);
      return n === null ? m : String(n);
    });

    // Hanya izinkan karakter aman
    if (!/^[\d\s+\-*/%.()]+$/.test(expr)) return null;
    if (!/\d/.test(expr)) return null;

    let pos = 0;
    function peek(){ return expr[pos]; }
    function isDigit(c){ return c >= '0' && c <= '9'; }
    function skipSpace(){ while (peek() === ' ') pos++; }

    function parseNumber(){
      skipSpace();
      let start = pos;
      while (pos < expr.length && (isDigit(peek()) || peek() === '.')) pos++;
      if (pos === start) return null;
      return parseFloat(expr.slice(start, pos));
    }

    function parseFactor(){
      skipSpace();
      if (peek() === '('){
        pos++; // (
        const val = parseExpr();
        skipSpace();
        if (peek() === ')') pos++;
        return val;
      }
      if (peek() === '-'){
        pos++;
        const val = parseFactor();
        return val === null ? null : -val;
      }
      return parseNumber();
    }

    function parseTerm(){
      let val = parseFactor();
      if (val === null) return null;
      skipSpace();
      while (peek() === '*' || peek() === '/' || peek() === '%'){
        const op = peek(); pos++;
        const rhs = parseFactor();
        if (rhs === null) return null;
        if (op === '*') val *= rhs;
        else if (op === '/') val = rhs === 0 ? NaN : val / rhs;
        else val = rhs === 0 ? NaN : val % rhs;
        skipSpace();
      }
      return val;
    }

    function parseExpr(){
      let val = parseTerm();
      if (val === null) return null;
      skipSpace();
      while (peek() === '+' || peek() === '-'){
        const op = peek(); pos++;
        const rhs = parseTerm();
        if (rhs === null) return null;
        val = op === '+' ? val + rhs : val - rhs;
        skipSpace();
      }
      return val;
    }

    const result = parseExpr();
    skipSpace();
    if (pos !== expr.length) return null; // ada sisa karakter yang tidak terpakai -> bukan ekspresi valid
    return (result === null || isNaN(result)) ? null : result;
  }

  // Deteksi apakah sebuah pertanyaan mengandung ekspresi aritmatika murni
  // (bukan cuma satu angka biasa dalam kalimat).
  function looksLikeExpression(text){
    const t = text.toLowerCase();
    const hasMinusBetweenNumbers = /\d\s*-\s*\d/.test(t);
    const hasOperatorSignal = /[+*/%]/.test(t) || /x\s*\d|kali|dikali|bagi|dibagi|tambah|ditambah|kurang|dikurangi|minus|plus/.test(t) || hasMinusBetweenNumbers;
    if (!hasOperatorSignal) return false;
    // Butuh minimal 2 angka supaya bukan cuma satu angka yang nyasar di kalimat biasa
    return findAllAmounts(t).length >= 2;
  }

  // "20% dari 500000" / "15 persen dari saldo" -> { percent, ofText }
  function matchPercentOf(text){
    const m = text.match(/(\d[\d.,]*)\s*(%|persen)\s*(dari|dr)\s*(.+)/i);
    if (!m) return null;
    return { percent: normalizePlainNumber(m[1]), ofText: m[4].trim() };
  }

  function percentOf(percent, ofValue){
    return (percent / 100) * ofValue;
  }

  /* ---------------------------------------------------------
     3. STATISTIK
     --------------------------------------------------------- */
  function mean(arr){
    if (!arr.length) return 0;
    return arr.reduce((a,b) => a+b, 0) / arr.length;
  }

  function median(arr){
    if (!arr.length) return 0;
    const s = [...arr].sort((a,b) => a-b);
    const mid = Math.floor(s.length/2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid-1] + s[mid]) / 2;
  }

  function stdDev(arr){
    if (arr.length < 2) return 0;
    const m = mean(arr);
    const variance = arr.reduce((s,v) => s + Math.pow(v-m, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  function growthPercent(oldVal, newVal){
    if (oldVal === 0) return newVal === 0 ? 0 : 100;
    return ((newVal - oldVal) / Math.abs(oldVal)) * 100;
  }

  // Regresi linear sederhana y = a + b*x, x = 0..n-1
  function linearRegression(values){
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };
    const xs = values.map((_, i) => i);
    const xMean = mean(xs);
    const yMean = mean(values);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++){
      num += (xs[i]-xMean) * (values[i]-yMean);
      den += Math.pow(xs[i]-xMean, 2);
    }
    const slope = den === 0 ? 0 : num/den;
    const intercept = yMean - slope*xMean;
    return { slope, intercept };
  }

  // Proyeksi nilai periode berikutnya berdasarkan tren linear beberapa
  // periode terakhir. Jika data terlalu sedikit/flat, fallback ke rata-rata.
  function forecastNext(values){
    const clean = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (!clean.length) return 0;
    if (clean.length < 3) return mean(clean);
    const { slope, intercept } = linearRegression(clean);
    const nextX = clean.length;
    const projected = intercept + slope*nextX;
    return Math.max(0, projected);
  }

  /* ---------------------------------------------------------
     4. KALKULATOR "WHAT-IF" TABUNGAN & BUDGET
     --------------------------------------------------------- */
  // Berapa bulan lagi target tercapai jika menabung `monthlyAmount`/bulan.
  function monthsToReachTarget(remaining, monthlyAmount){
    if (remaining <= 0) return 0;
    if (monthlyAmount <= 0) return Infinity;
    return Math.ceil(remaining / monthlyAmount);
  }

  function addMonthsLabel(monthsAhead){
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  // Sisa hari di bulan berjalan & anggaran aman per hari dari sisa dana.
  function safeDailyBudget(remainingBalance, daysLeftInMonth){
    if (daysLeftInMonth <= 0) return Math.max(0, remainingBalance);
    return Math.max(0, remainingBalance / daysLeftInMonth);
  }

  return {
    parseNumberToken, findFirstAmount, findAllAmounts, normalizePlainNumber,
    evalExpression, looksLikeExpression, matchPercentOf, percentOf,
    mean, median, stdDev, growthPercent, linearRegression, forecastNext,
    monthsToReachTarget, addMonthsLabel, safeDailyBudget
  };
})();
