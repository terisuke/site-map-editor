// キャンバス関連の機能
(function(window) {
    'use strict';
    
    // 設定を遅延取得する関数
    function getConfig() {
        return window.SiteMapConfig || {
            CANVAS: { WIDTH: 1200, HEIGHT: 850 },
            SCALE: 4,
            GRID: { 
                UNIT: 910,
                get SIZE() { return this.UNIT / 1000 * 4; }
            },
            PDF_BACKGROUND: { OPACITY: 0.5 }
        };
    }
    
    // プライベート変数
    let canvas;
    let gridLines = [];
    let backgroundImage = null;

    // Fabric.jsキャンバスの初期化
    function initializeCanvas() {
        const CONFIG = getConfig();
        const CANVAS_WIDTH = CONFIG.CANVAS.WIDTH;
        const CANVAS_HEIGHT = CONFIG.CANVAS.HEIGHT;
        const GRID_SIZE = CONFIG.GRID.SIZE;
        
        console.log('Initializing canvas with dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
        console.log('Grid size:', GRID_SIZE, 'pixels');
        
        canvas = new fabric.Canvas('canvas', {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: '#ffffff'
        });
        
        // グローバル変数を設定（互換性のため）
        window.canvas = canvas;
        window.backgroundImage = backgroundImage;
        
        // グリッドを描画
        drawGrid();
        
        console.log('Canvas initialized, grid lines:', gridLines.length);
        
        return canvas;
    }

    // グリッド描画（910mmグリッド）
    function drawGrid() {
        const CONFIG = getConfig();
        const CANVAS_WIDTH = CONFIG.CANVAS.WIDTH;
        const CANVAS_HEIGHT = CONFIG.CANVAS.HEIGHT;
        const GRID_SIZE = CONFIG.GRID.SIZE;
        
        // 既存のグリッドを削除
        gridLines.forEach(line => canvas.remove(line));
        gridLines = [];
        
        // 10グリッドごとに太線、1グリッドごとに細線
        const majorGridInterval = 10; // 9.1mごと
        
        // 縦線
        for (let i = 0; i <= CANVAS_WIDTH / GRID_SIZE; i++) {
            const isMajor = i % majorGridInterval === 0;
            const line = new fabric.Line([i * GRID_SIZE, 0, i * GRID_SIZE, CANVAS_HEIGHT], {
                stroke: isMajor ? '#bbb' : '#e8e8e8',
                strokeWidth: isMajor ? 1 : 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            gridLines.push(line);
            canvas.add(line);
        }
        
        // 横線
        for (let j = 0; j <= CANVAS_HEIGHT / GRID_SIZE; j++) {
            const isMajor = j % majorGridInterval === 0;
            const line = new fabric.Line([0, j * GRID_SIZE, CANVAS_WIDTH, j * GRID_SIZE], {
                stroke: isMajor ? '#bbb' : '#e8e8e8',
                strokeWidth: isMajor ? 1 : 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true
            });
            gridLines.push(line);
            canvas.add(line);
        }
        
        // グリッドを最背面に
        gridLines.forEach(line => canvas.sendToBack(line));
    }

    // グリッド表示/非表示切り替え
    function toggleGrid() {
        gridLines.forEach(line => {
            line.visible = !line.visible;
        });
        canvas.renderAll();
    }

    // PDF.jsの設定（ローカルワーカーを使用）
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // PDF読み込み
    async function loadPDF(event) {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            alert('PDFファイルを選択してください');
            return;
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
            const page = await pdf.getPage(1); // 1ページ目を取得
            
            const viewport = page.getViewport({ scale: 1.0 });
            
            // 一時的なcanvasを作成してPDFをレンダリング
            const tempCanvas = document.createElement('canvas');
            const context = tempCanvas.getContext('2d');
            
            // キャンバスサイズに合わせてスケールを調整
            const CONFIG = getConfig();
            const CANVAS_WIDTH = CONFIG.CANVAS.WIDTH;
            const CANVAS_HEIGHT = CONFIG.CANVAS.HEIGHT;
            const scaleX = CANVAS_WIDTH / viewport.width;
            const scaleY = CANVAS_HEIGHT / viewport.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledViewport = page.getViewport({ scale: scale });
            tempCanvas.width = scaledViewport.width;
            tempCanvas.height = scaledViewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: scaledViewport
            }).promise;
            
            // レンダリングしたPDFを背景画像として設定
            const imgData = tempCanvas.toDataURL();
            fabric.Image.fromURL(imgData, function(img) {
                // 既存の背景を削除
                if (backgroundImage) {
                    canvas.remove(backgroundImage);
                }
                
                // 背景画像の設定（中央配置）
                img.set({
                    left: (CANVAS_WIDTH - img.width) / 2,
                    top: (CANVAS_HEIGHT - img.height) / 2,
                    selectable: false,
                    evented: false,
                    excludeFromExport: false,
                    opacity: CONFIG.PDF_BACKGROUND.OPACITY,
                    isBackground: true // 背景であることを示すカスタムプロパティ
                });
                
                backgroundImage = img;
                window.backgroundImage = img;
                canvas.add(backgroundImage);
                canvas.sendToBack(backgroundImage);
                
                // グリッドを再描画して最背面に
                gridLines.forEach(line => canvas.sendToBack(line));
                
                canvas.renderAll();
                if (window.SiteMapUtils) {
                    window.SiteMapUtils.updateStatus('PDFを背景に設定しました');
                }
            });
            
        } catch (error) {
            console.error('PDF読み込みエラー:', error);
            alert('PDFの読み込みに失敗しました');
        }
    }

    // 背景クリア
    function clearBackground() {
        if (backgroundImage) {
            canvas.remove(backgroundImage);
            backgroundImage = null;
            window.backgroundImage = null;
            canvas.renderAll();
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('背景をクリアしました');
            }
        }
    }

    // 公開API
    window.SiteMapCanvas = {
        initializeCanvas,
        drawGrid,
        toggleGrid,
        loadPDF,
        clearBackground,
        getCanvas: () => canvas,
        getBackgroundImage: () => backgroundImage,
        getGridLines: () => gridLines,
        // 互換性のために定数も公開
        GRID_SIZE,
        SCALE,
        GRID_UNIT
    };
    
})(window);