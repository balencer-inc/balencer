# DADS デザイントークン全量（v2.0.1 / Figma v2.0.4〜2.14.0 対応）

出典: `@digital-go-jp/design-tokens@2.0.1`（MIT / デジタル庁）と `@digital-go-jp/tailwind-theme-plugin@1.0.1`。
CSS変数の実体は同フォルダの `../assets/dads-tokens.css`（公式ファイルをそのまま同梱）。

## 1. プリミティブカラー（10色相 × 13階調）

CSS変数は `--color-primitive-<hue>-<step>`。Tailwindプラグインでは `<hue>-<step>`（例 `bg-blue-900`）。

| step | blue | light-blue | cyan | green | lime | yellow | orange | red | magenta | purple |
|---|---|---|---|---|---|---|---|---|---|---|
| 50 | #e8f1fe | #f0f9ff | #e9f7f9 | #e6f5ec | #ebfad9 | #fbf5e0 | #ffeee2 | #fdeeee | #f3e5f4 | #f1eafa |
| 100 | #d9e6ff | #dcf0ff | #c8f8ff | #c2e5d1 | #d0f5a2 | #fff0b3 | #ffdfca | #ffdada | #ffd0ff | #ecddff |
| 200 | #c5d7fb | #c0e4ff | #99f2ff | #9bd4b5 | #c0f354 | #ffe380 | #ffc199 | #ffbbbb | #ffaeff | #ddc2ff |
| 300 | #9db7f9 | #97d3ff | #79e2f2 | #71c598 | #ade830 | #ffd43d | #ffa66d | #ff9696 | #ff8eff | #cda6ff |
| 400 | #7096f8 | #57b8ff | #2bc8e4 | #51b883 | #9ddd15 | #ffc700 | #ff8d44 | #ff7171 | #f661f6 | #bb87ff |
| 500 | #4979f5 | #39abff | #01b7d6 | #2cac6e | #8cc80c | #ebb700 | #ff7628 | #ff5454 | #f137f1 | #a565f8 |
| 600 | #3460fb | #008bf2 | #00a3bf | #259d63 | #7eb40d | #d2a400 | #fb5b01 | #fe3939 | #db00db | #8843e1 |
| 700 | #264af4 | #0877d7 | #008da6 | #1d8b56 | #6fa104 | #b78f00 | #e25100 | #fa0000 | #c000c0 | #6f23d0 |
| 800 | #0031d8 | #0066be | #008299 | #197a4b | #618e00 | #a58000 | #c74700 | #ec0000 | #aa00aa | #5c10be |
| 900 | #0017c1 | #0055ad | #006f83 | #115a36 | #507500 | #927200 | #ac3e00 | #ce0000 | #8b008b | #5109ad |
| 1000 | #00118f | #00428c | #006173 | #0c472a | #3e5a00 | #806300 | #8b3200 | #a90000 | #6c006c | #41048e |
| 1100 | #000071 | #00316a | #004c59 | #08351f | #2c4100 | #6e5600 | #6d2700 | #850000 | #500050 | #30016c |
| 1200 | #000060 | #00234b | #003741 | #032213 | #1e2d00 | #604b00 | #541e00 | #620000 | #3b003b | #21004b |

## 2. キーカラー（= blue のエイリアス。ここを差し替えればブランド適用できる）

`--color-key-50` 〜 `--color-key-1200` は blue と同値。Tailwind では `key-900` 等。

| トークン | 値 | 主な用途 |
|---|---|---|
| `--color-key-50` | #e8f1fe | テキストボタン hover 背景 |
| `--color-key-100` | #d9e6ff | テキストボタン active 背景 |
| `--color-key-200` | #c5d7fb | アウトラインボタン hover 背景 |
| `--color-key-300` | #9db7f9 | アウトラインボタン active 背景 |
| `--color-key-400` | #7096f8 | — |
| `--color-key-500` | #4979f5 | — |
| `--color-key-600` | #3460fb | — |
| `--color-key-700` | #264af4 | — |
| `--color-key-800` | #0031d8 | — |
| `--color-key-900` | #0017c1 | **基準のキーカラー**（塗りボタン背景・見出しチップ・アイコン） |
| `--color-key-1000` | #00118f | 塗りボタン hover / リンク文字色（blue-1000） |
| `--color-key-1100` | #000071 | — |
| `--color-key-1200` | #000060 | 塗りボタン active |

