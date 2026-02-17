# Encryption Fix Summary

## What Was Fixed

### Problem
XOR decryption in browser produced garbage output instead of valid JSON. The browser console showed:
```javascript
Decrypted string starts with: Ǭ3:=��-��L��6Ŵ����ne�N�{��
// Expected: {"eventId":"..."}
```

### Root Causes Identified

**1. Signed vs Unsigned Bytes**
- Apps Script `Utilities.computeDigest()` returns **signed bytes** (-128 to 127)
- JavaScript expects **unsigned bytes** (0-255)
- XOR operations on signed bytes produced wrong results

**2. Inconsistent String-to-Bytes Conversion**
- Apps Script `Utilities.newBlob(string).getBytes()` uses platform-specific encoding
- Browser `TextEncoder().encode()` uses UTF-8
- Different encodings = different hash outputs = wrong keys

**3. Header Format Issues**
- Apps Script `Utilities.newBlob('Salted__').getBytes()` might produce signed bytes
- Browser expected exact byte values [83, 97, 108, 116, 101, 100, 95, 95]

### Solution Applied

**Updated Apps Script (`scripts/templates/apps-script.js`):**

1. **Manual UTF-8 Encoding** (Line 461-478):
   ```javascript
   // Convert keyMaterial to UTF-8 bytes manually
   const keyMaterialUtf8 = [];
   for (let i = 0; i < keyMaterial.length; i++) {
     const code = keyMaterial.charCodeAt(i);
     if (code < 128) {
       keyMaterialUtf8.push(code);
     } else if (code < 2048) {
       keyMaterialUtf8.push(192 | (code >> 6));
       keyMaterialUtf8.push(128 | (code & 63));
     } else {
       // 3-byte UTF-8 encoding
     }
   }
   ```

2. **Normalize to Unsigned Bytes** (Line 483):
   ```javascript
   const keyBytes = keyBytesSigned.map(function(b) { return b & 0xFF; });
   ```

3. **Hardcoded Header Bytes** (Line 502):
   ```javascript
   const header = [83, 97, 108, 116, 101, 100, 95, 95]; // "Salted__"
   ```

4. **Updated Decryption** (Line 849-938):
   - Normalize base64-decoded bytes to unsigned
   - Manual UTF-8 encoding for key derivation
   - Manual UTF-8 decoding for output

### Files Modified

1. ✅ `scripts/templates/apps-script.js` - Fixed encryption/decryption
2. ✅ `docs/SETUP_GUIDE.md` - Added encryption testing section
3. ✅ `tests/encryption-test.js` - Created Node.js test suite
4. ✅ `tests/browser-test.html` - Created browser test page
5. ✅ `tests/README.md` - Test documentation
6. ✅ `tests/TESTING.md` - Quick reference
7. ✅ `package.json` - Added test scripts

## What You Need to Do

### 1. Update Your Apps Script (CRITICAL)

**Action Required:**
1. Open your Google Form's Apps Script editor
2. Select all code (Ctrl+A)
3. Copy the latest code from `scripts/templates/apps-script.js`
4. Paste, replacing all existing code
5. Save (Ctrl+S)

### 2. Test Encryption (BEFORE Creating New Events)

**Run in Apps Script:**
1. Select `testEncryption` from function dropdown
2. Click Run (▶️)
3. Check execution log (View → Logs)
4. Must see: **"✓ All tests PASSED!"**

**Expected Output:**
```
=== Testing Encryption/Decryption ===

Test 1: ASCII text
  Match: ✓ PASS

Test 2: JSON object
  Match: ✓ PASS

Test 3: Hebrew text (UTF-8)
  Match: ✓ PASS

Test 4: Browser compatibility check
  Header check: ✓ PASS

=== Summary ===
✓ All tests PASSED! Encryption is working correctly.
✓ You can now submit the form to create a new event.
```

**If any test shows "✗ FAIL":**
- Double-check you copied the latest code
- Refresh Apps Script editor and try again
- Check for syntax errors

