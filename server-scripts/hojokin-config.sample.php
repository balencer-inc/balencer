<?php
// ───────────────────────────────────────────────
// 補助金リード設定サンプル
// 本番サーバーでは、このファイルを「hojokin-config.php」に複製し、
// 値を埋めてください（hojokin-config.php は Git 管理外）。
// ───────────────────────────────────────────────
return [
    // メール
    'mail_to'         => 'info@balencer.jp',          // 社内通知の宛先
    'mail_from_name'  => 'バレンサー｜阿部貴之',        // 差出人表示名

    // リンク
    'booking_url'     => 'https://calendar.app.google/FXdS7EwvmPPWR5DW8', // 無料相談の予約カレンダー
    'checklist_url'   => 'https://balencer.jp/hojokin/checklist.pdf',     // 配布するチェックリストPDF
    'lp_url'          => 'https://balencer.jp/hojokin/',                  // ハブLP

    // Notion（内部インテグレーション）
    // 1) https://www.notion.so/my-integrations で内部インテグレーションを作成→「Internal Integration Secret」を貼る
    // 2) 対象データベースを開き ・・・ → 「コネクトを追加」でそのインテグレーションを接続
    'notion_token'    => 'ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'notion_db'       => '0440b4bdbff3499fb705c06698c9481b',              // 作成済みDB「補助金リード（チェックリストDL）」
    'notion_version'  => '2022-06-28',
];
