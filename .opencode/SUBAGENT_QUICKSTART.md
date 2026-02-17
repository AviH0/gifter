# Quick Reference for Subagents

## What This Is
Multi-event wedding gifts platform. Users create events via Google Forms, get encrypted URLs.

## Current Branch
`multi-event-encrypted` (DO NOT TOUCH master!)

## Key Files
- **.opencode/MASTER_PLAN.md** - Full project overview
- **.opencode/ARCHITECTURE.md** - Technical specs
- **.opencode/SUBAGENT_TASKS.md** - Implementation tasks

## Architecture
```
Google Form → Apps Script → GitHub (encrypted) → jsDelivr CDN → Browser decrypts
```

## Next Task
**Task 1:** Repository restructuring
- Create `public/` directory
- Move all existing web files into `public/`
- See SUBAGENT_TASKS.md for details

## Key Points
- AES-256 encryption with CryptoJS
- UUID + key in URL: `?event=[uuid]#[key]`
- Public repo but configs encrypted
- Demo config kept for backward compatibility

## Before You Start
1. Read task in SUBAGENT_TASKS.md
2. Check ARCHITECTURE.md for technical details
3. Implement & test
4. Commit on this branch only!
