# dev の知見ログ

> 各担当が作業で得た知見・決定・好み・命名規則・却下案とその理由を蓄積する。
> 1エントリは `## YYYY-MM-DD 要点` の形。運用ルールは README.md を参照。

<!-- ここに追記していく -->

## 2026-07-01 フルテロップツール作成キットをスキル化

- 外部配布キット「フルテロップツール作成キット_20260611.zip」（フリーランスの学校・しゅうへい氏）を `.claude/skills/full-telop/` に取り込んだ
- **中身**：喋る動画に全字幕を付ける自動化ツールを、非エンジニアのPCにゼロから作る伴走手順。ローカルWhisper文字起こし→自動分割→ブラウザ校閲(localhost:5050)→🎯音合わせ(Needleman-Wunsch系列アライメント)→FCPXML/SRT書き出し
- **構成の判断**：`AIへの指示_最初に読んで.md`（AIへの指示書）をSKILL.md本体に変換し、`開発手順書.md`（全仕様の正本）・JSONスキーマ・元プロンプト2本を `resources/` に丸ごと格納。手順書を"正本"として温存し、SKILL.mdはオンボーディング5問と作る順番のディスパッチャに徹する形にした
- **担当扱いにはしない**：dev/marketing等の「AI社員(担当)」ではなくタスク実行スキルなので、CLAUDE.md §2の担当一覧には追加していない。「フルテロップ」「字幕自動化」等のトリガーで自動発動する
- 実装の肝（手順書より）：F6は文字数比按分・VAD(無音検出)を使わず単語実時刻基準／F2はword timestamp必須／縦動画はffprobeのrotationタグ自動判定／校閲サーバーはpreview_startを使わず素のpython3起動

## 2026-07-05 提案HTMLのVercel自動デプロイ運用（`deploy/`）

- 阿部さんの要望：「作ったHTMLを『デプロイして』と言ったら基本Vercelに自動で上がるようにして」。
- **この実行環境はVercelへ直接デプロイ不可**（api.vercel.com が egress proxy で403遮断／CLIログインも不可）。→ 解決策は **Vercel Git連携（push検知で自動ビルド）**。
- **配信元＝リポジトリ直下 `deploy/`**（1プロジェクトで全案件を集約）。構成: `deploy/index.html`（トップ）＋`deploy/<会社>/index.html`(デッキ)・`plan.html`＋`deploy/vercel.json`(cleanUrls)。詳細は `deploy/README.md`。
- **最初の1回だけ阿部さんがVercelダッシュボードで接続**：New Project → `balencer-inc/balencer` import → **Root Directory=`deploy`** → Deploy →（Settings→Git→**Production Branch=`claude/zealous-darwin-ntnfwl`**）。以降はpushで自動。
- **Claudeの毎回作業**：新規は `deploy/<会社>/` を足して `deploy/index.html` にリンク追加、更新は上書き → commit&push で自動反映。**新しいHTMLを作ったら deploy/ にも反映するのを既定にする。**
- デザインは統一（モノトーン+黄色差し色／Noto Sans JP+Inter／引用符なし・強調は太字）。

## 2026-07-14 旧Notionから「Web表現の指示語彙」を救済
- ◎サイト級の動きをAIに指示するための語彙集を [dev-web-animation-vocab.md](dev-web-animation-vocab.md) に整備（スクロール連動/カーソル/テキスト/グラデーション/ライブラリ名＋PLAID ALPHA分解の技術insight＋プロンプトテンプレ）
- LP・Web制作で「◎の動きを出したい」時はまずこの語彙で指示する
- **CI値は載せていない**：元ネタは旧CI（蛍光イエロー #E6FF2F・Poppins）前提だったが、色・フォントは現行CI正本（`docs/handoff/`・`docs/company/`）を正とするため意図的に中立化した
- 却下：旧CIの具体値をそのままコピーすること（CIは更新されているため誤誘導になる）

