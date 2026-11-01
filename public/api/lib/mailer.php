<?php
declare(strict_types=1);
/** Запасной канал: письмо на sales@ через SMTP (минимальный клиент, STARTTLS/SSL) */
function smtp_send(array $c, string $to, string $subject, string $text): bool {
    $host = ($c['smtp_secure'] === 'ssl' ? 'ssl://' : '') . $c['smtp_host'];
    $fp = @stream_socket_client($host . ':' . $c['smtp_port'], $errno, $errstr, 8);
    if (!$fp) return false;
    stream_set_timeout($fp, 8);
    $read = function () use ($fp) { $r = ''; while (($l = fgets($fp, 515)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
    $cmd = function (string $s, string $expect) use ($fp, $read) { fwrite($fp, $s . "\r\n"); return str_starts_with($read(), $expect); };
    $read();
    $cmd('EHLO intekko.kz', '250');
    if ($c['smtp_secure'] === 'tls') { $cmd('STARTTLS', '220'); stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT); $cmd('EHLO intekko.kz', '250'); }
    if (!$cmd('AUTH LOGIN', '334') || !$cmd(base64_encode($c['smtp_user']), '334') || !$cmd(base64_encode($c['smtp_pass']), '235')) { fclose($fp); return false; }
    $ok = $cmd("MAIL FROM:<{$c['smtp_from']}>", '250') && $cmd("RCPT TO:<$to>", '25') && $cmd('DATA', '354');
    if ($ok) {
        $h = "From: INTEKKO site <{$c['smtp_from']}>\r\nTo: <$to>\r\nSubject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\nDate: " . date('r') . "\r\n";
        $ok = $cmd($h . "\r\n" . chunk_split(base64_encode($text)) . "\r\n.", '250');
    }
    $cmd('QUIT', '221');
    fclose($fp);
    return $ok;
}
