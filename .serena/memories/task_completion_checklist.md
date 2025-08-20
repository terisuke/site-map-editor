# Task Completion Checklist

When completing any coding task in this project, follow these steps:

## 1. Code Quality Checks
- [ ] All comments and UI text remain in Japanese
- [ ] Variable and function names follow camelCase convention
- [ ] Constants use UPPER_CASE naming
- [ ] Code follows existing modular structure

## 2. Manual Testing
Since there are no automated tests:
- [ ] Open index.html in browser (Chrome recommended)
- [ ] Test the modified functionality thoroughly
- [ ] Check browser console for any errors (F12 → Console)
- [ ] Verify grid snapping still works correctly
- [ ] Test all placement modes if building logic was changed

## 3. Cross-browser Testing
- [ ] Test in Chrome (primary)
- [ ] Test in Firefox
- [ ] Test in Safari (if on macOS)

## 4. File Verification
- [ ] Ensure no new dependencies were added
- [ ] Verify CDN links are still valid if modified
- [ ] Check that file structure remains consistent

## 5. Documentation
- [ ] Update README.md if user-facing features changed
- [ ] Update CLAUDE.md if technical details changed
- [ ] Add Japanese comments for any new functions

## 6. Final Checks
- [ ] No console.log statements left in production code (unless intentional)
- [ ] No debugging code or temporary fixes
- [ ] Files saved with proper encoding (UTF-8)

## Important Reminders
- **No build process** - changes are live immediately
- **No linting** - manually ensure code quality
- **No tests** - thorough manual testing is critical
- **Japanese context** - maintain all Japanese text and comments