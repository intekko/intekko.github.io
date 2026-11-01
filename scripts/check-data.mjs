// Проверка данных перед сборкой: телефоны в формате E.164 (+7 и 10 цифр), уникальность slug, ссылки графика на курсы.
import { readFileSync } from 'node:fs';
const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url)));
const { courses } = JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url)));
const sched = JSON.parse(readFileSync(new URL('../src/data/schedule.snapshot.json', import.meta.url)));
const errors = [];
for (const p of site.phones) if (!/^\+7\d{10}$/.test(p.e164)) errors.push(`Неверный номер телефона: ${p.e164}`);
if (!/^\+7(7\d{2})/.test(site.phones[0].e164)) errors.push('Основной номер должен быть мобильным KZ (+77xx…)');
const slugs = new Set();
for (const c of courses) { if (slugs.has(c.slug)) errors.push(`Дубль slug: ${c.slug}`); slugs.add(c.slug); }
for (const s of sched.items) if (!slugs.has(s.course_slug)) console.warn(`[schedule] неизвестный course_slug пропущен: ${s.course_slug}`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`check-data: OK (${courses.length} курсов, ${site.phones.length} телефон(а))`);
