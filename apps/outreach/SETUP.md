# BALENCER Outreach Phase 1 — セットアップガイド

阿部さん向け。実装着手前にやってもらう外部サービス契約 + DNS設定の手順書。

---

## STEP 0: balencer.jp の DNS 整備

現状（2026-05-18 dig結果）:

| 項目 | 現状 | 必要対応 |
|---|---|---|
| SPF | `v=spf1 include:_spf.conoha.ne.jp ~all` | **Resend と Google を追加** |
| DKIM (default) | ConoHa経由 1本あり | 残してOK |
| DKIM (Google) | **未設定** | **Google Workspace側で有効化** |
| DMARC | **未設定** | **新規発行** |
| MX | Google Workspace | OK |

### 1. SPF レコード書き換え（既存を上書き）

ドメイン管理画面（ConoHa or 移管先）で `balencer.jp` の TXT レコードを以下に書き換え:

```
v=spf1 include:_spf.conoha.ne.jp include:_spf.google.com include:_spf.resend.com ~all
```

### 2. Google Workspace の DKIM 有効化

[Google Admin Console](https://admin.google.com) → アプリ → Google Workspace → Gmail → メールの認証 → balencer.jp で **DKIMキーを生成** → 表示されるTXTレコード（`google._domainkey.balencer.jp`）をDNSに追加 → Admin Consoleに戻って **「認証を開始」**。

### 3. Resend のドメイン認証用 DNS（Resendアカウント作成後）

Resend管理画面 → Domains → Add Domain で `balencer.jp` を登録すると、表示される MX/TXT/CNAME を3〜4本DNSに追加 → Resend上で `Verified` 表示を確認。

### 4. DMARC レコード新規追加

DNSに以下のTXTを `_dmarc.balencer.jp` で新規追加:

```
v=DMARC1; p=none; rua=mailto:info@balencer.jp; pct=100
```

`p=none` で観測モードから始め、3日後にDMARCレポートを受信できているか確認。1週間問題なければ `p=quarantine` に格上げ予定（Phase 1 中は `p=none` のまま）。

---

## STEP 1: 外部サービスのアカウント開設

順番にやれば OK。各サービスのAPIキーを `.env.local` に貼ります（後述）。

### 1. Anthropic Claude API
- 既存キーで足りるなら新規発行不要
- 不足するなら https://console.anthropic.com/ で新キー発行
- 取得: `ANTHROPIC_API_KEY`

### 2. Supabase
- https://supabase.com/dashboard で `balencer-outreach` プロジェクト作成（リージョン: 東京 / ap-northeast-1）
- Project Settings → API から取得
- 取得: `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`
- 作成後、SQL Editor で `apps/outreach/supabase/migrations/0001_init.sql` の中身を実行

### 3. Resend
- https://resend.com/ でアカウント作成
- Add Domain で `balencer.jp` を登録 → 表示される DNS レコードを STEP 0 の3で追加
- API Keys → Create API Key（Full Access）→ 取得: `RESEND_API_KEY`
- Webhooks → Create Endpoint で `https://outreach.balencer.jp/api/webhook/resend` を登録、Signing Secret を取得: `RESEND_WEBHOOK_SECRET`
- 月額3000通まで無料。Phase 1 は十分

### 4. Firecrawl
- https://firecrawl.dev/ でアカウント作成 → API Keys
- 取得: `FIRECRAWL_API_KEY`
- 月500ページまで無料

### 5. Baseconnect (Musubu)
- https://musubu.in/ で無料アカウント作成
- 月20社まで無料で企業情報取得可能
- API Key 発行 → 取得: `BASECONNECT_API_KEY`

### 6. TidyCal (商談予約リンク)
- 既存URLがなければ https://tidycal.com/ で15分・20分・30分の3枠を用意
- 各URLをサービスマスター画面の `cta_url` に貼る（または `.env.local` に置く）

---

## STEP 2: ローカル開発の起動

リポジトリのこのディレクトリ（`apps/outreach/`）で:

```bash
cd apps/outreach
cp .env.example .env.local
# .env.local を編集して各APIキーを貼る
npm install
npm run dev
```

→ http://localhost:3100 で起動。

---

## STEP 3: Supabase スキーマ投入

Supabase ダッシュボード → SQL Editor → New query で
`apps/outreach/supabase/migrations/0001_init.sql` の中身を貼り付けて実行。

成功すれば 10テーブル + バレンサー1組織 + 加藤梨紗・松本カオリの sender_personas + バレンサーAI/組織立て直しコンサル の services が作成されます。

---

## STEP 4: 動作確認

http://localhost:3100 にアクセスして、サイドバーから各画面に遷移できれば OK。各画面はまだスタブですが、骨格が動いていることを確認。

---

## STEP 5: 阿部さんからもらいたい情報（Open Items）

実装を進める上で必要な確定情報:

1. **創業年数と「N年連続黒字」の正確値** — サンプルでは「12年連続黒字」と仮置き
2. **中小企業支援の実績社数** — サンプルでは「60社超」と仮置き
3. **代表 阿部による著書の冊数とタイトル** — サンプルでは「3冊」と仮置き
4. **バレンサーAI / 立て直しコンサル の最新サービス資料テキスト** — `docs/service-master.md` の該当部分でOK？
5. **TidyCal / Calendly の既存URL** — なければ新規作成
6. **info@balencer.jp の Gmail フィルタ作成権限** — Outreach/返信 用ラベル運用

これらが揃ったら Phase 1 タスク #6 以降の実装に進めます。

---

## トラブルシューティング

### 「DKIM署名がない」と Gmail が言う
→ STEP 0 の3が完了していないか、DNS伝播待ち。dig で確認:
```
dig TXT resend._domainkey.balencer.jp +short
```

### Supabase の RLS でアクセスできない
→ Phase 1 では `org_isolation_all` ポリシーが `using (true)` で全許可。それでも止まるなら Service Role Key で API Route から接続しているか確認。

### Resend の本番送信が止まる
→ Resend管理画面 → Activity でバウンス率を確認。送信速度を下げる（60秒→120秒間隔）。
