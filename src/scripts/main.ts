// INTEKKO — клиентский JS: меню, модалка, форма заявки, график, каталог, счётчики.
type CI = { s: string; t: string; st: string; d: string; k: string; u: string; f: string[]; c: string; cs: string };
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as T[];
const INDEX: CI[] = JSON.parse($('#course-index')?.textContent || '[]');
const bySlug = new Map(INDEX.map((c) => [c.s, c]));
const store = {
  get(k: string) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { sessionStorage.setItem(k, v); } catch { /* приватный режим */ } },
};

/* ---------- UTM и цели Метрики ---------- */
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const qs = new URLSearchParams(location.search);
if (UTM.some((k) => qs.get(k))) store.set('utm', JSON.stringify(Object.fromEntries(UTM.map((k) => [k, qs.get(k) || '']))));
if (!store.get('ref') && document.referrer && !document.referrer.includes(location.host)) store.set('ref', document.referrer);
function goal(name: string) {
  const w = window as any;
  const id = w.__METRIKA_ID;
  if (id && typeof w.ym === 'function') w.ym(id, 'reachGoal', name);
}
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-goal]') as HTMLElement | null;
  if (el) goal(el.dataset.goal!);
});

/* ---------- Мобильное меню и мега-меню ---------- */
const burger = $('[data-burger]');
const mm = $('#mobile-menu');
burger?.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(open));
  mm!.hidden = !open;
  mm!.classList.toggle('is-open', open);
  document.body.classList.toggle('no-scroll', open);
});
mm?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a,button')) { burger?.setAttribute('aria-expanded', 'false'); mm.hidden = true; mm.classList.remove('is-open'); document.body.classList.remove('no-scroll'); } });
$$('[data-dd]').forEach((dd) => {
  const btn = $('button', dd)!;
  btn.addEventListener('click', () => { const o = !dd.classList.contains('is-open'); dd.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', (e) => { if (!dd.contains(e.target as Node)) { dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
  dd.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') { dd.classList.remove('is-open'); btn.focus(); } });
});

/* ---------- Форма заявки ---------- */
function ensureChip(form: HTMLFormElement, slug: string, title?: string) {
  if (!slug) return;
  let input = $$<HTMLInputElement>('input[name="courses"]', form).find((i) => i.value === slug);
  if (!input) {
    const box = $('[data-chips]', form)!;
    const label = document.createElement('label');
    input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'courses'; input.value = slug;
    const span = document.createElement('span');
    span.textContent = title || bySlug.get(slug)?.st || slug;
    label.append(input, span);
    box.prepend(label);
  }
  input.checked = true;
}
function resetContext(form: HTMLFormElement) {
  $$<HTMLInputElement>('input[name="courses"]', form).forEach((i) => (i.checked = false));
  (form.elements.namedItem('schedule_id') as HTMLInputElement).value = '';
  (form.elements.namedItem('course_slug') as HTMLInputElement).value = '';
  $('[data-context]', form)!.textContent = '';
}
function formatPhone(v: string) {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}
function setErr(input: Element, msg: string) {
  const f = input.closest('.field');
  if (!f) return;
  f.classList.toggle('has-error', !!msg);
  const e = $('.field__err', f);
  if (e) e.textContent = msg;
  (input as HTMLElement).setAttribute('aria-invalid', String(!!msg));
}
function validate(form: HTMLFormElement, field?: string) {
  const el = form.elements;
  const name = el.namedItem('name') as HTMLInputElement;
  const phone = el.namedItem('phone') as HTMLInputElement;
  const email = el.namedItem('email') as HTMLInputElement | null;
  const consent = el.namedItem('consent') as HTMLInputElement;
  let ok = true;
  const check = (key: string, input: HTMLInputElement | null, msg: string) => {
    if (!input) return;
    if (field && field !== key) return;
    setErr(input, msg); if (msg) ok = false;
  };
  const n = name.value.trim();
  check('name', name, n.length < 2 ? 'Укажите имя (от 2 символов)' : n.length > 80 ? 'Слишком длинное имя' : '');
  const digits = phone.value.replace(/\D/g, '');
  check('phone', phone, !/^7[67]\d{9}$/.test(digits) ? 'Укажите номер в формате +7 (7XX) XXX-XX-XX' : '');
  if (email) check('email', email, email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value) ? 'Проверьте email' : '');
  if (!field || field === 'consent') {
    const ce = $('[data-consent-err]', form)!;
    ce.textContent = consent.checked ? '' : 'Нужно согласие на обработку персональных данных';
    if (!consent.checked) ok = false;
  }
  return ok;
}
function collect(form: HTMLFormElement) {
  const fd = new FormData(form);
  const coursesSel = fd.getAll('courses').map(String);
  const utm = JSON.parse(store.get('utm') || '{}');
  return {
    name: String(fd.get('name') || '').trim(), company: String(fd.get('company') || '').trim(),
    phone: '+' + String(fd.get('phone') || '').replace(/\D/g, ''), email: String(fd.get('email') || '').trim(),
    courses: coursesSel, course_titles: coursesSel.map((s) => (s === 'consulting' ? 'Консалтинг' : bySlug.get(s)?.t || s)),
    participants: String(fd.get('participants') || ''), format: String(fd.get('format') || ''),
    message: String(fd.get('message') || '').trim().slice(0, 1000), schedule_id: String(fd.get('schedule_id') || ''),
    course_slug: String(fd.get('course_slug') || ''), context: $('[data-context]', form)?.textContent || '',
    page_url: location.href, referrer: store.get('ref') || document.referrer, website: String(fd.get('website') || ''), ...utm,
  };
}
async function timedFetch(url: string, init: RequestInit, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); } finally { clearTimeout(t); }
}
async function sendPrimary(url: string, lead: ReturnType<typeof collect>) {
  try {
    const res = await timedFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
    return res.ok && (res.headers.get('content-type') || '').includes('json') && (await res.json()).ok === true;
  } catch { return false; }
}
async function sendEmail(url: string, lead: ReturnType<typeof collect>) {
  const course = lead.course_titles.length ? lead.course_titles.join(', ') : 'консультация';
  const body = {
    _subject: `Заявка с сайта: ${course}${lead.context && lead.schedule_id ? ' [' + lead.context.replace(/^(Запись|Курс):\s*/, '') + ']' : ''}`,
    _template: 'table',
    _honey: lead.website,
    'Имя': lead.name,
    'Телефон': lead.phone,
    'Email': lead.email || '—',
    'Компания': lead.company || '—',
    'Курс / услуга': course,
    'Дата из графика': lead.context || '—',
    'Участников': lead.participants || '—',
    'Формат': lead.format || '—',
    'Сообщение': lead.message || '—',
    'Страница': lead.page_url,
    'Источник перехода': lead.referrer || '—',
    'UTM': [lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_term, lead.utm_content].filter(Boolean).join(' / ') || '—',
  };
  try {
    const res = await timedFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }, 12000);
    if (!res.ok) return false;
    const j = await res.json();
    return j.success === true || j.success === 'true';
  } catch { return false; }
}

