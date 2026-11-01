# INTEKKO — сайт учебного центра (intekko.kz)

Статический сайт на **Astro 5** + PHP-обработчики для заявок (Bitrix24) и графика (Google Таблица). Техзадание — [`PRD.md`](PRD.md).

**Превью:** https://intekko.github.io/

## Быстрый старт
```bash
npm ci
npm run dev      # http://localhost:4321
npm run build    # проверка данных + сборка в dist/
```

## Структура
- `src/data/courses.json` — каталог (136 курсов, 6 направлений; сгенерирован из Приложения А PRD скриптом `scripts/build-courses.py`)
- `src/data/site.json` — контакты (E.164, проверяются при сборке), цифры, аккредитации
- `src/data/schedule.snapshot.json` — снимок графика (`npm run fetch-schedule` при заданном `SCHEDULE_CSV_URL`)
- `src/pages/` — главная, каталог, направления, 10 страниц флагманских курсов, график, консалтинг, о нас, контакты, политика, спасибо, 404
- `public/api/` — `lead.php` (Bitrix24 + запасной SMTP, honeypot, rate-limit, SmartCaptcha), `schedule.php` (CSV → JSON, кэш 15 минут)
- `config/config.example.php` — шаблон конфига (секреты только на сервере вне webroot)
- `docs/manager-guide.md`, `docs/deploy.md`

## Статус относительно PRD
Готово: этапы 1–3, 6–8 и клиентская часть 4–5. Требуют доступов заказчика: вебхук Bitrix24, Google Таблица, hoster.kz, счётчик Метрики (`metrikaId` в `site.json`), текст политики ПДн, подтверждение контактов/адреса и прав на логотипы клиентов (PRD §14).
