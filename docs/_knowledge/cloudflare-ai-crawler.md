# AIクローラー制御 — balencer.jp 実装手順と営業展開

作成: 2026-08-17 ／ 対象: balencer.jp（自社サイト）
目的: 自社コンテンツをAIに学習させるかを自社で決められる状態にし、それをそのまま顧客提案の切り口にする

---

## 0. 結論（2段階でやる）

| 段階 | やること | 効き目 | リスク | 所要 |
|---|---|---|---|---|
| **段階1** | robots.txt にAIクローラーの方針を書く | お願いベース。主要AI各社は従う | **ほぼゼロ** | 30分 |
| **段階2** | DNSをCloudflareに移し、ネットワークで遮断 | 強制力あり。従わないクローラーも止まる | **中**（メール停止の可能性） | 半日＋様子見1週間 |

**まず段階1だけやる。** 段階2は、やる価値はあるが、メールの引っ越しを伴うので別日に落ち着いて。

---

## 1. 現状（2026-08-17 調査）

| 項目 | 現状 |
|---|---|
| ドメイン・DNS管理 | **ConoHa**（ns-a1.conoha.io / ns-a2 / ns-a3） |
| サイト本体 | 118.27.122.183 ／ nginx + WordPress + Elementor |
| **メール** | **Google Workspace**（MX = aspmx.l.google.com ほか4本） |
| SPF | `v=spf1 include:_spf.conoha.ne.jp ~all` |
| その他TXT | Google Search Console の所有権確認 |
| robots.txt | WordPress標準のまま。**AIクローラーの指定は一切なし＝現在は全部読まれている** |

---

## 2. 段階1: robots.txt（今日できる）

### 2-1. 先に決めること（経営判断）

AIクローラーは大きく2種類ある。**ここを分けずに全部ブロックすると損をする。**

| 種類 | 何をするか | バレンサーの方針 |
|---|---|---|
| **学習用**（GPTBot, ClaudeBot, Google-Extended など） | 記事や文章をAIの学習データに取り込む | **拒否** |
| **AI検索用**（OAI-SearchBot, ChatGPT-User, PerplexityBot など） | ユーザーの質問に答えるため、その場で読んで引用・リンクする | **許可** |

**なぜこの分け方か**: バレンサーは「ブランディング会社を探している人」にChatGPTやPerplexityの回答の中で見つけてもらいたい会社。**全部ブロックするとAI検索の回答に出てこなくなる。** 一方、書いた文章がタダで学習素材にされるのは断る。この線引きが方針。

### 2-2. 貼り付ける内容

WordPress標準の記述を残したまま、末尾に追記する。

```
# --- AI学習クローラー: 拒否 ---
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

# --- AI検索・引用クローラー: 許可 ---
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

### 2-3. WordPressでの入れ方

balencer.jp の robots.txt は WordPress が自動生成している（実ファイルが無い）。入れ方は2通り。

- **A: SEOプラグインの管理画面から編集**（推奨）。Yoast等なら「ツール → ファイルエディター」に robots.txt の編集欄がある
- **B: 実ファイルを置く**。FTP（FileZilla）でドキュメントルートに `robots.txt` を置くと、そちらが優先される。ただし WordPress の自動生成分（wp-admin の除外・サイトマップの記述）を**自分で書き写す必要がある**ので、消し忘れに注意

### 2-4. 確認方法

反映後、ブラウザで `https://balencer.jp/robots.txt` を開いて追記分が出ていればOK。Search Console の robots.txt テスターでも確認できる。

### 2-5. 運用

**四半期に1回、見直す。** AI各社は新しいクローラーを頻繁に追加し、名前を変えることもある。カレンダーに入れておく。

---

## 3. 段階2: Cloudflare へのDNS移管（別日に）

robots.txt は**お願い**であって、無視するクローラーは無視する。本当に止めたいならネットワークで遮断する。それがCloudflare。

### 3-1. Cloudflare 側でできること

- AIボットを **Search / Agent / Training** の3区分で個別に許可・拒否
- 名乗らずに来るクローラーも検知して遮断
- ついでにサイト高速化・攻撃遮断・無料SSLが付く
- **2026年9月15日から、新規ドメインは Training と Agent がデフォルト拒否・Search は許可**（＝上の方針とほぼ同じ）

