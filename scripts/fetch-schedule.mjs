// Снимок графика из опубликованной Google Таблицы (CSV) → src/data/schedule.snapshot.json
// Использование: SCHEDULE_CSV_URL="https://docs.google.com/.../pub?output=csv" npm run fetch-schedule
import { writeFileSync, readFileSync } from 'node:fs';
const url = process.env.SCHEDULE_CSV_URL;
if (!url) { console.log('SCHEDULE_CSV_URL не задан — используется текущий снимок.'); process.exit(0); }
const { courses } = JSON.parse(readFileSync(new URL('../src/data/courses.json', import.meta.url)));
const known = new Set(courses.map(c => c.slug));
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const [head, ...rows] = parseCSV(await res.text());
  const items = [];
  for (const r of rows) {
    const o = Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()]));
    if (String(o.published).toUpperCase() !== 'TRUE') continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.start_date) || !known.has(o.course_slug)) { console.warn('Пропущена строка', o.id); continue; }
    if (!o.end_date || o.end_date < o.start_date) o.end_date = o.start_date;
    o.seats_left = o.seats_left ? Number(o.seats_left) : null;
    delete o.published; items.push(o);
  }
  writeFileSync(new URL('../src/data/schedule.snapshot.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), source: 'google-sheets', items }, null, 2));
  console.log(`Снимок графика обновлён: ${items.length} строк`);
} catch (e) { console.warn('Google Таблица недоступна, оставлен прежний снимок:', e.message); }
