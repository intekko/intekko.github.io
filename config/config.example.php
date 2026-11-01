<?php
// Скопируйте в config.php ВНЕ webroot (например, /home/USER/config.php) и заполните. В Git не коммитить.
return [
    'bitrix_webhook' => 'https://YOUR.bitrix24.kz/rest/1/XXXXXXXXXXXX',  // входящий вебхук с правом CRM
    'bitrix_dry_run' => true,                                           // true — лид не создаётся, payload пишется в лог
    'bitrix_assigned_by_id' => 1,
    'bitrix_uf' => ['course' => 'UF_CRM_COURSE', 'schedule_date' => 'UF_CRM_SCHEDULE_DATE', 'city' => 'UF_CRM_CITY', 'participants' => 'UF_CRM_PARTICIPANTS'],
    'schedule_csv_url' => 'https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv',
    'smartcaptcha_server_key' => '',
    'fallback_email' => 'sales@intekko.kz',
    'smtp_host' => 'mail.hoster.kz', 'smtp_port' => 465, 'smtp_secure' => 'ssl',
    'smtp_user' => 'site@intekko.kz', 'smtp_pass' => '', 'smtp_from' => 'site@intekko.kz',
    'storage_dir' => __DIR__ . '/intekko-data',                         // логи и кэш — вне webroot, срок хранения логов 30 дней
    'allowed_origins' => ['https://intekko.kz', 'https://www.intekko.kz', 'https://new.intekko.kz'],
];
