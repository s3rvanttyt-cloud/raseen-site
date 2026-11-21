/* رصين: الموقع العام */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');

const routes = {
  '': [home, 'رصين | نادي الأبحاث الطبية'],
  events: [eventsPage, 'الإعلانات'],
  archive: [archivePage, 'الفعاليات الماضية'],
  event: [eventPage, 'تفاصيل الفعالية'],
  team: [teamPage, 'الفريق'],
  circles: [circlesPage, 'الحلقات البحثية'],
  suggest: [suggestPage, 'اقترح'],
};

function parse() {
  const h = location.hash;
  if (h && !h.startsWith('#/')) return null; // روابط داخلية مثل #main
  const [r = '', id] = h.replace(/^#\/?/, '').split('/');
  return { r, id: id && decodeURIComponent(id) };
}
async function render() {
  const p = parse(); if (!p) return;
  $$('dialog').forEach(d => d.remove()); // أغلق أي نافذة مفتوحة عند التنقل
  const [fn, title] = routes[p.r] || [notFound, 'غير موجودة'];
  $$('.nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#/' + (p.r === 'event' ? '' : p.r)));
  $$('.nav a[aria-current]').forEach(a => a.setAttribute('aria-current', 'page'));
  document.title = p.r ? `${title} | رصين` : title;
  main.innerHTML = '<div class="loading">جارٍ التحميل…</div>';
  window.scrollTo(0, 0);
  try { await fn(p.id); }
  catch (e) {
    console.error(e);
    main.innerHTML = `<div class="wrap section"><div class="empty"><b>تعذّر تحميل الصفحة</b>${esc(errText(e))}<p style="margin-top:14px"><button class="btn btn-ink btn-sm" onclick="render()">أعد المحاولة</button></p></div></div>`;
  }
  if (p.r) main.focus({ preventScroll: true });
}
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', render);

/* ---------- البيانات ---------- */
const nowISO = () => new Date().toISOString();
async function q(promise) { const { data, error } = await promise; if (error) throw error; return data; }
const getUpcoming = () => q(sb.from('events').select('*').gte('starts_at', nowISO()).order('starts_at'));
const getPast = () => q(sb.from('events').select('*').lt('starts_at', nowISO()).order('starts_at', { ascending: false }));
const getCircles = () => q(sb.from('circles').select('*').order('created_at', { ascending: false }));

/* ---------- قطع مشتركة ---------- */
function pageHead(title, text) {
  return `<header class="page-head"><div class="wrap"><h1>${title}</h1>${text ? `<p>${text}</p>` : ''}</div></header>`;
}
function isExample(t) { return /^\(مثال\)/.test(t || ''); }
function cleanTitle(t) { return esc(String(t || '').replace(/^\(مثال\)\s*/, '')); }
function exampleTag(t) { return isExample(t) ? '<span class="pill example">مثال للتجربة</span> ' : ''; }

function eventCard(e, past = false) {
  const d = new Date(e.starts_at);
  const reg = safeUrl(e.register_url);
  return `<article class="event${past ? ' past' : ''}">
    <div class="date" aria-hidden="true"><b>${F.day.format(d)}</b><span>${F.month.format(d)}</span></div>
    <div>
      ${exampleTag(e.title)}<span class="pill">${esc(e.kind)}</span>
      <h3><a href="#/event/${e.id}">${cleanTitle(e.title)}</a></h3>
      <div class="meta">
        <span>${ICONS.cal}${F.full.format(d)}</span>
        <span>${ICONS.clock}${F.time.format(d)}</span>
        ${e.location ? `<span>${ICONS.pin}${esc(e.location)}</span>` : ''}
      </div>
      ${e.summary ? `<p>${esc(e.summary)}</p>` : ''}
      <div class="row">
        <a class="btn btn-line btn-sm" href="#/event/${e.id}">${past ? 'عرض الفعالية' : 'التفاصيل'}</a>
        ${!past && reg ? `<a class="btn btn-ink btn-sm" href="${esc(reg)}" target="_blank" rel="noopener">سجّل حضورك</a>` : ''}
      </div>
    </div>
  </article>`;
}

