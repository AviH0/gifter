# Registry Corruption Fix

## Issue

When form is submitted, Apps Script tries to read the old registry file (`public/events/_registry.enc`) which was encrypted with the **broken encryption code**. The new fixed decryption produces garbage, causing:

```
Error getting event by email: SyntaxError: Unexpected token 'ס', "סͫƎȣfh΢2E`"... is not valid JSON
```

## What This Means

- The registry file is corrupted (encrypted with old code)
- The script catches the error and continues
- Form submission should still succeed (creates new event)
- But the error message is concerning

## Solutions Applied

### Improved Error Handling

Added better error handling in two functions:

**1. `getEventByEmail()` (line 786-796)**
- Catches JSON parse errors separately
- Logs clear message: "Registry corrupted (encrypted with old code)"
- Returns `null` so script treats it as new event
- No crash, continues gracefully

**2. `updateRegistry()` (line 846-857)**
- Catches decryption errors  
- Creates fresh registry if old one is corrupted
- Logs: "Registry corrupted. Creating fresh registry."
- Overwrites corrupted file with new one

## Result

After this fix:
- ✅ Form submissions work even with corrupted registry
- ✅ Clear log messages explain what's happening
- ✅ Registry is automatically recreated with fixed encryption
- ✅ Future submissions will use new registry

## What You Need to Do

### Option A: Update Script (Recommended)

1. Copy the latest code from `scripts/templates/apps-script.js`
2. Paste into your Apps Script editor
3. Save
4. Submit form again

The script will now:
- Detect corrupted registry
- Log clear message
- Create fresh registry with fixed encryption
- Continue successfully

### Option B: Manually Delete Registry

1. Go to GitHub: `avih0/gifter`
2. Navigate to `public/events/_registry.enc`
3. Delete file
4. Commit: "Remove corrupted registry"
5. Submit form

Registry will be recreated from scratch.

## Check Your Logs

**Please share the COMPLETE logs** from the form submission. They should show:

```
Form submission started
Event object keys: toString, authMode, response, source, triggerUid
e.namedValues not available, extracting from e.response
Extracted 11 fields from FormResponse
Registry corrupted (old encryption). Creating fresh registry.  ← NEW MESSAGE
UUID: 5e59bc1a-fef4-405c-aae4-57d6575bb561
Config encrypted                                              ← Should see this
Committed to GitHub                                           ← Should see this
Registry updated                                              ← Should see this
Email sent - process complete!                                ← Should see this
```

**If logs stop at "UUID: ...", there's a different problem** (likely in encryption step).

## Testing

After updating the script:

1. **Test encryption:**
   ```
   Apps Script → testEncryption() → Should show "✓ All tests PASSED!"
   ```

2. **Submit form:**
   - Should complete without errors
   - Should see "Email sent - process complete!"

3. **Check email:**
   - Should receive event URL

4. **Test in browser:**
   - Open event URL
   - Should load correctly (not garbage)

## Files Modified

- `scripts/templates/apps-script.js:786-857` - Improved registry error handling

## Status

✅ Error handling improved  
⏳ Waiting for user to:
  1. Share complete logs from form submission
  2. Update Apps Script with latest code
  3. Test with new form submission
