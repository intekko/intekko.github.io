<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/validate.php';
require __DIR__ . '/lib/ratelimit.php';
require __DIR__ . '/lib/captcha.php';
require __DIR__ . '/lib/bitrix.php';
require __DIR__ . '/lib/mailer.php';

cors($CONFIG);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
$raw = file_get_contents('php://input', false, null, 0, 20000) ?: '';
$in = json_decode($raw, true);
if (!is_array($in)) json_out(['ok' => false, 'error' => 'bad_json'], 400);
if (!empty($in['website'])) json_out(['ok' => true]); // honeypot: делаем вид, что всё хорошо

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (rate_limited($CONFIG['storage_dir'] . '/ratelimit', $ip)) json_out(['ok' => false, 'error' => 'rate_limited'], 429);
if (!captcha_ok($CONFIG, (string)($in['smart_token'] ?? ''), $ip)) json_out(['ok' => false, 'error' => 'captcha'], 400);

[$lead, $errors] = validate_lead($in);
if ($errors) json_out(['ok' => false, 'errors' => $errors], 422);

$fields = bitrix_build_fields($lead, $CONFIG);
if (!empty($CONFIG['bitrix_dry_run'])) {
    log_line($CONFIG['storage_dir'] . '/leads-dryrun.log', $fields);
    json_out(['ok' => true, 'dry_run' => true]);
}
$res = bitrix_lead_add($fields, $CONFIG);
if (!$res['ok']) {
    // Запасной канал: письмо + лог (вне webroot). Пользователь всё равно видит «Спасибо».
    log_line($CONFIG['storage_dir'] . '/leads-failed.log', ['error' => $res['error'], 'fields' => $fields]);
    $text = $fields['TITLE'] . "\n\nИмя: {$lead['name']}\nТелефон: {$lead['phone']}\nEmail: {$lead['email']}\nКомпания: {$lead['company']}\n\n" . $fields['COMMENTS'];
    smtp_send($CONFIG, $CONFIG['fallback_email'], 'Заявка с сайта (Bitrix недоступен)', $text);
}
json_out(['ok' => true]);
