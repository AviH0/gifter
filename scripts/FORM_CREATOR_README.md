# Automated Google Form Creator

This script automatically creates a Google Form with all required Hebrew fields for the wedding gifts platform.

## Features

- ✅ Creates form with Hebrew field names
- ✅ Configures all required fields (email, titles, messages, images, gifts)
- ✅ Sets up file upload fields for images
- ✅ Creates a dedicated Google Drive folder for uploads
- ✅ Publishes the form automatically
- ✅ Outputs all necessary IDs and URLs
- ✅ Customizable number of gift fields

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
   - Click "Create"
   - Download the credentials JSON file
   - Save it as `credentials.json` in the `scripts/` directory

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

The first time you run the script:

1. **Authorization URL** - The script will display a URL
2. **Open URL** - Copy and paste it in your browser
3. **Sign In** - Sign in with your Google account
4. **Grant Permissions** - Allow the app to:
   - Create and manage forms
   - Create and manage Drive files
5. **Copy Code** - Google will display an authorization code
6. **Paste Code** - Return to terminal and paste the code
7. **Token Saved** - Credentials stored in `token.json` for future use

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
   Upload Folder: folder-id-here
   Number of Gifts: 5

📝 Next Steps:
   1. Open the edit URL above to review your form
   2. Copy the Apps Script code from scripts/templates/apps-script.js
   ...
```

### Saved File

Details are also saved to `form-info.json`:

```json
{
  "formId": "1a2b3c4d5e6f7g8h9i0j",
  "formUrl": "https://docs.google.com/forms/d/.../edit",
  "viewUrl": "https://docs.google.com/forms/d/e/.../viewform",
  "folderId": "folder-id-here"
}
```

## Next Steps After Form Creation

### 1. Review the Form

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

The script creates a form with these fields:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| אימייל | Email | ✅ Yes | User's email address |
| כותרת האירוע (אנגלית) | Text | ✅ Yes | Event title (English) |
| כותרת האירוע (עברית) | Text | ❌ No | Event title (Hebrew) |
| הודעה לאורחים (אנגלית) | Paragraph | ✅ Yes | Guest message (English) |
| הודעה לאורחים (עברית) | Paragraph | ❌ No | Guest message (Hebrew) |
| תמונת האירוע | File Upload | ❌ No | Main event image |
| רקע בהיר | File Upload | ❌ No | Light theme background |
| רקע כהה | File Upload | ❌ No | Dark theme background |
| מתנה 1 - שם (אנגלית) | Text | ✅ Yes | Gift 1 name (English) |
| מתנה 1 - שם (עברית) | Text | ❌ No | Gift 1 name (Hebrew) |
| מתנה 1 - קישור 1 | Text | ✅ Yes | Gift 1 URL 1 |
| מתנה 1 - קישור 2 | Text | ❌ No | Gift 1 URL 2 |
| מתנה 1 - לוגו | Text | ❌ No | Gift 1 logo URL |
| ... | ... | ... | *Repeats for each gift* |

**Note:** First gift is required, additional gifts are optional.

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