## 3. ニュートラル

| トークン | 値 |
|---|---|
| `--color-neutral-white` | #ffffff |
| `--color-neutral-black` | #000000 |
| `--color-neutral-solid-gray-50` | #f2f2f2 |
| `--color-neutral-solid-gray-100` | #e6e6e6 |
| `--color-neutral-solid-gray-200` | #cccccc |
| `--color-neutral-solid-gray-300` | #b3b3b3 |
| `--color-neutral-solid-gray-400` | #999999 |
| `--color-neutral-solid-gray-420` | #949494 |
| `--color-neutral-solid-gray-500` | #7f7f7f |
| `--color-neutral-solid-gray-536` | #767676 |
| `--color-neutral-solid-gray-600` | #666666 |
| `--color-neutral-solid-gray-700` | #4d4d4d |
| `--color-neutral-solid-gray-800` | #333333 |
| `--color-neutral-solid-gray-900` | #1a1a1a |
| `--color-neutral-opacity-gray-50` | rgba(0, 0, 0, 0.05) |
| `--color-neutral-opacity-gray-100` | rgba(0, 0, 0, 0.1) |
| `--color-neutral-opacity-gray-200` | rgba(0, 0, 0, 0.2) |
| `--color-neutral-opacity-gray-300` | rgba(0, 0, 0, 0.3) |
| `--color-neutral-opacity-gray-400` | rgba(0, 0, 0, 0.4) |
| `--color-neutral-opacity-gray-420` | rgba(0, 0, 0, 0.42) |
| `--color-neutral-opacity-gray-500` | rgba(0, 0, 0, 0.5) |
| `--color-neutral-opacity-gray-536` | rgba(0, 0, 0, 0.54) |
| `--color-neutral-opacity-gray-600` | rgba(0, 0, 0, 0.6) |
| `--color-neutral-opacity-gray-700` | rgba(0, 0, 0, 0.7) |
| `--color-neutral-opacity-gray-800` | rgba(0, 0, 0, 0.8) |
| `--color-neutral-opacity-gray-900` | rgba(0, 0, 0, 0.9) |

