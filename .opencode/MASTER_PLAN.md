# Multi-Event Encrypted Wedding Gifts Platform - Master Plan

## Project Overview

Transform the single-event wedding gifts web app into a multi-event platform where users can create their own events via Google Forms without requiring technical knowledge or backend deployment.

## Architecture

### High-Level Flow
```
Google Form → Apps Script → GitHub (public repo) → jsDelivr CDN → Browser decrypts & renders
```

### Security Model
- **URL Format:** `yoursite.com/?event=[uuid]#[key]`
- **Encryption:** AES-256 with unique key per event
- **Key Distribution:** Hash fragment (never sent to server)
- **Privacy:** Configs stored encrypted in public repo; can't enumerate without keys
- **Access Control:** Full URL = access token

### Technology Stack
- **Frontend:** Vanilla JS + CryptoJS for decryption
- **Storage:** GitHub public repo + jsDelivr CDN
- **Event Creation:** Google Forms + Google Apps Script
- **Encryption:** AES-256 (CryptoJS browser-side, Apps Script server-side)
- **Hosting:** GitHub Pages (free, global CDN)

## Repository Structure

```
wedding_gifts/
├── .opencode/                 # Agent development files
│   ├── MASTER_PLAN.md        # This file
│   ├── ARCHITECTURE.md       # Technical architecture details
│   └── SUBAGENT_TASKS.md     # Task breakdown for subagents
│
├── public/                    # GitHub Pages serves this as root
│   ├── index.html            # Main entry (Hebrew)
│   ├── en/
│   │   └── index.html        # English version
│   ├── js/
│   │   ├── script.js         # Core logic + encryption handling
│   │   ├── config.js         # Demo/default config
│   │   └── crypto.min.js     # CryptoJS library (local copy)
│   ├── css/
│   │   └── style.css         # Styles
│   ├── assets/               # Default/demo assets
│   │   └── ...
│   └── events/               # Event-specific encrypted data
│       ├── _registry.enc     # Email→UUID mapping (encrypted)
│       └── [uuid]/           # Per-event directory
│           ├── config.enc    # Encrypted config JSON
│           ├── metadata.enc  # Event metadata (email, timestamps)
│           ├── wedding.jpg   # Optimized images
│           ├── bg-light.jpg
│           └── bg-dark.jpg
│
├── scripts/                   # Setup automation (NOT publicly served)
│   ├── templates/
│   │   ├── apps-script.js    # Google Apps Script template
│   │   └── form-schema.json  # Google Form structure
│   ├── setup-google-form.js  # Auto-create form via API
│   ├── github-setup.sh       # Repository configuration
│   ├── migrate-events.js     # Migrate from branch-based setup
│   └── test-encryption.js    # Local encryption testing
│
├── docs/                      # Documentation
│   ├── SETUP_GUIDE.md        # For deploying your own instance
│   ├── USER_GUIDE.md         # For event creators
│   ├── DEVELOPMENT.md        # For contributors
│   └── API.md                # Apps Script API documentation
│
└── README.md                  # Main project readme
```

## Implementation Phases

### Phase 1: Repository Setup
- [x] Create new branch: `multi-event-encrypted`
- [ ] Reorganize files into `public/` directory
- [ ] Create development structure
- [ ] Configure GitHub Pages to serve from `/public`

### Phase 2: Frontend Development
- [ ] Add CryptoJS library
- [ ] Implement config loading logic (URL parsing)
- [ ] Implement decryption logic
- [ ] Update asset path resolution (event vs. default)
- [ ] Add error handling for invalid URLs
- [ ] Test with manually created encrypted config

### Phase 3: Apps Script Development
- [ ] Create form schema/template
- [ ] Implement main `onFormSubmit()` trigger
- [ ] Implement UUID generation
- [ ] Implement encryption key generation
- [ ] Implement AES encryption in Apps Script
- [ ] Implement GitHub API integration
- [ ] Implement image optimization
- [ ] Implement email→UUID registry management
- [ ] Implement update detection (existing email)
- [ ] Implement email notification with URL

