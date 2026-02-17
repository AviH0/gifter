# Setup and Testing Scripts

This directory contains automation scripts for deploying and testing the multi-event wedding gifts platform.

## Overview

The platform uses:
- **GitHub Pages** to host the frontend
- **Apps Script** to process Google Form submissions
- **AES-256 encryption** to protect event configs
- **jsDelivr CDN** for global delivery

These scripts help you set up and test the entire system.

## Scripts

### 1. test-encryption.js

**Purpose:** Generate test encrypted configs for local development and testing.

**What it does:**
- Creates a test event configuration with sample data
- Generates a random UUID and encryption key
- Encrypts the config using CryptoJS (same as frontend)
- Saves to `public/events/[uuid]/config.enc`
- Outputs test URLs for local and deployed testing
- Validates encryption/decryption works correctly

**Usage:**

```bash
# Install dependencies first
cd scripts
npm install

# Run the test encryption script
npm run test-encryption
# or: node test-encryption.js
```

**Output:**
- Creates: `public/events/[uuid]/config.enc` (encrypted config)
- Creates: `public/events/[uuid]/test-info.json` (metadata)
- Prints: Test URLs with embedded UUID and encryption key

**Example output:**
```
🔐 Wedding Gifts - Test Encryption Script

Generated Test Event:
   UUID: 550e8400-e29b-41d4-a716-446655440000
   Encryption Key: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

Test URLs:
   http://localhost:8000/?event=550e8400...#a1b2c3d4...
```

**Testing workflow:**
1. Run `test-encryption.js` to generate a test config
2. Start a local server: `python -m http.server 8000`
3. Visit the test URL shown in the output
4. Verify the page loads and displays test event data
5. Test with wrong key to verify error handling

---

### 2. github-setup.sh

**Purpose:** Interactive guide for configuring GitHub Pages and API access.

**What it does:**
- Checks git repository status
- Guides through GitHub Pages configuration
- Helps create Personal Access Token (PAT)
- Validates token permissions
- Optionally saves token to `.env` file
- Provides Apps Script configuration instructions
- Shows deployment and testing commands

**Usage:**

```bash
# Make executable (first time only)
chmod +x scripts/github-setup.sh

# Run the setup script
bash scripts/github-setup.sh
```

**Interactive steps:**
1. **GitHub Pages**: Instructions for configuring Pages to serve from `/public`
2. **Personal Access Token**: Guide to create PAT with `repo` scope
3. **Token validation**: Tests if token works with GitHub API
4. **Apps Script properties**: Shows required configuration
5. **Testing**: Commands for local testing
6. **Deployment**: Git commands to push to GitHub

**What you need:**
- GitHub account with repository access
- Git configured locally
- Browser to access GitHub settings
- Apps Script project (for Step 3)

---

### 3. package.json

**Purpose:** Node.js dependencies for testing scripts.

**Dependencies:**
- **crypto-js** (^4.2.0): AES encryption/decryption (same as frontend)
- **uuid** (^9.0.1): Generate RFC4122 UUIDs

**Usage:**

```bash
cd scripts
npm install
```

This installs the dependencies needed by `test-encryption.js`.

---

## Quick Start

### First-time setup:

```bash
# 1. Install dependencies
cd scripts
npm install

# 2. Run GitHub setup wizard
bash github-setup.sh

# 3. Generate test config
npm run test-encryption

# 4. Test locally
cd ..
python -m http.server 8000
# Visit the test URL from step 3
```

### Daily development:

```bash
# Generate new test config
cd scripts
npm run test-encryption

# Start local server
cd ..
python -m http.server 8000
# or: npx serve public -p 3000
```

---

## File Structure

```
scripts/
├── package.json              # Node.js dependencies
├── test-encryption.js        # Test config generator
├── github-setup.sh           # GitHub setup wizard
├── README.md                 # This file
└── templates/
    └── apps-script.js        # Google Apps Script template
```

After running `test-encryption.js`:
```
public/events/
└── [uuid]/
    ├── config.enc            # Encrypted event config
    └── test-info.json        # Test metadata (UUID, key, URLs)
```

---

## Prerequisites

### For test-encryption.js:
- Node.js >= 14.0.0
- npm or yarn

### For github-setup.sh:
- Bash shell (Linux/macOS/WSL)
- Git installed and configured
- curl (for token validation)
- GitHub account

### For local testing:
- Python 3 (for `python -m http.server`)
- Or Node.js with `npx serve`
- Modern browser (Chrome, Firefox, Safari, Edge)

