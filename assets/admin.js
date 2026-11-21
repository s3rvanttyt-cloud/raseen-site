/* رصين: لوحة الإدارة */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');
async function q(p) { const { data, error } = await p; if (error) throw error; return data; }

/* التاريخ: الإدخال والعرض بتوقيت السعودية */
const toLocalInput = iso => iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }).replace(' ', 'T').slice(0, 16) : '';
const fromLocalInput = v => v ? new Date(v + ':00+03:00').toISOString() : null;

const KINDS = ['لقاء علمي', 'ورشة عمل', 'محاضرة', 'دورة تدريبية', 'مسابقة', 'زيارة', 'أخرى'];
const TABLES = {
  events: {
    label: 'الإعلانات والفعاليات', single: 'فعالية',
    order: q => q.order('starts_at', { ascending: false }),
    title: r => r.title,
    sub: r => `${F.short.format(new Date(r.starts_at))}، ${F.time.format(new Date(r.starts_at))}${new Date(r.starts_at) < new Date() ? '، في الأرشيف' : '، قادمة'}`,
    note: 'الفعالية تظهر في «الإعلانات» قبل موعدها، وتنتقل وحدها إلى «الفعاليات الماضية» بعده.',
    fields: [
      { k: 'title', l: 'العنوان', req: 1 },
      { k: 'kind', l: 'النوع', type: 'select', opts: KINDS },
      { k: 'starts_at', l: 'التاريخ والوقت (بتوقيت السعودية)', type: 'datetime', req: 1 },
      { k: 'location', l: 'المكان' },
      { k: 'summary', l: 'نبذة قصيرة (تظهر في البطاقة)', type: 'textarea' },
      { k: 'details', l: 'التفاصيل الكاملة', type: 'textarea' },
      { k: 'register_url', l: 'رابط التسجيل (اختياري)', type: 'url' },
      { k: 'cover_url', l: 'صورة الغلاف', type: 'image' },
      { k: 'gallery', l: 'صور من الفعالية (للأرشيف)', type: 'images' },
    ],
  },
  leaders: {
    label: 'الإدارة', single: 'منصب',
    order: q => q.order('sort').order('created_at'),
    title: r => `${r.name}: ${r.role}`,
    sub: (r, all) => r.parent_id ? `يتبع: ${all.find(x => x.id === r.parent_id)?.role || 'غير محدد'}` : 'رأس الهيكل',
    note: 'كل منصب يتبع منصباً أعلى منه، وهكذا يُرسم الهيكل في صفحة الفريق. «الترتيب» يحدد موضع المنصب بين زملائه.',
    fields: [
      { k: 'name', l: 'الاسم', req: 1 },
      { k: 'role', l: 'المنصب', req: 1 },
      { k: 'parent_id', l: 'يتبع لـ', type: 'parent' },
      { k: 'sort', l: 'الترتيب', type: 'number' },
      { k: 'photo_url', l: 'الصورة الشخصية (اختياري)', type: 'image' },
    ],
  },
  members: {
    label: 'الأعضاء', single: 'عضو',
    order: q => q.order('sort').order('name'),
    title: r => r.name,
    sub: r => [r.specialty, r.committee && 'لجنة ' + r.committee].filter(Boolean).join('، '),
    fields: [
      { k: 'name', l: 'الاسم', req: 1 },
      { k: 'specialty', l: 'التخصص' },
      { k: 'committee', l: 'اللجنة' },
      { k: 'sort', l: 'الترتيب', type: 'number' },
    ],
  },
};
const TABS = [['events', 'الإعلانات والفعاليات'], ['leaders', 'الإدارة'], ['members', 'الأعضاء'], ['circles', 'الحلقات البحثية'], ['suggestions', 'الاقتراحات'], ['account', 'الحساب']];
let tab = (location.hash.slice(1) || 'events');

