<?php
declare(strict_types=1);
function clean(mixed $v, int $max = 200): string {
    $s = is_string($v) ? $v : '';
    $s = trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', $s) ?? '');
    return mb_substr($s, 0, $max);
}
/** Возвращает [нормализованные данные, массив ошибок] */
function validate_lead(array $in): array {
    $e = [];
    $d = [
        'name' => clean($in['name'] ?? '', 80),
        'company' => clean($in['company'] ?? '', 120),
        'phone' => preg_replace('/\D/', '', (string)($in['phone'] ?? '')),
        'email' => clean($in['email'] ?? '', 120),
        'courses' => array_slice(array_map(fn($x) => clean($x, 80), (array)($in['courses'] ?? [])), 0, 20),
        'course_titles' => array_slice(array_map(fn($x) => clean($x, 200), (array)($in['course_titles'] ?? [])), 0, 20),
        'participants' => clean($in['participants'] ?? '', 10),
        'format' => clean($in['format'] ?? '', 40),
        'message' => clean($in['message'] ?? '', 1000),
        'schedule_id' => clean($in['schedule_id'] ?? '', 60),
        'course_slug' => clean($in['course_slug'] ?? '', 80),
        'context' => clean($in['context'] ?? '', 300),
        'page_url' => clean($in['page_url'] ?? '', 500),
        'referrer' => clean($in['referrer'] ?? '', 500),
    ];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as $k) $d[$k] = clean($in[$k] ?? '', 200);
    if (mb_strlen($d['name']) < 2) $e['name'] = 'Укажите имя';
    if (!preg_match('/^7[67]\d{9}$/', $d['phone'])) $e['phone'] = 'Неверный номер телефона';
    $d['phone'] = '+' . $d['phone'];
    if ($d['email'] !== '' && !filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $e['email'] = 'Неверный email';
    return [$d, $e];
}
