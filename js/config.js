// 設定ファイル
(function(window) {
    'use strict';
    
    // 定数定義
    const CONFIG = {
        // キャンバス設定
        CANVAS: {
            WIDTH: 1200,
            HEIGHT: 850
        },
        
        // スケール設定
        SCALE: 4,  // 1m = 4 pixels (1/1000スケール)
        
        // グリッド設定
        GRID: {
            UNIT: 910,  // グリッドユニット（mm）
            get SIZE() {
                return this.UNIT / 1000 * 4;  // 3.64 pixels - 直接4を使用
            }
        },
        
        // 建物タイプ定義
        BUILDING_TYPES: {
            'A': {
                type: 'A',
                name: 'PLAN-①',
                width: 6.37,   // メートル（短辺）
                height: 8.19,  // メートル（長辺）
                color: '#3498db',
                hasEntrance: true,
                description: '戸建住宅A（テラス・ポーチ付き）'
            },
            'B': {
                type: 'B',
                name: 'PLAN-②',
                width: 5.46,   // メートル（短辺）
                height: 7.28,  // メートル（長辺）
                color: '#2ecc71',
                hasEntrance: true,
                description: '戸建住宅B（テラス・ポーチ付き）'
            },
            'C': {
                type: 'C',
                name: '建物C',
                width: 42,     // メートル（短辺）
                height: 43,    // メートル（長辺）
                color: '#e74c3c',
                hasEntrance: false,
                description: 'サービス付き高齢者向け住宅'
            },
            'D': {
                type: 'D',
                name: '建物D',
                width: 19.5,   // メートル（短辺）
                height: 34.2,  // メートル（長辺）
                color: '#f39c12',
                hasEntrance: false,
                description: '集合住宅'
            }
        },
        
        // エントランスマーカー設定
        ENTRANCE_MARKER: {
            WIDTH: 14,
            HEIGHT: 4,
            COLOR: '#e74c3c',
            OFFSET_FROM_BOTTOM: 4
        },
        
        // デフォルト間隔設定（メートル）
        DEFAULT_SPACING: {
            SHORT_SIDE: 1.2,  // 短辺方向
            LONG_SIDE: 1.2    // 長辺方向
        },
        
        // エリア選択設定
        AREA_SELECTION: {
            MIN_WIDTH: 20,   // 最小幅（ピクセル）
            MIN_HEIGHT: 20,  // 最小高さ（ピクセル）
            FILL_COLOR: 'rgba(52, 152, 219, 0.1)',
            STROKE_COLOR: '#3498db',
            STROKE_WIDTH: 2,
            STROKE_DASH: [5, 5]
        },
        
        // 建物描画設定
        BUILDING_STYLE: {
            STROKE_COLOR: '#2c3e50',
            STROKE_WIDTH: 1,
            OPACITY: 0.7
        },
        
        // PDF背景設定
        PDF_BACKGROUND: {
            OPACITY: 0.5
        }
    };
    
    // グローバルに公開
    window.SiteMapConfig = CONFIG;
    
})(window);