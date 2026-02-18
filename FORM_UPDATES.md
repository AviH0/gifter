# Google Forms Update Behavior

## How Event Updates Work

The Apps Script is **already configured** to keep the same UUID and encryption key when updating an event!

### System Logic

1. **User submits form** → Apps Script runs `onFormSubmit()`
2. **Extract email** from form response
3. **Check registry** → `getEventByEmail(email)`
   - If email found → Reuse existing UUID + key (UPDATE mode)
   - If email not found → Generate new UUID + key (CREATE mode)
4. **Process form data** with the UUID/key
5. **Commit to GitHub** (creates or updates files)
6. **Update registry** with email → UUID + key mapping
7. **Send email** with event URL

### When Users Edit Form Responses

Google Forms provides an "Edit your response" link. When clicked:
- Form is pre-filled with previous answers
- User can modify any fields
- On submit, **same email** is used
- Apps Script detects existing event
- **Same UUID and URL** are maintained ✅

### Important Notes

#### ✅ **URL Stays the Same** When:
- User submits with the **same email address**
- Registry file exists and is readable
- Apps Script is updated with the latest code

#### ❌ **New URL Created** When:
- User submits with a **different email address** (intended behavior)
- Registry file doesn't exist (first submission after setup)
- Registry is corrupted (old encryption format)
- Apps Script encounters an error before updating registry

### Testing Update Behavior

To verify updates work correctly:

1. **First Submission:**
   ```
   Email: test@example.com
   Result: New UUID (e.g., abc-123)
   URL: https://...?event=abc-123#key
   ```

2. **Check Apps Script Logs:**
   ```
   Email: test@example.com
   UUID: abc-123
   Is update: no          ← First submission
   ```

3. **Second Submission (same email):**
   ```
   Email: test@example.com
   Result: Same UUID (abc-123)
   URL: https://...?event=abc-123#key ← SAME URL!
   ```

4. **Check Apps Script Logs:**
   ```
   Email: test@example.com
   UUID: abc-123
   Is update: yes         ← Reusing existing UUID!
   ```

### Registry Structure

The registry is stored at: `public/events/_registry.enc`

Format (encrypted with MASTER_KEY):
```json
{
  "test@example.com": {
    "uuid": "abc-123-def-456",
    "key": "encryptionKey123",
    "created": "2026-01-01T00:00:00Z",
    "updated": "2026-01-02T00:00:00Z"
  },
  "another@example.com": {
    "uuid": "xyz-789-ghi-012",
    "key": "anotherKey456",
    "created": "2026-01-03T00:00:00Z"
  }
}
```

### Troubleshooting

**Problem:** User edits response but gets a new URL

**Possible Causes:**
1. ✅ Check Apps Script logs for "Is update: yes"
   - If "no", registry lookup failed
2. ✅ Verify registry file exists: `public/events/_registry.enc`
3. ✅ Check if MASTER_KEY is set in Script Properties
4. ✅ Ensure user used the **exact same email** (case-sensitive!)
5. ✅ Look for errors in Apps Script execution logs

**Solution:**
- Review execution logs to identify where it failed
- If registry is corrupted, delete `_registry.enc` and it will rebuild
- If MASTER_KEY is missing, set it in Script Properties

### Current System Status

✅ **Update logic implemented** (lines 100-106 in apps-script.js)  
✅ **Registry lookup working** (`getEventByEmail` function)  
✅ **SHA fetching fixed** (includes branch parameter)  
✅ **Encryption fixed** (UTF-8 encoding, proper base64)  
✅ **Image encryption working** (stored as base64)  

**Next submission with your email will UPDATE the existing event!**

---

## Summary

**The system ALREADY maintains the same URL when users edit their form responses.**

When a user clicks "Edit response" in Google Forms and resubmits:
- ✅ Same UUID
- ✅ Same encryption key  
- ✅ Same URL
- ✅ Files updated in place
- ✅ Email sent with same link

**No additional changes needed!** The system is working as designed.
