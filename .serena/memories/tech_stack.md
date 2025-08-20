# Technology Stack

## Core Technologies
- **Pure HTML/CSS/JavaScript** - No framework or build process
- **No package manager** - All libraries loaded via CDN
- **No TypeScript** - Plain JavaScript only
- **No build tools** - Direct file serving

## External Libraries (CDN)
- **Fabric.js v5.3.0** - Canvas manipulation and object handling
- **PDF.js v3.11.174** - PDF background loading and rendering

## File Structure
```
site-map-editor/
├── index.html          # Main HTML with sidebar controls and canvas
├── css/
│   └── styles.css     # All styles and visual design
├── js/
│   ├── main.js        # Event handlers and app initialization
│   ├── canvas.js      # Canvas init, grid drawing, PDF handling
│   ├── building.js    # Building creation and placement logic
│   └── utils.js       # Utilities (delete, rotate, export)
├── README.md          # User documentation (Japanese)
└── CLAUDE.md          # Developer guidance
```

## Development Environment
- **Platform**: Darwin (macOS)
- **Runtime**: Browser-based (Chrome recommended)
- **Development server**: Not needed - open index.html directly
- **Internet**: Required for CDN libraries