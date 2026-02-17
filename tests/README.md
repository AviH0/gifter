# Encryption/Decryption Tests

This directory contains tests to verify compatibility between Apps Script encryption and browser decryption.

## Overview

The platform uses XOR encryption with SHA-256 key derivation. These tests ensure that:
1. Data encrypted in Apps Script can be decrypted in the browser
2. UTF-8 encoding is handled correctly on both sides
3. The encryption format matches expected structure

## Test Files

### 1. `encryption-test.js` - Node.js Test Suite

Simulates Apps Script encryption and tests decryption logic locally.

**Run:**
```bash
npm test
```

**Tests:**
- ✓ Simple ASCII text encryption/decryption
- ✓ JSON object (realistic event config)
- ✓ Hebrew/Unicode UTF-8 text
- ✓ Large JSON (performance test)
- ✓ Wrong key handling

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║        ENCRYPTION/DECRYPTION COMPATIBILITY TEST           ║
╚═══════════════════════════════════════════════════════════╝

Test 1: Simple ASCII text
  Original:  Hello, World!
  Encrypted: U2FsdGVkX1...
  Decrypted: Hello, World!
  Result:    ✓ PASS

[... more tests ...]

╔═══════════════════════════════════════════════════════════╗
║                        SUMMARY                            ║
╚═══════════════════════════════════════════════════════════╝

  Total tests: 5
  Passed:      ✓ 5
  Failed:      ✗ 0

  ✓ ALL TESTS PASSED!
  ✓ Encryption/Decryption is working correctly.
  ✓ Apps Script encryption will be compatible with browser decryption.
```

### 2. `browser-test.html` - Browser Test Page

Interactive browser test page for testing decryption in real browser environment.

**Run:**
```bash
npm run test:browser
```

Or open `tests/browser-test.html` directly in your browser.

**Features:**
- **Automated Tests**: Run predefined test cases in browser
- **Manual Test**: Paste encrypted data from Apps Script to verify compatibility

**Usage:**
1. Click "Run All Tests" to verify browser decryption
2. Copy encrypted data from Apps Script `testEncryption()` function
3. Paste into "Manual Test" section to verify Apps Script compatibility

## Testing Workflow

### Before Deploying

1. **Run Node.js tests:**
   ```bash
   npm test
   ```
   All tests must pass ✓

2. **Test in browser:**
   ```bash
   npm run test:browser
   ```
   Click "Run All Tests" - all must pass ✓

3. **Test Apps Script:**
   - Open Apps Script editor
   - Run `testEncryption()` function
   - Check logs - all tests must show "✓ PASS"

4. **Verify cross-compatibility:**
   - Copy encrypted base64 from Apps Script Test 4
   - Paste into browser-test.html "Manual Test"
   - Should decrypt successfully

### After Making Changes

If you modify encryption/decryption logic:

1. Update Apps Script template (`scripts/templates/apps-script.js`)
2. Update browser decryption (`js/decrypt.js`)
3. Update test simulation (`tests/encryption-test.js`)
4. Run all tests:
   ```bash
   npm test && npm run test:browser
   ```
5. Test in Apps Script with `testEncryption()`

## Common Issues

### Node.js Tests Fail

**Problem:** Tests show "✗ FAIL (mismatch)"

**Fix:**
- Check UTF-8 encoding logic matches Apps Script
- Verify key derivation uses same SHA-256 approach
- Ensure XOR encryption uses same byte operations

### Browser Tests Fail

**Problem:** Browser tests fail but Node.js tests pass

**Fix:**
- Check `TextEncoder/TextDecoder` usage
- Verify `crypto.subtle.digest` compatibility
- Test in multiple browsers (Chrome, Firefox, Safari)

### Apps Script ↔ Browser Incompatibility

**Problem:** Apps Script encryption produces data that browser can't decrypt

**Symptoms:**
- Browser shows garbage: "Ǭ3:=��-��L"
- Decrypted JSON invalid
- Wrong key derivation

**Fix:**
1. Verify Apps Script uses manual UTF-8 encoding:
   ```javascript
   // Apps Script line 461-470
   const keyMaterialUtf8 = [];
   for (let i = 0; i < keyMaterial.length; i++) {
     const code = keyMaterial.charCodeAt(i);
     if (code < 128) {
       keyMaterialUtf8.push(code);
     } else if (code < 2048) {
       // UTF-8 encoding...
   ```

2. Verify signed bytes are normalized to unsigned:
   ```javascript
   // Apps Script line 473
   const keyBytes = keyBytesSigned.map(function(b) { return b & 0xFF; });
   ```

3. Test with browser-test.html manual test

## Test Data

All tests use the same test data for consistency:

**Test 1:** ASCII text
- Plaintext: `"Hello, World!"`
- Key: `"test-key-32-characters-long!!"`

**Test 2:** JSON event config
- Plaintext: `{"eventId":"test-uuid-123",...}`
- Key: `"another-test-key-32-chars!!!"`

**Test 3:** Hebrew UTF-8
- Plaintext: `"שלום עולם! こんにちは世界"`
- Key: `"test-key-with-unicode-support"`

## Encryption Format

```
Base64(
  "Salted__" (8 bytes, literal string) +
  salt (8 random bytes) +
  encrypted_data (XOR of plaintext with key)
)
```

**Key Derivation:**
```
keyMaterial = passphrase + saltString
keyBytes = SHA256(UTF8(keyMaterial))
encrypted[i] = plaintext[i] XOR keyBytes[i % 32]
```

## Debugging

Enable verbose logging:

**Node.js:**
```javascript
// Already has detailed console.log output
```

**Browser:**
```javascript
// decrypt.js already has console.log statements
// Open browser console (F12) to see logs
```

**Apps Script:**
```javascript
// Check execution logs in Apps Script editor
Logger.log('...')
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run encryption tests
  run: npm test
```

Tests will fail CI if encryption compatibility is broken.