## 2026-08-02 睦備・納涼会用「音響卓」PWAを新規制作＋Vercel直デプロイ成功
- 依頼：社内イベント当日、スマホ1台でBGMと効果音を**同時再生**する音響操作アプリ（標準の音楽アプリだと効果音を鳴らすとBGMが止まる問題の解決）。成果物 = `docs/clients/mutsubi/納涼会-音響アプリ/`
- **公開URL: https://balencer-audio.vercel.app**（安定エイリアス。Vercelプロジェクト名 `noryo-audio` / team `tabe-balencerjps-projects`）
- 技術判断の要点（再利用可）:
  - **BGM=`<audio>`ストリーム（MediaElementSource経由でWeb Audioにミックス）／効果音=`AudioBuffer`事前展開**。音源総量100MB想定でBGMまでdecodeAudioDataすると端末メモリが落ちるため、BGMはPCM全展開しない。効果音だけ低遅延用にバッファ化し`pointerdown`で即発音
  - **オートダッキング**は `bgmDuck` ゲイン1本を効果音の発音/終了でsetTargetAtTime。同時発音カウンタ`activeSe`で全終了時のみ復帰
  - **iOS対策3点**：開始画面タップでAudioContext.resume＋全`<audio>`をジェスチャ内でplay→pauseして自動再生解除、消音スイッチ案内＋テスト音、Wake Lock＋自動ロック案内
  - オフライン：Service Worker（shell先読み＋audioは実行時キャッシュ）＋起動時に`caches`へ音源addAll
  - 音源未配置でも落ちない：`DEV_SYNTH_FALLBACK`で合成ビープ代替、本番前に`false`で「音源なし＝グレー無効」に
- **重要な環境更新**：2026-07-05メモの「この実行環境はVercelへ直接デプロイ不可」は**現時点では解消**。`npx vercel deploy --prod --yes`がCLIログイン済み(tabe-9167)で通った。ただし**新規プロジェクトは既定でSSO(Deployment Protection)が有効**で302に弾かれる → Vercel MCP `update_project_deployment_protection` で `ssoProtection:{enabled:false}` にして公開化する手順が必要（curlで200確認）
- 却下：日本語フォルダ名のままデプロイ（URL/CLIで事故る）→ ASCII名の独立フォルダにコピーしてからデプロイ（メモリ「独立フォルダ+CLI」方針どおり）

## 2026-08-03 音響卓アプリ 完成（最終アーキ・ハマりどころの結論）
- **完成品**：`docs/clients/mutsubi/納涼会-音響アプリ/`。公開URL **https://balencer-audio.vercel.app**（旧 noryo-audio はプロジェクトごと削除。アプリ名「イベント音響アプリ by BALENCER」）。Vercelプロジェクト=`balencer-audio`(team tabe-balencerjps-projects)
- **音源**（全て商用可／CREDITS.md参照）：効果音=効果音ラボ(UA+Referer付きcurlでDL可)、BGM=魔王魂(`maou_loop_bgm_<genre><n>.mp3`/ロックは`sound/game/maou_game_rock<n>.mp3`)、表彰=阿部さんがMMT STUDIOから選定DLした「見よ勇者は帰る」弦楽E♭を`~/Downloads`から取り込み。gain値で音量を揃える設計
- **ハマりどころの結論（重要）**：
  - iOSの音声解除で全`<audio>`をplay→pauseする“bless”は**やってはいけない**。ミュートしても環境で鳴り「起動時に知らない曲が流れる」不具合になる。→ **起動は完全無音**、BGMは各ボタンのタップ(=ユーザー操作)で`el.play()`すればiOSでも鳴る（テスト音も廃止）
  - SWは**ネットワーク優先**(cache-firstは「更新したのに古い音」の主因)。ただし**controllerchangeでの自動リロードは入れない**（使用中に再生が止まる）。更新はリロードで反映される旨を案内
  - 起動時の存在確認は**GETでなくHEAD**（GETだと全mp3をフルDLして激重）。Vercelは静的ファイルにHEADで200を返す
  - 検証は必ず**サーバー実測**で（curlでファイルの実バイトサイズを期待値と突合／HEADの200確認）。「変わってない」の大半はブラウザ/SWキャッシュで、サーバーは正しいことが多い→まずサイズ照合で切り分ける