/* ---------- الرئيسية ---------- */
function heroRing() {
  const n = 12, on = 9, c = 200, r = 168;
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 - (i * 2 * Math.PI) / n;
    s += `<circle class="seat${i < on ? ' on' : ''}" style="animation-delay:${200 + i * 90}ms" cx="${(c + r * Math.cos(a)).toFixed(1)}" cy="${(c + r * Math.sin(a)).toFixed(1)}" r="15"/>`;
  }
  return `<svg class="hero-ring" viewBox="0 0 400 400" aria-hidden="true">
    <circle class="core" cx="200" cy="200" r="120"/><circle class="core" cx="200" cy="200" r="72"/>
    ${s}<text x="200" y="204" text-anchor="middle" dominant-baseline="middle" font-size="64" font-weight="700">ر</text></svg>`;
}

async function home() {
  main.innerHTML = `
  <section class="hero">
    <div class="wrap">
      <div>
        <h1>رصين</h1>
        <p class="tag">نادي الأبحاث الطبية في جامعة نجران</p>
        <p class="lede">نجمع طلاب الكليات الصحية بأعضاء هيئة التدريس حول أسئلة بحثية حقيقية: لقاءات علمية، وورش منهجية، وحلقات بحثية يقودها دكاترة الجامعة.</p>
        <div class="actions">
          <a class="btn btn-sky" href="#/circles">تصفّح الحلقات البحثية</a>
          <a class="btn btn-ghost" href="#/events">الإعلانات</a>
        </div>
      </div>
      ${heroRing()}
    </div>
  </section>
  <section class="section"><div class="wrap" id="next-event"><div class="loading">جارٍ التحميل…</div></div></section>
  <section class="section" style="padding-top:0"><div class="wrap" id="open-circles"></div></section>
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="cta-strip">
      <div><h2>عندك فكرة للنادي؟</h2><p>فعالية تتمنى حضورها، أو موضوع بحثي، أو ملاحظة على الموقع. اقتراحك يصل إلى الإدارة مباشرة.</p></div>
      <a class="btn btn-sky" href="#/suggest">أرسل اقتراحاً</a>
    </div>
  </div></section>`;

  const [up, circles] = await Promise.all([getUpcoming(), getCircles()]);
  const ne = $('#next-event');
  if (!up.length) {
    ne.innerHTML = `<h2>الفعالية القادمة</h2><div class="empty"><b>لا توجد فعاليات معلنة حالياً</b>تابعنا على <a href="https://x.com/Raseen_NU" target="_blank" rel="noopener">@Raseen_NU</a> ليصلك الإعلان القادم، أو اطّلع على <a href="#/archive">الفعاليات الماضية</a>.</div>`;
  } else {
    const e = up[0], d = new Date(e.starts_at), reg = safeUrl(e.register_url);
    ne.innerHTML = `<div class="section-head"><h2>الفعالية القادمة</h2>${up.length > 1 ? `<a href="#/events">كل الإعلانات (${up.length})</a>` : ''}</div>
      <article class="feature">
        <div class="big-date"><b>${F.day.format(d)}</b><span>${F.month.format(d)}</span></div>
        <div>
          ${exampleTag(e.title)}<span class="pill">${esc(e.kind)}</span>
          <h3>${cleanTitle(e.title)}</h3>
          <div class="event"><div class="meta" style="margin:0 0 10px">
            <span>${ICONS.cal}${F.full.format(d)}، ${F.hijri.format(d)}</span>
            <span>${ICONS.clock}${F.time.format(d)}</span>
            ${e.location ? `<span>${ICONS.pin}${esc(e.location)}</span>` : ''}
          </div></div>
          <div class="row" style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-ink btn-sm" href="#/event/${e.id}">التفاصيل</a>
            ${reg ? `<a class="btn btn-line btn-sm" href="${esc(reg)}" target="_blank" rel="noopener">سجّل حضورك</a>` : ''}
          </div>
        </div>
      </article>`;
    // .event wrapper used only for meta styling; strip its card look
    const w = ne.querySelector('.feature .event'); w.style.cssText = 'display:block;border:0;padding:0;background:none';
  }

  const open = circles.filter(c => c.filled < c.capacity).slice(0, 3);
  $('#open-circles').innerHTML = `<div class="section-head"><h2>حلقات تستقبل طلاباً الآن</h2><a href="#/circles">كل الحلقات</a></div>
    ${open.length ? `<div class="circles">${open.map(circleCard).join('')}</div>`
      : `<div class="empty"><b>لا توجد حلقات مفتوحة الآن</b>إن كنت دكتوراً، <a href="#/circles">أضف حلقتك البحثية</a> ليتقدم لها الطلاب.</div>`}`;
  bindCircleButtons($('#open-circles'), circles);
}