---

## Configuration

### Environment Variables (optional)

You can create a `.env` file in the project root:

```bash
# GitHub API access
GITHUB_TOKEN=ghp_your_token_here

# Repository info
GITHUB_REPO=username/wedding_gifts
SITE_URL=https://username.github.io/wedding_gifts

# Master key for registry encryption (32+ characters)
MASTER_KEY=your_32_character_random_string_here
```

**Important:** `.env` should be in `.gitignore` (never commit tokens!)

### Apps Script Properties

These must be configured in your Google Apps Script project:

| Property | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Personal Access Token with `repo` scope | `ghp_abc123...` |
| `GITHUB_REPO` | Your repository in format `user/repo` | `john/wedding_gifts` |
| `SITE_URL` | Your GitHub Pages URL | `https://john.github.io/wedding_gifts` |
| `MASTER_KEY` | Random 32+ char string for registry encryption | Generate with `openssl rand -base64 32` |

---

## Troubleshooting

### test-encryption.js fails

**Problem:** `Cannot find module 'crypto-js'`

**Solution:**
```bash
cd scripts
npm install
```

**Problem:** Permission denied

**Solution:**
```bash
chmod +x scripts/test-encryption.js
node scripts/test-encryption.js
```

### github-setup.sh fails

**Problem:** Token validation fails

**Solution:**
- Check token has `repo` scope
- Token should start with `ghp_` (Personal Access Token)
- Generate new token at: https://github.com/settings/tokens/new

**Problem:** Not in a git repository

**Solution:**
```bash
# Make sure you're in the project root
cd /path/to/wedding_gifts
git status  # Should show git info
```

### Local testing issues

**Problem:** Page shows "Event Not Found"

**Solution:**
- Check the URL has both `?event=UUID` and `#KEY`
- Verify `public/events/[uuid]/config.enc` exists
- Open browser console to see error messages

**Problem:** "Invalid encryption key"

**Solution:**
- Key is case-sensitive
- Make sure entire key is copied (32 characters)
- Check URL hash symbol `#` is present

**Problem:** CORS errors in browser console

**Solution:**
- Must use a local server (not `file://` protocol)
- Use `python -m http.server 8000`
- Or `npx serve public -p 3000`

---

## Testing Checklist

Before deploying to production:

- [ ] Run `test-encryption.js` successfully
- [ ] Local server serves the page correctly
- [ ] Test URL loads encrypted config
- [ ] Wrong key shows error message
- [ ] No event param shows demo config
- [ ] GitHub Pages is configured (serves from `/public`)
- [ ] Personal Access Token is created and tested
- [ ] Apps Script properties are configured
- [ ] Full flow tested: Form → GitHub → Browser

---

## Security Notes

### Encryption Keys
- 32 characters = 190-bit security (62^32 combinations)
- Keys are **never** sent to server (in URL hash)
- Lost keys = lost access (no recovery possible)
- Each event has unique key

### GitHub Token
- Only grant `repo` scope (minimum required)
- Never commit to git or expose publicly
- Rotate token if compromised
- Set expiration date (1 year recommended)

### Master Key
- Used to encrypt the event registry
- Store in Apps Script properties only
- If lost, registry must be rebuilt
- Generate with: `openssl rand -base64 32`

---

## Advanced Usage

### Custom test configs

Edit `test-encryption.js` to customize test data:

```javascript
const testConfig = {
  title: {
    en: "Your Custom Title",
    he: "כותרת מותאמת אישית"
  },
  // ... modify as needed
};
```

### Batch testing

Generate multiple test configs:

```bash
for i in {1..5}; do
  node scripts/test-encryption.js
done
```

### Decrypt existing config

```javascript
const CryptoJS = require('crypto-js');
const fs = require('fs');

const encrypted = fs.readFileSync('public/events/UUID/config.enc', 'utf8');
const key = 'your-32-character-key-here';

const decrypted = CryptoJS.AES.decrypt(encrypted, key);
const config = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

console.log(config);
```

---

## Related Documentation

- **Architecture:** `.opencode/ARCHITECTURE.md`
- **Master Plan:** `.opencode/MASTER_PLAN.md`
- **Setup Guide:** `docs/SETUP_GUIDE.md` (when available)
- **User Guide:** `docs/USER_GUIDE.md` (when available)

---

## Support

For issues or questions:
1. Check this README
2. Review architecture documentation
3. Open GitHub issue with:
   - Script name
   - Error message
   - Steps to reproduce

---

## License

Same as main project. See repository LICENSE file.
