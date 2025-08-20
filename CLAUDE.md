# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Site Map Editor (敷地図PDFエディタ) - a single-page web application for architectural site planning in Japan. It allows users to place buildings on a site map with constraints based on Japanese building regulations.

## Technology Stack

- **Pure HTML/CSS/JavaScript** - No framework or build process
- **Fabric.js v5.3.0** - Canvas manipulation
- **PDF.js v3.11.174** - PDF background loading
- **No package manager** - Libraries loaded via CDN

## Development Commands

No build or development commands needed. Simply open `index.html` in a web browser.

## Architecture

Modular file structure with namespace-based organization:
- `index.html` - HTML structure with sidebar controls and main canvas
- `css/styles.css` - All styles and visual design
- `js/config.js` - Centralized configuration and constants (building types, styles, dimensions)
- `js/canvas.js` - Canvas initialization, grid drawing, PDF handling (namespace: `SiteMapCanvas`)
- `js/building.js` - Building creation and placement logic (namespace: `SiteMapBuilding`)
- `js/utils.js` - Utility functions (delete, rotate, export) (namespace: `SiteMapUtils`)
- `js/main.js` - Event handlers and application initialization (namespace: `SiteMapMain`)

### Code Organization
- **IIFE Pattern**: All JavaScript files use Immediately Invoked Function Expressions to prevent global pollution
- **Namespaces**: Each module exposes its public API through a specific namespace
- **State Management**: Application state is centralized in `appState` object
- **Error Handling**: All major functions include try-catch blocks with user-friendly error messages

## Key Technical Details

- **Scale**: 1/1000 (1m = 4 pixels)
- **Grid**: 910mm module (Japanese architectural standard)
- **Building Types**:
  - PLAN-①: 6.37m × 8.19m residential (with terrace 0.91m + porch 1.2m on short side)
  - PLAN-②: 5.46m × 7.28m residential (with terrace 0.91m + porch 1.2m on short side)
  - Building C: 42m × 43m service-oriented senior housing (サ高住)
  - Building D: 19.5m × 34.2m apartment
- **Placement Rules**:
  - Buildings are placed vertically (long side vertical, short side horizontal)
  - Short sides (horizontal) spacing is adjustable (0-5m, default 1.2m)
  - Long sides (vertical) spacing is adjustable (0-5m, default 1.2m)
  - Grid snapping ensures proper alignment

## Additional Features

- **Direction Marker**: Add compass/north arrow from direction.png image (toggle on/off)
- **Text Mode**: Add editable text annotations with customizable font size and color
- **Drawing Mode**: Freehand drawing with adjustable brush size and color
- **Drawing Frame**: Standard architectural drawing frame from frame.png image (toggle on/off)

## Important Considerations

- All UI text and code comments are in Japanese
- Buildings A and B have entrance markers (red lines) at the bottom (short side)
- The application follows Japanese building placement regulations
- Canvas coordinates use Fabric.js coordinate system (not raw canvas coordinates)

## API Reference

### SiteMapConfig
Centralized configuration object containing all constants and settings:
- Building types definitions
- Canvas dimensions
- Grid settings
- Style constants
- Default spacing values

### SiteMapCanvas
- `initializeCanvas()` - Initialize Fabric.js canvas
- `drawGrid()` - Draw 910mm grid
- `toggleGrid()` - Show/hide grid
- `loadPDF(event)` - Load PDF background
- `clearBackground()` - Clear PDF background
- `zoomIn()` - Zoom in by 20%
- `zoomOut()` - Zoom out by 20%
- `resetZoom()` - Reset zoom to 100%

### SiteMapBuilding
- `placeBuilding(x, y)` - Place single building
- `placeMultipleBuildings(area)` - Place multiple buildings in area
- `setSelectedBuildingType(type)` - Set active building type
- `setSpacing(shortSide, longSide)` - Update building spacing
- `updateGridInfo(width, height)` - Update placement information display

### SiteMapUtils
- `deleteSelected()` - Delete selected element(s)
- `rotateSelected()` - Rotate selected element 90 degrees
- `clearAll()` - Clear all elements
- `exportJSON()` - Export building data as JSON
- `exportPDF()` - Export to PDF
- `snapToGrid(value)` - Snap value to grid
- `calculatePlacementCapacity()` - Calculate building placement capacity
- `addCompass()` - Toggle compass/direction marker (direction.png)
- `placeText(x, y)` - Place editable text at coordinates
- `addDrawingFrame()` - Toggle architectural drawing frame (frame.png)

### SiteMapMain
- `setMode(mode)` - Switch between select/place/area/text/draw modes
