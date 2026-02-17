#!/usr/bin/env node

/**
 * Test Encryption Script
 * 
 * Creates a test encrypted config file for local testing of the multi-event platform.
 * Uses CryptoJS (same as frontend) to ensure compatibility.
 * 
 * Usage: node scripts/test-encryption.js
 */

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Generate random encryption key (32 characters)
function generateEncryptionKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Test event configuration
const testConfig = {
  eventId: 'test-event',
  fonts: {
    primary: "'Noto Sans Hebrew', sans-serif",
    secondary: "'Rubik', sans-serif"
  },
  title: {
    en: "Test Wedding Event",
    he: "אירוע חתונה לבדיקה"
  },
  message: {
    en: "This is a test event for local development and testing",
    he: "זהו אירוע בדיקה לפיתוח ובדיקה מקומית"
  },
  image: "assets/logo.png",
  backgroundLight: "assets/logo.png",
  backgroundDark: "assets/logo.png",
  gifts: [
    {
      name: { en: "Bit", he: "ביט" },
      url: ["https://bit.co.il"],
      logo: "https://www.bit.co.il/wp-content/uploads/2023/02/bit-logo.svg"
    },
    {
      name: { en: "PayBox", he: "פייבוקס" },
      url: ["https://payboxapp.page.link"],
      logo: "https://payboxapp.page.link/logo"
    },
    {
      name: { en: "PayPal", he: "פייפאל" },
      url: ["https://paypal.me/test"],
      logo: "https://www.paypalobjects.com/webstatic/icon/pp258.png"
    }
  ]
};

console.log('🔐 Wedding Gifts - Test Encryption Script\n');
console.log('=' .repeat(60));

// Generate UUID and encryption key
const uuid = uuidv4();
const key = generateEncryptionKey();

console.log('\n📋 Generated Test Event:');
console.log(`   UUID: ${uuid}`);
console.log(`   Encryption Key: ${key}`);

// Update config with UUID
testConfig.eventId = uuid;

// Encrypt the config
console.log('\n🔒 Encrypting configuration...');
const configJson = JSON.stringify(testConfig, null, 2);
const encrypted = CryptoJS.AES.encrypt(configJson, key).toString();

// Create directory structure
const projectRoot = path.join(__dirname, '..');
const eventDir = path.join(projectRoot, 'public', 'events', uuid);

console.log(`\n📁 Creating directory: public/events/${uuid}/`);
fs.mkdirSync(eventDir, { recursive: true });

// Write encrypted config
const configPath = path.join(eventDir, 'config.enc');
fs.writeFileSync(configPath, encrypted);
console.log(`✅ Encrypted config saved to: public/events/${uuid}/config.enc`);

// Display encrypted content preview
const preview = encrypted.substring(0, 80) + (encrypted.length > 80 ? '...' : '');
console.log(`   Preview: ${preview}`);

// Test decryption
console.log('\n🔓 Testing decryption...');
try {
  const decrypted = CryptoJS.AES.decrypt(encrypted, key);
  const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  const parsedConfig = JSON.parse(decryptedStr);
  
  if (parsedConfig.title && parsedConfig.message && parsedConfig.gifts) {
    console.log('✅ Decryption successful! Config is valid.');
    console.log(`   Title (EN): ${parsedConfig.title.en}`);
    console.log(`   Title (HE): ${parsedConfig.title.he}`);
    console.log(`   Gifts: ${parsedConfig.gifts.length} payment methods`);
  } else {
    console.log('❌ Decryption failed: Invalid config structure');
    process.exit(1);
  }
} catch (err) {
  console.log('❌ Decryption failed:', err.message);
  process.exit(1);
}

// Generate test URLs
console.log('\n🌐 Test URLs:');
console.log('=' .repeat(60));
console.log('\n📍 Local Development (with local server):');
console.log(`   http://localhost:8000/?event=${uuid}#${key}`);
console.log(`   http://localhost:3000/?event=${uuid}#${key}`);
console.log(`   http://127.0.0.1:8000/?event=${uuid}#${key}`);

console.log('\n📍 GitHub Pages (after deployment):');
console.log(`   https://YOUR_USERNAME.github.io/wedding_gifts/?event=${uuid}#${key}`);

console.log('\n📍 jsDelivr CDN (for testing CDN fetch):');
console.log(`   Config URL: https://cdn.jsdelivr.net/gh/YOUR_USERNAME/wedding_gifts@main/public/events/${uuid}/config.enc`);

console.log('\n💡 Tips:');
console.log('   • Start a local server: python -m http.server 8000');
console.log('   • Or use: npx serve public -p 3000');
console.log('   • The encryption key is in the URL hash (#) - never logged or sent to server');
console.log('   • Test with wrong key to verify error handling');

console.log('\n🔐 Security Note:');
console.log('   • Save the encryption key securely - it cannot be recovered!');
console.log('   • Without the key, the encrypted config is unreadable');
console.log(`   • Keyspace: 62^32 ≈ 2^190 possible combinations`);

console.log('\n' + '=' .repeat(60));
console.log('✅ Test encryption complete!\n');

// Save test info to a file for reference
const testInfo = {
  uuid,
  key,
  created: new Date().toISOString(),
  configPath: `public/events/${uuid}/config.enc`,
  testUrl: `http://localhost:8000/?event=${uuid}#${key}`,
  githubPagesUrl: `https://YOUR_USERNAME.github.io/wedding_gifts/?event=${uuid}#${key}`,
  cdnUrl: `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/wedding_gifts@main/public/events/${uuid}/config.enc`
};

const testInfoPath = path.join(eventDir, 'test-info.json');
fs.writeFileSync(testInfoPath, JSON.stringify(testInfo, null, 2));
console.log(`📝 Test info saved to: public/events/${uuid}/test-info.json\n`);
