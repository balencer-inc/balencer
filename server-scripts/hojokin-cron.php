<?php
// ───────────────────────────────────────────────
// 補助金チェックリスト 追いかけステップメール（cron実行用）
//   実行: php /path/to/hojokin-cron.php
//   推奨: 毎日1回（例 9:00）
//   +3日 / +7日 / +14日 に自動で3回追いかけ。予約が入ったら停止。
// ───────────────────────────────────────────────

$cfgFile = is_file(__DIR__ . '/hojokin-config.php')
    ? __DIR__ . '/hojokin-config.php'
    : __DIR__ . '/hojokin-config.sample.php';
$cfg = require $cfgFile;
require __DIR__ . '/hojokin-mail.php';

$dataDir = __DIR__ . '/hojokin-data';
if (!is_dir($dataDir)) { echo "No data directory\n"; exit; }

$now   = new DateTime();
$book  = $cfg['booking_url'];
$lp    = $cfg['lp_url'];
$files = glob($dataDir . '/*.json');

foreach ($files as $file) {
    $d = json_decode(file_get_contents($file), true);
    if (!$d) continue;
    if (!empty($d['booked'])) continue;

    $sent = $d['emailsSent'] ?? [1];
    if (in_array(2, $sent) && in_array(3, $sent) && in_array(4, $sent)) continue;

    $created = new DateTime($d['createdAt']);
    $days = intval($now->diff($created)->days);
    $email = $d['email'];

    if ($days >= 3 && !in_array(2, $sent)) {
        hj_step2($email, $book, $lp, $cfg);
        $d['emailsSent'][] = 2;
        file_put_contents($file, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        echo "Sent step2 to {$email}\n";
    }
    if ($days >= 7 && !in_array(3, $sent)) {
        hj_step3($email, $book, $lp, $cfg);
        $d['emailsSent'][] = 3;
        file_put_contents($file, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        echo "Sent step3 to {$email}\n";
    }
    if ($days >= 14 && !in_array(4, $sent)) {
        hj_step4($email, $book, $lp, $cfg);
        $d['emailsSent'][] = 4;
        file_put_contents($file, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        echo "Sent step4 to {$email}\n";
    }
}
echo "Cron completed at " . $now->format('Y-m-d H:i:s') . "\n";

/* ── Step2（+3日）：よくある勘違いを1つ ─────────── */
function hj_step2($email, $book, $lp, $cfg) {
    $subject = '補助金、ここで勘違いする人が多いです｜BALENCER';
    $content = '
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 16px;">先日は補助金AI導入チェックリストをご請求いただき、ありがとうございました。目を通していただけましたか？</p>
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 24px;">今日は、ご相談でいちばん多い「補助金の勘違い」を1つだけお伝えします。</p>
<hr style="border:none;border-top:1px solid #E7ECF1;margin:24px 0;">
<h3 style="font-size:16px;font-weight:800;color:#1C2733;margin:0 0 12px;">■「コンサル・作業代行だけ」は、補助金に乗りにくい</h3>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">補助金は本来「ソフト（ツール）の導入」が主役で、人の作業（設定や研修）はその脇役、という構成が通りやすい形です。逆に、人の作業ばかりが大きいと対象として認められにくくなります。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">そしてもう一つ、絶対に外せないのが<strong>「交付決定の“前”に契約・発注・支払いをしない」</strong>こと。これをやってしまうと、全額が補助対象外になります。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0;">——この2点を押さえるだけで、失敗のほとんどは防げます。チェックリストの②も、ぜひ見返してみてください。</p>';
    $text = "先日は補助金AI導入チェックリストをご請求いただき、ありがとうございました。\n\n"
        . "今日は、ご相談でいちばん多い『補助金の勘違い』を1つ。\n\n"
        . "■コンサル・作業代行だけは、補助金に乗りにくい\n"
        . "補助金はソフト（ツール）の導入が主役、人の作業はその脇役、という構成が通りやすい形です。人の作業ばかり大きいと対象外になりがち。\n\n"
        . "そして『交付決定の前に契約・発注・支払いをしない』——これを破ると全額対象外になります。\n\n"
        . "この2点で失敗のほとんどは防げます。\n\n"
        . "▼無料相談の予約\n{$book}\n\n株式会社バレンサー 阿部貴之\nhttps://balencer.jp";
    hj_send_mail($email, $subject, hj_wrap_html($content, $book, $lp, 'チェックリストの続きを見る'), $text, $cfg['mail_from_name']);
}

/* ── Step3（+7日）：今からでも間に合う ─────────── */
function hj_step3($email, $book, $lp, $cfg) {
    $subject = '「今からだと間に合いますか？」へのお答え｜BALENCER';
    $content = '
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 16px;">株式会社バレンサーの阿部です。補助金でAIを検討中の方から、いちばんよくいただく質問にお答えします。</p>
<hr style="border:none;border-top:1px solid #E7ECF1;margin:24px 0;">
<h3 style="font-size:16px;font-weight:800;color:#1C2733;margin:0 0 12px;">■「今からだと、申請に間に合いますか？」</h3>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">結論、<strong>焦らなくて大丈夫です。</strong>補助金の公募は通年・複数回あります。直近の回に間に合わなくても、次の回に確実に乗せる準備を、今から進められます。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">むしろ大事なのは「準備の早さ」。どの業務に効くかの見立て、申請に乗る形への組み立て——ここが整っていれば、公募が開いたタイミングですぐ動けます。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0;">いきなり大きく入れる必要はありません。まず小さく試して（PoC）、効果が見えたところから補助金で広げる。この進め方が、いちばん失敗しません。</p>';
    $text = "株式会社バレンサーの阿部です。\n\n"
        . "■「今からだと、申請に間に合いますか？」\n"
        . "焦らなくて大丈夫です。補助金の公募は通年・複数回あります。次の回に確実に乗せる準備を今から進められます。\n\n"
        . "大事なのは準備の早さ。どの業務に効くかの見立てと、申請に乗る形への組み立てが整っていれば、公募が開いた瞬間に動けます。\n\n"
        . "まず小さく試して（PoC）、効果を見て補助金で広げる——この進め方がいちばん失敗しません。\n\n"
        . "▼無料相談の予約\n{$book}\n\n株式会社バレンサー 阿部貴之\nhttps://balencer.jp";
    hj_send_mail($email, $subject, hj_wrap_html($content, $book, $lp, '補助金ページで進め方を見る'), $text, $cfg['mail_from_name']);
}

/* ── Step4（+14日）：最後のひと押し ─────────── */
function hj_step4($email, $book, $lp, $cfg) {
    $subject = '「何から」を、一度だけ一緒に整理しませんか｜BALENCER';
    $content = '
<p style="font-size:14px;line-height:1.85;color:#1C2733;margin:0 0 16px;">何度かメールをお送りしました。お忙しいなか、お読みいただきありがとうございます。今日でいったん区切りにします。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">補助金でAIを、と思っても、最初の「何から手をつけるか」でつまずく会社がほとんどです。これは能力の問題ではなく、<strong>外から一度、業務を棚卸ししてもらえば一気にほどける</strong>類のものです。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0 0 14px;">たとえば「ベテランしかできない段取りを仕組みに移す」「議事録や問い合わせをAIに下書きさせる」——どれが自社に効くかは、30分話せばだいたい見えてきます。</p>
<p style="font-size:14px;line-height:1.9;color:#1C2733;margin:0;">売り込みはしません。「うちの場合は何が効く？」だけ、一度だけ一緒に整理しましょう。お役に立てそうなら、その時にまたご相談ください。</p>';
    $text = "何度かメールをお送りしました。今日でいったん区切りにします。\n\n"
        . "補助金でAIを、と思っても『何から手をつけるか』でつまずく会社がほとんどです。これは外から一度業務を棚卸しすれば一気にほどけます。\n\n"
        . "『ベテランの段取りを仕組みに移す』『議事録や問い合わせをAIに下書きさせる』——どれが効くかは30分話せば見えてきます。\n\n"
        . "売り込みはしません。『うちの場合は何が効く？』だけ、一度だけ一緒に整理しましょう。\n\n"
        . "▼無料相談の予約\n{$book}\n\n株式会社バレンサー 阿部貴之\nhttps://balencer.jp";
    hj_send_mail($email, $subject, hj_wrap_html($content, $book, $lp, ''), $text, $cfg['mail_from_name']);
}
