import data from '../data/courses.json';
import schedule from '../data/schedule.snapshot.json';

export type Course = (typeof data.courses)[number];
export type Direction = (typeof data.directions)[number];
export const directions = [...data.directions].sort((a, b) => a.order - b.order);
export const courses = data.courses as Course[];

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Ссылка с учётом base-пути (GitHub Pages / hoster.kz) */
export const url = (p: string) => (p.startsWith('http') || p.startsWith('#') ? p : base + (p.startsWith('/') ? p : '/' + p));

export const dirBySlug = (s: string) => directions.find((d) => d.slug === s)!;
export const courseBySlug = (s: string) => courses.find((c) => c.slug === s);
export const courseUrl = (c: Course) => (c.hasPage ? url(`/courses/${c.direction}/${c.slug}/`) : url(`/courses/${c.direction}/#${c.slug}`));

export const FORMAT_LABEL: Record<string, string> = { center: 'Очно в центре', onsite: 'Выезд к заказчику', webinar: 'Онлайн-вебинар', elearning: 'E-learning' };
export const CERT_LABEL: Record<string, string> = { rospa: 'Сертификат RoSPA', iosh: 'Сертификат IOSH', nebosh: 'NEBOSH', kz: 'Удостоверение РК', intekko: 'Сертификат INTEKKO' };
export const LANG_LABEL: Record<string, string> = { ru: 'Русский', kk: 'Казахский', en: 'Английский' };
export const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Набор открыт', cls: 'badge--open' },
  few_seats: { label: 'Мало мест', cls: 'badge--few' },
  planned: { label: 'Планируется', cls: 'badge--planned' },
  closed: { label: 'Набор закрыт', cls: 'badge--closed' },
};

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export function formatRange(a: string, b: string) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = (b || a).split('-').map(Number);
  if (a === b || !b) return `${d1} ${MONTHS[m1 - 1]} ${y1} г.`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1} г.`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y1} г.`;
  return `${d1} ${MONTHS[m1 - 1]} ${y1} – ${d2} ${MONTHS[m2 - 1]} ${y2} г.`;
}

export type ScheduleItem = (typeof schedule.items)[number];
const today = new Date().toISOString().slice(0, 10);
/** Актуальный график: только будущие даты с известным курсом, по дате начала */
export const upcoming = (schedule.items as ScheduleItem[])
  .filter((s) => (s.end_date || s.start_date) >= today && courseBySlug(s.course_slug))
  .sort((a, b) => a.start_date.localeCompare(b.start_date));

export const cityKey = (c: string) => ({ 'Астана': 'astana', 'Алматы': 'almaty', 'Атырау': 'atyrau', 'Актау': 'aktau', 'Караганда': 'karaganda', 'Шымкент': 'shymkent', 'Дистанционно': 'online' } as Record<string, string>)[c] || c.toLowerCase();
export const formatKey = (f: string) => (/дистанц|виртуал/i.test(f) ? 'online' : 'offline');

/** Компактный индекс курсов для клиентского JS (поиск, график, форма) */
export const courseIndex = courses.map((c) => ({ s: c.slug, t: c.title, st: c.shortTitle, d: c.direction, k: c.keywords.join(' '), u: courseUrl(c), f: c.formats, c: c.certificate, cs: c.status }));
