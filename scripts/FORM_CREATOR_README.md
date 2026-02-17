# Automated Google Form Creator

This script automatically creates a Google Form with all required Hebrew fields for the wedding gifts platform.

## Features

- ✅ Creates form with Hebrew field names
- ✅ Configures all required fields (email, titles, messages, gifts)
- ✅ Publishes the form automatically
- ✅ Outputs all necessary IDs and URLs
- ✅ Customizable number of gift fields
- ⚠️ **Note:** File upload fields must be added manually (API limitation)

## API Limitation: File Uploads

**Important:** The Google Forms API does not support creating file upload questions programmatically. After running this script, you must manually add 3 file upload fields:

1. **תמונת האירוע** (Wedding Image)
2. **רקע בהיר** (Background Light)
3. **רקע כהה** (Background Dark)

The script will provide detailed instructions after form creation. This takes only 2-3 minutes.

## Prerequisites

### 1. Google Cloud Project Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your project ID

2. **Enable Required APIs:**
   - Navigate to "APIs & Services" → "Library"
   - Search and enable:
     - **Google Forms API**
     - **Google Drive API**

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Desktop app**
   - Name it: "Wedding Gifts Form Creator"
   - **IMPORTANT:** After creation, click "DOWNLOAD JSON"
   - **Configure redirect URI:** The downloaded JSON should have `redirect_uris` including:
     - `http://localhost:3000/oauth2callback`
     - If not, click "Edit" on your OAuth client and add it manually
   - Save the downloaded file as `credentials.json` in the `scripts/` directory

### 2. Local Setup

```bash
# Navigate to scripts directory
cd scripts/

# Install dependencies
npm install

# Verify credentials.json exists
ls credentials.json
```

## Usage

### Basic Usage

```bash
# Create form with default settings (5 gifts)
node form-creator.js
```

### Custom Options

```bash
# Create form with 10 gift fields
node form-creator.js --gifts=10

# Create form with custom title
node form-creator.js --title="טופס רישום אירועים"

# Combine options
node form-creator.js --gifts=8 --title="My Custom Form"
```

### Using npm scripts

```bash
npm run create-form

# With arguments
npm run create-form -- --gifts=10
```

## First Run - Authentication Flow

The first time you run the script, it will automatically handle OAuth:

1. **Local Server Starts** - Script starts a temporary server on `http://localhost:3000`
2. **Browser Opens** - Your default browser opens automatically to Google's authorization page
3. **Sign In** - Sign in with your Google account (the one that owns the Cloud project)
4. **Grant Permissions** - Click "Allow" to grant the app permissions to:
   - Create and manage forms
   - Create and manage Drive files
5. **Automatic Redirect** - Google redirects to `http://localhost:3000/oauth2callback`
6. **Code Captured** - The local server automatically captures the authorization code
7. **Success Page** - Browser shows success message: "Authorization Successful!"
8. **Token Saved** - Credentials stored in `token.json` for future use
9. **Script Continues** - Form creation begins automatically

**No manual code copying needed!** The entire flow is automatic.

### If Browser Doesn't Open

If your browser doesn't open automatically:
1. Copy the URL from the terminal
2. Paste it in your browser
3. Complete the authorization
4. The redirect will still work automatically

### Troubleshooting "Unable to Connect"

If you see "Unable to connect" after authorization:

**Cause:** Your OAuth client doesn't have `http://localhost:3000/oauth2callback` as a redirect URI.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/oauth2callback
   ```
4. Click "Save"
5. Delete `token.json` if it exists
6. Run the script again

**Important:** The `token.json` file contains your access token. Keep it secure and **never commit it to git**.

## Output

After successful execution, you'll receive:

### Console Output

```
✅ FORM CREATED SUCCESSFULLY!
================================================================================

📋 Form Details:
   Form ID: 1a2b3c4d5e6f7g8h9i0j
   Edit URL: https://docs.google.com/forms/d/1a2b3c4d5e6f7g8h9i0j/edit
   Public URL: https://docs.google.com/forms/d/e/1a2b3c4d5e6f7g8h9i0j/viewform
   Number of Gifts: 5

⚠️  IMPORTANT: Manual Steps Required
================================================================================

📸 Add File Upload Fields (API Limitation):
   The Google Forms API does not support creating file upload fields.
   You must add these 3 fields MANUALLY in the form editor:

   1. תמונת האירוע (Wedding Image)
      - Type: File upload
      - Description: "תמונה ראשית לאירוע (מומלץ: 800x600px, עד 10MB)"
      - Settings: Allow only images, max 1 file, max 10MB
      - Optional (not required)

   2. רקע בהיר (Background Light)
      - Type: File upload
      ...

   3. רקע כהה (Background Dark)
      - Type: File upload
      ...
