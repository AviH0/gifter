# Subagent Task Breakdown

## Task 1: Repository Restructuring

**Files:** `.opencode/SUBAGENT_QUICKSTART.md`

**Objective:** Reorganize files into `public/` directory for GitHub Pages

**Steps:**
1. Create `public/` directory
2. Move existing files:
   - `index.html` → `public/index.html`
   - `en/` → `public/en/`
   - `js/` → `public/js/`
   - `css/` → `public/css/`
   - `assets/` → `public/assets/`
3. Create `public/events/` (empty for now)
4. Test site still works

**Success:** All files in `public/`, site renders correctly

---

## Task 2: Frontend Encryption

**Objective:** Add decryption logic to load encrypted event configs

**Steps:**
1. Add to `public/index.html` and `public/en/index.html`:
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
   ```

2. Add to `public/js/script.js` (before existing code):
   ```javascript
   async function loadConfig() {
       const eventId = new URLSearchParams(window.location.search).get('event');
       const key = window.location.hash.substring(1);
       
       if (eventId && key) {
           try {
               const baseUrl = 'https://cdn.jsdelivr.net/gh/USERNAME/wedding_gifts@main';
               const configUrl = `${baseUrl}/public/events/${eventId}/config.enc`;
               
               const response = await fetch(configUrl);
               if (!response.ok) throw new Error('Config not found');
               
               const encrypted = await response.text();
               const decrypted = CryptoJS.AES.decrypt(encrypted, key);
               const configStr = decrypted.toString(CryptoJS.enc.Utf8);
               
               if (!configStr) throw new Error('Invalid encryption key');
               
               const config = JSON.parse(configStr);
               
               // Validate structure
               if (!config.title || !config.message || !config.gifts) {
                   throw new Error('Invalid config');
               }
               
               return config;
           } catch (err) {
               console.error('Failed to load event:', err);
               alert(`Unable to load event: ${err.message}`);
               return null;
           }
       }
       
       // Fallback to demo config
       return window.config;
   }
   ```

3. Update existing `DOMContentLoaded`:
   ```javascript
   document.addEventListener('DOMContentLoaded', async () => {
       const config = await loadConfig();
       if (!config) {
           document.getElementById('title').textContent = 'Event Not Found';
           return;
       }
       
       // ... rest of existing code
   });
   ```

**Success:** Can decrypt test config, demo config still works

---

## Task 3: Apps Script Template

**Objective:** Create Apps Script for form processing

**File:** `scripts/templates/apps-script.js`

**Required Functions:**
```javascript
// Main trigger
function onFormSubmit(e) {
  const responses = e.namedValues;
  const email = responses['Email'][0];
  
  const existing = getEventByEmail(email);
  const uuid = existing ? existing.uuid : generateUUID();
  const key = existing ? existing.key : generateEncryptionKey();
  
  // Build config from form responses
  const config = buildConfigFromResponses(responses, uuid);
  
  // Encrypt
  const encrypted = encryptAES(JSON.stringify(config), key);
  
  // Commit to GitHub
  commitToGitHub(uuid, encrypted, email, key);
  
  // Send email
  sendEventURL(email, uuid, key);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateEncryptionKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// TODO: Implement encryptAES compatible with CryptoJS
// TODO: Implement commitToGitHub using GitHub API
// TODO: Implement registry management
// TODO: Implement email sending
```

**Script Properties to set:**
- GITHUB_TOKEN
- MASTER_KEY  
- GITHUB_REPO
- SITE_URL

**Success:** Complete template ready to use

---

## Task 4: Setup Scripts

**Files to create:**
- `scripts/test-encryption.js` - Node.js script to test encryption locally
- `scripts/github-setup.sh` - Setup instructions
- `scripts/package.json` - For Node dependencies

**test-encryption.js:**
```javascript
const CryptoJS = require('crypto-js');
const fs = require('fs');

const config = {
  title: {en: 'Test', he: 'בדיקה'},
  message: {en: 'Test', he: 'בדיקה'},
  gifts: []
};

const uuid = 'test-12345';
const key = 'test-key-32-characters-long!!';

const encrypted = CryptoJS.AES.encrypt(JSON.stringify(config), key).toString();

fs.mkdirSync(`public/events/${uuid}`, {recursive: true});
fs.writeFileSync(`public/events/${uuid}/config.enc`, encrypted);

console.log('Test URL:', `?event=${uuid}#${key}`);
```

**Success:** Can generate test encrypted configs

---

## Task 5: Documentation

**Files to create:**
- `docs/SETUP_GUIDE.md` - How to deploy your own
- `docs/USER_GUIDE.md` - How to create events
- Update `README.md` on this branch

**Key sections:**
- Prerequisites
- Step-by-step setup
- Troubleshooting
- FAQ

**Success:** Complete, clear documentation

---

## Task 6: Testing

**Checklist:**
- [ ] Frontend loads demo config (no params)
- [ ] Frontend loads encrypted config (with params)
- [ ] Invalid URL shows error
- [ ] Wrong key shows error
- [ ] Works on Chrome/Firefox/Safari
- [ ] Mobile responsive
- [ ] Form → GitHub → Frontend flow
- [ ] Event updates work

**Success:** All tests pass

---

## Priority Order

**Phase 1 (Critical):**
1. Task 1: Restructure repo
2. Task 2: Frontend encryption
3. Task 3: Apps Script

**Phase 2 (Important):**
4. Task 4: Setup scripts
5. Task 5: Documentation

**Phase 3 (Final):**
6. Task 6: Testing
