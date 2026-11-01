<?php
declare(strict_types=1);
// Конфиг с секретами лежит ВНЕ webroot: ../../config.php относительно public_html/api или путь из INTEKKO_CONFIG.
$cfgPath = getenv('INTEKKO_CONFIG') ?: dirname(__DIR__, 3) . '/config.php';
if (!is_file($cfgPath)) { http_response_code(500); header('Content-Type: application/json'); echo json_encode(['ok' => false, 'error' => 'config_missing']); exit; }
$CONFIG = require $cfgPath;

function json_out(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function cors(array $cfg): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && in_array($origin, $cfg['allowed_origins'], true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}
function log_line(string $file, array $data): void {
    @file_put_contents($file, date('c') . ' ' . json_encode($data, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}
