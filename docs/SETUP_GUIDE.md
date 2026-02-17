# Setup Guide: Deploy Your Own Multi-Event Platform

This guide will walk you through deploying your own instance of the Wedding Gifts platform, allowing multiple users to create their own private events via Google Forms.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
  - [1. Fork and Configure GitHub Repository](#1-fork-and-configure-github-repository)
  - [2. Create GitHub Personal Access Token](#2-create-github-personal-access-token)
  - [3. Configure GitHub Pages](#3-configure-github-pages)
  - [4. Create Google Form](#4-create-google-form)
  - [5. Set Up Apps Script](#5-set-up-apps-script)
  - [6. Configure Script Properties](#6-configure-script-properties)
  - [7. Add Form Submit Trigger](#7-add-form-submit-trigger)
  - [8. Test Your Setup](#8-test-your-setup)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Maintenance](#maintenance)

## Overview

The platform uses a serverless architecture:
- **Google Forms** - Event creation interface for non-technical users
- **Apps Script** - Processes form submissions, encrypts data, commits to GitHub
- **GitHub** - Stores encrypted event configurations
- **jsDelivr CDN** - Delivers content globally with edge caching
- **GitHub Pages** - Hosts the static frontend application

```
Google Form → Apps Script → GitHub (encrypted) → jsDelivr CDN → Browser decrypts
```

## Prerequisites

Before you begin, you'll need:

1. **GitHub Account** (free tier is sufficient)
   - Sign up at [github.com](https://github.com)

2. **Google Account** (free Gmail account)
   - For creating Google Forms and using Apps Script

3. **Basic Technical Knowledge**
   - Ability to copy/paste code
   - Comfortable navigating web interfaces
   - Basic understanding of Git (helpful but not required)

4. **Time Required**: ~30-45 minutes for initial setup

## Step-by-Step Setup

### 1. Fork and Configure GitHub Repository

**1.1. Fork the Repository**

1. Go to the repository page on GitHub
2. Click the "Fork" button in the top-right corner
3. Select your account as the destination
4. Wait for the fork to complete

**1.2. Switch to the Correct Branch**

1. In your forked repository, click the branch dropdown (shows "main" or "master")
2. Select `multi-event-encrypted` branch
3. This branch contains the multi-event platform code

**1.3. Verify Repository Structure**

Your repository should have this structure:
```
wedding_gifts/
├── index.html               # Frontend files served by GitHub Pages
├── en/                      # English version
├── js/                      # JavaScript files
├── css/                     # Stylesheets
├── assets/                  # Images and static assets
├── events/                  # Encrypted event data
├── scripts/                 # Setup scripts and templates
├── docs/                    # Documentation
└── README.md
```

### 2. Create GitHub Personal Access Token

The Apps Script needs permission to commit encrypted event data to your repository.

**2.1. Generate Token**

1. Go to GitHub Settings: Click your profile picture → Settings
2. Navigate to: Developer settings → Personal access tokens → Tokens (classic)
3. Click "Generate new token" → "Generate new token (classic)"
4. Configure the token:
   - **Note**: "Wedding Gifts Platform - Apps Script"
   - **Expiration**: Choose expiration (90 days recommended, can be renewed)
   - **Scopes**: Check **only** `repo` (Full control of private repositories)
5. Click "Generate token"
6. **CRITICAL**: Copy the token immediately and save it securely
   - You won't be able to see it again!
   - Store it in a password manager or secure note

**Example token format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**2.2. Security Notes**

- Never commit this token to your repository
- Never share it publicly
- If compromised, immediately revoke it and create a new one
- Set reminders to renew before expiration

### 3. Configure GitHub Pages

**3.1. Enable GitHub Pages**

1. In your repository, go to Settings → Pages (left sidebar)
2. Under "Source", select:
   - **Branch**: `multi-event-encrypted`
   - **Folder**: `/ (root)`
3. Click "Save"
4. Wait 1-2 minutes for deployment

**3.2. Verify Your Site**

1. GitHub will show your site URL: `https://[your-username].github.io/wedding_gifts/`
2. Click the URL to visit your site
3. You should see the demo wedding gifts page (default content)
4. **Save this URL** - you'll need it for the Apps Script configuration

**3.3. Test Demo Mode**

The demo should work immediately without any URL parameters. This confirms your frontend is properly deployed.

### 4. Create Google Form

The form is the interface where event creators will submit their event details.

**You have two options:**

**Option A: Automated Creation (Recommended)** - Use the automated form creator script
**Option B: Manual Creation** - Create the form manually through Google Forms UI

---

#### Option A: Automated Form Creation (Recommended)

Use the automated form creator script to generate the form with all fields automatically.

**Prerequisites:**
- Node.js 14+ installed
- Google Cloud project with Forms API and Drive API enabled
- OAuth 2.0 credentials (see `scripts/FORM_CREATOR_README.md` for detailed setup)

**Steps:**

1. **Set up Google Cloud credentials:**
   ```bash
   # Follow the guide in scripts/FORM_CREATOR_README.md
   # Download credentials.json to scripts/ directory
   ```

2. **Install dependencies:**
   ```bash
   cd scripts/
   npm install
   ```

3. **Run the form creator:**
   ```bash
   # Basic: Create form with 5 gifts
   node form-creator.js

   # Advanced: Customize number of gifts
   node form-creator.js --gifts=10
   ```

4. **Complete OAuth flow** (first time only):
   - Script displays authorization URL
   - Open URL in browser and sign in
   - Grant permissions
   - Copy authorization code
   - Paste code in terminal

5. **Form created!** - The script outputs:
   - Form ID
   - Edit URL (for you to review/modify)
   - Public URL (for users to submit)
   - Drive folder ID (for uploads)

6. **Continue to Step 5** to set up the Apps Script

**See `scripts/FORM_CREATOR_README.md` for detailed documentation.**

---

#### Option B: Manual Form Creation

**4.1. Create Form**

1. Go to [forms.google.com](https://forms.google.com)
2. Click "+ Blank" to create a new form
3. Title your form: "Create Your Event - Wedding Gifts Platform"

**4.2. Add Form Fields**

Add these fields in order (exact Hebrew names are important for the script to work):

**מידע בסיסי (Basic Information):**
1. **אימייל** (Email field)
   - Required (חובה)
   - Description: "כתובת האימייל שלך (לעדכונים)"

**פרטי האירוע (Event Details):**
2. **כותרת האירוע (אנגלית)** (Short answer)
   - Required (חובה)
   - Description: "כותרת האירוע באנגלית (לדוגמה: 'Sarah & John's Wedding')"

3. **כותרת האירוע (עברית)** (Short answer)
   - Optional (אופציונלי)
   - Description: "כותרת האירוע בעברית (לדוגמה: 'החתונה של שרה וג'ון')"

4. **הודעה לאורחים (אנגלית)** (Short answer)
   - Required (חובה)
   - Description: "הודעה לאורחים באנגלית (לדוגמה: 'Send us a gift!')"

5. **הודעה לאורחים (עברית)** (Short answer)
   - Optional (אופציונלי)
   - Description: "הודעה לאורחים בעברית (לדוגמה: 'שלחו לנו מתנה!')"

**תמונות (Images - all optional):**
6. **תמונת האירוע** (File upload)
   - Optional (אופציונלי)
   - Description: "תמונה ראשית של האירוע (מומלץ: 800x600px, עד 10MB)"
   - Settings: Allow only image files

7. **רקע בהיר** (File upload)
   - Optional (אופציונלי)
   - Description: "תמונת רקע למצב בהיר (אופקית, עד 10MB)"

8. **רקע כהה** (File upload)
   - Optional (אופציונלי)
   - Description: "תמונת רקע למצב כהה (אופקית, עד 10MB)"

**אפשרויות מתנה (Gift Options):**

**IMPORTANT:** Use sections and page breaks to organize gift fields for better UX.

9. **Add Section/Page Break** (click "Add section" button)
   - Title: "אפשרויות מתנות (Gift Options)"
   - Description: "הוסיפו לפחות אמצעי תשלום אחד"

**First Gift (Required - uses simplified field names):**

10. **שם אמצעי התשלום (אנגלית)** (Short answer)
    - Required (חובה)
    - Description: "שם אמצעי התשלום באנגלית (לדוגמה: 'Bit', 'PayBox', 'Venmo')"

11. **שם אמצעי התשלום (עברית)** (Short answer)
    - Optional (אופציונלי)
    - Description: "שם אמצעי התשלום בעברית (לדוגמה: 'ביט', 'פייבוקס')"

12. **קישורי תשלום** (Paragraph text)
    - Required (חובה)
    - Description: "הוסיפו קישור אחד או יותר (קישור אחד בכל שורה)\n\nלדוגמה:\nhttps://bit.co.il/app/?uid=xxx\nhttps://payboxapp.page.link/xxx"

13. **לוגו אמצעי התשלום** (Short answer)
    - Optional (אופציונלי)
    - Description: "קישור ללוגו (PNG/JPG/SVG) - לדוגמה: https://example.com/logo.png"

14. **להוסיף אמצעי תשלום נוסף?** (Multiple choice)
    - Required (חובה)
    - Options:
      - כן / Yes
      - לא - סיימתי / No - I'm done
    - Description: "בחרו 'כן' כדי להוסיף עוד אפשרות תשלום"

**Additional Gifts 2-N (Optional - repeat with numbered field names):**

15. **Add Section/Page Break**
    - Title: "מתנה 2 (Gift 2)"
    - Description: "אפשרות תשלום נוספת (אופציונלי)"

16. **מתנה 2 - שם (אנגלית)** (Short answer)
    - Optional (אופציונלי)

17. **מתנה 2 - שם (עברית)** (Short answer)
    - Optional (אופציונלי)

18. **מתנה 2 - קישורים** (Paragraph text)
    - Optional (אופציונלי)
    - Description: "קישורים (אחד בכל שורה)"

19. **מתנה 2 - לוגו** (Short answer)
    - Optional (אופציונלי)

20. **להוסיף אמצעי תשלום נוסף?** (Multiple choice)
    - Required (חובה)
    - Same options as before

**Repeat sections 15-20 for מתנה 3, מתנה 4, מתנה 5, etc.**

Recommended: Support at least 3-5 gifts. The script supports up to 10.

**4.3. Configure Form Settings**

1. Click the gear icon (Settings)
2. Under "Responses":
   - ✓ Collect email addresses
   - ✓ Limit to 1 response (allows updates)
3. Click "Save"

**4.4. Upload to Drive Configuration**

1. Still in Settings → Responses
2. Check "File upload" settings appear
3. Google will show "Files will be uploaded to [your email]'s Google Drive"
4. This is normal - uploaded images will temporarily be stored in Drive

### 5. Set Up Apps Script

Apps Script processes form submissions and creates encrypted events.

**5.1. Open Apps Script Editor**

1. In your Google Form, click the three dots menu (⋮) → "Script editor"
2. A new tab opens with Apps Script editor
3. You'll see a default `function myFunction() {}` - delete this entire code

**5.2. Copy the Apps Script Template**

1. In your GitHub repository, navigate to `scripts/templates/apps-script.js`
2. Click "Raw" to view the raw file
3. Copy the entire file contents (Ctrl+A, Ctrl+C)
4. Return to the Apps Script editor
5. Paste the code (Ctrl+V)
6. The file should be named "Code.gs" (default)

**5.3. Review the Code (Optional)**

The script includes detailed comments explaining each function. Key functions:
- `onFormSubmit(e)` - Main trigger that processes form submissions
- `generateUUID()` - Creates unique event IDs
- `encryptAES()` - Encrypts event data
- `commitToGitHub()` - Saves encrypted data to your repository
- `sendEventURL()` - Emails the event URL to the creator

**5.4. Save the Script**

1. Click the disk icon or press Ctrl+S
2. Give your project a name: "Wedding Gifts Event Creator"
3. Click "OK"

### 6. Configure Script Properties

The script needs configuration values to connect to your GitHub repository and send emails.

**6.1. Open Script Properties**

1. In Apps Script editor, click the gear icon (⚙️) on the left sidebar (Project Settings)
2. Scroll down to "Script Properties" section
3. Click "Add script property"

**6.2. Add Required Properties**

Add these properties one by one:

**Property 1: GITHUB_TOKEN**
- **Property**: `GITHUB_TOKEN`
- **Value**: Paste your GitHub Personal Access Token from Step 2
- Example: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Property 2: GITHUB_REPO**
- **Property**: `GITHUB_REPO`
- **Value**: `[your-github-username]/wedding_gifts`
- Example: `johndoe/wedding_gifts`
- Replace `[your-github-username]` with your actual GitHub username

**Property 3: GITHUB_BRANCH**
- **Property**: `GITHUB_BRANCH`
- **Value**: `multi-event-encrypted`
- This is the branch where events will be committed

**Property 4: SITE_URL**
- **Property**: `SITE_URL`
- **Value**: Your GitHub Pages URL from Step 3
- Example: `https://johndoe.github.io/wedding_gifts`
- Do NOT include trailing slash

**Property 5: MASTER_KEY**
- **Property**: `MASTER_KEY`
- **Value**: A random 32+ character string (you generate this)
- Generate a secure random string using one of these methods:
  - Online generator: [passwordsgenerator.net](https://passwordsgenerator.net/) (32+ characters, alphanumeric)
  - Terminal: `openssl rand -base64 32` (Mac/Linux)
  - Or create your own random string
- Example: `K8mP2nQ5rT9vX3zA7bD1fG4hJ6kL0oM2`
- **IMPORTANT**: Save this securely! You'll need it if you ever want to decrypt the registry manually

**6.3. Verify Properties**

Your Script Properties section should now show 5 properties. Double-check:
- No typos in property names (case-sensitive!)
- All values are correct (especially GitHub username and token)
- No extra spaces in values

### 7. Add Form Submit Trigger

The trigger automatically runs the script when someone submits the form.

**7.1. Create Trigger**

1. In Apps Script editor, click the clock/alarm icon on the left sidebar (Triggers)
2. Click "+ Add Trigger" (bottom right)
3. Configure trigger:
   - **Function**: Select `onFormSubmit`
   - **Deployment**: Select "Head"
   - **Event source**: Select "From form"
   - **Event type**: Select "On form submit"
4. Click "Save"

**7.2. Grant Permissions**

1. Google will show a permission dialog: "Authorization required"
2. Click "Authorize"
3. Choose your Google account
4. Click "Advanced" → "Go to [Project name] (unsafe)"
   - This warning is normal for custom scripts
5. Click "Allow" to grant permissions:
   - Send email as you
   - Connect to external service (GitHub)
   - Access your Google Drive (for uploaded images)

**7.3. Verify Trigger**

You should now see one trigger listed:
- **Function**: `onFormSubmit`
- **Event**: On form submit
- **Status**: Active (should show a checkmark or "Enabled")

### 8. Test Your Setup

Time to create your first test event and verify everything works!

**8.1. Submit Test Form**

1. Go back to your Google Form
2. Click "Preview" (eye icon) to open the form
3. Fill out the form with test data:
   - Use your real email
   - Test titles: "Test Event" / "אירוע בדיקה"
   - Test message: "Testing!" / "בדיקה!"
   - Add at least one gift (use a real URL for testing)
   - Skip image uploads for first test (faster)
4. Click "Submit"

**8.2. Monitor Execution**

1. Return to Apps Script editor
2. Click the clock icon (Executions)
3. You should see a new execution running or completed
4. Click on it to see the log

**8.3. Check for Success**

Successful execution shows:
```
Form submission started
Email: your.email@example.com
UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
Is update: no
Config encrypted
Committed to GitHub
Registry updated
Email sent - process complete!
```

**8.4. Verify GitHub Commit**

1. Go to your GitHub repository
2. Navigate to `public/events/` directory
3. You should see a new folder named with a UUID
4. Inside: `config.enc` and `metadata.enc` files
5. Check recent commits - should see "Add/Update event [UUID]"

**8.5. Check Your Email**

You should receive an email with:
- Subject: "Your Event URL is Ready!" (or similar)
- Your unique event URL in format: `https://[username].github.io/wedding_gifts/?event=[uuid]#[key]`
- Instructions for sharing

**8.6. Test Your Event Page**

1. Copy the full URL from the email (including the `#` and everything after)
2. Paste it in your browser
3. Wait ~1-2 minutes for jsDelivr CDN to cache your new event
4. Your event page should load with your custom data!

**8.7. Test Update Functionality**

1. Return to the form and submit again with the **same email**
2. Change some details (e.g., different title)
3. Submit the form
4. Check your email - you'll receive the **same URL** (same UUID and key)
5. Refresh your event page - it should show updated content

### Troubleshooting

#### "Error Creating Your Event" Email

**Problem**: You received an error email instead of the event URL.

**Solutions**:
1. Check Apps Script Executions log (clock icon) for detailed error
2. Common issues:
   - **GitHub API error**: Verify GITHUB_TOKEN is valid and has `repo` scope
   - **GitHub repo not found**: Check GITHUB_REPO format is `username/repo`
   - **Branch not found**: Ensure branch name is exact (`multi-event-encrypted`)
   - **Permission denied**: Token might have expired or insufficient permissions
   - **Path not found**: Ensure events/ directory exists in root (not public/)

#### Form Submits But No Email or GitHub Commit

**Problem**: Form submits successfully but nothing happens.

**Solutions**:
1. Check if trigger is active:
   - Apps Script → Triggers → should show green checkmark
2. Check execution logs:
   - Apps Script → Executions → look for failed executions
3. Verify trigger function name matches exactly: `onFormSubmit`
4. Re-authorize permissions: Delete trigger, re-add, re-authorize

#### Event Page Shows "Event Not Found"

**Problem**: Clicking the event URL shows an error.

**Solutions**:
1. **Wait 1-2 minutes** - jsDelivr CDN needs time to cache new files
2. Verify the full URL was copied (including `#` and key after it)
3. Check GitHub to confirm `events/[uuid]/config.enc` exists in root directory
4. Try purging CDN cache:
   - Visit: `https://purge.jsdelivr.net/gh/[username]/wedding_gifts@multi-event-encrypted/events/[uuid]/config.enc`
5. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

#### Event Page Shows Blank or Old Data

**Problem**: Page loads but shows wrong content.

**Solutions**:
1. Clear browser cache and hard refresh
2. Verify encryption key in URL is correct (after `#`)
3. Check GitHub for recent commit timestamp
4. Wait for jsDelivr to update (can take 1-2 minutes)

#### Images Not Showing

**Problem**: Event loads but images are missing.

**Solutions**:
1. Verify images were uploaded successfully to GitHub
   - Check `events/[uuid]/` in root directory for `.jpg` files
2. Check image file sizes aren't too large (script optimizes to <500KB)
3. Verify file permissions in Google Form settings (file upload enabled)
4. Try re-submitting form with smaller images

#### "Authorization Required" Error

**Problem**: Script asks for authorization but fails.

**Solutions**:
1. Click "Advanced" → "Go to [Project name] (unsafe)"
2. This warning is normal for personal Apps Scripts
3. If still failing:
   - Ensure you're logged into the correct Google account
   - Try different browser or incognito mode
   - Check Apps Script project has correct form association

#### GitHub API Rate Limit Exceeded

**Problem**: Error message about GitHub API limits.

**Solutions**:
1. GitHub API limit: 5,000 requests/hour per token
2. Each form submission uses ~2-3 API calls
3. If exceeded:
   - Wait 1 hour for limit reset
   - Consider using multiple tokens (advanced)
   - Not likely unless processing hundreds of events per hour

#### Script Times Out

**Problem**: Execution fails with "Exceeded maximum execution time".

**Solutions**:
1. Apps Script has 6-minute execution limit
2. Usually caused by:
   - Very large images (reduce size before upload)
   - Network issues connecting to GitHub
3. Script includes retry logic for network issues
4. For large images: optimize manually before uploading

## Security Best Practices

### Protect Your GitHub Token

- **Never commit** the token to your repository
- **Never share** it publicly or with untrusted parties
- **Store securely** in password manager
- **Rotate regularly** - set calendar reminders to renew
- **Revoke immediately** if compromised
- **Use minimal scope** - only `repo` permission needed

### Protect Your Master Key

- **Save securely** - you need it to decrypt the registry
- **Don't share** - contains email→UUID mappings
- **Use strong random** - at least 32 characters
- **Store offline** - password manager or secure note

### Form Security

- **Limit responses** to 1 per account (prevents spam)
- **Validate emails** are legitimate addresses
- **Monitor submissions** via form response spreadsheet
- **Disable form** if abused or no longer needed

### Repository Security

- **Enable 2FA** on GitHub account
- **Review commits** regularly for unexpected changes
- **Use branch protection** on main branch (optional)
- **Monitor access** via repository settings

### Privacy Considerations

- **Event data is encrypted** before storage (AES-256)
- **URLs are private** - only those with full URL can access
- **No analytics** - frontend doesn't track visitors
- **Email registry encrypted** with master key
- **Educate users** to share URLs privately (not publicly)

## Maintenance

### Regular Tasks

**Monthly:**
- Check for failed form submissions (Apps Script executions log)
- Review GitHub commit history
- Verify email deliverability

**Quarterly:**
- Rotate GitHub Personal Access Token (create new, update script property)
- Review repository size (large repos slow down)
- Update Apps Script if new features released

**Annually:**
- Review security practices
- Audit active events (if registry accessible)
- Consider archiving old events

### Updating the Platform

If the upstream repository releases updates:

1. Add upstream remote (one-time):
   ```bash
   git remote add upstream https://github.com/[original-repo]/wedding_gifts.git
   ```

2. Fetch and merge updates:
   ```bash
   git fetch upstream
   git checkout multi-event-encrypted
   git merge upstream/multi-event-encrypted
   ```

3. Test with a new form submission

4. Push to your fork:
   ```bash
   git push origin multi-event-encrypted
   ```

### Backup Your Data

**Script Properties:**
- Export your script properties regularly (copy to secure note)

**Registry:**
- Download `events/_registry.enc` (encrypted backup)
- Keep master key safe to decrypt if needed

**Events:**
- GitHub automatically backs up all commits
- Clone repository locally for offline backup

### Scaling Considerations

**Expected capacity:**
- GitHub Pages: Unlimited visitors (GitHub CDN)
- jsDelivr: Unlimited bandwidth (free tier sufficient)
- Apps Script: ~1,500 form submissions/day (6min execution × 24hrs)
- Repository size: ~10MB per event with images (GitHub limit: 100GB)

**If you exceed limits:**
- GitHub Pages: Consider Cloudflare or Netlify
- Apps Script: Use queuing system or multiple forms
- Repository: Archive old events to separate repo

## Additional Resources

### Documentation

- [User Guide](USER_GUIDE.md) - Share this with event creators
- [Architecture Overview](../.opencode/ARCHITECTURE.md) - Technical details
- [Apps Script Template](../scripts/templates/apps-script.js) - Commented code

### External Documentation

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Apps Script Guides](https://developers.google.com/apps-script)
- [jsDelivr CDN](https://www.jsdelivr.com/)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/)

### Support

For issues, questions, or contributions:
1. Check existing GitHub Issues in the repository
2. Create a new issue with detailed description
3. Include error messages and execution logs

## Summary Checklist

Use this checklist to verify your setup:

- [ ] GitHub repository forked and on correct branch
- [ ] GitHub Personal Access Token created and saved
- [ ] GitHub Pages enabled and site accessible
- [ ] Google Form created with all required fields
- [ ] Apps Script template copied and saved
- [ ] All 5 Script Properties configured correctly
- [ ] Form submit trigger created and authorized
- [ ] Test form submitted successfully
- [ ] GitHub commit visible with event files
- [ ] Email received with event URL
- [ ] Event page loads correctly with test data
- [ ] Update test completed (same email, new data)

**Congratulations!** Your multi-event platform is ready. Share the form URL with event creators and point them to the [User Guide](USER_GUIDE.md).