function successView(form: HTMLFormElement, lead: ReturnType<typeof collect>, demo: boolean) {
  const wa = ($('.header__wa') as HTMLAnchorElement | null)?.href || 'https://wa.me/77085550123';
  const text = encodeURIComponent(
    `Здравствуйте! Заявка с сайта INTEKKO.\nИмя: ${lead.name}\nТелефон: ${lead.phone}` +
    (lead.company ? `\nКомпания: ${lead.company}` : '') +
    (lead.course_titles.length ? `\nКурс: ${lead.course_titles.join(', ')}` : '') +
    (lead.context ? `\n${lead.context}` : '') + (lead.participants ? `\nУчастников: ${lead.participants}` : '') +
    (lead.message ? `\nСообщение: ${lead.message}` : ''));
  const box = document.createElement('div');
  box.className = 'form-success';
  box.setAttribute('role', 'status');
  box.innerHTML = `<span class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
    <h3>${demo ? 'Почти готово' : 'Спасибо'}, ${lead.name.replace(/[<>&"]/g, '')}!</h3>
    ${demo ? '' : '<p class="muted">Мы свяжемся с вами в течение рабочего дня.</p>'}
    ${demo ? `<p class="demo-note">Не удалось отправить заявку автоматически. Чтобы она точно дошла, отправьте её в WhatsApp одной кнопкой — текст уже заполнен.</p>` : ''}
    <a class="btn btn--wa" href="${wa}?text=${text}" target="_blank" rel="noopener" data-goal="click_whatsapp">Отправить в WhatsApp</a>`;
  form.replaceWith(box);
}
$$<HTMLFormElement>('[data-lead-form]').forEach((form) => {
  const phone = $<HTMLInputElement>('[data-phone]', form)!;
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
  phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });
  phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; else validate(form, 'phone'); });
  (form.elements.namedItem('name') as HTMLInputElement).addEventListener('blur', () => validate(form, 'name'));
  (form.elements.namedItem('email') as HTMLInputElement | null)?.addEventListener('blur', () => validate(form, 'email'));
  const search = $<HTMLInputElement>('[data-course-search]', form);
  search?.addEventListener('change', () => {
    const v = search.value.trim().toLowerCase();
    const hit = INDEX.find((c) => c.st.toLowerCase() === v || c.t.toLowerCase() === v);
    if (hit) { ensureChip(form, hit.s, hit.st); search.value = ''; }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form)) { ($('[aria-invalid="true"]', form) as HTMLElement | null)?.focus(); return; }
    const lead = collect(form);
    if (lead.website) return; // honeypot
    const btn = $<HTMLButtonElement>('button[type="submit"]', form)!;
    btn.disabled = true; btn.textContent = 'Отправляем…';
    goal('form_submit');
    // 1) Боевой обработчик (hoster.kz: Bitrix24 + запасной SMTP)
    if (await sendPrimary(form.dataset.endpoint!, lead)) { location.href = form.dataset.thanks!; return; }
    // 2) Временный канал: письмо через FormSubmit (статический хостинг)
    if (form.dataset.emailEndpoint && (await sendEmail(form.dataset.emailEndpoint, lead))) { location.href = form.dataset.thanks!; return; }
    // 3) Ничего не дошло — честно предлагаем WhatsApp
    successView(form, lead, true);
  });
});

