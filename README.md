# notthei.github.io

https://notthei.github.io/

ビルド不要の静的サイト（HTML / CSS / JS のみ）。

```
.
├── index.html          # 本文（TODO 箇所を編集）
├── .nojekyll           # Jekyll 処理を無効化
└── assets/
    ├── style.css
    ├── main.js         # GitHub API からリポジトリ一覧を取得
    └── favicon.svg
```

## 編集ポイント

- `index.html` の `TODO` コメント箇所（所属、CTF実績、連絡先）
- `assets/main.js` の `CONFIG.pinned` / `CONFIG.exclude`（表示するリポジトリの順序・除外）

## ローカル確認

```bash
python3 -m http.server 8000
# http://localhost:8000
```