/* ---------- الإعلانات ---------- */
async function eventsPage() {
  const up = await getUpcoming();
  main.innerHTML = pageHead('الإعلانات', 'الفعاليات القادمة للنادي، الأقرب أولاً. التوقيت بتوقيت السعودية.') +
    `<section class="section"><div class="wrap">${up.length ? `<div class="events">${up.map(e => eventCard(e)).join('')}</div>`
      : `<div class="empty"><b>لا توجد إعلانات حالياً</b>تابع حساب النادي <a href="https://x.com/Raseen_NU" target="_blank" rel="noopener">@Raseen_NU</a> لتصلك الإعلانات أولاً بأول.</div>`}</div></section>`;
}

/* ---------- الأرشيف ---------- */
async function archivePage() {
  const past = await getPast();
  const years = {};
  past.forEach(e => { const y = new Date(e.starts_at).getFullYear(); (years[y] ||= []).push(e); });
  main.innerHTML = pageHead('الفعاليات الماضية', 'سجلّ كل ما أقامه النادي من لقاءات وورش، مع صورها وملخصاتها.') +
    `<section class="section"><div class="wrap">${past.length
      ? Object.keys(years).sort((a, b) => b - a).map(y => `<h2 style="font-size:var(--step-2);margin:8px 0 14px">${y}</h2><div class="events" style="margin-bottom:28px">${years[y].map(e => eventCard(e, true)).join('')}</div>`).join('')
      : `<div class="empty"><b>لم تُضف فعاليات ماضية بعد</b>ستظهر هنا الفعاليات بعد انتهاء موعدها تلقائياً.</div>`}</div></section>`;
}

/* ---------- تفاصيل فعالية ---------- */
async function eventPage(id) {
  const e = await q(sb.from('events').select('*').eq('id', id).maybeSingle());
  if (!e) return notFound();
  const d = new Date(e.starts_at), past = d < new Date(), reg = safeUrl(e.register_url);
  const cover = safeUrl(e.cover_url);
  const gallery = (e.gallery || []).map(safeUrl).filter(Boolean);
  main.innerHTML = pageHead(cleanTitle(e.title), '') + `<section class="section"><div class="wrap detail">
    <p>${exampleTag(e.title)}<span class="pill">${esc(e.kind)}</span> ${past ? '<span class="pill">انتهت</span>' : ''}</p>
    ${cover ? `<img src="${esc(cover)}" alt="" style="border-radius:16px;margin:12px 0;width:100%">` : ''}
    <dl>
      <dt>التاريخ</dt><dd>${F.full.format(d)}<br><span class="muted">${F.hijri.format(d)}</span></dd>
      <dt>الوقت</dt><dd>${F.time.format(d)}</dd>
      ${e.location ? `<dt>المكان</dt><dd>${esc(e.location)}</dd>` : ''}
    </dl>
    ${e.summary ? `<p style="font-size:var(--step-1);color:var(--ink)">${esc(e.summary)}</p>` : ''}
    ${e.details ? `<p class="prose">${esc(e.details)}</p>` : ''}
    ${!past && reg ? `<p><a class="btn btn-ink" href="${esc(reg)}" target="_blank" rel="noopener">سجّل حضورك</a></p>` : ''}
    ${gallery.length ? `<h2 style="font-size:var(--step-2);margin-top:28px">من الفعالية</h2><div class="gallery">${gallery.map(g => `<a href="${esc(g)}" target="_blank" rel="noopener"><img src="${esc(g)}" alt="صورة من الفعالية" loading="lazy"></a>`).join('')}</div>` : ''}
    <p style="margin-top:28px"><a href="${past ? '#/archive' : '#/events'}">العودة إلى ${past ? 'الفعاليات الماضية' : 'الإعلانات'}</a></p>
  </div></section>`;
}

