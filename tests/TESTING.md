# Testing Quick Reference

## Run Tests

```bash
# Node.js tests (local simulation)
npm test

# Browser tests (interactive)
npm run test:browser
# or open: tests/browser-test.html

# All tests
npm run test:all
```

## Test Apps Script

1. Open Apps Script editor
2. Select `testEncryption` from function dropdown
3. Click Run (▶️)
4. Check logs - must see "✓ All tests PASSED!"

## Verify Cross-Compatibility

**Step 1:** Run Apps Script test
```
Apps Script → testEncryption() → Copy base64 from Test 4
```

**Step 2:** Test in browser
```
Browser → tests/browser-test.html → Paste into "Manual Test"
```

**Expected:** Should decrypt successfully to `{"test":"data"}`

## Quick Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Node.js tests fail | Logic mismatch | Check UTF-8 encoding in `encryption-test.js` |
| Browser tests fail | Web API issue | Check `TextEncoder` usage in `decrypt.js` |
| Apps Script fails | Code not updated | Copy latest from `scripts/templates/apps-script.js` |
| Browser shows garbage | Key derivation mismatch | Verify SHA-256 uses UTF-8 on both sides |
| "Invalid header" error | Encryption format wrong | Check "Salted__" header generation |

## Before Submitting Form

✅ `npm test` → All pass  
✅ `npm run test:browser` → All pass  
✅ Apps Script `testEncryption()` → All pass  
✅ Cross-compatibility verified  

## After Code Changes

1. Update all three locations:
   - `scripts/templates/apps-script.js`
   - `js/decrypt.js`
   - `tests/encryption-test.js`
2. Run all tests
3. Verify cross-compatibility
4. Test with real form submission

## Test Coverage

✓ ASCII text  
✓ JSON objects  
✓ Hebrew/Unicode UTF-8  
✓ Large data (4KB+)  
✓ Wrong key handling  
✓ Apps Script → Browser compatibility  

## Exit Codes

- `0` - All tests passed
- `1` - Some tests failed (do not deploy)
