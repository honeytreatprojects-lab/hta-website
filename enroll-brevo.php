<?php
/**
 * enroll-brevo.php — receives a course enrolment from courses.html and hands it to Brevo
 * so Automation #2 sends the student their automated emails.
 *
 *  1. Creates / updates the contact (name, phone, course, centre) and, if BREVO_LIST_ID is set,
 *     adds them to that list  -> starts a "Contact added to list" automation.
 *  2. Sends a custom event (BREVO_EVENT_NAME)  -> starts a "Custom event" automation.
 *
 * The existing EmailJS notification to the centre is untouched; this runs alongside it.
 */
define('HTA_BREVO', true);
$cfg = __DIR__ . '/brevo-config.php';
if (!is_file($cfg)) { hta_out(500, ['ok' => false, 'error' => 'config_missing']); }
require $cfg;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function hta_out($code, $data) {
    http_response_code($code);
    if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
function hta_log($msg) { error_log('[HTA Brevo] ' . $msg); } // no personal data is logged

/* ---------- 1. Basic request checks ---------- */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { hta_out(405, ['ok' => false, 'error' => 'method']); }

$allowed = array_filter(array_map('trim', explode(',', strtolower(HTA_ALLOWED_HOSTS))));
$allowed = array_merge($allowed, ['localhost', '127.0.0.1']);
$src = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$srcHost = strtolower((string) parse_url($src, PHP_URL_HOST));
if ($srcHost === '' || !in_array($srcHost, $allowed, true)) { hta_out(403, ['ok' => false, 'error' => 'origin']); }

$raw = file_get_contents('php://input');
$in = json_decode($raw ?: '', true);
if (!is_array($in)) { $in = $_POST; }

if (!empty($in['company'])) { hta_out(200, ['ok' => true]); } // honeypot: silently drop bots

$clean = function ($v, $max) {
    $v = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $v)));
    return mb_substr($v, 0, $max);
};
$first   = $clean($in['firstName'] ?? '', 60);
$last    = $clean($in['lastName'] ?? '', 60);
$email   = strtolower($clean($in['email'] ?? '', 120));
$phone   = $clean($in['phone'] ?? '', 30);
$course  = $clean($in['course'] ?? '', 80);
$centre  = $clean($in['centre'] ?? '', 80);
$message = $clean($in['message'] ?? '', 500);
$page    = $clean($in['page'] ?? '', 200);

if ($first === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    hta_out(422, ['ok' => false, 'error' => 'invalid']);
}

/* ---------- 2. Rate limit (per IP) and duplicate guard ---------- */
$tmp = sys_get_temp_dir();
$ip  = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl  = $tmp . '/hta_brevo_rl_' . md5($ip);
$now = time();
$hits = is_file($rl) ? (json_decode((string) @file_get_contents($rl), true) ?: []) : [];
$hits = array_values(array_filter($hits, function ($t) use ($now) { return $t > $now - 600; }));
if (count($hits) >= 8) { hta_out(429, ['ok' => false, 'error' => 'rate']); }
$hits[] = $now;
@file_put_contents($rl, json_encode($hits), LOCK_EX);

$dupe = $tmp . '/hta_brevo_dup_' . md5($email . '|' . $course . '|' . $centre);
if (is_file($dupe) && filemtime($dupe) > $now - 600) { hta_out(200, ['ok' => true, 'duplicate' => true]); }

/* ---------- 3. Brevo calls ---------- */
function brevo($method, $path, $body) {
    $base = getenv('HTA_BREVO_API_BASE') ?: 'https://api.brevo.com/v3';
    $ch = curl_init($base . $path);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT        => 12,
        CURLOPT_HTTPHEADER     => [
            'accept: application/json',
            'content-type: application/json',
            'api-key: ' . BREVO_API_KEY,
        ],
        CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
    ]);
    $res  = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    return [$code, $res === false ? null : json_decode((string) $res, true), $err];
}

function hta_phone($p) {
    $d = preg_replace('/\D/', '', $p);
    if ($d === '') return null;
    if (strpos($d, '234') === 0 && strlen($d) === 13) return '+' . $d;       // 2348031234567
    if ($d[0] === '0' && strlen($d) === 11) return '+234' . substr($d, 1);   // 08031234567
    if (strlen($d) === 10 && in_array($d[0], ['7', '8', '9'], true)) return '+234' . $d; // 8031234567
    if (strpos(trim($p), '+') === 0 && strlen($d) >= 8 && strlen($d) <= 15) return '+' . $d; // other countries
    return null;
}
$sms = hta_phone($phone);

// Contact: try with everything, then fall back if Brevo rejects an attribute (missing COURSE/CENTRE
// attribute, or the phone number already belongs to another contact).
$attrSets = [];
$base = ['FIRSTNAME' => $first, 'LASTNAME' => $last];
$full = $base;
if ($sms) $full['SMS'] = $sms;
if (BREVO_SAVE_COURSE_ATTRIBUTES) { $full['COURSE'] = $course; $full['CENTRE'] = $centre; }
$attrSets[] = $full;
if (BREVO_SAVE_COURSE_ATTRIBUTES) { $noCourse = $base; if ($sms) $noCourse['SMS'] = $sms; $attrSets[] = $noCourse; }
if ($sms) $attrSets[] = $base;

$contactOk = false;
$lastErr = '';
foreach ($attrSets as $attrs) {
    $payload = ['email' => $email, 'attributes' => $attrs, 'updateEnabled' => true];
    if ((int) BREVO_LIST_ID > 0) $payload['listIds'] = [(int) BREVO_LIST_ID];
    [$code, $body, $cerr] = brevo('POST', '/contacts', $payload);
    if ($code === 201 || $code === 204) { $contactOk = true; break; }
    $lastErr = $code . ' ' . ($body['code'] ?? '') . ' ' . ($body['message'] ?? $cerr);
    if ($code !== 400) break; // auth / network problems won't be fixed by dropping attributes
}
if (!$contactOk) hta_log('contact failed: ' . $lastErr);

$eventOk = null; // null = not configured
if (BREVO_EVENT_NAME !== '') {
    $ev = [
        'event_name'         => BREVO_EVENT_NAME,
        'identifiers'        => ['email_id' => $email],
        'contact_properties' => ['FIRSTNAME' => $first, 'LASTNAME' => $last],
        'event_properties'   => [
            'course'  => $course,
            'centre'  => $centre,
            'phone'   => $sms ?: $phone,
            'message' => $message,
            'page'    => $page,
        ],
    ];
    [$code, $body, $cerr] = brevo('POST', '/events', $ev);
    $eventOk = ($code >= 200 && $code < 300);
    if (!$eventOk) hta_log('event failed: ' . $code . ' ' . ($body['code'] ?? '') . ' ' . ($body['message'] ?? $cerr));
}

if ((int) BREVO_LIST_ID <= 0 && BREVO_EVENT_NAME === '') {
    hta_log('neither BREVO_LIST_ID nor BREVO_EVENT_NAME is set — no automation can start');
}

$ok = $contactOk && $eventOk !== false;
if ($ok) @touch($dupe);
hta_out($ok ? 200 : 502, ['ok' => $ok, 'contact' => $contactOk, 'event' => $eventOk]);
