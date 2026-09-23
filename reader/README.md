# 縦書きリーダー

`作品0*/*章.md` から本文を取り出して、縦書きで読むためのページ。

## 更新のしかた

章を書き足したり直したりしたら、リポジトリのルートで

```
python3 tools/リーダー用データ.py   # 本文 → reader/data/0*.json
python3 tools/資料データ.py         # 人物・店・年表 → reader/data/guide.json
```

`資料データ.py` の中身（人物・店・年表）は手書きなので、
新しい作品を書いたらこのファイルに追記する。

## 中身

- `index.html` — ページ本体。外部ライブラリなし
- `data/index.json` — 作品一覧
- `data/0*.json` — 各作品の本文
- `data/guide.json` — 資料（人物・店・年表）

## ローカルで見る

```
cd reader && python3 -m http.server 8811
```

`fetch` を使うので、ファイルを直接開くのではなくサーバー越しに見る。
