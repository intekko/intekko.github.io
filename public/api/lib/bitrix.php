<?php
declare(strict_types=1);
/**
 * Адаптер Bitrix24 (облако, входящий вебхук crm.lead.add).
 * При переходе на коробочный «1С-Битрикс» меняется только эта функция.
 */
function bitrix_build_fields(array $d, array $cfg): array {
    $what = $d['course_titles'] ? implode(', ', $d['course_titles']) : 'консультация';
    $ctx = $d['context'] ? preg_replace('/^(Запись|Курс):\s*/u', '', $d['context']) : '';
    $title = 'Заявка с сайта: ' . $what . ($d['schedule_id'] && $ctx ? " [$ctx]" : '');
    $comments = implode("\n", array_filter([
        $d['message'] ? 'Сообщение: ' . $d['message'] : '',
        $d['course_titles'] ? 'Курсы: ' . implode(', ', $d['course_titles']) : '',
        $d['participants'] ? 'Участников: ' . $d['participants'] : '',
        $d['format'] ? 'Формат: ' . $d['format'] : '',
        $d['schedule_id'] ? 'Дата из графика: ' . $d['schedule_id'] . ($ctx ? " ($ctx)" : '') : '',
        'Страница: ' . $d['page_url'],
        $d['referrer'] ? 'Источник перехода: ' . $d['referrer'] : '',
    ]));
    $f = [
        'TITLE' => mb_substr($title, 0, 250), 'NAME' => $d['name'], 'COMPANY_TITLE' => $d['company'],
        'PHONE' => [['VALUE' => $d['phone'], 'VALUE_TYPE' => 'WORK']],
        'COMMENTS' => $comments, 'SOURCE_ID' => 'WEB', 'SOURCE_DESCRIPTION' => $d['page_url'],
        'UTM_SOURCE' => $d['utm_source'], 'UTM_MEDIUM' => $d['utm_medium'], 'UTM_CAMPAIGN' => $d['utm_campaign'],
        'UTM_CONTENT' => $d['utm_content'], 'UTM_TERM' => $d['utm_term'],
    ];
    if ($d['email']) $f['EMAIL'] = [['VALUE' => $d['email'], 'VALUE_TYPE' => 'WORK']];
    if (!empty($cfg['bitrix_assigned_by_id'])) $f['ASSIGNED_BY_ID'] = (int)$cfg['bitrix_assigned_by_id'];
    $uf = $cfg['bitrix_uf'] ?? [];
    if (!empty($uf['course'])) $f[$uf['course']] = $d['course_slug'] ?: implode(',', $d['courses']);
    if (!empty($uf['schedule_date'])) $f[$uf['schedule_date']] = $d['schedule_id'];
    if (!empty($uf['city'])) $f[$uf['city']] = $ctx;
    if (!empty($uf['participants'])) $f[$uf['participants']] = $d['participants'];
    return $f;
}
/** @return array{ok:bool, id?:int, error?:string} */
function bitrix_lead_add(array $fields, array $cfg): array {
    $url = rtrim($cfg['bitrix_webhook'], '/') . '/crm.lead.add.json';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5, CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['fields' => $fields, 'params' => ['REGISTER_SONET_EVENT' => 'Y']], JSON_UNESCAPED_UNICODE),
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($body === false) return ['ok' => false, 'error' => 'curl: ' . $err];
    $j = json_decode((string)$body, true);
    if ($code !== 200 || !isset($j['result'])) return ['ok' => false, 'error' => "http $code: " . mb_substr((string)$body, 0, 300)];
    return ['ok' => true, 'id' => (int)$j['result']];
}