```

### Saved File

Details are also saved to `form-info.json`:

```json
{
  "formId": "1a2b3c4d5e6f7g8h9i0j",
  "formUrl": "https://docs.google.com/forms/d/.../edit",
  "viewUrl": "https://docs.google.com/forms/d/e/.../viewform"
}
```

## Next Steps After Form Creation

### 1. Add File Upload Fields (Required - 2-3 minutes)

Open the form edit URL and add these 3 fields manually:

**Field 1: תמונת האירוע**
- Click the "+" button to add a new question
- Change type to "File upload"
- Title: `תמונת האירוע`
- Description: `תמונה ראשית לאירוע (מומלץ: 800x600 פיקסלים, עד 10MB)`
- Click "File upload settings"
  - Allow: "Specific file types" → Images only
  - Maximum number of files: 1
  - Maximum file size: 10 MB
- Make it optional (toggle "Required" off)
- Position: After the message fields, before gift fields

**Field 2: רקע בהיר**
- Add another question
- Type: File upload
- Title: `רקע בהיר`
- Description: `תמונת רקע למצב בהיר (אופקית, עד 10MB)`
- Same upload settings as above
- Optional

**Field 3: רקע כהה**
- Add another question
- Type: File upload
- Title: `רקע כהה`
- Description: `תמונת רקע למצב כהה (אופקית, עד 10MB)`
- Same upload settings as above
- Optional

**💡 Pro Tip:** These field names MUST match exactly for the Apps Script to work.

### 2. Review the Form

Open the edit URL and verify all fields are correct:
- ✅ Email field
- ✅ Event titles (English & Hebrew)
- ✅ Messages (English & Hebrew)
- ✅ Image upload fields
- ✅ Gift fields (name, URLs, logo)

### 2. Set Up Apps Script

1. **Open Script Editor:**
   - In form editor: Three dots (⋮) → "Script editor"

2. **Paste Apps Script Code:**
   - Copy from `scripts/templates/apps-script.js`
   - Paste into Script editor (replace any existing code)

3. **Configure Constants** (at top of script):
   ```javascript
   const GITHUB_OWNER = 'your-github-username';
   const GITHUB_REPO = 'wedding_gifts';
   const GITHUB_TOKEN = 'ghp_your_personal_access_token';
   const SENDER_EMAIL = 'your-email@gmail.com';
   ```

4. **Save Script:** Ctrl+S or File → Save

### 3. Set Up Form Trigger

1. **Open Triggers:**
   - In Apps Script editor: Click clock icon (⏰) on left sidebar

2. **Add Trigger:**
   - Click "+ Add Trigger" (bottom right)
   - Choose function: **onFormSubmit**
   - Event source: **From form**
   - Event type: **On form submit**
   - Click "Save"

3. **Grant Permissions:**
   - You'll be asked to authorize the script
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

### 4. Test the Form

1. **Submit a test response:**
   - Use the public URL
   - Fill in all required fields
   - Submit

2. **Check execution:**
   - In Apps Script: View → "Executions"
   - You should see the script run
   - Check for any errors

3. **Verify email:**
   - Check your email for the event URL
   - Should arrive within 1-2 minutes

4. **Check GitHub:**
   - Go to your repository
   - Navigate to `events/` folder
   - You should see a new UUID folder with `config.enc`

## Created Form Structure

The script creates a form with these fields (file uploads must be added manually):

### Basic Information

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| אימייל | Email | ✅ Yes | User's email address |
| כותרת האירוע (אנגלית) | Text | ✅ Yes | Event title (English) |
| כותרת האירוע (עברית) | Text | ❌ No | Event title (Hebrew) |
| הודעה לאורחים (אנגלית) | Paragraph | ✅ Yes | Guest message (English) |
| הודעה לאורחים (עברית) | Paragraph | ❌ No | Guest message (Hebrew) |
| **תמונת האירוע** | **File Upload** | **❌ No** | **⚠️ Add manually** |
| **רקע בהיר** | **File Upload** | **❌ No** | **⚠️ Add manually** |
| **רקע כהה** | **File Upload** | **❌ No** | **⚠️ Add manually** |

### Gift Options (Organized in Sections with Page Breaks)

**First Gift (Required):**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| שם אמצעי התשלום (אנגלית) | Text | ✅ Yes | Payment method name (English) |
| שם אמצעי התשלום (עברית) | Text | ❌ No | Payment method name (Hebrew) |
| קישורי תשלום | Paragraph | ✅ Yes | Payment URLs (one per line) |
| לוגו אמצעי התשלום | Text | ❌ No | Payment method logo URL |
| להוסיף אמצעי תשלום נוסף? | Radio | ✅ Yes | Add another payment method? |

**Additional Gifts (Optional, numbered 2-N):**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| מתנה X - שם (אנגלית) | Text | ❌ No | Gift X name (English) |
| מתנה X - שם (עברית) | Text | ❌ No | Gift X name (Hebrew) |
| מתנה X - קישורים | Paragraph | ❌ No | Gift X URLs (one per line) |
| מתנה X - לוגו | Text | ❌ No | Gift X logo URL |
| להוסיף אמצעי תשלום נוסף? | Radio | ✅ Yes | Add another? (except on last gift) |

**Key Improvements:**
- ✅ Each gift is in its own section with page breaks for better UX
- ✅ URLs combined into single paragraph field (one URL per line)
- ✅ "Add another?" navigation questions with **working conditional logic**
  - "Yes" → Goes to next gift section
  - "No - I'm done" → Submits the form immediately
- ✅ Cleaner, more streamlined field names

## Troubleshooting

### Error: "credentials.json not found"

**Solution:** Download OAuth 2.0 credentials from Google Cloud Console and save as `scripts/credentials.json`

### Error: "Forms API has not been used"

**Solution:** 
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Forms API
3. Enable the Google Drive API
4. Wait 1-2 minutes and try again

### Error: "Access denied" or "Permission denied"

**Solution:**
1. Delete `token.json`
2. Run the script again
3. Complete the authorization flow
4. Make sure you're using the correct Google account

### Error: "Invalid authentication credentials"

**Solution:**
1. Verify your `credentials.json` is valid
2. Make sure it's for a Desktop application
3. Check that the client ID and secret are correct
4. Re-download from Google Cloud Console if needed

### Script runs but form fields are wrong

**Solution:**
1. Delete the created form
2. Check the field names match `scripts/templates/apps-script.js`
3. Run the script again
4. If issues persist, manually adjust field names in the form editor

## Advanced Configuration

### Modifying Field Names

Edit the `buildFormStructure()` function in `form-creator.js`:

```javascript
requests.push({
  createItem: {
    item: {
      title: 'Your Custom Field Name',
      description: 'Your custom description',
      questionItem: {
        question: {
          required: true,
          textQuestion: { paragraph: false }
        }
      }
    },
    location: { index: currentIndex++ }
  }
});
```

### Changing File Upload Limits

Modify the `fileUploadQuestion` section:

```javascript
fileUploadQuestion: {
  folderId: 'root',
  types: ['IMAGE'],      // or ['VIDEO'], ['PDF'], etc.
  maxFiles: 1,          // max files per submission
  maxFileSize: 10485760 // 10MB in bytes
}
```

### Adding New Field Types

Google Forms API supports:
- `textQuestion` - Short or paragraph text
- `choiceQuestion` - Multiple choice or checkboxes
- `scaleQuestion` - Linear scale
- `dateQuestion` - Date or time
- `timeQuestion` - Duration
- `fileUploadQuestion` - File upload
- `rowQuestion` - Grid questions

See [Forms API Reference](https://developers.google.com/forms/api/reference/rest/v1/forms) for details.

## Security Notes

### Sensitive Files (DO NOT COMMIT)

Add to `.gitignore`:
```
scripts/credentials.json
scripts/token.json
scripts/form-info.json
```

### OAuth Scopes

This script requires:
- `https://www.googleapis.com/auth/forms.body` - Create/modify forms
- `https://www.googleapis.com/auth/drive` - Create Drive folders
- `https://www.googleapis.com/auth/drive.file` - Manage uploaded files

### Best Practices

1. **Use a dedicated Google account** for form management
2. **Limit OAuth app** to specific users if possible
3. **Rotate credentials** periodically
4. **Monitor API usage** in Google Cloud Console
5. **Keep token.json secure** - contains access credentials

## Alternative: Manual Form Creation

If you prefer not to use automation, follow the manual instructions in `docs/SETUP_GUIDE.md` to create the form by hand.

## Support

For issues with:
- **This script:** Open an issue in the repository
- **Google Forms API:** See [Google Forms API Troubleshooting](https://developers.google.com/workspace/forms/api/troubleshoot-authentication-authorization)
- **OAuth setup:** See [Configure OAuth Consent](https://developers.google.com/workspace/guides/configure-oauth-consent)

## See Also

- [SETUP_GUIDE.md](../docs/SETUP_GUIDE.md) - Complete deployment guide
- [apps-script.js](./templates/apps-script.js) - Apps Script template
- [Google Forms API Documentation](https://developers.google.com/forms/api)
