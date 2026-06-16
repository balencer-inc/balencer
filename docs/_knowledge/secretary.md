# secretary の知見ログ

> 各担当が作業で得た知見・決定・好み・命名規則・却下案とその理由を蓄積する。
> 1エントリは `## YYYY-MM-DD 要点` の形。運用ルールは README.md を参照。

<!-- ここに追記していく -->

## 2026-06-16 オンライン商談ナビを作成（バレンサー/TSUGI 近況共有用）

- 取引先とのオンライン近況共有で、バレンサー/TSUGIの各種資料を画面共有で見せるため、1枚から全部にワンクリックで飛べる「商談ナビ」を作成。
- 成果物: `docs/online-shodan-2026-06/index.html`。CI（墨 #141414／白／蛍光イエロー #E6FF2F）準拠。各カードに「話すこと」メモ付き、リンクは別タブ（target=_blank）で開きナビが消えない設計。
- 開き方: `open ~/Projects/balencer/docs/online-shodan-2026-06/index.html`
- 構成: 01バレンサー再定義（handoff非公開ページ群）／02 AI社員デモ（outreach）／03提案事例（NAILIT・1st PLACE）／04 TSUGI企業ドック診断（本番URL）／05余力LP。
- **重要メモ（実体の所在）**:
  - バレンサー再定義の正本ページ＝`docs/handoff/`（pages/top・mvv・ai・migiude・soeru）。
  - TSUGI企業ドック診断は**このリポジトリに無い**。コードは別プロジェクト `~/Projects/ai-staff/dev/tsugi-site/dock/`、本番URL `https://tsugiandpartners.jp/test/dock/`。商談では本番ページ内の「**デモデータで体験する**」ボタンでサンプル商事(TYPE C・16ページ)を即生成して見せる（待ち時間なし）。
  - NAILIT営業ダッシュボードの見せ札＝`public/docs/nailit-2026/{samples,exec-brief,estimate}/index.html`。
- **AI社員アプリの起動状態（2026-06-16検証）**:
  - `apps/outreach/` … `npm run dev` → `localhost:3100` で **HTTP 200 正常**。AI社員デモはこれ1本で十分。
  - `demo/` … **起動不可**。package.json・src一式が消えており`.next`残骸のみ。商談ナビからは除外済み。復旧するならソース再配置が必要。
