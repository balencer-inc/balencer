# BALENCER Presentation Library

株式会社バレンサーの2種類の会社案内を、用途に応じて呼び出すためのWebサイトです。

## URL構成

- `/` — 資料を選ぶ入口
- `/business` — 商談・オンライン会議向けの会社／サービス紹介
- `COMPANY PROFILE` — 既存の世界観型会社案内
  - `https://balencer-brand-profile.vercel.app`

世界観型の資料と商談資料は、ひとつの長い資料には結合していません。用途が異なるため、それぞれのURLを直接共有できる設計です。

## 商談資料の操作

- PC：左右矢印キー、Space、マウスホイール、画面左右のクリック
- スマートフォン：左右スワイプ
- `ALL SLIDES`：全ページ一覧
- `FULLSCREEN`：全画面表示
- URL末尾の `?slide=5` のような指定で、任意のページから表示

## Vercelへの公開

1. このフォルダをGitHubリポジトリへ追加します。
2. VercelでリポジトリをImportします。
3. Framework Presetは `Next.js` を選択します。
4. `vercel.json` がVercel用のビルドを指定するため、Build Commandの上書きは不要です。
5. Install Commandは `npm install` のままで公開できます。
6. 公開後、VercelのDomainsから独自ドメインを追加します。

既存の会社案内URLを変更する場合は、以下の2ファイル内にある
`https://balencer-brand-profile.vercel.app` を置換してください。

- `app/page.tsx`
- `app/business/business-deck.tsx`

## スライド画像

`public/slides/` に、01〜09の順番でPNG画像を保存しています。
