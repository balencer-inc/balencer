# Web表現の指示語彙（AIに「動き」を頼むときの共通ボキャブラリ）

◎評価サイト（PLAID ALPHA・Whatever・ryden・Konel・gaaboo 等）のような表現を、
AI（Claude / v0 / Cursor 等）に指示するための語彙集。プロンプトに用語を入れれば、AIが該当実装を持ってくる。

> 出典：旧Notion「BALENCER デザイン参考事例」を救済。**色・フォント等のCI値はここに固定せず、現行CIの正本（`docs/handoff/`・`docs/company/`）を正とする**。ここは「動きの語彙・技術」だけを扱う。

## カテゴリ1：スクロール連動
- **Scroll-driven animation**：スクロール量で要素が変化。関連＝ScrollTrigger(GSAP) / CSS `animation-timeline: scroll()` / Intersection Observer
- **Parallax**：背景と前景が異なる速度で動く視差
- **Sticky / Pin**：スクロール中に要素を一定期間固定（横スクロール構成に多用）
- **Scroll snap**：セクション単位で停止
- **Smooth scroll（Lenis型）**：慣性つきの滑らかなスクロール

## カテゴリ2：カーソル・マウス連動
- **Cursor trail / Mouse trail**：カーソル追従の残像（Canvasパーティクル / WebGL / 残像Div）
- **Custom cursor**：OSカーソルを独自形状に置換
- **Magnetic cursor**：ボタンにカーソルが吸い寄せられる
- **Mouse tracking / 3D tilt**：マウス位置で傾く・視点が変わる

## カテゴリ3：テキストアニメ
- **Text reveal / Split text / Staggered text**：文字を一字/一語ずつ時差で登場（GSAP SplitText / Framer Motion `staggerChildren`）
- **Text scramble**：ランダム文字→実文字のデコード演出
- **Typewriter**：打ち込み風に一字ずつ
- **Kinetic typography**：タイポ自体が主役で動く
- **Marquee / Infinite ticker**：無限ループの横流れ帯
- **Text mask**：文字の中に写真/動画（`background-clip: text`）

## カテゴリ4：色・グラデーション
- **Animated gradient（CSS variable gradient）**：`@property` で角度・カラーストップ・位置を宣言し `transition` で色遷移（PLAID ALPHAの核心技術。詳細は下記）
- **Hue rotation**：`filter: hue-rotate()` で色相ループ
- **Conic / Mesh gradient**：円錐状・メッシュで流動感
- **Blend mode**：`mix-blend-mode: difference` 等で重なりの色を合成
- **Noise / Grain**：微粒子テクスチャでフィルム調

## カテゴリ5：ファーストビュー・導入
- **Preloader / Loading screen**：ロゴが動く・変形する読み込み画面
- **Page transition**：フェード/スライド/Curtain/Morph でシーンをつなぐ
- **Hero reveal**：FVの各要素が時差で登場

## カテゴリ6：ホバー・マイクロインタラクション
- **Hover reveal**：ホバーで写真・情報がスライドイン
- **Clip-path reveal**：切り抜き形で展開（円が拡張する等）
- **Image distortion / Liquid**：写真を液体状に歪ませる（WebGL）
- **Glitch**：一瞬のデジタルノイズ

## カテゴリ7：3D・リッチ
- **WebGL / Three.js / Shader**：GPU描画のリッチ表現（実装コスト高）
- **3D tilt（Vanilla Tilt）**／**Blob morph**：有機的な形が呼吸するように動く

## カテゴリ8：ライブラリ名（「※で実装して」と指定）
| ライブラリ | 用途 | 言い方 |
|---|---|---|
| GSAP | 高性能JSアニメ | 「GSAPとScrollTriggerで」 |
| Framer Motion | React宣言的アニメ | 「Framer Motionで」 |
| Lenis | スムーススクロール | 「Lenisでsmooth scrollを」 |
| Lottie | AE書き出しアニメ | 「Lottieで」 |
| Three.js | 3D/WebGL | 「Three.jsのシーンとして」 |
| Rive | インタラクティブアニメ | 「Riveで」 |
| Barba.js | ページ遷移 | 「Barbaで」 |
| Anime.js | 軽量JSアニメ | 「Anime.jsで」 |

---

## 付録：PLAID ALPHA から抽出した「◎の作り方」（技術insight）
バレンサーが◎と評価したサイト（alpha.plaid.co.jp）を分解して得た、再現可能な設計インサイト。**色・フォントの実値は現行DSに従う**前提で、"型"だけを残す。

- **背景は純白でなくオフホワイト基調**：#FFF を多用せず、わずかにグレーがかった面（例 #F7F7F7）で光を柔らかく落とす
- **黒を#000で使わない**：#111〜#333 主体でコントラストを緩める
- **イージングを1本に統一**：`cubic-bezier(.4,.4,0,1)`、duration は 0.3 / 0.4 / 0.6s の3段
- **主役は可変CSSグラデーション**：`@property` で `--g-angle` / `--g-color-*` / `--g-position-*` を宣言 →
  `background: linear-gradient(var(--g-angle), var(--g-color-0) var(--g-position-0), …)` →
  スクロール/ホバー/時間で custom property を変え `transition` で滑らかに補間（GPU加速）
- **フォントは三段重ね**：ディスプレイ・セリフ × 欧文サンセリフ × 和文。ジャンプ率を高く（本文16px→見出し64px+）
- **余白**：セクション間 80〜160px、カード内 24 / 32px

### 最小で真似る3点セット
1. ベース色をオフホワイトに寄せる
2. イージングを1本に統一
3. セリフ×サンセリフ×和文の三段重ね

### プロンプト・テンプレ（CI中立）
```
[PLAID ALPHA / Konel / Whatever / ryden / gaaboo] 風のデザインで、
※具体的な動き（上の語彙で指定）を入れてください。
色・フォントはバレンサー現行DSのトークンに従ってください（勝手な配色をしない）。
```

## 参考リンク
- CSS @property（MDN） https://developer.mozilla.org/ja/docs/Web/CSS/@property
- GSAP ScrollTrigger https://gsap.com/scrolltrigger/
- Framer Motion https://motion.dev/
- Lenis https://lenis.darkroom.engineering/
- Awwwards https://www.awwwards.com/