/* ---------- الفريق ---------- */
async function teamPage() {
  const [leaders, members] = await Promise.all([
    q(sb.from('leaders').select('*').order('sort').order('created_at')),
    q(sb.from('members').select('*').order('sort').order('name')),
  ]);
  const ids = new Set(leaders.map(l => l.id));
  const kids = id => leaders.filter(l => l.parent_id === id);
  const roots = leaders.filter(l => !l.parent_id || !ids.has(l.parent_id));
  const node = (l, isRoot) => {
    const ph = safeUrl(l.photo_url), ch = kids(l.id);
    return `<li><div class="node${isRoot ? ' root' : ''}">
      <div class="av">${ph ? `<img src="${esc(ph)}" alt="">` : initial(l.name)}</div>
      <div class="tx"><b>${esc(l.name)}</b><span>${esc(l.role)}</span></div></div>
      ${ch.length ? `<ul>${ch.map(c => node(c, false)).join('')}</ul>` : ''}</li>`;
  };
  const committees = [...new Set(members.map(m => m.committee).filter(Boolean))];
  main.innerHTML = pageHead('فريق رصين', 'الهيكل الإداري للنادي، ثم قائمة الأعضاء.') + `
  <section class="section"><div class="wrap">
    <h2>الإدارة</h2>
    ${roots.length ? `<div class="tree-wrap"><ul class="tree">${roots.map(r => node(r, true)).join('')}</ul></div>` : '<div class="empty"><b>لم تُضف الإدارة بعد</b></div>'}
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="section-head"><h2>الأعضاء <span class="muted" style="font-size:1rem;font-family:var(--body)">(${members.length})</span></h2></div>
    <div class="members-tools">
      <label class="vh" for="m-search">ابحث عن عضو</label>
      <input id="m-search" type="search" placeholder="ابحث بالاسم أو التخصص" style="max-width:320px">
      ${committees.length > 1 ? `<div class="chips" role="group" aria-label="تصفية حسب اللجنة"><button class="chip" aria-pressed="true" data-c="">كل اللجان</button>${committees.map(c => `<button class="chip" aria-pressed="false" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
    </div>
    <div class="members" id="members"></div>
  </div></section>`;
  let term = '', com = '';
  const draw = () => {
    const list = members.filter(m => (!com || m.committee === com) && (!term || `${m.name} ${m.specialty} ${m.committee}`.includes(term)));
    $('#members').innerHTML = list.length ? list.map(m => `<div class="member"><div class="av">${initial(m.name)}</div><div><b>${esc(m.name)}</b><small>${[m.specialty, m.committee && 'لجنة ' + m.committee].filter(Boolean).map(esc).join('، ')}</small></div></div>`).join('')
      : '<div class="empty" style="grid-column:1/-1">لا يوجد عضو بهذا الوصف.</div>';
  };
  $('#m-search').addEventListener('input', e => { term = e.target.value.trim(); draw(); });
  $$('.chip[data-c]').forEach(b => b.addEventListener('click', () => {
    $$('.chip[data-c]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); com = b.dataset.c; draw();
  }));
  draw();
}

/* ---------- الحلقات البحثية ---------- */
function circleCard(c) {
  const full = c.filled >= c.capacity, left = c.capacity - c.filled;
  const leftText = left === 1 ? 'بقي مقعد واحد' : left === 2 ? 'بقي مقعدان' : left <= 10 ? `بقي ${left} مقاعد` : `بقي ${left} مقعداً`;
  return `<article class="circle${full ? ' is-full' : ''}">
    <div class="circle-top">${ringSVG(c.filled, c.capacity)}
      <div>${exampleTag(c.doctor_name)}<span class="pill ${full ? 'full' : 'open'}">${full ? 'مكتملة' : leftText}</span>
        <h3>${esc(c.title)}</h3>
        <div class="doc">${cleanTitle(c.doctor_name)}${c.department ? `، ${esc(c.department)}` : ''}</div></div>
    </div>
    <div><span class="pill">${esc(c.field)}</span></div>
    ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ''}
    ${c.requirements ? `<p class="req"><b>المطلوب في الطالب:</b> ${esc(c.requirements)}</p>` : ''}
    <div class="foot">
      <button class="btn ${full ? 'btn-line' : 'btn-ink'} btn-sm" data-join="${c.id}" ${full ? 'disabled' : ''}>${full ? 'اكتملت الحلقة' : 'انضم للحلقة'}</button>
      <button class="linkish" data-roster="${c.id}">للدكتور: عرض المسجّلين</button>
    </div>
  </article>`;
}

function dialog(html) {
  const d = document.createElement('dialog');
  d.innerHTML = html;
  document.body.appendChild(d);
  d.addEventListener('close', () => d.remove());
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
  $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  d.showModal();
  return d;
}
const dlgHead = (t, p) => `<div class="dlg-head"><div><h2>${t}</h2>${p ? `<p>${p}</p>` : ''}</div><button class="dlg-x" data-close aria-label="إغلاق">×</button></div>`;
const successBlock = (t, p) => `<div class="success"><div class="tick">${ICONS.tick}</div><h3>${t}</h3><p class="muted">${p}</p></div>`;

function bindCircleButtons(root, circles) {
  $$('[data-join]', root).forEach(b => b.addEventListener('click', () => openJoin(circles.find(c => c.id === b.dataset.join))));
  $$('[data-roster]', root).forEach(b => b.addEventListener('click', () => openRoster(circles.find(c => c.id === b.dataset.roster))));
}

function openJoin(c) {
  const d = dialog(`${dlgHead('الانضمام إلى الحلقة', `${esc(c.title)}، ${cleanTitle(c.doctor_name)}`)}
    <div class="dlg-body"><form class="form" novalidate>
      <div class="field"><label for="j-name">الاسم الكامل</label><input id="j-name" name="name" required autocomplete="name"></div>
      <div class="two">
        <div class="field"><label for="j-level">الكلية والمستوى</label><input id="j-level" name="level" placeholder="مثل: الطب، السنة الرابعة"></div>
        <div class="field"><label for="j-contact">جوال أو بريد</label><input id="j-contact" name="contact" required dir="ltr" autocomplete="email"></div>
      </div>
      <div class="field"><label for="j-note">لماذا تريد الانضمام؟ <span class="muted">(اختياري)</span></label><textarea id="j-note" name="note" maxlength="500" style="min-height:80px"></textarea></div>
      <p class="hint muted" style="margin:0;font-size:.86rem">بياناتك تظهر للدكتور صاحب الحلقة ولإدارة النادي فقط.</p>
      <p class="err" role="alert"></p>
      <button class="btn btn-ink" type="submit">انضم للحلقة</button>
    </form></div>`);
  const f = $('form', d);
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('button[type=submit]', f), err = $('.err', f);
    err.textContent = ''; btn.disabled = true; btn.textContent = 'جارٍ التسجيل…';
    const fd = new FormData(f);
    const { data, error } = await sb.rpc('join_circle', { p_circle_id: c.id, p_name: fd.get('name'), p_level: fd.get('level'), p_contact: fd.get('contact'), p_note: fd.get('note') });
    if (error) { err.textContent = errText(error); btn.disabled = false; btn.textContent = 'انضم للحلقة'; if (/CIRCLE_FULL/.test(error.message)) render(); return; }
    $('.dlg-body', d).innerHTML = successBlock('انضممت إلى الحلقة', `أنت الآن ${data} من ${c.capacity}. سيتواصل معك ${cleanTitle(c.doctor_name)} أو إدارة النادي.${data >= c.capacity ? ' اكتمل العدد بانضمامك وأُغلقت الحلقة.' : ''}`) + '<button class="btn btn-line" data-close style="width:100%">تم</button>';
    $('[data-close]', $('.dlg-body', d)).addEventListener('click', () => d.close());
    d.addEventListener('close', render, { once: true });
  });
}

function openRoster(c) {
  const d = dialog(`${dlgHead('المسجّلون في الحلقة', `${esc(c.title)}. أدخل الرمز الذي اخترته عند إضافة الحلقة.`)}
    <div class="dlg-body"><form class="form" novalidate>
      <div class="field"><label for="r-code">رمز الحلقة</label><input id="r-code" name="code" type="password" required autocomplete="off"></div>
      <p class="err" role="alert"></p>
      <button class="btn btn-ink" type="submit">عرض المسجّلين</button>
    </form><div id="roster-out"></div></div>`);
  const f = $('form', d);
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const err = $('.err', f); err.textContent = '';
    const { data, error } = await sb.rpc('circle_roster', { p_circle_id: c.id, p_code: new FormData(f).get('code') });
    if (error) { err.textContent = errText(error); return; }
    f.hidden = true;
    $('#roster-out', d).innerHTML = data.length
      ? `<p class="muted">${data.length} من ${c.capacity}</p><div style="overflow-x:auto"><table class="roster"><thead><tr><th>الاسم</th><th>المستوى</th><th>التواصل</th></tr></thead><tbody>${data.map(s => `<tr><td>${esc(s.student_name)}${s.note ? `<br><small class="muted">${esc(s.note)}</small>` : ''}</td><td>${esc(s.student_level || '')}</td><td dir="ltr" style="text-align:end">${esc(s.contact)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty"><b>لم ينضم أحد بعد</b>شارك رابط صفحة الحلقات مع طلابك.</div>';
  });
}

