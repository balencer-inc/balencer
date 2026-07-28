# BALENCER Brand Profile

画像ベースのデジタルブランドブックです。PC・スマートフォンのページめくり、一覧表示、全画面表示を含みます。

## Vercelへの公開

1. このフォルダ一式をGitHubリポジトリへ入れます。
2. VercelでそのリポジトリをImportします。
3. Framework Presetは `Other`、Build Commandは空欄、Output Directoryは `.` を指定します。
4. 公開後、VercelのDomainsから独自ドメインを設定します。

## ページ画像の差し替え

`slides/slide-01.png` から `slide-14.png` を、同じファイル名・16:9サイズの画像で置き換えてください。HTMLやJavaScriptを変更する必要はありません。

## ローカル確認

フォルダ内で簡易Webサーバーを起動してください。例：

```bash
python3 -m http.server 8080
```

その後、ブラウザで `http://localhost:8080` を開きます。
