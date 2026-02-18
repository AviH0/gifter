# Google Forms Update Behavior

## How Event Updates Work

The Apps Script is **configured to keep the same UUID and encryption key when updating an event** using FormResponse ID tracking!

### System Logic

1. **User submits form** → Apps Script runs `onFormSubmit()`
2. **Extract FormResponse ID** from form response (`e.response.getId()`)
3. **Extract email** from form response
4. **Check registry** → `getEventByResponseId(responseId)`
   - If responseId found → Reuse existing UUID + key (UPDATE mode)
   - If responseId not found → Generate new UUID + key (CREATE mode)
5. **Process form data** with the UUID/key
6. **Commit to GitHub** (creates or updates files)
7. **Update registry** with responseId → {UUID, key, email} mapping
8. **Send email** with event URL

### Why FormResponse ID Instead of Email?

**Previous system (email-based):**
- ❌ User changes email → creates new event (wrong behavior)
- ❌ Email is not stable across edits

**New system (responseId-based):**
- ✅ FormResponse ID stays the same when user clicks "Edit response"
- ✅ User can change email without creating duplicate event
- ✅ More reliable tracking of form edits

### When Users Edit Form Responses

Google Forms provides an "Edit your response" link. When clicked:
- Form is pre-filled with previous answers
- User can modify **any fields including email**
- **FormResponse ID remains the same** (this is the key!)
- Apps Script detects existing event by responseId
- **Same UUID and URL** are maintained ✅

### Important Notes

#### ✅ **URL Stays the Same** When:
- User clicks "Edit response" link from Google Forms
- FormResponse ID is successfully retrieved
- Registry file exists and is readable
- Apps Script is updated with the latest code

#### ❌ **New URL Created** When:
- User submits a **brand new form response** (not an edit)
- FormResponse ID cannot be retrieved (fallback behavior)
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
   FormResponse ID: 2_ABaOnud...
   Email: test@example.com
   UUID: abc-123
   Is update: no          ← First submission
   ```

3. **Edit the Same Response (click "Edit response" link):**
   - Change any fields (including email if desired)
   - Submit the form again

4. **Check Apps Script Logs:**
   ```
   FormResponse ID: 2_ABaOnud...  ← SAME ID!
   Email: updated@example.com     ← Can be different now!
   UUID: abc-123                  ← SAME UUID!
   Is update: yes                 ← Reusing existing UUID!
   ```

5. **Result:**
   ```
   Same UUID: abc-123
   Same URL: https://...?event=abc-123#key ← SAME URL!
   ```

### Registry Structure

The registry is stored at: `public/events/_registry.enc`

**NEW Format (encrypted with MASTER_KEY):**
```json
{
  "2_ABaOnudA...responseId1": {
    "uuid": "abc-123-def-456",
    "key": "encryptionKey123",
    "email": "test@example.com",
    "created": "2026-01-01T00:00:00Z",
    "updated": "2026-01-02T00:00:00Z"
  },
  "2_ABaOnudB...responseId2": {
    "uuid": "xyz-789-ghi-012",
    "key": "anotherKey456",
    "email": "another@example.com",
    "created": "2026-01-03T00:00:00Z"
  }
}
```

**Key changes from old format:**
- **Primary key:** FormResponse ID (not email)
- **Email stored in value** (not as key)
- **Benefit:** Users can change email without breaking updates

### Troubleshooting

**Problem:** User edits response but gets a new URL

**Possible Causes:**
1. ✅ Check Apps Script logs for "FormResponse ID: ..." 
   - If missing, form trigger may not be set up correctly
2. ✅ Check Apps Script logs for "Is update: yes"
   - If "no", registry lookup failed
3. ✅ Verify registry file exists: `public/events/_registry.enc`
4. ✅ Check if MASTER_KEY is set in Script Properties
5. ✅ Ensure user clicked **"Edit response"** link (not submitting new form)
6. ✅ Look for errors in Apps Script execution logs

**Solution:**
- Review execution logs to identify where it failed
- If registry is corrupted or uses old format (email-based), delete `_registry.enc` and it will rebuild with new format
- If MASTER_KEY is missing, set it in Script Properties
- Verify the form trigger is set as "On form submit" (not "On open")

### Migration from Email-Based Registry

If you have an existing registry using the old email-based format:

**Option 1: Clean slate (recommended)**
- Delete `public/events/_registry.enc` from GitHub
- Next form submission will create new registry with responseId format
- Previous events will still work (configs exist), just won't be editable

**Option 2: Keep both formats temporarily**
- Current code handles registry corruption gracefully
- Old entries won't be found, creating new events on edit
- Gradually migrate as users resubmit forms

### Current System Status

✅ **ResponseId tracking implemented** (lines 88-112 in apps-script.js)  
✅ **Registry lookup by responseId** (`getEventByResponseId` function)  
✅ **Email changes supported** (can change email during edit without breaking updates)  
✅ **SHA fetching fixed** (includes branch parameter)  
✅ **Encryption fixed** (UTF-8 encoding, proper base64)  
✅ **Image encryption working** (stored as base64)  

**Next form edit will UPDATE the existing event using FormResponse ID!**

---

## Summary

**The system maintains the same URL when users edit their form responses using FormResponse ID tracking.**

When a user clicks "Edit response" in Google Forms and resubmits:
- ✅ Same FormResponse ID (stable across edits)
- ✅ Same UUID
- ✅ Same encryption key  
- ✅ Same URL
- ✅ Files updated in place
- ✅ Email sent with same link
- ✅ **User can change email** without breaking updates

**Key Advantage:** FormResponse ID is more reliable than email for tracking form edits, and allows users to update their email address if needed.