> 本文テキストは `solid-gray-800`(#333333)、境界線は `solid-gray-600`(#666666)、
> 無効状態は `solid-gray-300`/`solid-gray-420` が公式コンポーネントの既定。

## 4. セマンティックカラー

| トークン | 参照先 | 値 |
|---|---|---|
| `--color-semantic-success-1` | green-600 | #259d63 |
| `--color-semantic-success-2` | green-800 | #197a4b |
| `--color-semantic-error-1` | red-800 | #ec0000 |
| `--color-semantic-error-2` | red-900 | #ce0000 |
| `--color-semantic-warning-yellow-1` | yellow-700 | #b78f00 |
| `--color-semantic-warning-yellow-2` | yellow-900 | #927200 |
| `--color-semantic-warning-orange-1` | orange-600 | #fb5b01 |
| `--color-semantic-warning-orange-2` | orange-800 | #c74700 |

## 5. タイポグラフィ（公式58ユーティリティ）

フォント: `--font-family-sans: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif`  
等幅: `--font-family-mono: 'Noto Sans Mono', monospace`  
ウェイトは 400 / 700 の2つだけ（500・600は使わない）。

クラス名の読み方: `text-<用途>-<サイズ><B|N>-<行間>`  
用途 `dsp`=ディスプレイ（特大見出し） / `std`=スタンダード（本文・見出し） / `dns`=デンス（密集・UI内） / `oln`=ワンライン（ボタン・ラベル、行間1.0） / `mono`=等幅。
`B`=Bold(700) / `N`=Normal(400)。末尾の数値は行間×100。

### dsp — ディスプレイ

| クラス | font-size | weight | line-height | letter-spacing |
|---|---|---|---|---|
| `text-dsp-64B-140` | 4rem (64px) | 700 | 1.4 | 0 |
| `text-dsp-57B-140` | 3.5625rem (57px) | 700 | 1.4 | 0 |
| `text-dsp-48B-140` | 3rem (48px) | 700 | 1.4 | 0 |
| `text-dsp-64N-140` | 4rem (64px) | 400 | 1.4 | 0 |
| `text-dsp-57N-140` | 3.5625rem (57px) | 400 | 1.4 | 0 |
| `text-dsp-48N-140` | 3rem (48px) | 400 | 1.4 | 0 |

### std — スタンダード

| クラス | font-size | weight | line-height | letter-spacing |
|---|---|---|---|---|
| `text-std-45B-140` | 2.8125rem (45px) | 700 | 1.4 | 0 |
| `text-std-36B-140` | 2.25rem (36px) | 700 | 1.4 | 0.01em |
| `text-std-32B-150` | 2rem (32px) | 700 | 1.5 | 0.01em |
| `text-std-28B-150` | 1.75rem (28px) | 700 | 1.5 | 0.01em |
| `text-std-26B-150` | 1.625rem (26px) | 700 | 1.5 | 0.02em |
| `text-std-24B-150` | 1.5rem (24px) | 700 | 1.5 | 0.02em |
| `text-std-22B-150` | 1.375rem (22px) | 700 | 1.5 | 0.02em |
| `text-std-20B-160` | 1.25rem (20px) | 700 | 1.6 | 0.02em |
| `text-std-20B-150` | 1.25rem (20px) | 700 | 1.5 | 0.02em |
| `text-std-18B-160` | 1.125rem (18px) | 700 | 1.6 | 0.02em |
| `text-std-17B-170` | 1.0625rem (17px) | 700 | 1.7 | 0.02em |
| `text-std-16B-170` | 1rem (16px) | 700 | 1.7 | 0.02em |
| `text-std-16B-175` | 1rem (16px) | 700 | 1.75 | 0.02em |
| `text-std-45N-140` | 2.8125rem (45px) | 400 | 1.4 | 0 |
| `text-std-36N-140` | 2.25rem (36px) | 400 | 1.4 | 0.01em |
| `text-std-32N-150` | 2rem (32px) | 400 | 1.5 | 0.01em |
| `text-std-28N-150` | 1.75rem (28px) | 400 | 1.5 | 0.01em |
| `text-std-26N-150` | 1.625rem (26px) | 400 | 1.5 | 0.02em |
| `text-std-24N-150` | 1.5rem (24px) | 400 | 1.5 | 0.02em |
| `text-std-22N-150` | 1.375rem (22px) | 400 | 1.5 | 0.02em |
| `text-std-20N-150` | 1.25rem (20px) | 400 | 1.5 | 0.02em |
| `text-std-18N-160` | 1.125rem (18px) | 400 | 1.6 | 0.02em |
| `text-std-17N-170` | 1.0625rem (17px) | 400 | 1.7 | 0.02em |
| `text-std-16N-170` | 1rem (16px) | 400 | 1.7 | 0.02em |
| `text-std-16N-175` | 1rem (16px) | 400 | 1.75 | 0.02em |

### dns — デンス

| クラス | font-size | weight | line-height | letter-spacing |
|---|---|---|---|---|
| `text-dns-17B-130` | 1.0625rem (17px) | 700 | 1.3 | 0 |
| `text-dns-17B-120` | 1.0625rem (17px) | 700 | 1.2 | 0 |
| `text-dns-16B-130` | 1rem (16px) | 700 | 1.3 | 0 |
| `text-dns-16B-120` | 1rem (16px) | 700 | 1.2 | 0 |
| `text-dns-14B-130` | 0.875rem (14px) | 700 | 1.3 | 0 |
| `text-dns-14B-120` | 0.875rem (14px) | 700 | 1.2 | 0 |
| `text-dns-17N-130` | 1.0625rem (17px) | 400 | 1.3 | 0 |
| `text-dns-17N-120` | 1.0625rem (17px) | 400 | 1.2 | 0 |
| `text-dns-16N-130` | 1rem (16px) | 400 | 1.3 | 0 |
| `text-dns-16N-120` | 1rem (16px) | 400 | 1.2 | 0 |
| `text-dns-14N-130` | 0.875rem (14px) | 400 | 1.3 | 0 |
| `text-dns-14N-120` | 0.875rem (14px) | 400 | 1.2 | 0 |

### oln — ワンライン

| クラス | font-size | weight | line-height | letter-spacing |
|---|---|---|---|---|
| `text-oln-17B-100` | 1.0625rem (17px) | 700 | 1 | 0.02em |
| `text-oln-16B-100` | 1rem (16px) | 700 | 1 | 0.02em |
| `text-oln-14B-100` | 0.875rem (14px) | 700 | 1 | 0.02em |
| `text-oln-17N-100` | 1.0625rem (17px) | 400 | 1 | 0.02em |
| `text-oln-16N-100` | 1rem (16px) | 400 | 1 | 0.02em |
| `text-oln-14N-100` | 0.875rem (14px) | 400 | 1 | 0.02em |

### mono — 等幅

| クラス | font-size | weight | line-height | letter-spacing |
|---|---|---|---|---|
| `text-mono-17B-150` | 1.0625rem (17px) | 700 | 1.5 | 0 |
| `text-mono-16B-150` | 1rem (16px) | 700 | 1.5 | 0 |
| `text-mono-14B-150` | 0.875rem (14px) | 700 | 1.5 | 0 |
| `text-mono-17N-150` | 1.0625rem (17px) | 400 | 1.5 | 0 |
| `text-mono-16N-150` | 1rem (16px) | 400 | 1.5 | 0 |
| `text-mono-14N-150` | 0.875rem (14px) | 400 | 1.5 | 0 |

## 6. 角丸

| トークン | 値 |
|---|---|
| `--border-radius-4` | 0.25rem |
| `--border-radius-6` | 0.375rem |
| `--border-radius-8` | 0.5rem |
| `--border-radius-12` | 0.75rem |
| `--border-radius-16` | 1rem |
| `--border-radius-24` | 1.5rem |
| `--border-radius-32` | 2rem |
| `--border-radius-full` | 624.9375rem |

## 7. エレベーション（影・8段階）

| トークン | 値 |
|---|---|
| `--elevation-1` | `0 2px 8px 1px rgba(0,0,0,0.1), 0 1px 5px 0 rgba(0,0,0,0.3)` |
| `--elevation-2` | `0 2px 12px 2px rgba(0,0,0,0.1), 0 1px 6px 0 rgba(0,0,0,0.3)` |
| `--elevation-3` | `0 4px 16px 3px rgba(0,0,0,0.1), 0 1px 6px 0 rgba(0,0,0,0.3)` |
| `--elevation-4` | `0 6px 20px 4px rgba(0,0,0,0.1), 0 2px 6px 0 rgba(0,0,0,0.3)` |
| `--elevation-5` | `0 8px 24px 5px rgba(0,0,0,0.1), 0 2px 10px 0 rgba(0,0,0,0.3)` |
| `--elevation-6` | `0 10px 30px 6px rgba(0,0,0,0.1), 0 3px 12px 0 rgba(0,0,0,0.3)` |
| `--elevation-7` | `0 12px 36px 7px rgba(0,0,0,0.1), 0 3px 14px 0 rgba(0,0,0,0.3)` |
| `--elevation-8` | `0 14px 40px 7px rgba(0,0,0,0.1), 0 3px 16px 0 rgba(0,0,0,0.3)` |

---

生成元: `npm pack @digital-go-jp/design-tokens@2.0.1` / `@digital-go-jp/tailwind-theme-plugin@1.0.1`（2026-08-17 取得）。
バージョンを上げる時は同じ手順で取り直し、このファイルと `../assets/dads-tokens.css` を差し替える。