### 3. Test Locally (Optional but Recommended)

```bash
# Clone your repo
cd wedding_gifts

# Run Node.js tests
npm test

# Should output:
# ✓ ALL TESTS PASSED!
# ✓ Encryption/Decryption is working correctly.
```

### 4. Create New Test Event

**Important:** Old events encrypted with broken code cannot be fixed. You must create a NEW event.

1. Submit your Google Form with a **NEW email** or **test email**
2. Check Apps Script execution logs - should see "Config encrypted"
3. Check your email for event URL
4. Open the URL in browser
5. Should load correctly (not garbage)

**If browser shows decryption error:**
- Check browser console (F12) for detailed logs
- Verify you updated Apps Script with latest code
- Run `testEncryption()` in Apps Script again

### 5. Verify Old vs New Events

**Old Event (UUID: `a3eb5856-...`):**
- Encrypted with broken code
- Will NOT decrypt correctly
- Browser shows garbage: "Ǭ3:=��"
- Cannot be fixed without re-encrypting

**New Event (after updating script):**
- Encrypted with fixed code
- Should decrypt correctly
- Browser shows valid JSON
- Event page loads properly

### 6. Clean Up (Optional)

If you have old test events that don't work:
1. Go to your GitHub repo
2. Delete old event folders in `public/events/`
3. Commit and push

## Testing Checklist

Before considering this DONE:

- [ ] Updated Apps Script with latest code
- [ ] Ran `testEncryption()` in Apps Script - all PASS
- [ ] Ran `npm test` locally - all PASS
- [ ] Created NEW test event via form submission
- [ ] NEW event loads correctly in browser
- [ ] Verified browser console shows no decryption errors
- [ ] Event data displays correctly (titles, gifts, etc.)

## Technical Details

### Encryption Format
```
Base64(
  [83,97,108,116,101,100,95,95] +  // "Salted__" (8 bytes)
  [8 random salt bytes] +
  [XOR encrypted data]
)
```

### Key Derivation
```
keyMaterial = passphrase + saltString
keyBytes = SHA256(UTF8(keyMaterial))  // ← UTF-8 encoding critical!
encrypted[i] = plaintext[i] XOR keyBytes[i % 32]
```

### What Changed
- **Before:** `Utilities.newBlob(string).getBytes()` → Platform-specific encoding
- **After:** Manual UTF-8 encoding → Consistent across Apps Script & browser

## Need Help?

### Symptoms & Solutions

**"✗ FAIL" in Apps Script testEncryption():**
- Copy latest code from `scripts/templates/apps-script.js`
- Make sure you replaced ALL code, not just parts
- Save and try again

**Browser shows garbage after updating:**
- Old event files still exist - create NEW event
- Apps Script not updated - verify in editor
- CDN cache - wait 2-5 minutes and refresh

**Form submission succeeds but browser fails:**
- Check browser console for detailed error
- Verify event file exists in GitHub `public/events/[uuid]/config.enc`
- Test with `tests/browser-test.html` manual decrypt

**Tests pass but real events fail:**
- Possible CDN caching issue - wait 5 minutes
- Check GitHub commits - ensure files uploaded
- Try GitHub raw URL instead of CDN

## Success Indicators

✅ Apps Script `testEncryption()` → All PASS  
✅ Form submission → No errors in logs  
✅ Email received with event URL  
✅ Browser loads event correctly  
✅ Event data displays (title, gifts)  
✅ No console errors in browser  

## Commits Summary

1. `4a77fe8` - Added decryption fallbacks (before this fix)
2. `[NEW]` - Fixed encryption: UTF-8 encoding & unsigned bytes
3. `[NEW]` - Added comprehensive test suite
4. `[NEW]` - Updated documentation with testing instructions

---

**Status:** ✅ **READY TO TEST**  
**Next Step:** Update your Apps Script and create a new test event
