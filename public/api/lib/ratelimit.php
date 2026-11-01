<?php
declare(strict_types=1);
/** Не больше $max запросов с IP за $window секунд (файловое хранилище вне webroot) */
function rate_limited(string $dir, string $ip, int $max = 5, int $window = 600): bool {
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $f = $dir . '/' . hash('sha256', $ip) . '.json';
    $now = time();
    $hits = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $hits = array_values(array_filter($hits, fn($t) => $t > $now - $window));
    if (count($hits) >= $max) return true;
    $hits[] = $now;
    file_put_contents($f, json_encode($hits), LOCK_EX);
    return false;
}