- 反復差し替えの型：`/tmp/_pool2`に候補DL→`file`でMPEG検証→採用分だけ配置→sounds.json整合→独立フォルダにcp→`vercel deploy --prod`→curlでサイズ照合→commit&main。ブラウザ確認用に`open URL/?v=fixN`でキャッシュ回避
- ※2026-08-02メモのSSO手順は当時の話。balencer-audio新規作成時はSSO無効のまま200で公開できた（環境/チーム設定次第。302なら要無効化）

## 2026-08-17 デジタル庁デザインシステム（DADS v2）をスキル化 `.claude/skills/dads/`
- 依頼：「デジタル庁のやつで作って」で呼び出せるように保存。発火語＝デジタル庁／DADS／デジタル庁風／行政っぽく
- **公式StorybookはWebFetchで中身が取れない**（JSレンダリングでタイトルしか返らない）。取得ルートの結論:
  - トークン実体 → `npm pack @digital-go-jp/design-tokens`（v2.0.1・MIT）の `dist/tokens.css`
  - タイポ58種 → `@digital-go-jp/tailwind-theme-plugin`（v1.0.1）の `dist/v4.css` の `@utility` 定義
  - コンポーネント仕様 → GitHub raw `digital-go-jp/design-system-example-components-react`（**リポ名は `-react`／`-html` 付きが正**。`design-system-example-components` は301）
  - 全体像（部品71件の一覧）→ Storybookの静的JSON `https://design.digital.go.jp/dads/react/index.json`
- 保存物：`reference/tokens.md`（10色相×13階調・タイポ58・角丸・影8段の全量表）／`assets/dads-tokens.css`（公式そのまま）／`dads-typography.css`（55クラスを素CSSに機械展開）／`dads-components.css`（ボタン・リンク・フォーム・見出し・カード・表・通知を書き起こし）／`starter.html`（雛形兼見本）／MITライセンス原文
- 設計判断：バレンサーの成果物は**静的HTMLが主**なので、React/Tailwind前提の公式実装を素のCSSに落とす層を自前で持つことにした。公式コピー部分（tokens.css）と書き起こし部分（components.css）はファイルを分けて、バージョン更新時に前者だけ差し替えられるようにした
- 押さえた仕様：キー#0017c1(key-900)／本文#333333／境界#666666／ウェイトは400と700のみ／角丸はボタン8px／フォーカスは黒4pxアウトライン+黄#ffd43d 2pxリング／sm・xsボタンも擬似要素でタップ領域44px／hoverは色でなく下線で示す
- ガードレール：コードはMITだがブランドは別。デジタル庁のロゴ・省庁名は使わず、公的機関の制作物と誤認させない。自社対外物は `docs/company/BALENCER_DESIGN_SYSTEM.md` が優先、混ぜる時は `--color-key-*` だけ自社色に差し替える（key はblueのエイリアスなので全体が追従する）
- 却下：design-md ギャラリー（awesome-design-md-jp）に混ぜる案 → あれは公開CSSの実測値集。DADSは公式仕様書があるので独立スキルにした

## 2026-08-25 外部エンジニアへ渡す前の要件定義パッケージの整え方（MUTSUBI PORTAL）

睦備建設の社内ポータル開発で、Notion上の要件定義一式を「正式見積りを取れる状態」に仕上げた。第三者レビューの指摘5点を反映した際の判断を残す。

### 見積り精度は「画面の枚数」で決まる
機能一覧20件に対し画面一覧が5件だった。フロントエンド工数は画面枚数に直結するので、機能一覧より画面一覧のほうが見積りには効く。1画面に登録・一覧・管理が同居していたものを役割で割った。

