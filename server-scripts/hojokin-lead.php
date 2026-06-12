<?php
// ───────────────────────────────────────────────
// 補助金チェックリスト リード受付
//  ・LPフォームから {email, company} を POST(JSON) で受ける
//  ・チェックリストPDFを即送信（ステップ1）
//  ・JSON保存（hojokin-data/）＋社内通知＋Notion追加
//  ・以降の追いかけは hojokin-cron.php が担当
// ───────────────────────────────────────────────

header('Content-Type: application/json; charset=UTF-8');
mb_language('ja');
mb_internal_encoding('UTF-8');

$cfgFile = is_file(__DIR__ . '/hojokin-config.php')
    ? __DIR__ . '/hojokin-config.php'
    : __DIR__ . '/hojokin-config.sample.php';
$cfg = require $cfgFile;
require __DIR__ . '/hojokin-mail.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) { $data = $_POST; } // フォールバック

$email   = trim($data['email']   ?? '');
$company = trim($data['company'] ?? '');

// 簡易ボット除け（ハニーポット）
if (!empty($data['_hp'] ?? '')) { echo json_encode(['ok' => true]); exit; }

if (empty($company)) {
    http_response_code(400);
    echo json_encode(['error' => '会社名をご入力ください']);
    exit;
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'メールアドレスの形式が正しくありません']);
    exit;
}

// 法人限定：フリーメール／キャリアメールを弾く
$freeDomains = [
    'gmail.com','googlemail.com','yahoo.co.jp','yahoo.com','ymail.com',
    'outlook.com','outlook.jp','hotmail.com','hotmail.co.jp','live.jp','live.com','msn.com',
    'icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me','gmx.com','mail.com',
    'zoho.com','yandex.com','qq.com','163.com','naver.com','ybb.ne.jp','excite.co.jp',
    'docomo.ne.jp','ezweb.ne.jp','au.com','softbank.ne.jp','i.softbank.jp',
];
$domain = strtolower(substr(strrchr($email, '@'), 1));
if (in_array($domain, $freeDomains, true)) {
    http_response_code(400);
    echo json_encode(['error' => '会社のメールアドレスでお願いします（フリーメール不可）']);
    exit;
}

$companyDisp = $company !== '' ? $company : '（未記入）';

// ── ① ユーザーへ：チェックリスト即送信（ステップ1） ──
$subject = '【BALENCER】補助金AI導入チェックリストをお届けします';
$content = '
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 16px;">この度は「補助金で失敗しないAI導入チェックリスト」をご請求いただき、ありがとうございます。</p>
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 8px;">下記より、チェックリスト（PDF・A4・2ページ）をご覧いただけます。</p>
<div style="text-align:center;margin:22px 0;">
  <a href="' . htmlspecialchars($cfg['checklist_url'], ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:14px 34px;background:#E6FF2F;color:#1C2733;font-size:15px;font-weight:800;text-decoration:none;border-radius:999px;">チェックリストをダウンロード</a>
</div>
<hr style="border:none;border-top:1px solid #E7ECF1;margin:24px 0;">
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 14px;">チェックリストは「①自社に効くAI活用シーンの見つけ方」「②補助金に乗る／乗らないの見分け方」「③稟議を通しやすい提案のまとめ方」の3部構成です。</p>
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 6px;"><strong>3つ以上当てはまった項目があれば、補助金でAIを始める準備ができています。</strong></p>
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0;">「うちの場合は何が効く？」を一緒に見立てる無料相談（30〜45分・0円・売り込みなし）も承っています。気になる項目があれば、お気軽にどうぞ。</p>';

$textBody = "この度は「補助金で失敗しないAI導入チェックリスト」をご請求いただき、ありがとうございます。\n\n"
    . "▼ チェックリスト（PDF）\n" . $cfg['checklist_url'] . "\n\n"
    . "①自社に効くAI活用シーンの見つけ方／②補助金に乗る・乗らないの見分け方／③稟議を通しやすい提案のまとめ方、の3部構成です。\n\n"
    . "3つ以上当てはまった項目があれば、補助金でAIを始める準備ができています。\n"
    . "「うちの場合は何が効く？」を一緒に見立てる無料相談（30〜45分・0円・売り込みなし）も承っています。\n\n"
    . "▼ 無料相談の予約\n" . $cfg['booking_url'] . "\n\n"
    . "株式会社バレンサー 阿部貴之\nhttps://balencer.jp";

$htmlBody = hj_wrap_html($content, $cfg['booking_url'], $cfg['lp_url'], '補助金ページを見る');
$sent = hj_send_mail($email, $subject, $htmlBody, $textBody, $cfg['mail_from_name']);

// ── ② 社内通知 ──
$notifySubject = '【補助金リード】チェックリストDL：' . $companyDisp;
$notifyBody = "補助金チェックリストのダウンロード請求がありました。\n"
    . str_repeat('-', 36) . "\n"
    . "会社名: {$companyDisp}\n"
    . "メール: {$email}\n"
    . "日時  : " . date('Y-m-d H:i:s') . "\n"
    . str_repeat('-', 36) . "\n";
$notifyHeaders = "From: =?UTF-8?B?" . base64_encode('補助金リード通知') . "?= <info@balencer.jp>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n";
@mail($cfg['mail_to'], "=?UTF-8?B?" . base64_encode($notifySubject) . "?=", chunk_split(base64_encode($notifyBody)), $notifyHeaders);

// ── ③ JSON保存（追いかけ用） ──
$dataDir = __DIR__ . '/hojokin-data';
if (!is_dir($dataDir)) { @mkdir($dataDir, 0755, true); }
$lead = [
    'email'      => $email,
    'company'    => $company,
    'source'     => '補助金チェックリスト',
    'createdAt'  => date('Y-m-d H:i:s'),
    'emailsSent' => [1],   // 初回（チェックリスト）送信済み
    'booked'     => false,
];
@file_put_contents(
    $dataDir . '/' . date('Ymd_His') . '_' . md5($email) . '.json',
    json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
);

// ── ④ Notionへ追加 ──
@hj_push_notion($cfg, $email, $company);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => '送信に失敗しました。時間をおいて再度お試しください。']);
}
