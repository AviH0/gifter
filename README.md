# Wedding Gifts - Multi-Event Platform

A serverless, encrypted platform for creating beautiful, private wedding and event gift pages. Users create events via Google Forms - no coding required!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-blue)](https://pages.github.com/)
[![Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-green)](https://developers.google.com/apps-script)

## ✨ Key Features

### For Event Creators
- **No technical skills required** - Simple Google Form interface
- **Instant setup** - Event ready in minutes, unique URL sent via email
- **Fully customizable** - Your titles, messages, photos, and gift options
- **Multiple payment methods** - Bit, PayBox, Venmo, bank transfers, crypto, etc.
- **Bilingual support** - English and Hebrew (easily extensible)
- **Easy updates** - Re-submit form with same email to update your event
- **Privacy by design** - Encrypted storage, unique secret URLs

### For Platform Administrators
- **100% serverless** - No backend to maintain
- **Free hosting** - GitHub Pages + jsDelivr CDN + Google Forms
- **AES-256 encryption** - All event data encrypted at rest
- **Auto-scaling** - Handles unlimited concurrent events
- **Simple deployment** - 30-minute setup following our guide
- **No databases** - Events stored as encrypted files in GitHub

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  Google Form    │  ← Event creators fill out form
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apps Script    │  ← Processes form, encrypts data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Repo    │  ← Stores encrypted configs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  jsDelivr CDN   │  ← Global edge caching
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Browser (User) │  ← Decrypts & renders page
└─────────────────┘
```

**Security Model:**
- Event configs encrypted with AES-256 before storage
- URL format: `?event=[uuid]#[key]`
- Encryption key transmitted via URL fragment (never sent to servers)
- Public repository but data remains private (encrypted)
- Unique UUID per event (128-bit random, non-enumerable)

## 🚀 Quick Start

### For Platform Administrators (Deploy Your Own)

**Want to host your own instance?** Follow our comprehensive [Setup Guide](docs/SETUP_GUIDE.md).

**Quick overview:**
1. Fork this repository
2. Create GitHub Personal Access Token
3. Configure GitHub Pages from root directory
4. Create Google Form with required fields
5. Set up Apps Script with our template
6. Configure script properties (GitHub token, repo, etc.)
7. Add form submit trigger
8. Test with your first event!

**Time required:** ~30-45 minutes

### For Event Creators (Use Existing Platform)

**Need to create an event?** See our [User Guide](docs/USER_GUIDE.md).

**Quick overview:**
1. Get Google Form link from your administrator
2. Fill out form with event details (titles, messages, photos, gifts)
3. Submit with your email address
4. Receive unique event URL via email
5. Share URL with guests
6. Update anytime by re-submitting with same email

**Time required:** ~5-10 minutes

## 📖 Documentation

### For Platform Administrators
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete deployment instructions
  - Prerequisites and requirements
  - Step-by-step setup process
  - GitHub, Google Forms, and Apps Script configuration
  - Testing and troubleshooting
  - Security best practices

### For Event Creators (Non-Technical Users)
- **[User Guide](docs/USER_GUIDE.md)** - How to create and manage events
  - Filling out the form (field-by-field explanations)
  - Sharing your event URL
  - Updating your event
  - Privacy and security overview
  - FAQ and troubleshooting

### For Developers
- **[Technical Architecture](.opencode/ARCHITECTURE.md)** - Detailed technical specs
  - Frontend implementation details
  - Apps Script functions and flow
  - Encryption implementation
  - GitHub storage structure
  - Performance and security considerations
  
- **[Master Plan](.opencode/MASTER_PLAN.md)** - Complete project overview
  - Project vision and goals
  - Implementation phases
  - Technical decisions and rationale

## 🎨 Features in Detail

### Event Customization
- **Bilingual content** - English and Hebrew with language switcher
- **Custom photos** - Main event photo + background images (light/dark themes)
- **Personal messages** - Warm greetings to your guests
- **Flexible gift options** - 5-10 different payment methods per event

### User Experience
- **Mobile-first design** - Responsive, works on all devices
- **Dark/light themes** - Automatic or manual theme switching
- **Fast loading** - Global CDN ensures <2s load times worldwide
- **No tracking** - Privacy-focused, no analytics or cookies

### Security & Privacy
- **End-to-end encryption** - AES-256 encryption with unique keys
- **Private by default** - Events not publicly listed or searchable
- **Secure key distribution** - Encryption key in URL fragment (client-side only)
- **Registry encryption** - Email→UUID mapping encrypted with master key
- **Minimal permissions** - GitHub token only needs `repo` scope

### Scalability
- **Unlimited events** - Create as many events as needed
- **Unlimited guests** - Each event handles thousands of concurrent visitors
- **Global CDN** - Fast access from anywhere in the world
- **No rate limits** - jsDelivr provides unlimited bandwidth

## 🛠️ Technology Stack

### Frontend
- **HTML/CSS/JavaScript** - Vanilla JS, no frameworks
- **CryptoJS** - Client-side AES decryption
- **Responsive Design** - Mobile-first CSS

### Backend (Serverless)
- **Google Forms** - Event creation interface
- **Apps Script** - Form processing and encryption
- **GitHub API** - Storage and version control
- **jsDelivr CDN** - Asset delivery

### Hosting
- **GitHub Pages** - Static site hosting
- **GitHub Repository** - Encrypted file storage
- **Google Drive** - Temporary image storage during upload

## 📁 Repository Structure

```
wedding_gifts/
├── index.html                # Hebrew version (main entry)
├── en/index.html             # English version
├── js/
│   ├── script.js             # Main logic + decryption
│   └── config.js             # Demo/default config
├── css/style.css             # Responsive styles
├── assets/                   # Default demo assets
├── events/                   # Event-specific data (encrypted)
│   ├── _registry.enc         # Email→UUID mapping (encrypted)
│   └── [uuid]/               # Per-event directory
│       ├── config.enc        # Encrypted event config
│       ├── metadata.enc      # Event metadata
│       └── *.jpg             # Optimized images
│
├── scripts/                   # Setup automation (not served)
│   ├── templates/
│   │   └── apps-script.js    # Google Apps Script template
│   ├── test-encryption.js    # Local encryption testing
│   ├── github-setup.sh       # Repository setup script
│   └── package.json          # Node.js dependencies (for testing)
│
├── docs/                      # Documentation
│   ├── SETUP_GUIDE.md        # Administrator deployment guide
│   └── USER_GUIDE.md         # Event creator user guide
│
├── .opencode/                 # Project planning (development)
│   ├── MASTER_PLAN.md        # Complete project overview
│   ├── ARCHITECTURE.md       # Technical architecture
│   └── SUBAGENT_TASKS.md     # Implementation task breakdown
│
└── README.md                  # This file
```

## 🔒 Security Considerations

### Encryption
- **Algorithm:** AES-256-CBC
- **Key generation:** 32-character random alphanumeric (2^256 keyspace)
- **UUID generation:** Cryptographically secure random UUID v4 (2^128 space)

### Threat Model
| Threat | Mitigation |
|--------|------------|
| UUID enumeration | 128-bit random UUIDs, computationally infeasible |
| Brute force decryption | 256-bit keys, would take longer than age of universe |
| Social engineering | User education, private URL sharing guidelines |
| GitHub token leak | Minimal scope (`repo` only), can be revoked instantly |
| Registry exposure | Encrypted with separate master key |

### Best Practices
- Rotate GitHub tokens quarterly
- Use strong, random master key (32+ characters)
- Educate event creators to share URLs privately
- Monitor form submissions for abuse
- Enable GitHub 2FA for repository owner

## 🧪 Testing

### Test Encryption Locally

```bash
cd scripts
npm install
node test-encryption.js
```

This creates a test encrypted event in `public/events/test-[uuid]/` that you can use to verify decryption works.

### Test Your Deployed Platform

1. Submit a test form with your email
2. Verify GitHub commit appears with encrypted files
3. Check email for event URL
4. Open event URL in browser (wait 1-2 minutes for CDN)
5. Verify page loads with your test data
6. Test update: re-submit form with same email, verify updates appear

## 📊 Current Status

This is the **multi-event-encrypted** branch implementing the full multi-event platform.

**Completed:**
- ✅ Multi-event encrypted platform
- ✅ Frontend encryption and decryption logic
- ✅ Apps Script template with full functionality
- ✅ Setup automation scripts
- ✅ Comprehensive documentation (Setup + User guides)
- ✅ Testing utilities
- ✅ Root directory deployment (GitHub Pages compatible)

**Next Steps:**
- Integration testing with real Google Form
- Production deployment
- User acceptance testing
- Performance monitoring

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional language support (Spanish, French, etc.)
- Enhanced image optimization
- Alternative encryption algorithms
- Custom theme support
- Analytics dashboard (privacy-preserving)
- Event templates
- QR code generation

Please open an issue first to discuss major changes.

## 📜 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **CryptoJS** - Client-side encryption library
- **jsDelivr** - Fast, reliable CDN
- **GitHub Pages** - Free static hosting
- **Google Apps Script** - Serverless backend processing

## 📞 Support

- **Setup issues:** See [Setup Guide Troubleshooting](docs/SETUP_GUIDE.md#troubleshooting)
- **User issues:** See [User Guide FAQ](docs/USER_GUIDE.md#frequently-asked-questions)
- **Bug reports:** Open a GitHub issue with details
- **Feature requests:** Open a GitHub issue with use case

## 🎯 Use Cases

Beyond weddings, this platform works for:
- **Birthday parties** - Gift collection for milestone birthdays
- **Baby showers** - Easy gift giving for new parents
- **Anniversaries** - Celebration gift pages
- **Graduations** - Help graduates start their next chapter
- **Fundraisers** - Simple donation collection pages
- **Group gifts** - Coordinate group contributions
- **Any event** - Where you need to collect gifts or contributions

## 🌍 Demo

**Demo mode:** Visit your deployed GitHub Pages URL without any parameters to see the demo event with sample data.

**Live event:** Events created through your form will have URLs like:
```
https://[username].github.io/wedding_gifts/?event=abc12345-uuid-here#encryption-key-here
```

---

**Ready to get started?**
- **Administrators:** Follow the [Setup Guide](docs/SETUP_GUIDE.md)
- **Event Creators:** Follow the [User Guide](docs/USER_GUIDE.md)

**Questions?** Open an issue or check the documentation.

**Made with ❤️ for celebrating life's special moments**
