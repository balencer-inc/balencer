<?php
// ───────────────────────────────────────────────
// 補助金リード 共通メールヘルパー（lead/cron 兼用）
// ブランド：白×くすんだブルー×蛍光イエロー（ハブLPと統一）
// ───────────────────────────────────────────────

function hj_send_mail($to, $subject, $htmlBody, $textBody, $fromName) {
    $boundary = md5(uniqid((string)time()));
    $subjectEncoded = "=?UTF-8?B?" . base64_encode($subject) . "?=";

    $headers  = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <info@balencer.jp>\r\n";
    $headers .= "Reply-To: info@balencer.jp\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

    $message  = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($textBody)) . "\r\n";
    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($htmlBody)) . "\r\n";
    $message .= "--{$boundary}--";

    return mail($to, $subjectEncoded, $message, $headers);
}

function hj_wrap_html($content, $bookingUrl = '', $secondaryUrl = '', $secondaryLabel = '') {
    $cta = '';
    if ($bookingUrl) {
        $cta .= '
    <div style="text-align:center;margin:30px 0 8px;">
      <a href="' . htmlspecialchars($bookingUrl, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:15px 38px;background:#27384A;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;">無料相談を予約する（30〜45分・0円）</a>
    </div>';
    }
    if ($secondaryUrl) {
        $cta .= '
    <div style="text-align:center;margin:0 0 8px;">
      <a href="' . htmlspecialchars($secondaryUrl, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;padding:11px 26px;color:#3E5C76;font-size:13px;font-weight:700;text-decoration:none;">' . htmlspecialchars($secondaryLabel, ENT_QUOTES, 'UTF-8') . ' →</a>
    </div>';
    }

    return '<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EDF1F5;font-family:\'Helvetica Neue\',Arial,\'Hiragino Sans\',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:36px 18px;">
  <div style="text-align:center;padding:18px 0;">
    <span style="font-weight:800;font-size:15px;letter-spacing:.12em;color:#1C2733;">BALENCER</span>
    <span style="display:block;font-size:11px;color:#647281;margin-top:3px;">デジタル化・AI導入補助金 サポート</span>
  </div>
  <div style="background:#FFFFFF;border-radius:14px;padding:38px 30px;border:1px solid #DAE1E8;">
    ' . $content . $cta . '
  </div>
  <div style="text-align:center;padding:26px 0;font-size:12px;color:#647281;">
    <p style="margin:0 0 4px;">株式会社バレンサー｜中小企業向けAI・DX導入支援</p>
    <p style="margin:0;"><a href="https://balencer.jp" style="color:#3E5C76;text-decoration:none;">https://balencer.jp</a></p>
  </div>
</div></body></html>';
}

// Notion にリードを1件追加（失敗しても本処理は止めない）
function hj_push_notion($cfg, $email, $company) {
    if (empty($cfg['notion_token']) || empty($cfg['notion_db'])) return false;
    $title = $company !== '' ? $company : $email;
    $payload = [
        'parent' => ['database_id' => $cfg['notion_db']],
        'properties' => [
            '会社名'    => ['title' => [['text' => ['content' => $title]]]],
            'メール'    => ['email' => $email],
            'ステータス'=> ['select' => ['name' => '未対応']],
            '流入元'    => ['select' => ['name' => '補助金チェックリスト']],
            '登録日時'  => ['date' => ['start' => date('c')]],
        ],
    ];
    $ch = curl_init('https://api.notion.com/v1/pages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $cfg['notion_token'],
            'Notion-Version: ' . $cfg['notion_version'],
            'Content-Type: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    $res = @curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    @curl_close($ch);
    return $code >= 200 && $code < 300;
}
