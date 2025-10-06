# vivaldi-custom-script-injector

Vivaldiブラウザにカスタムスクリプトを自動で注入するツールです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 設定ファイルの作成

`config.example.json` をコピーして `config.json` を作成します：

```bash
cp config.example.json config.json
```

### 3. 設定の編集

`config.json` を開いて、お使いの環境に合わせてパスを設定します：

```json
{
  "vivaldiBasePath": "C:\\Program Files\\Vivaldi\\Application",
  "customScriptDir": "C:\\MyScripts"
}
```

- `vivaldiBasePath`: Vivaldiのインストールディレクトリ
- `customScriptDir`: カスタムスクリプトを保存しているディレクトリ

## 使い方

```bash
node inject-script.js
```

このコマンドを実行すると：

1. Vivaldiの最新バージョンディレクトリを自動検出
2. `customScriptDir` 内の全ファイルをVivaldiのリソースディレクトリにコピー
3. `.js` ファイルについて、`window.html` に `<script>` タグを自動追加
4. 変更前の `window.html` は自動でバックアップ

## 注意事項

- Vivaldiを更新した場合は、再度このスクリプトを実行する必要があります
