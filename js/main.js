// メインアプリケーション
(function(window) {
    'use strict';
    
    // 設定を取得（遅延評価）
    function getConfig() {
        return window.SiteMapConfig || {
            SCALE: 4,
            GRID: { SIZE: 3.64 },
            DEFAULT_SPACING: { SHORT_SIDE: 1.2, LONG_SIDE: 1.2 }
        };
    }
    
    // アプリケーション状態
    const appState = {
        currentMode: 'select', // select, place, area
        isDrawing: false,
        startPoint: null,
        selectionRect: null,
        canvas: null,
        selectedBuildingType: null
    };
    
    // DOM要素のキャッシュ
    const domCache = {};
    
    function cacheDOMElements() {
        domCache.modeButtons = document.querySelectorAll('.mode-button');
        domCache.buildingOptions = document.querySelectorAll('.building-option');
        domCache.shortSpacingSlider = document.getElementById('shortSideSpacing');
        domCache.shortSpacingValue = document.getElementById('shortSpacingValue');
        domCache.longSpacingSlider = document.getElementById('longSideSpacing');
        domCache.longSpacingValue = document.getElementById('longSpacingValue');
    }

    // モード切替
    function setMode(mode, buttonElement) {
        appState.currentMode = mode;
        
        // ボタンのアクティブ状態を更新
        domCache.modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
        
        // オプションパネルの表示/非表示
        document.querySelector('.drawing-options').style.display = (mode === 'draw') ? 'block' : 'none';
        document.querySelector('.text-options').style.display = (mode === 'text') ? 'block' : 'none';
        
        // 描画モードの処理
        if (mode === 'draw') {
            appState.canvas.isDrawingMode = true;
            appState.canvas.freeDrawingBrush = new fabric.PencilBrush(appState.canvas);
            appState.canvas.freeDrawingBrush.width = parseInt(document.getElementById('brushWidth').value);
            appState.canvas.freeDrawingBrush.color = document.getElementById('brushColor').value;
        } else {
            appState.canvas.isDrawingMode = false;
        }
        
        // 選択モードの場合は選択を有効化
        appState.canvas.selection = (mode === 'select');
        appState.canvas.getObjects().forEach(obj => {
            // 背景画像、グリッド、図面枠は選択不可のまま
            if (!obj.excludeFromExport && 
                obj !== window.backgroundImage && 
                !obj.isBackground && 
                !obj.isGrid &&
                obj.objectType !== 'drawingFrame') {
                obj.selectable = (mode === 'select');
            }
        });
        
        appState.canvas.renderAll();
        window.SiteMapUtils.updateStatus(getStatusMessage());
        
        // グローバル変数を更新（互換性のため）
        window.currentMode = mode;
    }

    // ステータスメッセージ取得
    function getStatusMessage() {
        const selectedType = window.SiteMapBuilding.getSelectedBuildingType();
        let status = '';
        
        if (appState.currentMode === 'text') {
            status = 'テキストモード - クリックしてテキストを追加';
        } else if (appState.currentMode === 'draw') {
            status = '描画モード - ドラッグして線を描画';
        } else if (!selectedType) {
            status = '建物タイプを選択してください';
        } else if (appState.currentMode === 'select') {
            status = '選択モード - 建物をクリックして選択';
        } else if (appState.currentMode === 'place') {
            status = `配置モード - クリックして建物${selectedType.type}を配置`;
        } else if (appState.currentMode === 'area') {
            status = `範囲配置モード - ドラッグして建物${selectedType.type}を配置`;
        }
        return status;
    }

    // レイヤー順序を維持する関数
    function maintainLayerOrder() {
        const canvas = appState.canvas;
        
        // 1. 背景画像を最背面
        if (window.backgroundImage) {
            canvas.sendToBack(window.backgroundImage);
        }
        
        // 2. 図面枠を背景の次に配置
        const drawingFrame = canvas.getObjects().find(obj => obj.objectType === 'drawingFrame');
        if (drawingFrame) {
            canvas.sendToBack(drawingFrame);
            if (window.backgroundImage) {
                canvas.bringForward(drawingFrame);
            }
        }
        
        // 3. グリッドを図面枠の前に配置
        const gridLines = canvas.getObjects().filter(obj => obj.isGrid);
        gridLines.forEach(grid => {
            canvas.sendToBack(grid);
            if (drawingFrame) {
                canvas.bringForward(grid);
            } else if (window.backgroundImage) {
                canvas.bringForward(grid);
            }
        });
        
        canvas.renderAll();
    }
    
    // 既存の建物を再描画（箱のみモード切替時）
    function updateExistingBuildings() {
        const objects = appState.canvas.getObjects();
        const boxOnly = document.getElementById('boxOnly');
        const boxOnlyMode = boxOnly && boxOnly.checked;
        
        objects.forEach(obj => {
            if (obj.buildingType && (obj.buildingType === 'A' || obj.buildingType === 'B')) {
                const CONFIG = window.SiteMapConfig;
                const buildingConfig = CONFIG.BUILDING_TYPES[obj.buildingType];
                
                // 現在の位置と回転を保存
                const left = obj.left;
                const top = obj.top;
                const angle = obj.angle;
                const buildingType = obj.buildingType;
                const isPair = obj.isPair;
                
                // 古い建物を削除
                appState.canvas.remove(obj);
                
                // 新しい建物を作成
                let newBuilding;
                if (isPair) {
                    // ペア建物の場合
                    newBuilding = window.SiteMapBuilding.createPairBuilding(left, top, buildingType);
                } else {
                    // 通常の建物の場合
                    newBuilding = window.SiteMapBuilding.createBuilding(left, top, buildingType, angle);
                }
                
                if (newBuilding) {
                    appState.canvas.add(newBuilding);
                }
            }
        });
        
        appState.canvas.renderAll();
    }
    
    // 建物の色を更新
    function updateBuildingColors(type) {
        const objects = appState.canvas.getObjects();
        const colorCheckbox = document.getElementById(`color${type}`);
        const useColor = colorCheckbox && colorCheckbox.checked;
        const CONFIG = window.SiteMapConfig;
        const buildingConfig = CONFIG.BUILDING_TYPES[type];
        const newColor = useColor ? buildingConfig.color : '#cccccc';
        
        objects.forEach(obj => {
            if (obj.buildingType === type) {
                if (obj._objects) {
                    // グループ内のすべての矩形要素の色を変更
                    obj._objects.forEach(shape => {
                        // 入口マーカー（赤色）以外の矩形の色を変更
                        if (shape.type === 'rect' && shape.fill !== CONFIG.ENTRANCE_MARKER.COLOR) {
                            shape.set('fill', newColor);
                        }
                    });
                    obj.dirty = true;
                }
            }
        });
        
        appState.canvas.renderAll();
    }

    // イベントハンドラー設定
    function setupEventHandlers() {
        // 建物タイプ選択
        domCache.buildingOptions.forEach(option => {
            option.addEventListener('click', function() {
                domCache.buildingOptions.forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                
                // 建物タイプを設定
                const selectedType = window.SiteMapBuilding.setSelectedBuildingType(this.dataset.type);
                appState.selectedBuildingType = selectedType;
                
                window.SiteMapUtils.updateStatus(getStatusMessage());
            });
    });
    
        // キャンバスイベント
        appState.canvas.on('mouse:down', function(options) {
            const pointer = appState.canvas.getPointer(options.e);
            const selectedType = window.SiteMapBuilding.getSelectedBuildingType();
            
            if (appState.currentMode === 'text' && !options.target) {
                window.SiteMapUtils.placeText(pointer.x, pointer.y);
            } else if (appState.currentMode === 'place' && selectedType && !options.target) {
                window.SiteMapBuilding.placeBuilding(pointer.x, pointer.y);
            } else if (appState.currentMode === 'area' && selectedType && !options.target) {
                appState.isDrawing = true;
                appState.startPoint = { x: pointer.x, y: pointer.y };
                
                const CONFIG = getConfig();
                appState.selectionRect = new fabric.Rect({
                    left: appState.startPoint.x,
                    top: appState.startPoint.y,
                    width: 0,
                    height: 0,
                    fill: CONFIG.AREA_SELECTION.FILL_COLOR,
                    stroke: CONFIG.AREA_SELECTION.STROKE_COLOR,
                    strokeWidth: CONFIG.AREA_SELECTION.STROKE_WIDTH,
                    strokeDashArray: CONFIG.AREA_SELECTION.STROKE_DASH,
                    selectable: false,
                    evented: false
                });
                
                appState.canvas.add(appState.selectionRect);
            }
        });
    
        // オブジェクト移動時のグリッドスナップ
        appState.canvas.on('object:moving', function(options) {
            if (appState.currentMode === 'select' && options.target && options.target.buildingType) {
                const snapped = window.SiteMapUtils.snapCoordinatesToGrid(
                    options.target.left,
                    options.target.top
                );
                options.target.set({
                    left: snapped.x,
                    top: snapped.y
                });
            }
        });
        
        // オブジェクト移動後にレイヤー順序を維持
        appState.canvas.on('object:modified', function(options) {
            maintainLayerOrder();
        });
    
        // 短辺間隔スライダーのイベントハンドラー
        domCache.shortSpacingSlider.addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            window.SiteMapBuilding.setSpacing(value, undefined);
            domCache.shortSpacingValue.textContent = value.toFixed(1);
            
            // 範囲選択中の場合、リアルタイムで情報更新
            if (appState.currentMode === 'area' && appState.selectionRect) {
                window.SiteMapBuilding.updateGridInfo(
                    appState.selectionRect.width,
                    appState.selectionRect.height
                );
            }
        });
    
        // 長辺間隔スライダーのイベントハンドラー
        domCache.longSpacingSlider.addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            window.SiteMapBuilding.setSpacing(undefined, value);
            domCache.longSpacingValue.textContent = value.toFixed(1);
            
            // 範囲選択中の場合、リアルタイムで情報更新
            if (appState.currentMode === 'area' && appState.selectionRect) {
                window.SiteMapBuilding.updateGridInfo(
                    appState.selectionRect.width,
                    appState.selectionRect.height
                );
            }
        });
    
        appState.canvas.on('mouse:move', function(options) {
            if (!appState.isDrawing || !appState.selectionRect) return;
            
            const pointer = appState.canvas.getPointer(options.e);
            const width = Math.abs(pointer.x - appState.startPoint.x);
            const height = Math.abs(pointer.y - appState.startPoint.y);
            const left = Math.min(pointer.x, appState.startPoint.x);
            const top = Math.min(pointer.y, appState.startPoint.y);
            
            appState.selectionRect.set({
                left: left,
                top: top,
                width: width,
                height: height
            });
            
            appState.canvas.renderAll();
            window.SiteMapBuilding.updateGridInfo(width, height);
        });
    
        appState.canvas.on('mouse:up', function() {
            if (!appState.isDrawing || !appState.selectionRect) return;
            
            appState.isDrawing = false;
            
            const CONFIG = getConfig();
            if (appState.selectionRect.width > CONFIG.AREA_SELECTION.MIN_WIDTH && 
                appState.selectionRect.height > CONFIG.AREA_SELECTION.MIN_HEIGHT) {
                window.SiteMapBuilding.placeMultipleBuildings({
                    left: appState.selectionRect.left,
                    top: appState.selectionRect.top,
                    width: appState.selectionRect.width,
                    height: appState.selectionRect.height
                });
            }
            
            appState.canvas.remove(appState.selectionRect);
            appState.selectionRect = null;
        });
        
        // 選択時のレイヤー順序を維持
        appState.canvas.on('selection:created', function(e) {
            maintainLayerOrder();
        });
        
        appState.canvas.on('selection:updated', function(e) {
            maintainLayerOrder();
        });
        
        appState.canvas.on('selection:cleared', function(e) {
            maintainLayerOrder();
        });
        
        // ペア配置チェックボックスのイベントハンドラー
        const pairPlacementCheckbox = document.getElementById('pairPlacement');
        if (pairPlacementCheckbox) {
            pairPlacementCheckbox.addEventListener('change', function() {
                // 範囲選択中の場合、リアルタイムで情報更新
                if (appState.currentMode === 'area' && appState.selectionRect) {
                    window.SiteMapBuilding.updateGridInfo(
                        appState.selectionRect.width,
                        appState.selectionRect.height
                    );
                }
            });
        }
        
        // 箱のみ表示チェックボックスのイベントハンドラー
        const boxOnlyCheckbox = document.getElementById('boxOnly');
        if (boxOnlyCheckbox) {
            boxOnlyCheckbox.addEventListener('change', function() {
                // 既存の建物を再描画
                updateExistingBuildings();
            });
        }
        
        // カラー表示チェックボックスのイベントハンドラー
        ['A', 'B', 'C', 'D'].forEach(type => {
            const colorCheckbox = document.getElementById(`color${type}`);
            if (colorCheckbox) {
                colorCheckbox.addEventListener('change', function() {
                    // 既存の建物の色を更新
                    updateBuildingColors(type);
                });
            }
        });
        
        // 描画設定
        const brushWidthSlider = document.getElementById('brushWidth');
        const brushWidthValue = document.getElementById('brushWidthValue');
        const brushColorInput = document.getElementById('brushColor');
        
        if (brushWidthSlider) {
            brushWidthSlider.addEventListener('input', function(e) {
                brushWidthValue.textContent = e.target.value;
                if (appState.canvas.freeDrawingBrush) {
                    appState.canvas.freeDrawingBrush.width = parseInt(e.target.value);
                }
            });
        }
        
        if (brushColorInput) {
            brushColorInput.addEventListener('input', function(e) {
                if (appState.canvas.freeDrawingBrush) {
                    appState.canvas.freeDrawingBrush.color = e.target.value;
                }
            });
        }
        
        // テキスト設定
        const fontSizeSlider = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', function(e) {
                fontSizeValue.textContent = e.target.value;
            });
        }
    }

    // 初期化
    function init() {
        try {
            // DOM要素をキャッシュ
            cacheDOMElements();
            
            // Fabric.jsキャンバスの初期化
            appState.canvas = window.SiteMapCanvas.initializeCanvas();
            window.canvas = appState.canvas; // 互換性のため
            
            // イベントハンドラーを設定
            setupEventHandlers();
            
            // デフォルト間隔を設定
            const CONFIG = getConfig();
            window.SiteMapBuilding.setSpacing(
                CONFIG.DEFAULT_SPACING.SHORT_SIDE,
                CONFIG.DEFAULT_SPACING.LONG_SIDE
            );
            
            console.log('Canvas initialized successfully');
        } catch (error) {
            console.error('初期化エラー:', error);
            alert('アプリケーションの初期化に失敗しました');
        }
    }
    
    // ページ読み込み時に初期化
    window.addEventListener('DOMContentLoaded', init);
    
    // 公開API
    window.SiteMapMain = {
        setMode,
        getAppState: () => ({ ...appState })
    };
    
    // 互換性のために一部をグローバルに公開
    window.currentMode = appState.currentMode;
    window.setMode = function(mode) {
        // モードボタンを探す
        const button = document.querySelector(`.mode-button[onclick*="${mode}"]`);
        setMode(mode, button);
    };
    
})(window);