# Registry Reader Tool

A command-line tool to decrypt and view the event registry.

## What It Does

The registry reader tool:
- Fetches the encrypted registry from GitHub
- Decrypts it using your MASTER_KEY
- Displays all events with their details
- Shows event URLs for easy access

## Setup

1. Make sure you have Node.js installed
2. Ensure `scripts/.env` has your `MASTER_KEY` set
3. Run the tool!

## Usage

```bash
# Using npm script (recommended)
npm run read-registry

# Or directly
node scripts/read-registry.js
```

## Example Output

```
🔍 Wedding Gifts Registry Reader

======================================================================
📦 Repository: AviH0/gifter
🌿 Branch: multi-event-encrypted
🔑 Master Key: sAv0eEHH...
======================================================================

📥 Fetching registry from GitHub...
✓ Registry fetched (543 bytes)

🔓 Decrypting registry...
✓ Registry decrypted successfully

======================================================================
📋 EVENT REGISTRY
======================================================================

Total events: 2

1. UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   Email: user@example.com
   Response ID: 2_ABaOnueXXXXX
   Created: 15/01/2024, 14:30
   Updated: 15/01/2024, 14:30
   URL: https://avih0.github.io/gifter/?event=a1b2c3d4-e5f6-7890-abcd-ef1234567890#key123

2. UUID: b2c3d4e5-f6g7-8901-bcde-f12345678901
   Email: another@example.com
   Response ID: 2_ABaOnueYYYYY
   Created: 16/01/2024, 09:15
   Updated: 16/01/2024, 10:20
   URL: https://avih0.github.io/gifter/?event=b2c3d4e5-f6g7-8901-bcde-f12345678901#key456

======================================================================
✓ Done! Found 2 event(s)
```

## Configuration

The tool reads settings from `scripts/.env`:

```env
MASTER_KEY=your-master-key-here
GITHUB_REPO=username/repo-name
GITHUB_BRANCH=main
SITE_URL=https://username.github.io/repo-name
```

## Troubleshooting

### "Failed to fetch registry"
- The registry file doesn't exist yet (no events created)
- Check that `GITHUB_REPO` and `GITHUB_BRANCH` are correct
- The file is at: `public/registry.enc` in your repo

### "Failed to decrypt registry"
- Your `MASTER_KEY` is incorrect
- Make sure it matches what's in Apps Script Properties
- The key is case-sensitive

### "No events found in registry"
- The registry exists but is empty
- This is normal if you haven't created any events yet

## Security Notes

- The tool uses AES-256-CBC decryption (matches CryptoJS format)
- Your MASTER_KEY is read from `.env` (not committed to git)
- The registry contains event UUIDs, emails, and encryption keys
- Keep your `.env` file secure!
