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
        
        // 色設定を取得（カラー/白黒）
        let fillColor = buildingConfig.color;
        const colorCheckbox = document.getElementById(`color${type}`);
        if (colorCheckbox && !colorCheckbox.checked) {
            // 白黒表示の場合
            fillColor = '#cccccc';
        }
        
        // 建物本体（縦長のまま配置）
        const rect = new fabric.Rect({
            left: 0,
            top: 0,
            width: width,   // 短辺
            height: height, // 長辺
            fill: fillColor,
            stroke: CONFIG.BUILDING_STYLE.STROKE_COLOR,
            strokeWidth: CONFIG.BUILDING_STYLE.STROKE_WIDTH,
            opacity: CONFIG.BUILDING_STYLE.OPACITY
        });
        
        // 入口マーカーを追加（箱のみモードでない場合）
        const shapes = [rect];
        const boxOnly = document.getElementById('boxOnly');
        if (buildingConfig.hasEntrance && (!boxOnly || !boxOnly.checked)) {
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
            
            // ペア配置チェック
            const pairPlacement = document.getElementById('pairPlacement');
            if (pairPlacement && pairPlacement.checked && 
                (selectedBuildingType.type === 'A' || selectedBuildingType.type === 'B')) {
                // 密着ペア建物を配置
                const pairBuilding = createPairBuilding(snapped.x, snapped.y, selectedBuildingType.type);
                
                if (pairBuilding) {
                    window.canvas.add(pairBuilding);
                    window.canvas.renderAll();
                    
                    if (window.SiteMapUtils) {
                        window.SiteMapUtils.updateStatus(`建物${selectedBuildingType.type}ペア（密着）を配置しました`);
                    }
                }
            } else {
                // 通常の単一配置
                const building = createBuilding(snapped.x, snapped.y, selectedBuildingType.type);
                if (building) {
                    window.canvas.add(building);
                    window.canvas.renderAll();
                    
                    if (window.SiteMapUtils) {
                        window.SiteMapUtils.updateStatus(`建物${selectedBuildingType.type}を配置しました`);
                    }
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
            // ペア配置チェック
            const pairPlacement = document.getElementById('pairPlacement');
            if (pairPlacement && pairPlacement.checked && 
                (selectedBuildingType.type === 'A' || selectedBuildingType.type === 'B')) {
                // ペア配置の場合
                placePairBuildingsInArea(area);
                return;
            }
            
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

    // ペア建物を範囲内に配置
    function placePairBuildingsInArea(area) {
        try {
            // 選択された建物タイプ（AまたはB）を2つ上下密着で配置
            const buildingType = selectedBuildingType.type;
            const buildingConfig = CONFIG.BUILDING_TYPES[buildingType];
            const buildingWidth = buildingConfig.width * SCALE;
            const buildingHeight = buildingConfig.height * SCALE;
            
            // ペアの高さは建物2つ分（密着なので間隔なし）
            const pairHeight = buildingHeight * 2;
            
            // 間隔をピクセルに変換（ペア間の間隔）
            const horizontalSpacingPx = spacingState.shortSide * SCALE;
            const verticalSpacingPx = spacingState.longSide * SCALE;
            
            // 配置可能数を計算
            const capacity = window.SiteMapUtils.calculatePlacementCapacity(
                area.width, area.height,
                buildingWidth, pairHeight,
                horizontalSpacingPx, verticalSpacingPx
            );
            
            const { cols, rows } = capacity;
            
            if (cols < 1 || rows < 1) {
                if (window.SiteMapUtils) {
                    window.SiteMapUtils.updateStatus('選択範囲が小さすぎます');
                }
                return;
            }
            
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
                const requiredHeight = rows * pairHeight + (rows - 1) * verticalSpacingPx;
                if (requiredHeight < area.height) {
                    const extraSpace = area.height - requiredHeight;
                    verticalSpacing = verticalSpacingPx + (extraSpace / rows);
                }
            }
            
            let count = 0;
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = area.left + col * (buildingWidth + horizontalSpacing);
                    const y = area.top + row * (pairHeight + verticalSpacing);
                    
                    // 密着ペア建物を配置
                    const pairBuilding = createPairBuilding(x, y, buildingType);
                    
                    if (pairBuilding) {
                        window.canvas.add(pairBuilding);
                        count += 2;
                    }
                }
            }
            
            window.canvas.renderAll();
            
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus(`${count}個の建物${buildingType}（${count/2}ペア）を配置しました`);
            }
        } catch (error) {
            console.error('ペア建物配置エラー:', error);
            if (window.SiteMapUtils) {
                window.SiteMapUtils.updateStatus('ペア建物の配置に失敗しました');
            }
        }
    }

    // 配置情報更新
    function updateGridInfo(width, height) {
        if (!selectedBuildingType) return;
        
        try {
            const pairPlacement = document.getElementById('pairPlacement');
            
            if (pairPlacement && pairPlacement.checked && 
                (selectedBuildingType.type === 'A' || selectedBuildingType.type === 'B')) {
                // ペア配置の場合
                const buildingType = selectedBuildingType.type;
                const buildingConfig = CONFIG.BUILDING_TYPES[buildingType];
                const buildingWidth = buildingConfig.width * SCALE;
                const buildingHeight = buildingConfig.height * SCALE;
                const pairHeight = buildingHeight * 2;  // 2つ分の高さ
                const horizontalSpacingPx = spacingState.shortSide * SCALE;
                const verticalSpacingPx = spacingState.longSide * SCALE;
                
                const capacity = window.SiteMapUtils.calculatePlacementCapacity(
                    width, height,
                    buildingWidth, pairHeight,
                    horizontalSpacingPx, verticalSpacingPx
                );
                
                const gridInfoElement = document.getElementById('grid-info');
                if (gridInfoElement) {
                    gridInfoElement.innerHTML = `
                        配置可能: ${capacity.cols} × ${capacity.rows} = ${capacity.total}ペア（${capacity.total * 2}個）<br>
                        選択範囲: ${(width/SCALE).toFixed(1)}m × ${(height/SCALE).toFixed(1)}m<br>
                        建物タイプ: ${buildingConfig.name}ペア（密着）
                    `;
                }
            } else {
                // 通常配置の場合
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
    
    // 密着ペア建物を作成（新規）
    function createPairBuilding(x, y, type) {
        const buildingConfig = CONFIG.BUILDING_TYPES[type];
        if (!buildingConfig) {
            console.error(`不明な建物タイプ: ${type}`);
            return null;
        }
        
        const width = buildingConfig.width * SCALE;
        const height = buildingConfig.height * SCALE;
        
        // 色設定を取得
        let fillColor = buildingConfig.color;
        const colorCheckbox = document.getElementById(`color${type}`);
        if (colorCheckbox && !colorCheckbox.checked) {
            fillColor = '#cccccc';
        }
        
        const shapes = [];
        const boxOnly = document.getElementById('boxOnly');
        const showEntrance = buildingConfig.hasEntrance && (!boxOnly || !boxOnly.checked);
        
        // 1つ目の建物（下側）
        buildingCount++;
        const rect1 = new fabric.Rect({
            left: 0,
            top: height, // 下側に配置
            width: width,
            height: height,
            fill: fillColor,
            stroke: CONFIG.BUILDING_STYLE.STROKE_COLOR,
            strokeWidth: CONFIG.BUILDING_STYLE.STROKE_WIDTH,
            opacity: CONFIG.BUILDING_STYLE.OPACITY
        });
        shapes.push(rect1);
        
        // 1つ目の建物の入口（下側）
        if (showEntrance) {
            const entrance1 = new fabric.Rect({
                left: width / 2 - CONFIG.ENTRANCE_MARKER.WIDTH / 2,
                top: height * 2 - CONFIG.ENTRANCE_MARKER.OFFSET_FROM_BOTTOM,
                width: CONFIG.ENTRANCE_MARKER.WIDTH,
                height: CONFIG.ENTRANCE_MARKER.HEIGHT,
                fill: CONFIG.ENTRANCE_MARKER.COLOR
            });
            shapes.push(entrance1);
        }
        
        // 2つ目の建物（上側）
        buildingCount++;
        const rect2 = new fabric.Rect({
            left: 0,
            top: 0, // 上側に配置
            width: width,
            height: height,
            fill: fillColor,
            stroke: CONFIG.BUILDING_STYLE.STROKE_COLOR,
            strokeWidth: CONFIG.BUILDING_STYLE.STROKE_WIDTH,
            opacity: CONFIG.BUILDING_STYLE.OPACITY
        });
        shapes.push(rect2);
        
        // 2つ目の建物の入口（上側の建物の上部に配置）
        if (showEntrance) {
            const entrance2 = new fabric.Rect({
                left: width / 2 - CONFIG.ENTRANCE_MARKER.WIDTH / 2,
                top: 0,  // 入口を上端に配置
                width: CONFIG.ENTRANCE_MARKER.WIDTH,
                height: CONFIG.ENTRANCE_MARKER.HEIGHT,
                fill: CONFIG.ENTRANCE_MARKER.COLOR
            });
            shapes.push(entrance2);
        }
        
        // グループ化
        const group = new fabric.Group(shapes, {
            left: x,
            top: y,
            selectable: window.currentMode === 'select',
            hasControls: true,
            lockScalingX: true,
            lockScalingY: true,
            buildingType: type,
            isPair: true
        });
        
        return group;
    }
    
    // 建物カウントをリセット
    function resetBuildingCount() {
        buildingCount = 0;
    }
    
    // 公開API
    window.SiteMapBuilding = {
        createBuilding,
        createPairBuilding,
        placeBuilding,
        placeMultipleBuildings,
        placePairBuildingsInArea,
        updateGridInfo,
        setSelectedBuildingType,
        setSpacing,
        resetBuildingCount,
        getSelectedBuildingType: () => selectedBuildingType,
        getSpacing: () => ({ ...spacingState })
    };
    
})(window);