### 3-2. 最大のリスク

**メールが止まること。** balencer.jp のメールは Google Workspace。DNSをCloudflareに移すと、MXレコードも一緒に引っ越す。**MXの写し漏れ＝会社のメールが全停止**する。サイトが落ちるより重い。

### 3-3. 手順

**事前準備（これが本番）**
1. Cloudflareアカウントを作る（無料）
2. **ConoHaの現在のDNSレコードを全部書き出して保存する**（画面のスクリーンショットでもよい）。切り戻しの命綱
3. 書き出しに以下が含まれているか目視で確認する
   - A レコード（118.27.122.183 と www）
   - **MX 5本すべて**（aspmx.l.google.com / alt1〜alt4）
   - **SPF の TXT**（`v=spf1 include:_spf.conoha.ne.jp ~all`）
   - **Google Search Console の確認用TXT**
   - DKIM の TXT（Google Workspace用。ConoHa画面で `_domainkey` を含むものを探す）

**実行**
4. Cloudflare にドメインを追加する。既存レコードを自動で読み込むので、**上の一覧と1件ずつ突き合わせる**。足りないものは手で足す
5. この時点ではまだ切り替わっていない。**メール系レコードは必ずグレーの雲アイコン（DNS only）にする**。オレンジ（Proxied）にするとメールが壊れる
6. ConoHa側でネームサーバーをCloudflareの指定する2つに変更する
7. 反映まで数分〜48時間。切り替わりの瞬間に2〜5秒サイトが見えなくなることがある

**直後の確認（必ず全部）**
8. サイトが表示されるか
9. **自分宛にテストメールを送って届くか**
10. **自分から外部宛に送って届くか**
11. フォーム（お問い合わせ・補助金LP・ヒトツLP）から実際に送信して、通知が届くか

**切り戻し**
- 何かおかしければ、ConoHaのネームサーバーを元（ns-a1〜a3.conoha.io）に戻す。反映に時間はかかるが元に戻る

**落ち着いてから**
12. 1週間ほど様子を見て問題なければ、AIボット制御を設定する
13. サイト高速化（キャッシュ）は**さらに後**。WordPress + Elementor はキャッシュ設定を誤ると管理画面が壊れることがあるので、一度に触らない

### 3-4. やらないこと

- **ドメイン自体のCloudflare移管はできない**。Cloudflare Registrar は原価で安いが、**2026年時点で .jp に非対応**。DNSだけCloudflare、ドメインはConoHaのままで運用する

---

## 4. 営業への展開

### 4-1. なぜバレンサーの話になるか

これは技術の話ではなく、**「自社の言葉をAIに渡すのか」というブランドの意思決定**。ブランディング会社が答えを持っているべき問い。

### 4-2. 顧客への切り出し方

> 御社のサイトの文章、いまAIに読み取られて学習に使われているの、ご存じですか。

- **MVV・コピー・記事を作った会社ほど刺さる**。作った言葉が勝手に持っていかれる話だから
- **既存顧客への再訪問の理由**として使える（休眠掘り起こしとも噛み合う）
- 9月15日の仕様変更は**期限のある話題**なので、連絡する口実になる

### 4-3. 対象

MVV策定・リブランディング・サイト制作をやった先。睦備建設・北麓・アダチ音研など、コンテンツを持っている会社。

### 4-4. 前提

**自社でやっていないと売れない。** 段階1を先に済ませること。

---

## 5. 参考リンク

- [Cloudflare公式: AIボットの3区分（Search / Agent / Training）](https://developers.cloudflare.com/bots/concepts/bot/)
- [AIボット制御とPay per crawl（gihyo.jp）](https://gihyo.jp/article/2026/07/content-independence-day-one-year-on)
- [robots.txt完全ガイド 2026年版](https://www.blog.ai-kansoku.com/robots-txt-ai-crawler-complete/)
- [AIクローラー一覧2026｜GPTBot・ClaudeBotは許可すべきか](https://0120.co.jp/blog/aio-123/)