function openCreate() {
  const d = dialog(`${dlgHead('إضافة حلقة بحثية', 'للدكاترة. تظهر الحلقة فور إضافتها، وتُغلق تلقائياً عند اكتمال العدد.')}
    <div class="dlg-body"><form class="form" novalidate>
      <div class="two">
        <div class="field"><label for="c-doc">اسم الدكتور</label><input id="c-doc" name="doc" required placeholder="د. "></div>
        <div class="field"><label for="c-dep">القسم أو الكلية</label><input id="c-dep" name="dep"></div>
      </div>
      <div class="field"><label for="c-field">مجال البحث</label><input id="c-field" name="field" required placeholder="مثل: طب الأطفال، الصحة العامة، علم الأدوية"></div>
      <div class="field"><label for="c-title">عنوان البحث أو فكرته</label><input id="c-title" name="title" required maxlength="200"></div>
      <div class="field"><label for="c-desc">وصف مختصر</label><textarea id="c-desc" name="desc" maxlength="3000" placeholder="ما الذي سيعمل عليه الطلاب؟ وما المدة المتوقعة؟"></textarea></div>
      <div class="field"><label for="c-req">المطلوب في الطالب <span class="muted">(اختياري)</span></label><input id="c-req" name="req" maxlength="1000" placeholder="مثل: سنة رابعة فما فوق، إتقان الإنجليزية"></div>
      <div class="two">
        <div class="field"><label for="c-cap">عدد الطلاب المطلوب</label><input id="c-cap" name="cap" type="number" min="1" max="30" value="4" required inputmode="numeric"></div>
        <div class="field"><label for="c-code">رمز خاص بك</label><input id="c-code" name="code" type="password" minlength="4" required autocomplete="new-password"><span class="hint">4 أحرف أو أرقام على الأقل. تحتاجه لعرض أسماء الطلاب وطرق التواصل معهم.</span></div>
      </div>
      <p class="err" role="alert"></p>
      <button class="btn btn-ink" type="submit">أضف الحلقة</button>
    </form></div>`);
  const f = $('form', d);
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('button[type=submit]', f), err = $('.err', f); err.textContent = '';
    const fd = new FormData(f);
    if (String(fd.get('code')).length < 4) { err.textContent = ERRORS.BAD_CODE.replace('غير صحيح. تأكد منه وحاول مرة أخرى', 'يجب أن يكون 4 أحرف على الأقل'); return; }
    btn.disabled = true; btn.textContent = 'جارٍ الإضافة…';
    const { error } = await sb.rpc('create_circle', {
      p_doctor_name: fd.get('doc'), p_department: fd.get('dep'), p_field: fd.get('field'), p_title: fd.get('title'),
      p_description: fd.get('desc'), p_requirements: fd.get('req'), p_capacity: Number(fd.get('cap')), p_code: fd.get('code'),
    });
    if (error) { err.textContent = errText(error); btn.disabled = false; btn.textContent = 'أضف الحلقة'; return; }
    $('.dlg-body', d).innerHTML = successBlock('أُضيفت حلقتك', 'تظهر الآن في صفحة الحلقات البحثية. احتفظ برمزك الخاص لتعرض أسماء الطلاب المنضمين من زر «للدكتور: عرض المسجّلين».') + '<button class="btn btn-line" data-close style="width:100%">تم</button>';
    $('[data-close]', $('.dlg-body', d)).addEventListener('click', () => d.close());
    d.addEventListener('close', render, { once: true });
  });
}

