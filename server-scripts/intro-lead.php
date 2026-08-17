<?php
// ───────────────────────────────────────────────
// イベント用 2社紹介ページ（balencer-intro.vercel.app）お問い合わせ受付
//  ・Vercel上の静的ページから 別ドメイン(balencer.jp) へ JSON を POST するため CORS 対応
//  ・社内へメール通知（info@balencer.jp・全項目）
//  ・Notion DB（補助金/SOERUリードと同一DB）へ登録。「流入元」で区別
//  ・Notionの認証情報は hojokin-config.php を共用（新規設定不要）
//  ※ balencer.jp のルートに FTP で設置する（= https://balencer.jp/intro-lead.php）
// ───────────────────────────────────────────────

// ── CORS（別ドメインのVercelページから叩くため） ──
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');
mb_language('ja');
mb_internal_encoding('UTF-8');

// プリフライト（OPTIONS）には即200を返す
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) { $data = $_POST; }

// 簡易ボット除け（ハニーポット）
if (!empty($data['_hp'] ?? '')) { echo json_encode(['ok' => true]); exit; }

$name    = trim($data['お名前']       ?? '');
$company = trim($data['会社名']       ?? '');
$email   = trim($data['メール']       ?? '');
$tel     = trim($data['電話番号']     ?? '');
$svc     = trim($data['ご相談先']     ?? '');
$issue   = trim($data['ご相談内容']   ?? '');
$source  = trim($data['source']       ?? 'イベント紹介ページ');

if ($name === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['error' => 'お名前とメールアドレスは必須です']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'メールアドレスの形式が正しくありません']);
    exit;
}

// ── ① 社内へメール通知（全項目） ──
$subject = '【紹介ページ】' . $name . '様よりお問い合わせ';
$fields = [
    'お名前'       => $name,
    '会社名'       => $company,
    'メール'       => $email,
    '電話番号'     => $tel,
    'ご相談先'     => $svc,
    'ご相談内容'   => $issue,
    '流入元'       => $source,
];
$body  = "イベント用 2社紹介ページ よりお問い合わせがありました。\n";
$body .= str_repeat('-', 40) . "\n\n";
foreach ($fields as $label => $value) {
    if ($value !== '') { $body .= "[{$label}]\n{$value}\n\n"; }
}
$body .= str_repeat('-', 40) . "\n";
$body .= '登録日時: ' . date('Y-m-d H:i:s') . "\n";

$headers  = "From: info@balencer.jp\r\n";
$headers .= "Reply-To: {$email}";
@mb_send_mail('info@balencer.jp', $subject, $body, $headers);

// ── ② Notion DB へ登録（流入元つき。補助金/SOERUリードと同一DB） ──
$cfgFile = is_file(__DIR__ . '/hojokin-config.php')
    ? __DIR__ . '/hojokin-config.php'
    : __DIR__ . '/hojokin-config.sample.php';
$cfg = is_file($cfgFile) ? require $cfgFile : [];
@intro_push_notion($cfg, $company, $name, $email, $source);

echo json_encode(['ok' => true]);

// ───────────────────────────────────────────────
function intro_push_notion($cfg, $company, $name, $email, $source) {
    if (empty($cfg['notion_token']) || empty($cfg['notion_db'])) return false;
    $title = $company !== '' ? $company : ($name !== '' ? $name : $email);
    $payload = [
        'parent' => ['database_id' => $cfg['notion_db']],
        'properties' => [
            '会社名'     => ['title' => [['text' => ['content' => $title]]]],
            'メール'     => ['email' => $email],
            'ステータス' => ['select' => ['name' => '未対応']],
            '流入元'     => ['select' => ['name' => $source]],
            '登録日時'   => ['date' => ['start' => date('c')]],
        ],
    ];
    $ch = curl_init('https://api.notion.com/v1/pages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $cfg['notion_token'],
            'Notion-Version: ' . ($cfg['notion_version'] ?? '2022-06-28'),
            'Content-Type: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    @curl_exec($ch);
    @curl_close($ch);
    return true;
}
