# Code Style and Conventions

## Language and Comments
- **All UI text and code comments are in Japanese**
- Comments use Japanese characters (e.g., // 建物関連の機能)
- Console messages can be in English

## JavaScript Style
- **ES6+ features**: const/let, arrow functions, template literals
- **Global variables**: Used for shared state (e.g., window.canvas)
- **Module pattern**: Each JS file handles specific functionality
- **No classes**: Function-based architecture
- **Variable naming**: camelCase for variables and functions
- **Constants**: UPPER_CASE for configuration values

## Code Organization
- **Separation of concerns**: Canvas, building, utils, and main logic separated
- **Event handlers**: Centralized in main.js
- **State management**: Global variables for mode and selection state
- **No state management library**: Direct manipulation

## Fabric.js Conventions
- Use Fabric.js coordinate system (not raw canvas)
- Custom properties added to fabric objects (e.g., buildingId, buildingType)
- Grid snapping calculations based on 910mm module

## Best Practices Observed
- Clear function names describing actions
- Modular file structure
- Configuration values defined as constants
- Event delegation for UI controls
- Proper error handling for file operations