### Phase 4: Setup Automation
- [ ] Create `setup-google-form.js` script
- [ ] Create `github-setup.sh` script
- [ ] Write SETUP_GUIDE.md with step-by-step instructions
- [ ] Write USER_GUIDE.md for event creators
- [ ] Create video/GIF walkthrough

### Phase 5: Testing & Validation
- [ ] Unit test encryption/decryption
- [ ] Test form submission → GitHub commit
- [ ] Test frontend rendering from encrypted config
- [ ] Test image optimization & loading
- [ ] Test event updates (same email)
- [ ] Test error cases (invalid URL, wrong key, missing files)
- [ ] Load testing (multiple concurrent users)
- [ ] Cross-browser testing

### Phase 6: Migration & Deployment
- [ ] Create migration script for existing events
- [ ] Migrate existing branch-based events
- [ ] Update main README.md
- [ ] Deploy to GitHub Pages
- [ ] Create demo event
- [ ] Notify existing users (if applicable)

## Key Technical Decisions

### 1. Encryption in Public Repo
**Decision:** Store encrypted configs in public GitHub repo  
**Rationale:** 
- Enables jsDelivr CDN (fast, free, global)
- URL with encryption key = access token (same security model as UUID-only)
- No backend or complex authentication needed

### 2. Google Forms for Event Creation
**Decision:** Use Google Forms + Apps Script  
**Rationale:**
- Non-technical friendly (familiar form interface)
- Free, reliable infrastructure
- Built-in file upload handling
- Easy to validate/extend
- Can integrate with Google Drive for image storage

### 3. Email-Based Event Updates
**Decision:** Track events by email address for updates  
**Rationale:**
- Simple for users (re-submit with same email)
- Maintains encryption key on update (old URLs keep working)
- Registry encrypted with master key
- Alternative approaches (user accounts) too complex

### 4. jsDelivr CDN for Asset Delivery
**Decision:** Use jsDelivr to serve from GitHub  
**Rationale:**
- Free, unlimited bandwidth
- Global edge caching
- No rate limits for reasonable usage
- Automatic purging (or manual via API)
- Better performance than GitHub raw URLs

## Security Considerations

### Threat Model
1. **Enumeration attacks:** Attacker tries to discover event UUIDs
   - **Mitigation:** UUIDs are random (128-bit), cryptographically secure
   
2. **Brute force decryption:** Attacker has encrypted config, tries keys
   - **Mitigation:** 32-character random keys = 2^256 keyspace
   
3. **Social engineering:** User shares URL publicly
   - **Mitigation:** Same risk as current setup; educate users
   
4. **GitHub repo access:** Someone gains write access to repo
   - **Mitigation:** Use dedicated PAT with minimal scope, protect Secret

### Privacy Features
- Encryption keys never logged (hash fragment)
- No analytics or tracking in frontend
- Configs encrypted at rest
- Registry encrypted separately
- Images stored in per-event directories (no cross-contamination)

## Success Criteria

### Functional Requirements
- [ ] User can create event via form in <10 minutes
- [ ] User receives unique URL immediately
- [ ] Event page loads in <2 seconds globally
- [ ] Multiple events can run concurrently without interference
- [ ] Users can update events by re-submitting form
- [ ] Images auto-optimized to <500KB

### Non-Functional Requirements
- [ ] No backend to deploy or maintain
- [ ] Works with free tier services only
- [ ] Mobile-responsive frontend
- [ ] Handles 1000+ concurrent guests per event
- [ ] Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- [ ] Setup process documented for technical users
- [ ] User guide documented for event creators

## Future Enhancements (Out of Scope)

- Password-protected events (additional auth layer)
- Custom domains per event
- Analytics dashboard for event creators
- RSVP management
- Gift registry integration
- Multi-language support beyond EN/HE
- Theme customization UI
- QR code auto-generation for events

## Related Documents

- [ARCHITECTURE.md](.opencode/ARCHITECTURE.md) - Detailed technical architecture
- [SUBAGENT_TASKS.md](.opencode/SUBAGENT_TASKS.md) - Task breakdown for subagents
- [SETUP_GUIDE.md](../docs/SETUP_GUIDE.md) - Setup instructions
- [DEVELOPMENT.md](../docs/DEVELOPMENT.md) - Development guidelines
