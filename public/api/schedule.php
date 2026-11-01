<?php
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
cors($CONFIG);
$cache = $CONFIG['storage_dir'] . '/schedule-cache.json';
$ttl = 15 * 60;
if (is_file($cache) && filemtime($cache) > time() - $ttl) { header('Cache-Control: public, max-age=300'); json_out(json_decode((string)file_get_contents($cache), true)); }

$ch = curl_init($CONFIG['schedule_csv_url']);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 8]);
$csv = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($csv === false || $code !== 200) {
    // Google недоступен — отдаём последнюю удачную копию
    if (is_file($cache)) json_out(json_decode((string)file_get_contents($cache), true));
    json_out(['items' => [], 'error' => 'source_unavailable'], 503);
}
$rows = array_map('str_getcsv', preg_split('/\r\n|\n|\r/', trim($csv)));
$head = array_map('trim', array_shift($rows));
$today = date('Y-m-d');
$items = [];
$allowedStatus = ['open', 'few_seats', 'planned', 'closed'];
foreach ($rows as $i => $r) {
    if (count($r) < 3) continue;
    $o = array_combine($head, array_pad(array_map('trim', $r), count($head), ''));
    if (strtoupper((string)($o['published'] ?? '')) !== 'TRUE') continue;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $o['start_date'] ?? '') || empty($o['course_slug'])) { log_line($CONFIG['storage_dir'] . '/schedule-errors.log', ['row' => $i + 2, 'id' => $o['id'] ?? '']); continue; }
    if (empty($o['end_date']) || $o['end_date'] < $o['start_date']) $o['end_date'] = $o['start_date'];
    if ($o['end_date'] < $today) continue;
    if (!in_array($o['status'] ?? '', $allowedStatus, true)) $o['status'] = 'planned';
    $items[] = ['id' => $o['id'], 'course_slug' => $o['course_slug'], 'start_date' => $o['start_date'], 'end_date' => $o['end_date'],
        'country' => $o['country'] ?? '', 'city' => $o['city'] ?? '', 'format' => $o['format'] ?? '', 'language' => $o['language'] ?? 'RU',
        'status' => $o['status'], 'seats_left' => ($o['seats_left'] ?? '') !== '' ? (int)$o['seats_left'] : null, 'note' => $o['note'] ?? ''];
}
usort($items, fn($a, $b) => strcmp($a['start_date'], $b['start_date']));
$out = ['generatedAt' => date('c'), 'items' => $items];
file_put_contents($cache, json_encode($out, JSON_UNESCAPED_UNICODE), LOCK_EX);
json_out($out);
