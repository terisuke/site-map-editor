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
    let currentZoom = 1; // ズームレベル

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
            backgroundColor: '#ffffff',
            preserveObjectStacking: true  // オブジェクトの重なり順を保持
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
        
        // ズームを考慮したグリッドサイズ
        const zoomedGridSize = GRID_SIZE * currentZoom;
        const zoomedWidth = CANVAS_WIDTH * currentZoom;
        const zoomedHeight = CANVAS_HEIGHT * currentZoom;
        
        // 縦線
        for (let i = 0; i <= CANVAS_WIDTH / GRID_SIZE; i++) {
            const isMajor = i % majorGridInterval === 0;
            const x = i * zoomedGridSize;
            const line = new fabric.Line([x, 0, x, zoomedHeight], {
                stroke: isMajor ? '#bbb' : '#e8e8e8',
                strokeWidth: isMajor ? 1 : 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true,
                isGrid: true
            });
            gridLines.push(line);
            canvas.add(line);
        }
        
        // 横線
        for (let j = 0; j <= CANVAS_HEIGHT / GRID_SIZE; j++) {
            const isMajor = j % majorGridInterval === 0;
            const y = j * zoomedGridSize;
            const line = new fabric.Line([0, y, zoomedWidth, y], {
                stroke: isMajor ? '#bbb' : '#e8e8e8',
                strokeWidth: isMajor ? 1 : 0.5,
                selectable: false,
                evented: false,
                excludeFromExport: true,
                isGrid: true
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
                
                // 現在のズームレベルを考慮した配置
                const scaleX = (CANVAS_WIDTH / img.width) * currentZoom;
                const scaleY = (CANVAS_HEIGHT / img.height) * currentZoom;
                const scale = Math.min(scaleX, scaleY) * 0.9; // 少し余白を持たせる
                
                // 背景画像の設定（中央配置）
                img.set({
                    left: (CANVAS_WIDTH * currentZoom - img.width * scale) / 2,
                    top: (CANVAS_HEIGHT * currentZoom - img.height * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    evented: false,
                    excludeFromExport: false,
                    opacity: CONFIG.PDF_BACKGROUND.OPACITY,
                    isBackground: true, // 背景であることを示すカスタムプロパティ
                    originalScaleX: scale / currentZoom, // ズーム前のスケール保存
                    originalScaleY: scale / currentZoom
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

    // ズーム機能
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.2;

    function zoomIn() {
        if (currentZoom < MAX_ZOOM) {
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
            applyZoom();
        }
    }

    function zoomOut() {
        if (currentZoom > MIN_ZOOM) {
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
            applyZoom();
        }
    }

    function resetZoom() {
        currentZoom = 1;
        applyZoom();
    }

    function applyZoom() {
        // キャンバスのズームを設定
        canvas.setZoom(currentZoom);
        
        // キャンバスのサイズを更新（ズーム後のサイズ）
        const CONFIG = getConfig();
        const newWidth = CONFIG.CANVAS.WIDTH * currentZoom;
        const newHeight = CONFIG.CANVAS.HEIGHT * currentZoom;
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);
        
        // 背景画像がある場合は再配置
        if (backgroundImage) {
            backgroundImage.scaleX = backgroundImage.originalScaleX * currentZoom;
            backgroundImage.scaleY = backgroundImage.originalScaleY * currentZoom;
        }
        
        // グリッドの再描画
        if (gridLines && gridLines.length > 0) {
            gridLines.forEach(line => {
                canvas.remove(line);
            });
            gridLines = [];
            drawGrid();
        }
        
        canvas.renderAll();
        updateZoomStatus();
    }

    function updateZoomStatus() {
        const zoomPercent = Math.round(currentZoom * 100);
        
        // ステータス更新
        if (window.SiteMapUtils) {
            window.SiteMapUtils.updateStatus(`ズーム: ${zoomPercent}%`);
        }
        
        // ズームリセットボタンのテキストを更新
        const zoomResetBtn = document.querySelector('button[onclick="SiteMapCanvas.resetZoom()"]');
        if (zoomResetBtn) {
            zoomResetBtn.textContent = `${zoomPercent}%`;
        }
    }

    // 公開API
    window.SiteMapCanvas = {
        initializeCanvas,
        drawGrid,
        toggleGrid,
        loadPDF,
        clearBackground,
        zoomIn,
        zoomOut,
        resetZoom,
        getCanvas: () => canvas,
        getBackgroundImage: () => backgroundImage,
        getGridLines: () => gridLines,
        getCurrentZoom: () => currentZoom
    };
    
})(window);