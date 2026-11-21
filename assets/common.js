/* إعدادات مشتركة بين الموقع ولوحة الإدارة */
const SUPABASE_URL = 'https://jtzhbriuagqhgyktjpox.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ADXXZGOTXRKDC2xbfU3llQ_-CA0WfE4'; // مفتاح عام، آمن للنشر
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TZ = 'Asia/Riyadh';
const fmt = (opts, cal = 'gregory') =>
  new Intl.DateTimeFormat(`ar-SA-u-ca-${cal}-nu-latn`, { timeZone: TZ, ...opts });
const F = {
  day: fmt({ day: 'numeric' }),
  month: fmt({ month: 'long' }),
  full: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  short: fmt({ day: 'numeric', month: 'long', year: 'numeric' }),
  time: fmt({ hour: 'numeric', minute: '2-digit' }),
  hijri: fmt({ day: 'numeric', month: 'long', year: 'numeric' }, 'islamic-umalqura'),
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeUrl(u) {
  try { const x = new URL(u); return ['http:', 'https:', 'mailto:'].includes(x.protocol) ? x.href : ''; } catch { return ''; }
}
function initial(name) {
  const t = String(name || '').replace(/^(د\.|د |\(مثال\))\s*/g, '').trim();
  return esc(t.charAt(0) || 'ر');
}
function toast(msg, bad = false) {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(t._h); t._h = setTimeout(() => (t.className = ''), 4200);
}
const ERRORS = {
  CIRCLE_FULL: 'اكتملت هذه الحلقة قبل لحظات. اختر حلقة أخرى من القائمة.',
  ALREADY_JOINED: 'وسيلة التواصل هذه مسجّلة في الحلقة نفسها من قبل.',
  BAD_CODE: 'الرمز غير صحيح. تأكد منه وحاول مرة أخرى.',
  BAD_NAME: 'اكتب الاسم كاملاً (3 أحرف على الأقل).',
  BAD_CONTACT: 'اكتب رقم جوال أو بريداً صحيحاً.',
  BAD_TITLE: 'اكتب عنواناً للبحث (3 أحرف على الأقل).',
  BAD_FIELD: 'اكتب مجال البحث.',
  BAD_CAPACITY: 'عدد الطلاب يجب أن يكون بين 1 و30.',
  NOT_FOUND: 'لم نجد هذه الحلقة. ربما حُذفت.',
  TOO_LONG: 'النص أطول من المسموح. اختصره قليلاً.',
};
function errText(e) {
  const m = e?.message || '';
  for (const k in ERRORS) if (m.includes(k)) return ERRORS[k];
  if (/fetch|network/i.test(m)) return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل.';
}
const ICONS = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  tick: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

/* حلقة المقاعد: تُرسم النقاط حول دائرة، الممتلئة منها بلون الحبر */
function ringSVG(filled, capacity, size = 92) {
  const c = size / 2, r = size / 2 - 9;
  const n = Math.max(1, capacity);
  const dot = n > 16 ? 3.2 : n > 10 ? 4.2 : 5.4;
  let seats = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 - (i * 2 * Math.PI) / n; // يبدأ من الأعلى ويدور عكس عقارب الساعة (اتجاه القراءة العربية)
    seats += `<circle class="seat${i < filled ? ' on' : ''}" cx="${(c + r * Math.cos(a)).toFixed(2)}" cy="${(c + r * Math.sin(a)).toFixed(2)}" r="${dot}"/>`;
  }
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" role="img" aria-label="${filled} من ${capacity} مقاعد مشغولة">${seats}
    <text x="${c}" y="${c + 2}" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.2}" font-weight="700">${filled}/${capacity}</text></svg>`;
}