/* ---------- Модальное окно ---------- */
const modal = $('#lead-modal');
let lastFocus: HTMLElement | null = null;
function openModal(trigger: HTMLElement) {
  if (!modal) return;
  const form = $<HTMLFormElement>('form', modal);
  if (form) {
    resetContext(form);
    const d = trigger.dataset;
    if (d.course) { ensureChip(form, d.course, d.title); (form.elements.namedItem('course_slug') as HTMLInputElement).value = d.course; }
    if (d.schedule) (form.elements.namedItem('schedule_id') as HTMLInputElement).value = d.schedule;
    const ctx = [d.title || (d.course && bySlug.get(d.course)?.st) || '', d.date || '', d.city || ''].filter(Boolean);
    $('[data-context]', form)!.textContent = d.schedule ? `Запись: ${ctx.join(' · ')}` : d.course ? `Курс: ${ctx.join(' · ')}` : '';
  }
  lastFocus = trigger;
  modal.hidden = false;
  modal.classList.add('is-open');
  document.body.classList.add('no-scroll');
  setTimeout(() => ($('input:not([type=hidden]):not([type=checkbox])', modal) as HTMLElement | null)?.focus(), 30);
}
function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open'); modal.hidden = true;
  document.body.classList.remove('no-scroll');
  lastFocus?.focus();
}
document.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest('[data-lead]') as HTMLElement | null;
  if (t && !t.closest('#lead-modal')) { e.preventDefault(); openModal(t); }
});
modal?.addEventListener('click', (e) => { if (e.target === modal || (e.target as HTMLElement).closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (!modal?.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    const f = $$('a[href],button:not([disabled]),input:not([type=hidden]):not(.hp input),select,textarea', modal).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

/* ---------- Появление и счётчики ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target as HTMLElement;
    el.classList.add('is-in');
    if (el.dataset.count) countUp(el);
    io!.unobserve(el);
  });
}, { rootMargin: '0px 0px -8% 0px' }) : null;
function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (reduce || innerWidth < 768) return;
  const t0 = performance.now(); const dur = 1100;
  const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/ /g, ' ');
  const step = (t: number) => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
$$('.reveal,[data-count]').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

/* ---------- График ---------- */
const today = new Date().toISOString().slice(0, 10);
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const range = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = (b || a).split('-').map(Number);
  if (a === b || !b) return `${d1} ${MONTHS[m1 - 1]} ${y1} г.`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1} г.`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y1} г.`;
  return `${d1} ${MONTHS[m1 - 1]} ${y1} – ${d2} ${MONTHS[m2 - 1]} ${y2} г.`;
};
const ST: Record<string, [string, string]> = { open: ['Набор открыт', 'badge--open'], few_seats: ['Мало мест', 'badge--few'], planned: ['Планируется', 'badge--planned'], closed: ['Набор закрыт', 'badge--closed'] };
const CITY: Record<string, string> = { 'Астана': 'astana', 'Алматы': 'almaty', 'Атырау': 'atyrau', 'Актау': 'aktau', 'Караганда': 'karaganda', 'Шымкент': 'shymkent', 'Дистанционно': 'online' };
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ICAL = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
const IPIN = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
type SI = { id: string; course_slug: string; start_date: string; end_date: string; country: string; city: string; format: string; status: string; seats_left?: number | null; note?: string };
function renderSchedule(root: HTMLElement, items: SI[]) {
  const limit = Number(root.dataset.limit || 0);
  const only = root.dataset.course;
  const dir = root.dataset.direction;
  let list = items.filter((s) => bySlug.has(s.course_slug) && (s.end_date || s.start_date) >= today && (!only || s.course_slug === only) && (!dir || bySlug.get(s.course_slug)!.d === dir))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (limit) list = list.slice(0, limit);
  const attrs = (s: SI, c: CI) => `data-item data-dir="${c.d}" data-course="${c.s}" data-city="${esc(CITY[s.city] || s.city.toLowerCase())}" data-format="${/дистанц|виртуал/i.test(s.format) ? 'online' : 'offline'}" data-month="${s.start_date.slice(0, 7)}" data-end="${s.end_date || s.start_date}"`;
  const btn = (s: SI, c: CI, cls: string) => s.status === 'closed' ? `<button class="btn ${cls}" disabled>Записаться</button>` :
    `<button class="btn btn--primary ${cls}" type="button" data-lead data-course="${c.s}" data-title="${esc(c.st)}" data-schedule="${esc(s.id)}" data-date="${esc(range(s.start_date, s.end_date))}" data-city="${esc(s.city)}" data-goal="schedule_signup">Записаться</button>`;
  $('[data-rows]', root)!.innerHTML = list.map((s) => {
    const c = bySlug.get(s.course_slug)!; const [l, cls] = ST[s.status] || ST.planned;
    return `<tr ${attrs(s, c)}><td class="sched-course"><a href="${c.u}">${esc(c.st)}</a><small>${esc(s.note || '')}</small></td><td><span class="with-ico">${ICAL}${range(s.start_date, s.end_date)}</span></td><td>${esc(s.country)}</td><td><span class="with-ico">${IPIN}${esc(s.city)}</span></td><td>${esc(s.format)}</td><td><span class="badge ${cls}">${l}</span>${s.seats_left ? `<small class="muted" style="display:block;font-size:12.5px;margin-top:4px">осталось мест: ${s.seats_left}</small>` : ''}</td><td style="text-align:right">${btn(s, c, 'btn--sm')}</td></tr>`;
  }).join('');
  $('[data-cards]', root)!.innerHTML = list.map((s) => {
    const c = bySlug.get(s.course_slug)!; const [l, cls] = ST[s.status] || ST.planned;
    return `<article class="card sched-card" ${attrs(s, c)}><div class="badges"><span class="badge ${cls}">${l}</span>${s.seats_left ? `<span class="badge">мест: ${s.seats_left}</span>` : ''}</div><h3><a href="${c.u}">${esc(c.st)}</a></h3><div class="meta"><span class="with-ico">${ICAL}${range(s.start_date, s.end_date)}</span><span class="with-ico">${IPIN}${esc(s.city)}</span><span>${esc(s.format)}</span></div>${btn(s, c, 'btn--block')}</article>`;
  }).join('');
}
function applyScheduleFilters(root: HTMLElement) {
  const form = $<HTMLFormElement>('[data-filters]', root);
  const f = form ? Object.fromEntries(new FormData(form)) as Record<string, string> : {};
  const map: Record<string, string> = { dir: 'dir', course: 'course', city: 'city', format: 'format', month: 'month' };
  let visible = 0;
  $$('[data-item]', root).forEach((el) => {
    const past = (el.dataset.end || '') < today;
    const pass = !past && Object.entries(map).every(([k, a]) => !f[k] || el.dataset[a] === f[k]);
    el.hidden = !pass;
    if (pass && el.tagName === 'TR') visible++;
  });
  const table = $('.sched-table', root) as HTMLElement;
  table.style.visibility = visible ? '' : 'hidden';
  table.style.position = visible ? '' : 'absolute';
  $('[data-empty]', root)!.hidden = visible > 0;
  if (form) {
    const p = new URLSearchParams(location.search);
    Object.keys(map).forEach((k) => (f[k] ? p.set(k, f[k]) : p.delete(k)));
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
}
$$('[data-schedule-root]').forEach(async (root) => {
  const form = $<HTMLFormElement>('[data-filters]', root);
  if (form) {
    const p = new URLSearchParams(location.search);
    ['dir', 'course', 'city', 'format', 'month'].forEach((k) => { const v = p.get(k); const s = form.elements.namedItem(k) as HTMLSelectElement | null; if (v && s) s.value = v; });
    form.addEventListener('change', () => applyScheduleFilters(root));
    form.addEventListener('reset', () => setTimeout(() => applyScheduleFilters(root)));
  }
  applyScheduleFilters(root);
  // Живое обновление из /api/schedule.php (на боевом хостинге). На статическом хостинге остаётся снимок.
  try {
    const res = await fetch(root.dataset.endpoint!, { headers: { Accept: 'application/json' } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return;
    const data = await res.json();
    if (Array.isArray(data.items)) { renderSchedule(root, data.items); applyScheduleFilters(root); }
  } catch { /* снимок остаётся */ }
});

/* ---------- Каталог: поиск и фильтры ---------- */
const cat = $('[data-catalog]');
if (cat) {
  const input = $<HTMLInputElement>('[data-cat-search]', cat)!;
  const selDir = $<HTMLSelectElement>('[name="cdir"]', cat)!;
  const selFmt = $<HTMLSelectElement>('[name="cfmt"]', cat)!;
  const selCert = $<HTMLSelectElement>('[name="ccert"]', cat)!;
  let fuse: any = null;
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
  async function ensureFuse() {
    if (fuse) return fuse;
    const { default: Fuse } = await import('fuse.js');
    fuse = new Fuse(INDEX.map((c) => ({ ...c, t: norm(c.t), st: norm(c.st), k: norm(c.k) })), { keys: [{ name: 'st', weight: 2 }, { name: 't', weight: 1.5 }, { name: 'k', weight: 2 }], threshold: 0.22, ignoreLocation: true, minMatchCharLength: 2 });
    return fuse;
  }
  async function run() {
    const q = norm(input.value.trim());
    let hits: Set<string> | null = null;
    if (q.length >= 2) {
      const f = await ensureFuse();
      hits = new Set<string>(f.search(q).map((r: any) => r.item.s));
      INDEX.forEach((c) => { if (norm(c.t).includes(q) || norm(c.st).includes(q) || norm(c.k).includes(q)) hits!.add(c.s); });
    }
    let total = 0;
    $$('[data-cat-group]', cat).forEach((g) => {
      let n = 0;
      $$('[data-course-row]', g).forEach((r) => {
        const ok = (!hits || hits.has(r.dataset.slug!)) && (!selDir.value || r.dataset.dir === selDir.value) &&
          (!selFmt.value || r.dataset.formats!.split(' ').includes(selFmt.value)) &&
          (!selCert.value || (selCert.value === 'intl' ? ['rospa', 'iosh', 'nebosh'].includes(r.dataset.cert!) : r.dataset.cert === selCert.value));
        r.hidden = !ok; if (ok) n++;
      });
      $$('[data-sub]', g).forEach((s) => { s.hidden = !$$('[data-course-row]', s).some((r) => !r.hidden); });
      g.hidden = n === 0;
      const filtered = !!(hits || selDir.value || selFmt.value || selCert.value);
      if (filtered && n) (g as HTMLDetailsElement).open = true;
      $('[data-count-label]', g)!.textContent = filtered ? `найдено: ${n}` : `${n} курсов`;
      total += n;
    });
    $('[data-no-results]', cat)!.style.display = total ? 'none' : 'block';
  }
  let t: number;
  input.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(run, 120); });
  [selDir, selFmt, selCert].forEach((s) => s.addEventListener('change', run));
  const q0 = new URLSearchParams(location.search).get('q');
  if (q0) { input.value = q0; run(); }
}