async function circlesPage() {
  const circles = await getCircles();
  main.innerHTML = pageHead('الحلقات البحثية', 'يضيف الدكتور فكرة بحثه وعدد الطلاب الذين يحتاجهم، ويتقدم الطلاب حتى يكتمل العدد فتُغلق الحلقة تلقائياً.') + `
  <section class="section"><div class="wrap">
    <div class="circles-intro" style="margin-bottom:28px">
      <ol class="how">
        <li><b>الدكتور يضيف حلقته</b><br><span class="muted">المجال، والفكرة، وعدد الطلاب.</span></li>
        <li><b>الطلاب ينضمون</b><br><span class="muted">بالاسم ووسيلة تواصل.</span></li>
        <li><b>تُغلق عند الاكتمال</b><br><span class="muted">ويرى الدكتور قائمة طلابه برمزه.</span></li>
      </ol>
      <button class="btn btn-ink" id="add-circle">أضف حلقة بحثية</button>
    </div>
    <div class="section-head">
      <h2>الحلقات <span class="muted" style="font-size:1rem;font-family:var(--body)">(${circles.length})</span></h2>
      <div class="chips" role="group" aria-label="تصفية الحلقات">
        <button class="chip" aria-pressed="true" data-f="all">الكل</button>
        <button class="chip" aria-pressed="false" data-f="open">مفتوحة</button>
        <button class="chip" aria-pressed="false" data-f="full">مكتملة</button>
      </div>
    </div>
    <label class="vh" for="c-search">ابحث في الحلقات</label>
    <input id="c-search" type="search" placeholder="ابحث بالمجال أو اسم الدكتور" style="max-width:360px;margin-bottom:18px">
    <div id="circles-list"></div>
  </div></section>`;
  $('#add-circle').addEventListener('click', openCreate);
  let filter = 'all', term = '';
  const draw = () => {
    const list = circles.filter(c => (filter === 'all' || (filter === 'open') === (c.filled < c.capacity)) &&
      (!term || `${c.title} ${c.field} ${c.doctor_name} ${c.department} ${c.description}`.includes(term)));
    const box = $('#circles-list');
    box.innerHTML = list.length ? `<div class="circles">${list.map(circleCard).join('')}</div>`
      : `<div class="empty"><b>${circles.length ? 'لا توجد حلقات بهذا الوصف' : 'لا توجد حلقات بعد'}</b>${circles.length ? 'جرّب تصفية أخرى.' : 'كن أول دكتور يضيف حلقته البحثية.'}</div>`;
    bindCircleButtons(box, circles);
  };
  $$('.chip[data-f]').forEach(b => b.addEventListener('click', () => {
    $$('.chip[data-f]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); filter = b.dataset.f; draw();
  }));
  $('#c-search').addEventListener('input', e => { term = e.target.value.trim(); draw(); });
  draw();
}

/* ---------- الاقتراحات ---------- */
async function suggestPage() {
  main.innerHTML = pageHead('اقترح على النادي', 'اقتراحك يصل إلى إدارة رصين مباشرة. لا تحتاج إلى تسجيل، والاسم اختياري.') + `
  <section class="section"><div class="wrap" style="max-width:720px">
    <div class="card" id="sg-box"><form class="form" novalidate>
      <div class="field"><label for="s-cat">نوع الاقتراح</label>
        <select id="s-cat" name="cat"><option>فعالية أو ورشة</option><option>موضوع بحثي</option><option>تنظيم النادي</option><option>الموقع</option><option selected>عام</option></select></div>
      <div class="field"><label for="s-body">اقتراحك</label><textarea id="s-body" name="body" required maxlength="2000" placeholder="اكتب فكرتك بوضوح، وإن أمكن: لماذا تراها مفيدة؟"></textarea></div>
      <div class="two">
        <div class="field"><label for="s-name">اسمك <span class="muted">(اختياري)</span></label><input id="s-name" name="name" maxlength="80" autocomplete="name"></div>
        <div class="field"><label for="s-contact">وسيلة تواصل <span class="muted">(اختياري)</span></label><input id="s-contact" name="contact" maxlength="120" dir="ltr"><span class="hint">إن أردت أن نرد عليك.</span></div>
      </div>
      <div class="hp" aria-hidden="true"><label>لا تملأ هذا الحقل<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <p class="err" role="alert"></p>
      <button class="btn btn-ink" type="submit">أرسل الاقتراح</button>
    </form></div>
  </div></section>`;
  const f = $('#sg-box form');
  f.addEventListener('submit', async ev => {
    ev.preventDefault();
    const fd = new FormData(f), err = $('.err', f), btn = $('button[type=submit]', f);
    err.textContent = '';
    const body = String(fd.get('body')).trim();
    if (body.length < 3) { err.textContent = 'اكتب اقتراحك أولاً.'; $('#s-body').focus(); return; }
    const done = () => { $('#sg-box').innerHTML = successBlock('وصل اقتراحك', 'شكراً لك. تقرأ إدارة النادي كل الاقتراحات.') + '<p style="text-align:center"><button class="btn btn-line" onclick="render()">أرسل اقتراحاً آخر</button></p>'; };
    if (fd.get('website')) return done(); // حماية بسيطة من الرسائل الآلية
    btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    const { error } = await sb.from('suggestions').insert({
      category: fd.get('cat'), body, name: String(fd.get('name')).trim() || null, contact: String(fd.get('contact')).trim() || null,
    });
    if (error) { err.textContent = errText(error); btn.disabled = false; btn.textContent = 'أرسل الاقتراح'; return; }
    done();
  });
}

function notFound() {
  main.innerHTML = `<div class="wrap section"><div class="empty"><b>الصفحة غير موجودة</b><a href="#/">العودة إلى الرئيسية</a></div></div>`;
}
