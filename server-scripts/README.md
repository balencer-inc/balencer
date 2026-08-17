# server-scripts — サーバーPHP（LPフォームの受け皿）と FileZilla アップロード手順

LPの相談フォームは「ブラウザ → JSONでPOST → ここのPHP → ①info@balencer.jp へメール ②Notionリード台帳へ登録」で動く。PHPは **balencer.jp サーバー（ConoHa）** の上で動くので、ファイルは **FileZilla（FTP）で手動アップロード**する。

> このフォルダの `.php` を直したり新規追加したら、下の手順でサーバーへ上げる。Gitに置くのは原本管理のためで、Gitだけではサーバーに反映されない。

---

## 0. アップロードのいつものハマりどころ（先に結論）
- **置き場所は `public_html` の中**。サーバーに繋いだ直後の画面（一番上の階層）ではない。`public_html` をダブルクリックして入る。
- 目印＝中に `soeru-lead.php` `hojokin-lead.php` `hojokin-config.php` などが並んでいる。**それらの隣に置けば正解**。
- 上げたいファイルは**事前にデスクトップにコピー**しておくと、左ペイン（最初デスクトップ表示）からすぐ掴めて楽。

---

## 1. サーバー接続情報（balencer.jp 用）
| 項目 | 値 |
|---|---|
| ホスト (H) | `www239.conoha.ne.jp`（繋がらなければ予備 `www98.conoha.ne.jp`） |
| ユーザー名 (U) | `ftp@balencer.jp` |
| ポート (P) | `21` |
| パスワード (W) | FileZillaに保存済み（クイック接続の履歴▼から `ftp@balencer.jp` を選べば自動入力） |

- 繋ぎ方：FileZilla上部「クイック接続」右の **▼** から `ftp@balencer.jp@www239.conoha.ne.jp` の履歴を選ぶ → 接続。
- ※ `admin@tsugiandpartners.jp`（www98）は **TSUGI側サーバー**。balencer.jp の作業では使わない。

---

## 2. アップロード手順（5ステップ）
1. **上げたいファイルをデスクトップにコピー**しておく（例：ターミナルで `cp server-scripts/intro-lead.php ~/Desktop/`）。
2. FileZillaで上記の接続先に**接続**する。
3. **右ペイン（リモート＝サーバー）** で `public_html` をダブルクリックして入る。`soeru-lead.php` などが見える場所であることを確認。
4. **左ペイン（ローカル＝自分のPC）** をデスクトップにして、上げたいファイル（例 `intro-lead.php`）を見つける。
5. 左のファイルを**右ペインへドラッグ＆ドロップ**。下の「キュー」が消えたら完了。同名ファイルがあれば「上書き」を選ぶ。

---

## 3. 上げた後の動作確認（任意・ターミナル）
```bash
# 設置できていれば 405（GETは拒否＝存在の証拠）
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://balencer.jp/<ファイル名>.php

# 別ドメイン(Vercel)から叩くフォームは CORS も確認（204＋Allowヘッダが出ればOK）
curl -s -i -X OPTIONS https://balencer.jp/<ファイル名>.php -H "Origin: https://example.vercel.app" | grep -iE 'HTTP/|access-control-allow'
```
フォームの実送信テストは、テストと分かる内容でPOSTし、Notion/メールに届くか見る（[intro-site/README](../docs/intro-site/README.md) に実例あり）。

---

## 4. このフォルダのファイル
| ファイル | 受け皿のLP / 送信先パス |
|---|---|
| `soeru-lead.php` | SOERU LP（`/soeru-lead.php`） |
| `hojokin-lead.php` `hojokin-mail.php` `hojokin-cron.php` | 補助金ハブLP |
| `keiei-lead.php` | 経営ボードLP |
| `hitotsu-lead.php` | ヒトツLP |
| `intro-lead.php` | イベント用2社紹介ページ（Vercel）。CORS対応・流入元=イベント紹介ページ |
| `hojokin-config.php`（**gitignore・サーバーにのみ存在**） | Notionトークン/DB等の実値。各leadが共用 |
| `hojokin-config.sample.php` | 設定の雛形（実値なし） |

- **秘密情報**：`hojokin-config.php`（notion_token 等）はGit管理外。サーバー上のものが正。新しい受け皿PHPも基本はこの共用configを `require` する。
