<?php
declare(strict_types=1);
/** Проверка токена Yandex SmartCaptcha (если ключ задан в конфиге) */
function captcha_ok(array $cfg, string $token, string $ip): bool {
    if (empty($cfg['smartcaptcha_server_key'])) return true;
    if ($token === '') return false;
    $ch = curl_init('https://smartcaptcha.yandexcloud.net/validate?' . http_build_query(['secret' => $cfg['smartcaptcha_server_key'], 'token' => $token, 'ip' => $ip]));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 3]);
    $r = json_decode((string)curl_exec($ch), true);
    curl_close($ch);
    return ($r['status'] ?? '') === 'ok' || $r === null; // при недоступности сервиса не блокируем заявку
}
