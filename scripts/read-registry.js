#!/usr/bin/env node

/**
 * Registry Reader Tool
 * 
 * Reads and decrypts the event registry to show all existing events.
 * The registry is encrypted with the MASTER_KEY from .env file.
 * 
 * Usage:
 *   node scripts/read-registry.js
 *   npm run read-registry
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load environment variables from scripts/.env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found at scripts/.env');
    console.error('   Please create scripts/.env with MASTER_KEY and GITHUB_TOKEN');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

// Fetch file from GitHub
function fetchFromGitHub(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Wedding-Gifts-Registry-Reader'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Decrypt using Node.js crypto (matches CryptoJS AES format)
function decryptAES(ciphertext, passphrase) {
  try {
    // CryptoJS uses OpenSSL-compatible format: "Salted__" + 8-byte salt + encrypted data
    const combined = Buffer.from(ciphertext, 'base64');
    
    // Check for "Salted__" header
    const saltedPrefix = combined.slice(0, 8).toString('ascii');
    if (saltedPrefix !== 'Salted__') {
      throw new Error('Invalid encryption format (no Salted__ header)');
    }
    
    // Extract salt and ciphertext
    const salt = combined.slice(8, 16);
    const encrypted = combined.slice(16);
    
    // Derive key and IV using EVP_BytesToKey (matches CryptoJS default)
    // This is the OpenSSL key derivation used by CryptoJS
    const keyIv = evpBytesToKey(passphrase, salt, 32, 16); // 256-bit key, 128-bit IV
    
    // Decrypt with AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyIv.key, keyIv.iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf-8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// OpenSSL EVP_BytesToKey implementation (used by CryptoJS)
function evpBytesToKey(password, salt, keyLen, ivLen) {
  const keyIv = [];
  let prevHash = Buffer.alloc(0);
  
  while (keyIv.length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    hash.update(prevHash);
    hash.update(password);
    hash.update(salt);
    prevHash = hash.digest();
    keyIv.push(...prevHash);
  }
  
  const keyIvBuffer = Buffer.from(keyIv);
  return {
    key: keyIvBuffer.slice(0, keyLen),
    iv: keyIvBuffer.slice(keyLen, keyLen + ivLen)
  };
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Main function
async function main() {
  console.log('🔍 Wedding Gifts Registry Reader\n');
  console.log('=' .repeat(70));
  
  // Load environment
  const env = loadEnv();
  const masterKey = env.MASTER_KEY;
  const githubRepo = env.GITHUB_REPO || 'AviH0/gifter';
  const branch = env.GITHUB_BRANCH || 'main';
  
  if (!masterKey) {
    console.error('❌ Error: MASTER_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log(`📦 Repository: ${githubRepo}`);
  console.log(`🌿 Branch: ${branch}`);
  console.log(`🔑 Master Key: ${masterKey.substring(0, 8)}...`);
  console.log('=' .repeat(70) + '\n');
  
  // Fetch encrypted registry
  const registryUrl = `https://raw.githubusercontent.com/${githubRepo}/${branch}/public/events/_registry.enc`;
  console.log(`📥 Fetching registry from GitHub...`);
  
  let encryptedRegistry;
  try {
    encryptedRegistry = await fetchFromGitHub(registryUrl);
    console.log(`✓ Registry fetched (${encryptedRegistry.length} bytes)\n`);
  } catch (error) {
    console.error(`❌ Failed to fetch registry: ${error.message}`);
    console.error(`   URL: ${registryUrl}`);
    process.exit(1);
  }
  
  // Decrypt registry
  console.log('🔓 Decrypting registry...');
  let registry;
  try {
    const decrypted = decryptAES(encryptedRegistry, masterKey);
    registry = JSON.parse(decrypted);
    console.log(`✓ Registry decrypted successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to decrypt registry: ${error.message}`);
    console.error(`   This usually means the MASTER_KEY is incorrect`);
    process.exit(1);
  }
  
  // Display registry
  console.log('=' .repeat(70));
  console.log('📋 EVENT REGISTRY');
  console.log('=' .repeat(70) + '\n');
  
  const entries = Object.entries(registry);
  
  if (entries.length === 0) {
    console.log('   (No events found in registry)');
  } else {
    console.log(`Total events: ${entries.length}\n`);
    
    entries.forEach(([responseId, data], index) => {
      console.log(`${index + 1}. Response ID: ${responseId}`);
      console.log(`   UUID: ${data.uuid || 'N/A'}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Created: ${formatDate(data.created)}`);
      console.log(`   Updated: ${formatDate(data.updated)}`);
      
      // Generate event URL
      if (data.uuid && data.key) {
        const siteUrl = env.SITE_URL || 'https://avih0.github.io/gifter';
        const eventUrl = `${siteUrl}/?event=${data.uuid}#${data.key}`;
        console.log(`   URL: ${eventUrl}`);
      }
      
      console.log('');
    });
  }
  
  console.log('=' .repeat(70));
  console.log(`✓ Done! Found ${entries.length} event(s)`);
}

// Run
main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