- 予約は「空室検索」「予約登録」「予約詳細・変更・キャンセル」の3枚に割る
- アルコールチェックは「本人の登録」と「総務の管理」で権限が違うので必ず分ける
- 社員マスタは「一覧」と「登録・編集」を分ける
- 忘れやすいのは **ホーム/ダッシュボード・CSV出力履歴・システム設定** の3枚。特にシステム設定は「部屋や判定基準を画面から変えられるか、固定値か」という運用コストの分岐点になる

結果5件→15件（S-001〜S-015）。既存行のIDを振り直しても、フロー順に並ぶほうがエンジニアが読みやすい。

### 画面を割ると未確定事項が増える
画面を分解すると自動的に確認事項が出る（利用可能時間帯、代理操作の可否、記録の修正権限、対応ブラウザ、想定社員数など）。15件→25件に増えた。**未確定事項が増えるのは劣化ではなく、見積り前に潰すべき穴が見えた状態**。

### 受入条件は「機能ID→受入条件」の対応表を必ず付ける
受入条件7項目に対しPhase 1候補は14機能で、権限管理・管理者画面・データ永続保存・PC/スマホ対応・監査ログが素通りしていた。共通基盤系は各機能の説明に埋もれて漏れやすいので、独立した節を立てて対応表で突き合わせる。

### 親ページと依頼書の役割分担
親ページに詳しい説明を書くと、01の開発依頼書とどちらが正本か分からなくなる。**親＝現在地・図・資料・次のアクション／01＝正式な依頼書／02以降＝詳細**に振り分け、親の散文は01へ寄せる。

### Notion実装メモ
- **Mermaidはコードブロックのままだと図にならない**（阿部さんの画面でコード文字列として表示された）。`npx -y @mermaid-js/mermaid-cli@11 -i x.mmd -o x.png -b white -s 3 -c theme.json` でPNG化して画像ブロックに差し替える。日本語フォントはmacOS標準で問題なく出る。.mmdソースはgitに残して再生成できるようにする
- **NotionへのHTML直アップロードはCloudflareに403で弾かれる**（`api.notion.com/v1/mcp/file_uploads/.../send` にscript入りHTMLをPOSTするとWAFが反応）。zipに固めればbinaryとして通る。MCPの `notion-create-attachment`（content渡し）は通るが、大きいファイルは全文を渡す必要があり非現実的
- docx等のcurlアップロードは `-F "file=@x.docx;type=<正確なMIME>"` を明示しないと `application/octet-stream` 扱いで400になる
- 親ページの本文を `replace_content` で丸ごと書き換えると子DB・子ページが消える。`update_content` の検索置換で部分的に直す

### 2026-08-26 追記：クライアント名入りモックを公開URLで渡すとき
zip添付よりURLのほうがエンジニアは確実に見る。ただし社名が入るので、公開前に2点入れる。

1. `<meta name="robots" content="noindex, nofollow, noarchive">` をHTMLに追加
2. `robots.txt` に `User-agent: * / Disallow: /`

デプロイはリポジトリ本体ではなく、`index.html` と `robots.txt` だけの独立フォルダを作って `npx vercel deploy --prod --yes`。**払い出される `<project>-<hash>-<team>.vercel.app` はDeployment Protectionで外部から開けないことがある。共有するのは短いエイリアス `<project>.vercel.app` のほう。**渡す前に必ず `curl -s -o /dev/null -w "%{http_code}" <URL>` で200を確認する。

## 2026-08-26 design-md 索引を472件に更新（414→472）

`.claude/skills/design-md/slugs.txt` を上流の最新一覧で貼り替えた。2026-07-28 の初回取得時は414件、今回472件。

- 増えた58件の傾向は **美術館・文化施設／地方の老舗・工芸／BtoB SaaS** の3方向。地域オーナー企業の案件で当てられる手札が厚くなった
  - 美術館系: nezu-museum・nakanoshima-museum・aomori-museum・kyocera-museum・pola-museum・kadokawa-museum・teien-art-museum・topmuseum・towada-art-center・ycam・setouchi-triennale・opam・bunkitsu
  - 老舗・地場: fukumitsuya・hakkaisan・tsuruyayoshinobu・ninben・inden-ya・suwada・gungendo・unagino-nedoko・tokichi・seikado・chateraise・maruyamacoffee
  - BtoB SaaS: andpad・kaminashi・loglass・upsider・nulab・smartbank・preferred-networks・concent・mimiguri・rhizomatiks・whatever
