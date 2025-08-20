# 敷地図PDFエディタ (Site Map Editor)

日本の建築規制に基づいた敷地図編集ツール。建物の配置、制約条件の確認、PDF出力が可能な単一ページWebアプリケーションです。

## 🌐 デモ

[GitHub Pagesで公開中](https://yourusername.github.io/site-map-editor/)

## ✨ 機能

### 建物配置
- **建物A (PLAN-①)**: 6.37m × 8.19m 戸建住宅
- **建物B (PLAN-②)**: 5.46m × 7.28m 戸建住宅
- **サ高住**: 42m × 43m サービス付き高齢者向け住宅
- **集合住宅**: 19.5m × 34.2m アパート

### 配置モード
- **選択モード**: 建物の選択・移動・削除
- **配置モード**: クリックして単一建物を配置
- **範囲配置モード**: ドラッグして複数建物を一括配置
- **テキストモード**: 注釈テキストの追加
- **描画モード**: フリーハンド描画

### 追加機能
- **同一建物ペア配置**: 上下密着配置（入口反対側）
- **箱のみ表示**: 入口マーカーなしの簡易表示
- **カラー切替**: 建物タイプごとの色表示ON/OFF
- **間隔調整**: 短辺・長辺方向の間隔を0〜5mで調整
- **方位マーク**: 回転可能な方位記号
- **図面枠**: 建築図面用の枠表示
- **ズーム機能**: 50%〜300%のズーム

### エクスポート
- **JSON出力**: 配置データのエクスポート
- **PDF出力**: 図面のPDF化（図面枠・方位マーク含む）

## 🚀 セットアップ

### ローカル環境での実行

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/site-map-editor.git
cd site-map-editor
```

2. HTTPサーバーを起動
```bash
# Python 3の場合
python3 -m http.server 8000

# Python 2の場合
python -m SimpleHTTPServer 8000

# Node.jsの場合
npx http-server
```

3. ブラウザで開く
```
http://localhost:8000
```

### GitHub Pagesへのデプロイ

1. GitHubリポジトリを作成

2. コードをプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/site-map-editor.git
git push -u origin main
```

3. GitHub Pagesを有効化
   - リポジトリの Settings → Pages
   - Source: "GitHub Actions"を選択
   - 自動的にデプロイが開始されます

## 🛠 技術スタック

- **純粋なHTML/CSS/JavaScript** - フレームワーク不使用
- **Fabric.js v5.3.0** - キャンバス操作
- **PDF.js v3.11.174** - PDF背景読み込み
- **jsPDF v2.5.1** - PDF出力
- **CDN経由でライブラリ読込** - ビルドプロセス不要

## 📐 仕様

- **スケール**: 1/1000 (1m = 4px)
- **グリッド**: 910mm モジュール（日本建築規格）
- **キャンバスサイズ**: 1200px × 850px (300m × 212.5m)

## 📁 ファイル構成

```
site-map-editor/
├── index.html              # メインHTML
├── css/
│   └── styles.css         # スタイルシート
├── js/
│   ├── config.js          # 設定・定数
│   ├── canvas.js          # キャンバス機能
│   ├── building.js        # 建物配置ロジック
│   ├── utils.js           # ユーティリティ
│   └── main.js           # メインアプリケーション
├── images/
│   ├── direction.png      # 方位マーク画像
│   └── frame.png         # 図面枠画像
├── CLAUDE.md             # Claude Code用ガイド
└── README.md            # このファイル
```

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## 🐛 既知の問題

- 直接HTMLファイルを開くとCORSエラーが発生する場合があります → HTTPサーバー経由で実行してください
- PDF出力時、外部画像（方位マーク・図面枠）を含める場合はHTTPサーバー経由での実行が必要です

## 📧 お問い合わせ

[GitHub Issues](https://github.com/yourusername/site-map-editor/issues)でお問い合わせください。