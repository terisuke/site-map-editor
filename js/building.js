// 建物関連の機能
(function(window) {
    'use strict';
    
    // 設定を取得
    const CONFIG = window.SiteMapConfig;
    const SCALE = CONFIG.SCALE;
    const GRID_SIZE = CONFIG.GRID.SIZE;
    
    // プライベート変数
    let selectedBuildingType = null;
    let buildingCount = 0;
    
    // 建物間隔の状態
    const spacingState = {
        shortSide: CONFIG.DEFAULT_SPACING.SHORT_SIDE,
        longSide: CONFIG.DEFAULT_SPACING.LONG_SIDE
    };

    // 建物を作成
    function createBuilding(x, y, type, rotation = 0) {
        buildingCount++;
        
        // 建物タイプの設定を取得
        const buildingConfig = CONFIG.BUILDING_TYPES[type];
        if (!buildingConfig) {
            console.error(`不明な建物タイプ: ${type}`);
            return null;
        }
        
        const width = buildingConfig.width * SCALE;   // メートルからピクセルに変換
        const height = buildingConfig.height * SCALE;
        
        // 建物本体（縦長のまま配置）
        const rect = new fabric.Rect({
            left: 0,
            top: 0,
            width: width,   // 短辺
            height: height, // 長辺
            fill: buildingConfig.color,
            stroke: CONFIG.BUILDING_STYLE.STROKE_COLOR,
            strokeWidth: CONFIG.BUILDING_STYLE.STROKE_WIDTH,
            opacity: CONFIG.BUILDING_STYLE.OPACITY
        });
        
        // 入口マーカーを追加
        const shapes = [rect];
        if (buildingConfig.hasEntrance) {
            const entrance = new fabric.Rect({
                left: width / 2 - CONFIG.ENTRANCE_MARKER.WIDTH / 2,
                top: height - CONFIG.ENTRANCE_MARKER.OFFSET_FROM_BOTTOM,
                width: CONFIG.ENTRANCE_MARKER.WIDTH,
                height: CONFIG.ENTRANCE_MARKER.HEIGHT,
                fill: CONFIG.ENTRANCE_MARKER.COLOR
            });
            shapes.push(entrance);
        }
    
        // グループ化（ラベルなし）
        const group = new fabric.Group(shapes, {
            left: x,
            top: y,
            angle: rotation,
            selectable: window.currentMode === 'select',
            hasControls: true,
            lockScalingX: true,
            lockScalingY: true,
            buildingType: type,
            buildingId: buildingCount
        });
        
        return group;
    }

    // 単一建物配置（グリッドスナップ付き）
    function placeBuilding(x, y) {
        if (!selectedBuildingType) {
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('建物タイプを選択してください');
            }
            return;
        }
        
        try {
            // グリッドにスナップ
            const snapped = window.SiteMapUtils.snapCoordinatesToGrid(x, y);
            
            const building = createBuilding(snapped.x, snapped.y, selectedBuildingType.type);
            if (building) {
                window.canvas.add(building);
                window.canvas.renderAll();
                
                if (window.SiteMapUtils) {
                    window.SiteMapUtils.updateStatus(`建物${selectedBuildingType.type}を配置しました`);
                }
            }
        } catch (error) {
            console.error('建物配置エラー:', error);
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('建物の配置に失敗しました');
            }
        }
    }

    // 範囲配置（改善版）
    function placeMultipleBuildings(area) {
        if (!selectedBuildingType) {
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('建物タイプを選択してください');
            }
            return;
        }
        
        try {
            const buildingConfig = CONFIG.BUILDING_TYPES[selectedBuildingType.type];
            const buildingWidth = buildingConfig.width * SCALE;   // 短辺
            const buildingHeight = buildingConfig.height * SCALE; // 長辺
            
            // 間隔をピクセルに変換
            const horizontalSpacingPx = spacingState.shortSide * SCALE;
            const verticalSpacingPx = spacingState.longSide * SCALE;
    
            // 配置可能数を計算
            const capacity = window.SiteMapUtils.calculatePlacementCapacity(
                area.width, area.height,
                buildingWidth, buildingHeight,
                horizontalSpacingPx, verticalSpacingPx
            );
            
            const { cols, rows } = capacity;
            
            // 間隔の調整
            let horizontalSpacing = horizontalSpacingPx;
            let verticalSpacing = verticalSpacingPx;
            
            if (cols > 0) {
                const requiredWidth = cols * buildingWidth + (cols - 1) * horizontalSpacingPx;
                if (requiredWidth < area.width) {
                    const extraSpace = area.width - requiredWidth;
                    horizontalSpacing = horizontalSpacingPx + (extraSpace / cols);
                }
            }
            
            if (rows > 0) {
                const requiredHeight = rows * buildingHeight + (rows - 1) * verticalSpacingPx;
                if (requiredHeight < area.height) {
                    const extraSpace = area.height - requiredHeight;
                    verticalSpacing = verticalSpacingPx + (extraSpace / rows);
                }
            }
    
            if (cols < 1 || rows < 1) {
                if (window.SiteMapUtils) {
                    window.SiteMapUtils.updateStatus('選択範囲が小さすぎます');
                }
                return;
            }
            
            let count = 0;
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = area.left + col * (buildingWidth + horizontalSpacing);
                    const y = area.top + row * (buildingHeight + verticalSpacing);
                    
                    const building = createBuilding(x, y, selectedBuildingType.type, 0);
                    if (building) {
                        window.canvas.add(building);
                        count++;
                    }
                }
            }
            
            window.canvas.renderAll();
            
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus(`${count}個の建物を配置しました`);
            }
        } catch (error) {
            console.error('複数建物配置エラー:', error);
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('建物の配置に失敗しました');
            }
        }
    }

    // 配置情報更新
    function updateGridInfo(width, height) {
        if (!selectedBuildingType) return;
        
        try {
            const buildingConfig = CONFIG.BUILDING_TYPES[selectedBuildingType.type];
            const buildingWidth = buildingConfig.width * SCALE;
            const buildingHeight = buildingConfig.height * SCALE;
            const horizontalSpacingPx = spacingState.shortSide * SCALE;
            const verticalSpacingPx = spacingState.longSide * SCALE;
            
            // 配置可能数を計算
            const capacity = window.SiteMapUtils.calculatePlacementCapacity(
                width, height,
                buildingWidth, buildingHeight,
                horizontalSpacingPx, verticalSpacingPx
            );
            
            const gridInfoElement = document.getElementById('grid-info');
            if (gridInfoElement) {
                gridInfoElement.innerHTML = `
                    配置可能: ${capacity.cols} × ${capacity.rows} = ${capacity.total}個<br>
                    選択範囲: ${(width/SCALE).toFixed(1)}m × ${(height/SCALE).toFixed(1)}m<br>
                    建物タイプ: ${buildingConfig.name}
                `;
            }
        } catch (error) {
            console.error('配置情報更新エラー:', error);
        }
    }

    // 建物タイプを設定
    function setSelectedBuildingType(type) {
        const buildingConfig = CONFIG.BUILDING_TYPES[type];
        if (buildingConfig) {
            selectedBuildingType = {
                type: buildingConfig.type,
                width: buildingConfig.width * SCALE,
                height: buildingConfig.height * SCALE,
                color: buildingConfig.color
            };
        }
        return selectedBuildingType;
    }
    
    // 間隔を設定
    function setSpacing(shortSide, longSide) {
        if (shortSide !== undefined) spacingState.shortSide = shortSide;
        if (longSide !== undefined) spacingState.longSide = longSide;
    }
    
    // 建物カウントをリセット
    function resetBuildingCount() {
        buildingCount = 0;
    }
    
    // 公開API
    window.SiteMapBuilding = {
        createBuilding,
        placeBuilding,
        placeMultipleBuildings,
        updateGridInfo,
        setSelectedBuildingType,
        setSpacing,
        resetBuildingCount,
        getSelectedBuildingType: () => selectedBuildingType,
        getSpacing: () => ({ ...spacingState })
    };
    
})(window);