/* ---------- الدخول ---------- */
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return loginView();
  const { data: ok } = await sb.rpc('is_admin');
  $('#adm-user').innerHTML = `<a href="./">عرض الموقع</a><a href="#" id="logout">تسجيل الخروج</a>`;
  $('#logout').onclick = async e => { e.preventDefault(); await sb.auth.signOut(); location.reload(); };
  if (!ok) {
    main.innerHTML = `<div class="wrap section"><div class="empty"><b>هذا الحساب ليس من حسابات الإدارة</b>${esc(session.user.email)}</div></div>`;
    return;
  }
  shell();
}
function loginView() {
  $('#adm-user').innerHTML = '<a href="./">العودة إلى الموقع</a>';
  main.innerHTML = `<div class="wrap"><div class="card login"><h1 style="font-size:1.8rem;margin-bottom:6px">دخول الإدارة</h1><p class="muted">للمسؤولين عن محتوى موقع رصين.</p>
    <form class="form" novalidate>
      <div class="field"><label for="l-email">البريد</label><input id="l-email" type="email" name="email" required dir="ltr" autocomplete="username"></div>
      <div class="field"><label for="l-pass">كلمة المرور</label><input id="l-pass" type="password" name="pass" required dir="ltr" autocomplete="current-password"></div>
      <p class="err" role="alert"></p>
      <button class="btn btn-ink" type="submit">دخول</button>
    </form></div></div>`;
  const f = $('form');
  f.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(f), btn = $('button', f);
    btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: fd.get('email').trim(), password: fd.get('pass') });
    btn.disabled = false;
    if (error) { $('.err', f).textContent = 'البريد أو كلمة المرور غير صحيحة.'; return; }
    boot();
  };
}

function shell() {
  main.innerHTML = `<header class="page-head"><div class="wrap"><h1>لوحة الإدارة</h1><p>كل تعديل هنا يظهر في الموقع فوراً.</p></div></header>
    <section class="section"><div class="wrap">
      <div class="adm-tabs chips" role="tablist">${TABS.map(([k, l]) => `<button class="chip" role="tab" aria-pressed="${k === tab}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="panel"></div>
    </div></section>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; location.hash = tab; $$('[data-tab]').forEach(x => x.setAttribute('aria-pressed', x === b)); panel(); });
  panel();
}
async function panel() {
  const p = $('#panel'); p.innerHTML = '<div class="loading">جارٍ التحميل…</div>';
  try {
    if (TABLES[tab]) await crudList(tab);
    else if (tab === 'circles') await circlesAdmin();
    else if (tab === 'suggestions') await suggestionsAdmin();
    else accountView();
  } catch (e) { console.error(e); p.innerHTML = `<div class="empty"><b>تعذّر التحميل</b>${esc(errText(e))}</div>`; }
}

/* ---------- قوائم وتعديل عام ---------- */
async function crudList(t) {
  const cfg = TABLES[t];
  const rows = await q(cfg.order(sb.from(t).select('*')));
  $('#panel').innerHTML = `<div class="section-head"><h2>${cfg.label} <span class="muted" style="font-size:1rem;font-family:var(--body)">(${rows.length})</span></h2><button class="btn btn-ink btn-sm" id="add">إضافة ${cfg.single}</button></div>
    ${cfg.note ? `<p class="muted">${cfg.note}</p>` : ''}
    <div class="adm-list">${rows.map(r => `<div class="adm-row"><div><div class="t">${esc(cfg.title(r))}</div><div class="s">${esc(cfg.sub(r, rows))}</div></div>
      <div class="acts"><button class="btn btn-line btn-sm" data-edit="${r.id}">تعديل</button><button class="btn btn-danger btn-sm" data-del="${r.id}">حذف</button></div></div>`).join('') || '<div class="empty">لا يوجد شيء بعد.</div>'}</div>`;
  $('#add').onclick = () => editForm(t, null, rows);
  $$('[data-edit]').forEach(b => b.onclick = () => editForm(t, rows.find(r => r.id === b.dataset.edit), rows));
  $$('[data-del]').forEach(b => b.onclick = async () => {
    const r = rows.find(x => x.id === b.dataset.del);
    if (!confirm(`حذف «${cfg.title(r)}» نهائياً؟`)) return;
    const { error } = await sb.from(t).delete().eq('id', r.id);
    if (error) return toast(errText(error), true);
    toast('حُذف.'); panel();
  });
}

