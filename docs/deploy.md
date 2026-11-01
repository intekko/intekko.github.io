# Деплой и настройка

## Сейчас: превью на GitHub Pages
- Адрес: https://intekko.github.io/
- Каждый push в `main` и ежедневно в 06:17 (Астана) workflow `pages.yml` собирает Astro и публикует `dist/`.
- На GitHub Pages нет PHP, поэтому форма работает в демо-режиме: после отправки пользователь видит «Спасибо» и кнопку «Отправить в WhatsApp» с текстом заявки. График показывается из снимка `src/data/schedule.snapshot.json` (сейчас — демонстрационные даты).
- Чтобы подтягивать график из Google Таблицы при сборке, задайте переменную репозитория `SCHEDULE_CSV_URL` (Settings → Secrets and variables → Actions → Variables).

## Боевой хостинг hoster.kz
1. Тариф: PHP ≥ 8.1 (curl, json, mbstring), Let's Encrypt, SFTP, cron, SMTP, `.htaccess`.
2. Скопировать `config/config.example.php` в `config.php` **вне webroot** (уровнем выше `public_html`) и заполнить: вебхук Bitrix24 (`crm.lead.add`), ссылку на CSV Google Таблицы, SMTP, ключ SmartCaptcha. Сначала `bitrix_dry_run => true`.
3. В GitHub → Settings → Secrets: `SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD`, `SFTP_PATH`; запустить workflow «Deploy to hoster.kz (SFTP)».
4. Проверить на `new.intekko.kz`: тестовая заявка → лид в Bitrix24 со всеми полями и UTM; при отключённом Bitrix — письмо на sales@intekko.kz.
5. Перенести DNS intekko.kz на hoster.kz (MX-записи почты не трогать), выпустить SSL, проверить редиректы из `.htaccess`.

## Bitrix24
Пользовательские поля лида: `UF_CRM_COURSE`, `UF_CRM_SCHEDULE_DATE`, `UF_CRM_CITY`, `UF_CRM_PARTICIPANTS` (коды настраиваются в `config.php`). Адаптер — `public/api/lib/bitrix.php`.
