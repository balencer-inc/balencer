# dev の知見ログ

> 各担当が作業で得た知見・決定・好み・命名規則・却下案とその理由を蓄積する。
> 1エントリは `## YYYY-MM-DD 要点` の形。運用ルールは README.md を参照。

<!-- ここに追記していく -->

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
