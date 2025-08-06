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
                updateStatus('削除する建物を選択してください');
                return;
            }
            
            activeObjects.forEach(obj => {
                // 背景画像とグリッドは削除しない
                if (obj !== backgroundImage && !obj.excludeFromExport && obj.buildingType) {
                    canvas.remove(obj);
                }
            });
            canvas.discardActiveObject();
            canvas.renderAll();
            updateStatus('建物を削除しました');
        } catch (error) {
            console.error('建物削除エラー:', error);
            updateStatus('建物の削除に失敗しました');
        }
    }

    // 選択回転
    function rotateSelected() {
        try {
            const activeObject = canvas.getActiveObject();
            if (activeObject && activeObject.buildingType) {
                activeObject.rotate((activeObject.angle + 90) % 360);
                canvas.renderAll();
                updateStatus('建物を回転しました');
            } else {
                updateStatus('回転する建物を選択してください');
            }
        } catch (error) {
            console.error('建物回転エラー:', error);
            updateStatus('建物の回転に失敗しました');
        }
    }

    // すべて削除
    function clearAll() {
        try {
            if (confirm('すべての建物を削除しますか？')) {
                let removedCount = 0;
                canvas.getObjects().forEach(obj => {
                    // 背景画像とグリッドは削除しない
                    if (obj !== backgroundImage && !obj.excludeFromExport && obj.buildingType) {
                        canvas.remove(obj);
                        removedCount++;
                    }
                });
                canvas.renderAll();
                updateStatus(`${removedCount}個の建物を削除しました`);
                
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
            
            // グリッドを一時的に非表示にする
            const gridLines = window.SiteMapCanvas.getGridLines();
            const gridVisibility = [];
            gridLines.forEach((line, index) => {
                gridVisibility[index] = line.visible;
                line.visible = false;
            });
            
            // キャンバスを画像として取得
            canvas.renderAll();
            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: 2 // 高解像度出力
            });
            
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
        calculatePlacementCapacity
    };
    
})(window);