- 索引の和名対応表に、よく使いそうな老舗・建設住宅・美術館の行を追記した（とらや・開化堂・能作・積水ハウス・住友林業 等）
- **上流は増え続けるので索引は放っておくと古びる**。ブランド名が索引で引けなかった時は、まず SKILL.md 冒頭のAPIコマンドで最新一覧を取り直す（消えたslugは今回ゼロ＝追加のみ）
- DESIGN.md の中身は引き続きリポジトリにキャッシュしない（都度 raw 取得）。同じブランドで3回以上作るようになったらキャッシュ固定化を提案する方針は維持

## 2026-09-03 HASSIN 制作システムの伴走が始動（ネクサスグループHD）

クライアント側の担当者（梶原さん）が **Claude＋Vercel＋Neon で自前開発したシステムに、バレンサーが途中から入る**という初めての形。フォルダは `docs/clients/nexus-group/事業会社/hassin/01_制作システム/`。

### 立ち位置の決め方
作り直しではなく**引き上げる**。独学の割に解像度が高く、作り直しは信頼を壊すうえスコープも合わない（先方は「制作システムを一旦1ヶ月程度で終わらせたい」）。バレンサーは設計の詰まりどころ（マスタ連携・置き場の切り分け・UI最適化の指示の型）を埋める役に回る。

### 「何にどこまで持たせるか」は用途で3分割する
画像の置き場を「Cloudinary か Google Drive か」の二択にすると詰まる。**構造化データ＝DB(Neon)／配信用画像＝画像配信サービス／制作原本・アーカイブ＝Drive** に割るのが要点。DBには参照キーとサムネURLだけ持たせる。
→ Drive に寄せると Cloudflare/R2 を検討する動機（配信コスト）自体が小さくなる。**基盤の乗り換え（Supabase・Cloudflare）は課題の解決にならない**ので、いまは触らない。開発が止まるコストが一番高い。

### 却下した指示の書き方
「スマホファーストのレスポンシブデザインで作って」は**却下**。制作チームはPC・現場（店舗）はスマホという**画面ごとに主利用者が違うシステム**では、全画面が一律スマホ優先になって誤る。
採用したのは「**利用者ごとに最適化**」＋「**セルフチェック→ベスト案1本→OK後に実装**」。主利用者が未指定なら確認を挟ませず自分で判断させ、判断理由を一言添えさせる。テンプレは [dev-ui-prompt-per-user.md](dev-ui-prompt-per-user.md)（案件非依存の汎用型）。

### 記録側の教訓
- **持株会社グループは担当者が同じならHDフォルダ1つに束ねる**。旧 `docs/clients/hare/` を `nexus-group/事業会社/hare/` に移設し、`clients/README.md` の命名規則に明文化した
- 人名の混線に注意。「加藤」がバレンサー側の加藤 梨紗さんとHASSINの加藤社長の両方に居る。旧READMEの「加藤梨紗さんがHD代表就任予定」は要確認扱いに落とした（→ [[feedback_no_imaginary_team_members]] と同じ筋）
- 音声入力の議事録は固有名詞が崩れる（バーセル/バーゼル＝Vercel、ネオン＝Neon、ディクショナリー＝Cloudinary、スパベース＝Supabase）。git に落とすときに正式表記へ直す

## 2026-09-03 追記：HASSIN 制作システムのデータアーキテクチャを実スキーマから決めた

クライアント自作システムに途中参加するとき、**先にリポジトリのスキーマを読むと結論が変わる**という実例。成果物は `docs/clients/nexus-group/事業会社/hassin/01_制作システム/アーキテクチャ検討_2026-09-03.md`（Notion版 https://app.notion.com/p/3d053269fc5e81749831d0a2ad0237a8 ）。

