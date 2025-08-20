// ユーティリティ関数
(function(window) {
    'use strict';
    
    // 設定を取得
    const CONFIG = window.SiteMapConfig;
    const SCALE = CONFIG.SCALE;
    const GRID_SIZE = CONFIG.GRID.SIZE;
    
    // グリッドスナップ用ユーティリティ
    function snapToGrid(value) {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }
    
    // 座標をグリッドにスナップ
    function snapCoordinatesToGrid(x, y) {
        return {
            x: snapToGrid(x),
            y: snapToGrid(y)
        };
    }
    
    // 配置可能数を計算
    function calculatePlacementCapacity(areaWidth, areaHeight, buildingWidth, buildingHeight, horizontalSpacing, verticalSpacing) {
        const cols = Math.floor((areaWidth + horizontalSpacing) / (buildingWidth + horizontalSpacing));
        const rows = Math.floor((areaHeight + verticalSpacing) / (buildingHeight + verticalSpacing));
        return { cols, rows, total: Math.max(0, cols * rows) };
    }

    // 選択削除
    function deleteSelected() {
        try {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length === 0) {
                updateStatus('削除する要素を選択してください');
                return;
            }
            
            activeObjects.forEach(obj => {
                // 背景画像とグリッドは削除しない
                if (obj !== backgroundImage && !obj.excludeFromExport && !obj.isGrid) {
                    canvas.remove(obj);
                }
            });
            canvas.discardActiveObject();
            canvas.renderAll();
            updateStatus('選択した要素を削除しました');
        } catch (error) {
            console.error('要素削除エラー:', error);
            updateStatus('要素の削除に失敗しました');
        }
    }

    // 選択回転
    function rotateSelected() {
        try {
            const activeObject = canvas.getActiveObject();
            if (activeObject && !activeObject.excludeFromExport && !activeObject.isGrid) {
                activeObject.rotate((activeObject.angle + 90) % 360);
                canvas.renderAll();
                updateStatus('要素を回転しました');
            } else {
                updateStatus('回転する要素を選択してください');
            }
        } catch (error) {
            console.error('要素回転エラー:', error);
            updateStatus('要素の回転に失敗しました');
        }
    }

    // すべて削除
    function clearAll() {
        try {
            if (confirm('すべての要素を削除しますか？')) {
                let removedCount = 0;
                canvas.getObjects().forEach(obj => {
                    // 背景画像とグリッドは削除しない
                    if (obj !== backgroundImage && !obj.excludeFromExport && !obj.isGrid) {
                        canvas.remove(obj);
                        removedCount++;
                    }
                });
                canvas.renderAll();
                updateStatus(`${removedCount}個の要素を削除しました`);
                
                // buildingCountのリセットはBuilding側で管理
                if (window.SiteMapBuilding && window.SiteMapBuilding.resetBuildingCount) {
                    window.SiteMapBuilding.resetBuildingCount();
                }
            }
        } catch (error) {
            console.error('全削除エラー:', error);
            updateStatus('建物の削除に失敗しました');
        }
    }

    // JSON出力
    function exportJSON() {
        try {
            const buildings = canvas.getObjects().filter(obj => 
                !obj.excludeFromExport && 
                obj !== backgroundImage && 
                !obj.isBackground &&
                obj.buildingType // 建物のみ
            );
            
            if (buildings.length === 0) {
                updateStatus('出力する建物がありません');
                return;
            }
            
            const data = buildings.map(obj => ({
                type: obj.buildingType,
                x: (obj.left / SCALE).toFixed(2) + 'm',
                y: (obj.top / SCALE).toFixed(2) + 'm',
                rotation: obj.angle + '°',
                gridX: Math.round(obj.left / GRID_SIZE),
                gridY: Math.round(obj.top / GRID_SIZE)
            }));
            
            console.log(JSON.stringify(data, null, 2));
            alert('コンソールにJSON出力しました（実寸法とグリッド座標付き）');
            updateStatus(`${buildings.length}個の建物データを出力しました`);
        } catch (error) {
            console.error('JSON出力エラー:', error);
            updateStatus('JSONの出力に失敗しました');
        }
    }

    // PDF出力
    function exportPDF() {
        try {
            // jsPDFが読み込まれているか確認
            if (typeof window.jspdf === 'undefined') {
                alert('PDFライブラリが読み込まれていません');
                return;
            }
            
            // キャンバスのサイズを取得
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            // A4サイズのPDFを作成（横向き）
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // PDFのページサイズを取得
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // グリッドのみ一時的に非表示にする（図面枠と方位マークは表示のまま）
            const gridLines = window.SiteMapCanvas.getGridLines();
            const gridVisibility = [];
            gridLines.forEach((line, index) => {
                gridVisibility[index] = line.visible;
                line.visible = false;
            });
            
            // キャンバスを画像として取得（図面枠と方位マークを含める）
            canvas.renderAll();
            let dataURL;
            try {
                dataURL = canvas.toDataURL({
                    format: 'png',
                    quality: 1.0,
                    multiplier: 2 // 高解像度出力
                });
            } catch (error) {
                // CORS エラーの場合、エラーメッセージを表示
                console.error('PDF出力エラー:', error);
                alert('PDF出力に失敗しました。画像ファイルがローカルサーバーから提供されていることを確認してください。');
                
                // グリッドの表示状態を復元
                gridLines.forEach((line, index) => {
                    line.visible = gridVisibility[index];
                });
                canvas.renderAll();
                return;
            }
            
            // グリッドの表示状態を復元
            gridLines.forEach((line, index) => {
                line.visible = gridVisibility[index];
            });
            canvas.renderAll();
            
            // 画像のアスペクト比を保持してPDFに配置
            const imgAspectRatio = canvasWidth / canvasHeight;
            const pageAspectRatio = pageWidth / pageHeight;
            
            let imgWidth, imgHeight, x, y;
            
            if (imgAspectRatio > pageAspectRatio) {
                // 画像の方が横長
                imgWidth = pageWidth - 20; // マージン10mm
                imgHeight = imgWidth / imgAspectRatio;
                x = 10;
                y = (pageHeight - imgHeight) / 2;
            } else {
                // 画像の方が縦長
                imgHeight = pageHeight - 20; // マージン10mm
                imgWidth = imgHeight * imgAspectRatio;
                x = (pageWidth - imgWidth) / 2;
                y = 10;
            }
            
            // 画像をPDFに追加
            pdf.addImage(dataURL, 'PNG', x, y, imgWidth, imgHeight);
            
            // 建物情報を取得
            const buildings = canvas.getObjects().filter(obj => 
                !obj.excludeFromExport && 
                obj !== backgroundImage && 
                !obj.isBackground &&
                obj.buildingType
            );
            
            // 2ページ目に建物情報を追加
            if (buildings.length > 0) {
                pdf.addPage();
                pdf.setFontSize(16);
                pdf.text('建物配置情報', 20, 20);
                
                pdf.setFontSize(10);
                let yPos = 40;
                
                buildings.forEach((obj, index) => {
                    const buildingInfo = `${index + 1}. ${obj.buildingType}: ` +
                        `位置(${(obj.left / SCALE).toFixed(2)}m, ${(obj.top / SCALE).toFixed(2)}m), ` +
                        `回転${obj.angle}°`;
                    
                    pdf.text(buildingInfo, 20, yPos);
                    yPos += 10;
                    
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = 20;
                    }
                });
            }
            
            // PDFを保存
            const now = new Date();
            const timestamp = now.getFullYear() + 
                ('0' + (now.getMonth() + 1)).slice(-2) + 
                ('0' + now.getDate()).slice(-2) + 
                '_' + 
                ('0' + now.getHours()).slice(-2) + 
                ('0' + now.getMinutes()).slice(-2);
            
            pdf.save(`敷地図_${timestamp}.pdf`);
            updateStatus('PDFを出力しました');
            
        } catch (error) {
            console.error('PDF出力エラー:', error);
            updateStatus('PDFの出力に失敗しました');
        }
    }

    // ステータス更新
    function updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    // 方位マークを追加（ツールバーボタン用）
    function addCompass() {
        try {
            // 既存の方位マークがあるか確認
            const existingCompass = canvas.getObjects().find(obj => obj.objectType === 'compass');
            const compassBtn = document.getElementById('compassBtn');
            
            if (existingCompass) {
                canvas.remove(existingCompass);
                canvas.renderAll();
                if (compassBtn) compassBtn.textContent = '方位マーク追加';
                updateStatus('方位マークを削除しました');
                return;
            }
            
            // 画像を読み込んで配置（右上に固定配置）
            fabric.Image.fromURL('images/direction.png', function(img) {
                // サイズを固定（50px）
                const size = 50;
                const scale = size / Math.max(img.width, img.height);
                
                img.set({
                    left: canvas.getWidth() - size - 20,
                    top: 20,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true,
                    hasRotatingPoint: true,
                    objectType: 'compass'
                });
                
                canvas.add(img);
                canvas.renderAll();
                if (compassBtn) compassBtn.textContent = '方位マーク削除';
                updateStatus('方位マークを追加しました');
            }, {
                crossOrigin: 'anonymous'
            });
        } catch (error) {
            console.error('方位マーク追加エラー:', error);
            updateStatus('方位マークの追加に失敗しました');
        }
    }
    
    // テキストを配置
    function placeText(x, y) {
        try {
            const fontSize = parseInt(document.getElementById('fontSize').value) || 16;
            const fontColor = document.getElementById('fontColor').value || '#000000';
            
            const text = new fabric.IText('テキストを入力', {
                left: x,
                top: y,
                fontSize: fontSize,
                fill: fontColor,
                fontFamily: 'Arial, sans-serif',
                selectable: true,
                editable: true,
                objectType: 'text'
            });
            
            canvas.add(text);
            canvas.setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            canvas.renderAll();
            updateStatus('テキストを配置しました。クリックして編集できます');
        } catch (error) {
            console.error('テキスト配置エラー:', error);
            updateStatus('テキストの配置に失敗しました');
        }
    }
    
    // 図面枠を追加
    function addDrawingFrame() {
        try {
            // 既存の図面枠があるか確認
            const existingFrame = canvas.getObjects().find(obj => obj.objectType === 'drawingFrame');
            const frameBtn = document.getElementById('frameBtn');
            
            if (existingFrame) {
                canvas.remove(existingFrame);
                canvas.renderAll();
                if (frameBtn) frameBtn.textContent = '図面枠追加';
                updateStatus('図面枠を削除しました');
                return;
            }
            
            // キャンバスのサイズを取得
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            // 画像を読み込んで配置
            fabric.Image.fromURL('images/frame.png', function(img) {
                // キャンバスサイズに合わせてスケール調整
                const scaleX = canvasWidth / img.width;
                const scaleY = canvasHeight / img.height;
                
                img.set({
                    left: 0,
                    top: 0,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: false,
                    evented: false,
                    hoverCursor: 'default',
                    lockMovementX: true,
                    lockMovementY: true,
                    lockRotation: true,
                    lockScalingX: true,
                    lockScalingY: true,
                    hasControls: false,
                    hasBorders: false,
                    objectType: 'drawingFrame',
                    excludeFromExport: false
                });
                
                // 図面枠を追加
                canvas.add(img);
                
                // レイヤー順序を整理
                // 1. 背景画像を最背面
                if (window.backgroundImage) {
                    canvas.sendToBack(window.backgroundImage);
                }
                
                // 2. 図面枠を背景の次に配置
                canvas.sendToBack(img);
                if (window.backgroundImage) {
                    canvas.bringForward(img);
                }
                
                // 3. グリッドを図面枠の前に配置
                const gridLines = canvas.getObjects().filter(obj => obj.isGrid);
                gridLines.forEach(grid => {
                    canvas.bringToFront(grid);
                });
                
                // 4. 建物などの要素を最前面に保持
                canvas.getObjects().forEach(obj => {
                    if (!obj.isGrid && obj.objectType !== 'drawingFrame' && 
                        obj !== window.backgroundImage && obj.buildingType) {
                        canvas.bringToFront(obj);
                    }
                });
                
                canvas.renderAll();
                if (frameBtn) frameBtn.textContent = '図面枠削除';
                updateStatus('図面枠を追加しました');
            }, {
                crossOrigin: 'anonymous'
            });
        } catch (error) {
            console.error('図面枠追加エラー:', error);
            updateStatus('図面枠の追加に失敗しました');
        }
    }
    
    // 公開API
    window.SiteMapUtils = {
        deleteSelected,
        rotateSelected,
        clearAll,
        exportJSON,
        exportPDF,
        updateStatus,
        snapToGrid,
        snapCoordinatesToGrid,
        calculatePlacementCapacity,
        addCompass,
        placeText,
        addDrawingFrame
    };
    
})(window);