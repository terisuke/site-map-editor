# Suggested Commands for Development

## Running the Application
```bash
# Open in default browser (macOS)
open index.html

# Or with specific browser
open -a "Google Chrome" index.html
```

## Development Tools
Since this is a pure HTML/CSS/JS project with no build process:

### File Operations (macOS/Darwin)
```bash
# List files
ls -la

# Navigate directories  
cd [directory]

# Find files
find . -name "*.js"

# Search in files
grep -r "function" js/

# View file contents
cat [filename]
less [filename]
```

### Git Commands
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "message"

# View history
git log --oneline
```

### Local Development Server (optional)
If you need a local server for development:

```bash
# Python 3 simple server
python3 -m http.server 8000

# Node.js http-server (if installed)
npx http-server

# Then open http://localhost:8000
```

## Testing and Debugging
- **No test framework**: Manual testing in browser
- **No linting tools**: Code style maintained manually
- **Browser DevTools**: Primary debugging tool (F12 or Cmd+Option+I)

## Important Notes
- **No build commands needed**
- **No npm install required**
- **No compilation or transpilation**
- **Direct file editing and browser refresh for changes**