### 読まずに答えると外す：先行整理の「案a: 直接接続」は不可だった
Prisma を読むと `Store.id` を7テーブルが外部キー参照していた（Project/Invoice/AssetStore/NewStoreSchedule/MenuSchedule/Request/AllowedUser＋多対多）。**ビューは外部キーの参照先になれない**ので、外部DBを参照先にする案は成立しない。正解は「ポータルを正として日次バッチで一方通行 upsert」＋ `Store.externalId` の追加。
→ 教訓: **リレーションの本数を数えるまで連携方式を断定しない。** GitHub権限があるなら `gh repo view` で確認 → clone して `grep -n "^model" prisma/schema.prisma` が最短。

### 金額は「単価×実データ量」で桁を出すと議論が決まる
「Cloudinary 3TB」という申告が**無料枠25クレジット（≒25GB）の120倍**で成立しないと分かった。1クレジット＝保存1GB＝配信1GB＝変換1,000回。3TBを各所で持つ年額は Neon 189万 / Cloudinary 205万 / Vercel Blob 12万 / R2 8.1万 / Drive 0円（既払いプール）。
→ 教訓: **ストレージの単価差は20倍以上開く。**「どこに置くか」は好みでなく桁の問題。まず実使用量を1つ確認しに行く（5分で桁が決まる）。

### 「安いから全部そこ」にしない判断軸
R2 は3TBで月6,750円・エグレス無料で最安。それでも原本の置き場に選ばなかったのは**制作部がIllustrator/PSDをFinderから直接開いて編集する**から。アプリ経由でしか触れない置き場は現場の作業を壊す。
→ 用途で3分割: 構造化=DB／配信サムネ=画像CDN／制作原本=Drive。DBは参照キーだけ持つ。

### リアルタイム同期は「Supabase必須」ではない（誤解しやすい）
- **Postgres Changes**（DB変更の自動購読）は Supabase の Postgres が必要 → DB移行が必須
- **Broadcast / Presence** は **DB非依存** → **Neonのまま Supabase Realtime だけ薄く足せる**
- その手前に無料の2段がある: ①ポーリング10〜30秒 ②Neon の LISTEN/NOTIFY＋SSE（制約: 1リスナー=1接続・直結接続文字列が必要・ペイロード8,000バイト上限・片方向）
- Vercel Pro の関数は Fluid compute で最大800秒（beta 1800秒）→ SSEはそこで切れるが `EventSource` が自動再接続する
→ 教訓: **「リアルタイムが欲しい」を即「DB乗り換え」に変換しない。**必要な画面を1〜2枚に絞ってから①→②→③と段を上げる。

### 実装の指摘は「消せないデータ」から入ると効く
`AssetFile` は `fileUrl` のみで `publicId` を持たず、**DBから消してもCloudinary側の実体が残る**（容量が戻らない）。`GroupPlanPost.imageUrl` も同型。置き場の抽象化（`storageProvider`/`storageKey`/`thumbnailUrl`/`originalRef`）を入れると、乗り換え可能化とこのバグが同時に直る。**共通テーブルへの統合はしない**（6テーブルのリレーション先が違う＋46本のマイグレーション履歴）。

### 作業メモ
- Notion に図を入れるときは `![キャプション](file-upload://<id>)` の**画像markdown形式にする**。`file-upload://<id>` を裸で置くと**テキストのまま入る**（1度失敗した）
- **callout に複数行を入れると壊れる**（`\<callout\>` がエスケープされて本文化する）。1行に収める
- `xychart-beta` は日本語ラベルが長いと軸で重なる。**単位を万円にして5文字程度に切る**
- **`nlm login` は Chrome 起動中だと失敗する**。CDPポートを9223→9224と変えて自前Chromeを立てようとして、既存インスタンスに奪われ即終了する。別プロファイルのChromeを9223でリッスンさせても、nlm側が毎回次のポートを取るので回避できない。**Chromeを終了してから実行するのが唯一の手**
