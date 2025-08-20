# リファクタリング変更内容

## 実施日
2025-08-03

## 主な変更点

### 1. アーキテクチャの改善
- **IIFEパターンの導入**: すべてのJavaScriptファイルを即時実行関数式でラップ
- **名前空間の整理**: 各モジュールが独自の名前空間を持つ
  - `SiteMapConfig`: 設定管理
  - `SiteMapCanvas`: キャンバス操作
  - `SiteMapBuilding`: 建物管理
  - `SiteMapUtils`: ユーティリティ
  - `SiteMapMain`: メインアプリケーション

### 2. 新規ファイル
- `js/config.js`: すべての設定値と定数を一元管理

### 3. コード品質の向上
- **エラーハンドリング**: try-catchブロックの追加
- **重複コードの削減**: 共通関数の抽出
- **マジックナンバーの削除**: 定数として定義
- **状態管理**: appStateオブジェクトで集中管理
- **DOM操作の最適化**: 要素のキャッシュ化

### 4. API変更
HTMLからの関数呼び出しが名前空間を使用するように変更：
- `deleteSelected()` → `SiteMapUtils.deleteSelected()`
- `toggleGrid()` → `SiteMapCanvas.toggleGrid()`
- 他のすべての公開関数も同様

### 5. 互換性
- 既存のグローバル変数（`canvas`、`currentMode`）は互換性のために維持
- 段階的な移行が可能な設計

## 今後の推奨事項
1. TypeScriptへの移行
2. ビルドプロセスの導入
3. 単体テストの追加
4. ES6モジュールシステムの採用