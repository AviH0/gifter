# Technical Architecture

See MASTER_PLAN.md for overview. This document contains implementation-specific technical details.

## Frontend (Browser)

**Tech:** Vanilla JS + CryptoJS (AES-256)

**Flow:**
1. Parse URL: `?event=[uuid]#[key]`
2. Fetch: `https://cdn.jsdelivr.net/gh/user/repo@main/public/events/[uuid]/config.enc`
3. Decrypt: `CryptoJS.AES.decrypt(encrypted, key)`
4. Render page with config

**Key Code:**
```javascript
async function loadConfig() {
    const eventId = new URLSearchParams(window.location.search).get('event');
    const key = window.location.hash.substring(1);
    
    if (eventId && key) {
        const url = `https://cdn.jsdelivr.net/gh/USER/REPO@main/public/events/${eventId}/config.enc`;
        const encrypted = await fetch(url).then(r => r.text());
        const decrypted = CryptoJS.AES.decrypt(encrypted, key);
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    }
    return window.config; // fallback to demo
}
```

## Apps Script (Event Creation)

**Responsibilities:**
- Process form submissions
- Generate UUID + encryption key
- Optimize images (<500KB)
- Encrypt config
- Commit to GitHub
- Email user with URL

**Key Functions:**
- `onFormSubmit(e)` - Main trigger
- `generateUUID()` - Random UUID v4
- `generateEncryptionKey()` - 32-char random
- `encryptAES(data, key)` - Compatible with CryptoJS
- `optimizeImage(blob)` - Compress to <500KB
- `commitToGitHub()` - GitHub API
- `updateRegistry()` - Email→UUID mapping
- `sendEventURL()` - Email notification

**Script Properties:**
- `GITHUB_TOKEN` - PAT with repo scope
- `MASTER_KEY` - For registry encryption
- `GITHUB_REPO` - e.g., "user/wedding_gifts"
- `SITE_URL` - e.g., "https://user.github.io/wedding_gifts"

## GitHub Storage

```
public/events/
├── _registry.enc          # {email: {uuid, key, created, updated}}
└── [uuid]/
    ├── config.enc         # Encrypted event config
    ├── metadata.enc       # {email, created, updated, version}
    ├── wedding.jpg        # Optimized images
    ├── bg-light.jpg
    └── bg-dark.jpg
```

## Config Format (before encryption)

```json
{
  "eventId": "abc123-uuid",
  "fonts": {
    "primary": "'Noto Sans Hebrew', sans-serif",
    "secondary": "'Rubik', sans-serif"
  },
  "title": {
    "en": "Sarah & John's Wedding",
    "he": "החתונה של שרה וג'ון"
  },
  "message": {
    "en": "Send us a gift!",
    "he": "שלחו לנו מתנה!"
  },
  "image": "events/abc123-uuid/wedding.jpg",
  "backgroundLight": "events/abc123-uuid/bg-light.jpg",
  "backgroundDark": "events/abc123-uuid/bg-dark.jpg",
  "gifts": [
    {
      "name": {"en": "Bit", "he": "ביט"},
      "url": ["https://bit.co.il/link1"],
      "logo": "https://example.com/logo.png"
    }
  ]
}
```

## Security

**Encryption:** AES-256-CBC  
**Key Size:** 256 bits (32 characters)  
**Library:** CryptoJS (browser), compatible in Apps Script

**Threats & Mitigations:**
- UUID enumeration → 2^128 random UUIDs
- Brute force → 2^256 keyspace
- Registry exposure → Encrypted with master key
- Token leak → Minimal PAT scope (repo only)

## Performance

**Target:** <2s page load globally

**Optimization:**
- Images compressed to <500KB
- jsDelivr edge caching
- Lazy load backgrounds
- Small config files (<10KB)

**Rate Limits:**
- jsDelivr: Unlimited (practical)
- GitHub API: 5000/hour (sufficient)
- Apps Script: 6min/execution (queue if needed)

## Error Handling

**Frontend:**
- No event param → Use demo config
- Invalid UUID → Show error message
- Wrong key → "Invalid encryption key"
- Network failure → "Unable to load event"

**Apps Script:**
- GitHub API fail → Email user with error
- Image optimization fail → Use original
- Duplicate email → Update existing event
