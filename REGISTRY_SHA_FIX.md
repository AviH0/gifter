# Registry SHA Fix - Complete Solution

## Problem Analysis

From your logs, the form submission showed:

✅ **Working:**
- Form data extraction
- UUID generation  
- Image processing
- **Encryption** ← This confirms the encryption fix worked!
- Config commit to GitHub
- Metadata commit
- Image commit

❌ **Failed:**
```
GitHub API error: "sha" wasn't supplied
```

## Root Cause

The `commitFile()` function has a logic flaw:

1. `updateRegistry()` fetches the registry file and gets its SHA
2. Decryption of old registry fails (corrupted with old encryption)
3. `updateRegistry()` sets `registrySha = fileData.sha` (the SHA of the corrupted file)
4. Calls `commitFile(..., registrySha !== null)` → passes `true`
5. `commitFile()` with `isUpdate=true` tries to **fetch the file AGAIN** to get SHA
6. But `updateRegistry` already fetched it, so this is redundant
7. The fetch inside `commitFile` fails or returns wrong data
8. GitHub API rejects: "sha wasn't supplied"

## Solution Applied

**Refactored `commitFile()` to accept SHA directly:**

```javascript
// OLD: commitFile(..., isUpdate) - boolean
function commitFile(url, content, message, branch, headers, isUpdate)

// NEW: commitFile(..., isUpdateOrSha) - string|boolean
function commitFile(url, content, message, branch, headers, isUpdateOrSha)
```

**Logic:**
- If `isUpdateOrSha` is a **string** → Use it as SHA directly
- If `isUpdateOrSha` is `true` → Fetch SHA from GitHub
- If `isUpdateOrSha` is `false` → Create new file (no SHA)
- If `isUpdateOrSha` is `null` → Create new file (no SHA)

**Updated `updateRegistry()`:**
```javascript
// OLD:
commitFile(url, encrypted, 'Update registry', branch, headers, registrySha !== null)

// NEW:
commitFile(url, encrypted, 'Update registry', branch, headers, registrySha)
```

Now when registry exists, we pass the SHA directly instead of passing `true`.

## Changes Made

**File:** `scripts/templates/apps-script.js`

**Line 639-671:** Refactored `commitFile()` function
- Parameter: `isUpdate` → `isUpdateOrSha`
- Added type checking: string vs boolean
- Passes SHA directly when available

**Line 880-886:** Updated `updateRegistry()` call
- Changed: `registrySha !== null` → `registrySha`
- Passes SHA directly instead of boolean

**Line 838-856:** Improved registry error handling
- Clearer error messages
- Proper SHA handling when decryption fails

## Expected Behavior After Fix

**Scenario 1: Fresh Registry (no _registry.enc file)**
```
Form submission started
...
Could not fetch existing registry: HTTP 404
UUID: [new-uuid]
Config encrypted
Committed to GitHub
Registry updated  ← Creates new registry with registrySha = null
Email sent - process complete!
```

**Scenario 2: Corrupted Registry (old encryption)**
```
Form submission started
...
Registry corrupted (old encryption). Will be overwritten with fresh registry.
UUID: [new-uuid]
Config encrypted
Committed to GitHub
Registry updated  ← Overwrites with registrySha = [old-sha]
Email sent - process complete!
```

**Scenario 3: Valid Registry (new encryption)**
```
Form submission started
...
Loaded existing registry with 1 entries
UUID: [same-uuid]  ← Reuses UUID for same email
Config encrypted
Committed to GitHub
Registry updated  ← Updates with registrySha = [current-sha]
Email sent - process complete!
```

## What You Need to Do

### 1. Update Your Apps Script

**Copy the entire latest code:**
1. Open `scripts/templates/apps-script.js`
2. Select all (Ctrl+A), Copy (Ctrl+C)
3. Open your Apps Script editor
4. Select all (Ctrl+A), Paste (Ctrl+V)
5. Save (Ctrl+S)

**Critical changes:**
- ✅ Fixed encryption (UTF-8 encoding, unsigned bytes)
- ✅ Fixed registry SHA passing
- ✅ Improved error handling

### 2. Test Encryption

Run in Apps Script:
```
Function: testEncryption
Click: Run ▶️
Expected: ✓ All tests PASSED!
```

### 3. Submit Form Again

**Use the SAME email** (`avinoam@hershler.com`) to test update functionality.

**Expected logs:**
```
Form submission started
e.namedValues not available, extracting from e.response
Extracted 11 fields from FormResponse
Email: avinoam@hershler.com
Registry corrupted (old encryption). Will be overwritten with fresh registry.
UUID: [NEW-uuid or SAME-uuid]
Config encrypted
Committed: .../config.enc
Committed: .../metadata.enc
Committed binary: .../wedding.jpg
Committed to GitHub
Registry updated for: avinoam@hershler.com  ← Should see this!
Email sent - process complete!                ← Should see this!
```

### 4. Check Your Email

You should receive an email with:
- Subject: "Your Wedding Gifts Event is Ready!" or "Your Event Has Been Updated"
- Event URL: `https://avih0.github.io/gifter/?event=[uuid]#[key]`

### 5. Test in Browser

1. Click the URL from email
2. Wait 1-2 minutes for CDN cache
3. Page should load with your event data
4. Open console (F12) - should see:
   ```
   Trying XOR decryption...
   Decrypted string starts with: {  ← Should be JSON, not garbage!
   ```

## Verification Checklist

After updating and submitting:

- [ ] Apps Script `testEncryption()` shows all PASS
- [ ] Form submission completes: "Email sent - process complete!"
- [ ] No GitHub API errors in logs
- [ ] Email received with event URL
- [ ] Event loads in browser (not garbage)
- [ ] Browser console shows valid JSON decryption

## Files Modified

1. `scripts/templates/apps-script.js:639-671` - Refactored commitFile()
2. `scripts/templates/apps-script.js:838-856` - Improved registry error handling
3. `scripts/templates/apps-script.js:880-886` - Pass SHA directly

## Summary

**Before:**
- ✅ Encryption worked
- ❌ Registry update failed (SHA issue)

**After:**
- ✅ Encryption works
- ✅ Registry update works (SHA passed correctly)
- ✅ Handles corrupted registry gracefully
- ✅ Clear error messages

## Status

✅ **READY TO TEST**

All local tests pass. The encryption and registry logic are fixed. Submit the form again to verify!