async function uploadImage(file, folder) {
  if (file.size > 5 * 1024 * 1024) throw new Error('الصورة أكبر من 5MB');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

function editForm(t, row, all) {
  const cfg = TABLES[t], r = row || {};
  const state = {}; // قيم الصور
  const fieldHTML = f => {
    const v = r[f.k], id = 'f-' + f.k;
    const lab = `<label for="${id}">${f.l}</label>`;
    switch (f.type) {
      case 'textarea': return `<div class="field">${lab}<textarea id="${id}" name="${f.k}">${esc(v)}</textarea></div>`;
      case 'select': return `<div class="field">${lab}<select id="${id}" name="${f.k}">${f.opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
      case 'datetime': return `<div class="field">${lab}<input id="${id}" name="${f.k}" type="datetime-local" value="${toLocalInput(v)}" ${f.req ? 'required' : ''}></div>`;
      case 'number': return `<div class="field">${lab}<input id="${id}" name="${f.k}" type="number" value="${v ?? 0}"></div>`;
      case 'url': return `<div class="field">${lab}<input id="${id}" name="${f.k}" type="url" dir="ltr" value="${esc(v)}" placeholder="https://"></div>`;
      case 'parent': return `<div class="field">${lab}<select id="${id}" name="${f.k}"><option value="">لا شيء (رأس الهيكل)</option>${all.filter(x => x.id !== r.id).map(x => `<option value="${x.id}" ${x.id === v ? 'selected' : ''}>${esc(x.role)}: ${esc(x.name)}</option>`).join('')}</select></div>`;
      case 'image': state[f.k] = v || null; return `<div class="field"><label>${f.l}</label><div class="thumbs" data-thumbs="${f.k}"></div><input type="file" accept="image/*" data-up="${f.k}" aria-label="${f.l}"></div>`;
      case 'images': state[f.k] = [...(v || [])]; return `<div class="field"><label>${f.l}</label><div class="thumbs" data-thumbs="${f.k}"></div><input type="file" accept="image/*" multiple data-up="${f.k}" aria-label="${f.l}"></div>`;
      default: return `<div class="field">${lab}<input id="${id}" name="${f.k}" value="${esc(v)}" ${f.req ? 'required' : ''}></div>`;
    }
  };
  const d = document.createElement('dialog');
  d.innerHTML = `<div class="dlg-head"><div><h2>${row ? 'تعديل' : 'إضافة'} ${cfg.single}</h2></div><button class="dlg-x" data-close aria-label="إغلاق">×</button></div>
    <div class="dlg-body"><form class="form" novalidate>${cfg.fields.map(fieldHTML).join('')}<p class="err" role="alert"></p><button class="btn btn-ink" type="submit">حفظ</button></form></div>`;
  document.body.appendChild(d);
  d.addEventListener('close', () => d.remove());
  $('[data-close]', d).onclick = () => d.close();
  const drawThumbs = k => {
    const box = $(`[data-thumbs="${k}"]`, d), v = state[k];
    const list = Array.isArray(v) ? v : v ? [v] : [];
    box.innerHTML = list.map((u, i) => `<figure><img src="${esc(u)}" alt=""><button type="button" data-rm="${i}" aria-label="إزالة الصورة">×</button></figure>`).join('');
    $$('[data-rm]', box).forEach(b => b.onclick = () => { if (Array.isArray(state[k])) state[k].splice(+b.dataset.rm, 1); else state[k] = null; drawThumbs(k); });
  };
  Object.keys(state).forEach(drawThumbs);
  $$('[data-up]', d).forEach(inp => inp.onchange = async () => {
    const k = inp.dataset.up;
    try {
      for (const file of inp.files) {
        toast('جارٍ رفع الصورة…');
        const url = await uploadImage(file, t);
        if (Array.isArray(state[k])) state[k].push(url); else state[k] = url;
      }
      toast('رُفعت الصورة.'); drawThumbs(k);
    } catch (e) { toast(e.message?.includes('5MB') ? e.message : errText(e), true); }
    inp.value = '';
  });
  const f = $('form', d);
  f.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(f), rec = {};
    for (const fl of cfg.fields) {
      if (fl.type === 'image' || fl.type === 'images') { rec[fl.k] = state[fl.k]; continue; }
      let v = fd.get(fl.k);
      if (fl.type === 'datetime') v = fromLocalInput(v);
      else if (fl.type === 'number') v = Number(v) || 0;
      else if (fl.type === 'parent') v = v || null;
      else v = String(v ?? '').trim() || null;
      if (fl.req && !v) { $('.err', f).textContent = `أكمل حقل «${fl.l}».`; return; }
      rec[fl.k] = v;
    }
    const btn = $('button[type=submit]', f); btn.disabled = true;
    const { error } = row ? await sb.from(t).update(rec).eq('id', row.id) : await sb.from(t).insert(rec);
    btn.disabled = false;
    if (error) { $('.err', f).textContent = errText(error); return; }
    d.close(); toast('حُفظ.'); panel();
  };
  d.showModal();
}

/* ---------- الحلقات ---------- */
async function circlesAdmin() {
  const rows = await q(sb.from('circles').select('*').order('created_at', { ascending: false }));
  $('#panel').innerHTML = `<div class="section-head"><h2>الحلقات البحثية (${rows.length})</h2></div>
    <p class="muted">يضيف الدكاترة حلقاتهم من الموقع مباشرة. من هنا تخفي حلقة أو تحذفها، وترى المسجّلين فيها وتزيل أحدهم إن لزم (فتُفتح مقاعده من جديد).</p>
    <div class="adm-list">${rows.map(c => `<div class="adm-row"><div><div class="t">${esc(c.title)}${c.is_hidden ? ' <span class="pill full">مخفية</span>' : ''}</div>
      <div class="s">${esc(c.doctor_name)}، ${esc(c.field)}، ${c.filled} من ${c.capacity}${c.filled >= c.capacity ? '، مكتملة' : ''}</div></div>
      <div class="acts"><button class="btn btn-line btn-sm" data-roster="${c.id}">المسجّلون</button>
      <button class="btn btn-line btn-sm" data-hide="${c.id}">${c.is_hidden ? 'إظهار' : 'إخفاء'}</button>
      <button class="btn btn-danger btn-sm" data-del="${c.id}">حذف</button></div></div>`).join('') || '<div class="empty">لا توجد حلقات بعد.</div>'}</div>`;
  $$('[data-hide]').forEach(b => b.onclick = async () => {
    const c = rows.find(x => x.id === b.dataset.hide);
    const { error } = await sb.from('circles').update({ is_hidden: !c.is_hidden }).eq('id', c.id);
    if (error) return toast(errText(error), true); panel();
  });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    const c = rows.find(x => x.id === b.dataset.del);
    if (!confirm(`حذف حلقة «${c.title}» وكل المسجّلين فيها نهائياً؟`)) return;
    const { error } = await sb.from('circles').delete().eq('id', c.id);
    if (error) return toast(errText(error), true); toast('حُذفت.'); panel();
  });
  $$('[data-roster]').forEach(b => b.onclick = () => rosterAdmin(rows.find(x => x.id === b.dataset.roster)));
}
async function rosterAdmin(c) {
  const list = await q(sb.from('circle_members').select('*').eq('circle_id', c.id).order('created_at'));
  const d = document.createElement('dialog');
  d.innerHTML = `<div class="dlg-head"><div><h2>المسجّلون</h2><p>${esc(c.title)}</p></div><button class="dlg-x" data-close aria-label="إغلاق">×</button></div>
    <div class="dlg-body">${list.length ? `<div style="overflow-x:auto"><table class="roster"><thead><tr><th>الاسم</th><th>المستوى</th><th>التواصل</th><th></th></tr></thead><tbody>
    ${list.map(s => `<tr><td>${esc(s.student_name)}${s.note ? `<br><small class="muted">${esc(s.note)}</small>` : ''}</td><td>${esc(s.student_level || '')}</td><td dir="ltr" style="text-align:end">${esc(s.contact)}</td><td><button class="btn btn-danger btn-sm" data-rm="${s.id}">إزالة</button></td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">لم ينضم أحد بعد.</div>'}</div>`;
  document.body.appendChild(d);
  d.addEventListener('close', () => { d.remove(); panel(); });
  $('[data-close]', d).onclick = () => d.close();
  $$('[data-rm]', d).forEach(b => b.onclick = async () => {
    if (!confirm('إزالة هذا الطالب من الحلقة؟')) return;
    const { error } = await sb.from('circle_members').delete().eq('id', b.dataset.rm);
    if (error) return toast(errText(error), true);
    b.closest('tr').remove(); toast('أُزيل، وفُتح مقعده.');
  });
  d.showModal();
}

/* ---------- الاقتراحات ---------- */
async function suggestionsAdmin() {
  const rows = await q(sb.from('suggestions').select('*').order('created_at', { ascending: false }));
  const unread = rows.filter(r => !r.is_read).length;
  $('#panel').innerHTML = `<div class="section-head"><h2>الاقتراحات (${rows.length})</h2>${unread ? `<span class="pill open">${unread} جديدة</span>` : ''}</div>
    <div class="adm-list">${rows.map(s => `<div class="adm-row${s.is_read ? '' : ' unread'}" style="align-items:start"><div style="flex:1;min-width:240px">
      <div class="s"><span class="pill">${esc(s.category)}</span> ${F.short.format(new Date(s.created_at))}${s.name ? `، من ${esc(s.name)}` : ''}${s.contact ? `، <span dir="ltr">${esc(s.contact)}</span>` : ''}</div>
      <p class="prose" style="margin:8px 0 0">${esc(s.body)}</p></div>
      <div class="acts"><button class="btn btn-line btn-sm" data-read="${s.id}">${s.is_read ? 'تعليم كجديد' : 'تعليم كمقروء'}</button><button class="btn btn-danger btn-sm" data-del="${s.id}">حذف</button></div></div>`).join('') || '<div class="empty"><b>لا توجد اقتراحات بعد</b>شارك رابط صفحة «اقترح» مع الطلاب.</div>'}</div>`;
  $$('[data-read]').forEach(b => b.onclick = async () => {
    const s = rows.find(x => x.id === b.dataset.read);
    const { error } = await sb.from('suggestions').update({ is_read: !s.is_read }).eq('id', s.id);
    if (error) return toast(errText(error), true); panel();
  });
  $$('[data-del]').forEach(b => b.onclick = async () => {
    if (!confirm('حذف هذا الاقتراح نهائياً؟')) return;
    const { error } = await sb.from('suggestions').delete().eq('id', b.dataset.del);
    if (error) return toast(errText(error), true); panel();
  });
}

/* ---------- الحساب ---------- */
function accountView() {
  $('#panel').innerHTML = `<div class="card" style="max-width:520px"><h2 style="font-size:1.4rem;margin-bottom:12px">تغيير كلمة المرور</h2>
    <form class="form" novalidate><div class="field"><label for="np">كلمة المرور الجديدة</label><input id="np" type="password" minlength="8" required dir="ltr" autocomplete="new-password"><span class="hint">8 أحرف على الأقل.</span></div>
    <p class="err" role="alert"></p><button class="btn btn-ink" type="submit">حفظ كلمة المرور</button></form></div>`;
  const f = $('#panel form');
  f.onsubmit = async e => {
    e.preventDefault();
    const v = $('#np').value;
    if (v.length < 8) { $('.err', f).textContent = 'كلمة المرور قصيرة. اكتب 8 أحرف على الأقل.'; return; }
    const { error } = await sb.auth.updateUser({ password: v });
    if (error) { $('.err', f).textContent = errText(error); return; }
    f.reset(); toast('حُفظت كلمة المرور الجديدة.');
  };
}

boot();
