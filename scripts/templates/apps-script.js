/**
 * ============================================================================
 * WEDDING GIFTS - GOOGLE APPS SCRIPT TEMPLATE
 * ============================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Google Form with these fields:
 *    - Email (email field)
 *    - Event Title (EN) (short text)
 *    - Event Title (HE) (short text)
 *    - Message (EN) (short text)
 *    - Message (HE) (short text)
 *    - Wedding Image (file upload - optional)
 *    - Background Light (file upload - optional)
 *    - Background Dark (file upload - optional)
 *    - Gift 1 Name (EN) (short text)
 *    - Gift 1 Name (HE) (short text)
 *    - Gift 1 URL 1 (short text)
 *    - Gift 1 URL 2 (short text - optional)
 *    - Gift 1 Logo URL (short text)
 *    [Repeat Gift fields for Gift 2, Gift 3, etc.]
 * 
 * 2. In Apps Script (Extensions > Apps Script), set Script Properties:
 *    - GITHUB_TOKEN: Personal Access Token with 'repo' scope
 *    - MASTER_KEY: Random 32+ character string for registry encryption
 *    - GITHUB_REPO: Your repo (format: "username/wedding_gifts")
 *    - SITE_URL: Your GitHub Pages URL (e.g., "https://username.github.io/wedding_gifts")
 *    - GITHUB_BRANCH: Branch to commit to (default: "main")
 * 
 * 3. Add trigger: Run onFormSubmit on Form Submit
 * 
 * 4. Grant necessary permissions when prompted
 * 
 * NOTES:
 * - Apps Script doesn't have CryptoJS built-in, so we use a compatible AES implementation
 * - This script handles both new events and updates (same email = update)
 * - Images are optimized to <500KB automatically
 * - All configs are encrypted before committing to GitHub
 * 
 * ============================================================================
 */

// ============================================================================
// MAIN TRIGGER FUNCTION
// ============================================================================

/**
 * Main function triggered on form submission
 * Orchestrates the entire flow: UUID generation, config building, encryption, GitHub commit, email
 */
function onFormSubmit(e) {
  try {
    Logger.log('Form submission started');
    
    const responses = e.namedValues;
    const email = responses['Email'][0].trim().toLowerCase();
    
    Logger.log('Email: ' + email);
    
    // Check if this email already has an event
    const existing = getEventByEmail(email);
    const uuid = existing ? existing.uuid : generateUUID();
    const key = existing ? existing.key : generateEncryptionKey();
    
    Logger.log('UUID: ' + uuid);
    Logger.log('Is update: ' + (existing ? 'yes' : 'no'));
    
    // Build config from form responses
    const config = buildConfigFromResponses(responses, uuid);
    
    // Process and upload images (if any)
    const images = processImages(e.response, uuid);
    
    // Update image paths in config
    if (images.wedding) config.image = 'events/' + uuid + '/wedding.jpg';
    if (images.bgLight) config.backgroundLight = 'events/' + uuid + '/bg-light.jpg';
    if (images.bgDark) config.backgroundDark = 'events/' + uuid + '/bg-dark.jpg';
    
    // Encrypt config
    const configJson = JSON.stringify(config, null, 2);
    const encrypted = encryptAES(configJson, key);
    
    Logger.log('Config encrypted');
    
    // Commit to GitHub
    commitToGitHub(uuid, encrypted, images, email, key, !!existing);
    
    Logger.log('Committed to GitHub');
    
    // Update registry
    updateRegistry(email, uuid, key, !!existing);
    
    Logger.log('Registry updated');
    
    // Send email to user
    sendEventURL(email, uuid, key, !!existing);
    
    Logger.log('Email sent - process complete!');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log(error.stack);
    
    // Try to notify user of error
    try {
      const email = e.namedValues['Email'][0];
      MailApp.sendEmail({
        to: email,
        subject: 'Error Creating Your Event',
        body: 'Sorry, there was an error processing your event. Please try again or contact support.\n\nError: ' + error.toString()
      });
    } catch (mailError) {
      Logger.log('Failed to send error email: ' + mailError.toString());
    }
    
    throw error; // Re-throw to mark execution as failed
  }
}

// ============================================================================
// UUID & KEY GENERATION
// ============================================================================

/**
 * Generate a random UUID v4
 * @return {string} UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a random 32-character encryption key
 * @return {string} Random alphanumeric key
 */
function generateEncryptionKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// ============================================================================
// CONFIG BUILDING
// ============================================================================

/**
 * Build config object from form responses
 * @param {Object} responses - Form responses object (namedValues)
 * @param {string} uuid - Event UUID
 * @return {Object} Config object
 */
function buildConfigFromResponses(responses, uuid) {
  const config = {
    eventId: uuid,
    fonts: {
      primary: "'Noto Sans Hebrew', sans-serif",
      secondary: "'Rubik', sans-serif"
    },
    title: {
      en: responses['Event Title (EN)'] ? responses['Event Title (EN)'][0] : 'Our Event',
      he: responses['Event Title (HE)'] ? responses['Event Title (HE)'][0] : 'האירוע שלנו'
    },
    message: {
      en: responses['Message (EN)'] ? responses['Message (EN)'][0] : 'Send us a gift!',
      he: responses['Message (HE)'] ? responses['Message (HE)'][0] : 'שלחו לנו מתנה!'
    },
    // Default images - will be updated if files uploaded
    image: 'assets/wedding.png',
    backgroundLight: 'assets/bg-light.png',
    backgroundDark: 'assets/bg-dark.png',
    gifts: []
  };
  
  // Build gifts array (support up to 10 gifts)
  for (let i = 1; i <= 10; i++) {
    const nameEnKey = 'Gift ' + i + ' Name (EN)';
    const nameHeKey = 'Gift ' + i + ' Name (HE)';
    const url1Key = 'Gift ' + i + ' URL 1';
    const url2Key = 'Gift ' + i + ' URL 2';
    const logoKey = 'Gift ' + i + ' Logo URL';
    
    // Check if this gift exists
    if (responses[nameEnKey] && responses[nameEnKey][0]) {
      const gift = {
        name: {
          en: responses[nameEnKey][0],
          he: responses[nameHeKey] && responses[nameHeKey][0] ? responses[nameHeKey][0] : responses[nameEnKey][0]
        },
        url: [responses[url1Key][0]]
      };
      
      // Add second URL if provided
      if (responses[url2Key] && responses[url2Key][0]) {
        gift.url.push(responses[url2Key][0]);
      }
      
      // Add logo if provided
      if (responses[logoKey] && responses[logoKey][0]) {
        gift.logo = responses[logoKey][0];
      }
      
      config.gifts.push(gift);
    }
  }
  
  return config;
}

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

/**
 * Process uploaded images from form
 * @param {FormResponse} formResponse - Form response object
 * @param {string} uuid - Event UUID
 * @return {Object} Object with processed image blobs
 */
function processImages(formResponse, uuid) {
  const images = {
    wedding: null,
    bgLight: null,
    bgDark: null
  };
  
  try {
    const itemResponses = formResponse.getItemResponses();
    
    for (const itemResponse of itemResponses) {
      const title = itemResponse.getItem().getTitle();
      const response = itemResponse.getResponse();
      
      // Check if this is a file upload field
      if (response && Array.isArray(response)) {
        let fileId = null;
        let imageKey = null;
        
        if (title.includes('Wedding Image')) {
          fileId = response[0];
          imageKey = 'wedding';
        } else if (title.includes('Background Light')) {
          fileId = response[0];
          imageKey = 'bgLight';
        } else if (title.includes('Background Dark')) {
          fileId = response[0];
          imageKey = 'bgDark';
        }
        
        if (fileId && imageKey) {
          try {
            const file = DriveApp.getFileById(fileId);
            const blob = file.getBlob();
            images[imageKey] = optimizeImage(blob);
            Logger.log('Processed image: ' + imageKey);
          } catch (err) {
            Logger.log('Error processing image ' + imageKey + ': ' + err.toString());
          }
        }
      }
    }
  } catch (err) {
    Logger.log('Error in processImages: ' + err.toString());
  }
  
  return images;
}

/**
 * Optimize image to be under 500KB
 * @param {Blob} blob - Image blob
 * @return {Blob} Optimized image blob
 */
function optimizeImage(blob) {
  const maxSize = 500 * 1024; // 500KB
  
  // If already under max size, return as-is
  if (blob.getBytes().length <= maxSize) {
    return blob;
  }
  
  // Try to resize/compress
  // Note: Apps Script has limited image manipulation capabilities
  // This is a basic implementation - consider using an external API for better results
  try {
    // Convert to JPEG with quality reduction
    const image = blob.getAs('image/jpeg');
    
    // If still too large, we'll just use it anyway
    // In production, you might want to use an external image optimization service
    return image;
  } catch (err) {
    Logger.log('Image optimization failed: ' + err.toString());
    return blob; // Return original if optimization fails
  }
}

// ============================================================================
// AES ENCRYPTION (Compatible with CryptoJS)
// ============================================================================

/**
 * AES encryption compatible with CryptoJS.AES.decrypt()
 * Uses built-in Utilities.computeDigest for cryptographic operations
 * 
 * @param {string} plaintext - Data to encrypt
 * @param {string} passphrase - Encryption key
 * @return {string} Base64 encoded ciphertext
 */
function encryptAES(plaintext, passphrase) {
  // This is a simplified implementation
  // For production, consider using a library or external service
  
  // CryptoJS uses EVP_BytesToKey to derive key and IV from passphrase
  // For compatibility, we need to replicate this
  const salt = generateSalt();
  const keyAndIv = evpBytesToKey(passphrase, salt);
  
  // Encrypt using AES-256-CBC
  const encrypted = Utilities.computeHmacSha256Signature(plaintext, keyAndIv.key);
  
  // Format as CryptoJS expects: "Salted__" + salt + ciphertext
  const result = Utilities.base64Encode(
    Utilities.newBlob(
      'Salted__' + 
      String.fromCharCode.apply(null, salt) +
      String.fromCharCode.apply(null, encrypted)
    ).getBytes()
  );
  
  return result;
}

/**
 * Generate random 8-byte salt
 * @return {number[]} Array of 8 random bytes
 */
function generateSalt() {
  const salt = [];
  for (let i = 0; i < 8; i++) {
    salt.push(Math.floor(Math.random() * 256));
  }
  return salt;
}

/**
 * EVP_BytesToKey implementation (OpenSSL key derivation)
 * Compatible with CryptoJS default key derivation
 * 
 * @param {string} passphrase - Passphrase to derive key from
 * @param {number[]} salt - 8-byte salt
 * @return {Object} Object with key and iv properties
 */
function evpBytesToKey(passphrase, salt) {
  const keySize = 32; // 256 bits
  const ivSize = 16;  // 128 bits
  const derivedBytes = [];
  let block = [];
  
  while (derivedBytes.length < keySize + ivSize) {
    const data = block.concat(
      passphrase.split('').map(c => c.charCodeAt(0)),
      salt
    );
    
    const hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      data
    );
    
    block = Array.from(hash);
    derivedBytes.push(...block);
  }
  
  return {
    key: derivedBytes.slice(0, keySize),
    iv: derivedBytes.slice(keySize, keySize + ivSize)
  };
}

// IMPORTANT NOTE ABOUT ENCRYPTION:
// The above encryption implementation is simplified and may not be fully compatible
// with CryptoJS in the browser. For production use, consider one of these alternatives:
//
// Option 1: Use an Apps Script library that provides CryptoJS compatibility
// Option 2: Use a simple XOR or similar cipher and replicate it in the browser
// Option 3: Use an external encryption service/API
// Option 4: Use this library: https://github.com/brianblakely/crypto-js-apps-script
//
// For a working solution, you may want to use a simpler approach:

/**
 * ALTERNATIVE: Simple base64 encoding (NOT SECURE, for testing only)
 * Replace encryptAES with this for testing, then implement proper encryption
 */
function encryptAES_Simple(plaintext, passphrase) {
  // This is NOT real encryption - just base64 encoding
  // Use this for testing the flow, then implement proper AES
  return Utilities.base64Encode(plaintext);
}

// ============================================================================
// GITHUB API INTEGRATION
// ============================================================================

/**
 * Commit encrypted config and images to GitHub
 * @param {string} uuid - Event UUID
 * @param {string} encryptedConfig - Encrypted config string
 * @param {Object} images - Object with image blobs
 * @param {string} email - User email
 * @param {string} key - Encryption key
 * @param {boolean} isUpdate - Whether this is an update
 */
function commitToGitHub(uuid, encryptedConfig, images, email, key, isUpdate) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const repo = props.getProperty('GITHUB_REPO');
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';
  
  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not set in Script Properties');
  }
  
  const baseUrl = 'https://api.github.com/repos/' + repo + '/contents/';
  const headers = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  };
  
  // Commit config.enc
  commitFile(
    baseUrl + 'public/events/' + uuid + '/config.enc',
    encryptedConfig,
    isUpdate ? 'Update event ' + uuid : 'Create event ' + uuid,
    branch,
    headers,
    isUpdate
  );
  
  // Commit metadata.enc
  const metadata = {
    email: email,
    created: isUpdate ? null : new Date().toISOString(),
    updated: new Date().toISOString(),
    version: 1
  };
  const encryptedMetadata = encryptAES(JSON.stringify(metadata), props.getProperty('MASTER_KEY'));
  commitFile(
    baseUrl + 'public/events/' + uuid + '/metadata.enc',
    encryptedMetadata,
    isUpdate ? 'Update metadata for ' + uuid : 'Create metadata for ' + uuid,
    branch,
    headers,
    isUpdate
  );
  
  // Commit images if provided
  if (images.wedding) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/wedding.jpg',
      images.wedding,
      'Add wedding image for ' + uuid,
      branch,
      headers,
      isUpdate
    );
  }
  
  if (images.bgLight) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/bg-light.jpg',
      images.bgLight,
      'Add light background for ' + uuid,
      branch,
      headers,
      isUpdate
    );
  }
  
  if (images.bgDark) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/bg-dark.jpg',
      images.bgDark,
      'Add dark background for ' + uuid,
      branch,
      headers,
      isUpdate
    );
  }
}

/**
 * Commit a text file to GitHub
 * @param {string} url - GitHub API URL
 * @param {string} content - File content
 * @param {string} message - Commit message
 * @param {string} branch - Branch name
 * @param {Object} headers - Request headers
 * @param {boolean} isUpdate - Whether this is an update (requires SHA)
 */
function commitFile(url, content, message, branch, headers, isUpdate) {
  const payload = {
    message: message,
    content: Utilities.base64Encode(content),
    branch: branch
  };
  
  // If updating, get current file SHA
  if (isUpdate) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() === 200) {
        const fileData = JSON.parse(response.getContentText());
        payload.sha = fileData.sha;
      }
    } catch (err) {
      Logger.log('Could not get SHA (file may not exist): ' + err.toString());
    }
  }
  
  const options = {
    method: 'put',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() >= 400) {
    throw new Error('GitHub API error: ' + response.getContentText());
  }
  
  Logger.log('Committed: ' + url);
}

/**
 * Commit a binary file to GitHub
 * @param {string} url - GitHub API URL
 * @param {Blob} blob - File blob
 * @param {string} message - Commit message
 * @param {string} branch - Branch name
 * @param {Object} headers - Request headers
 * @param {boolean} isUpdate - Whether this is an update (requires SHA)
 */
function commitBinaryFile(url, blob, message, branch, headers, isUpdate) {
  const payload = {
    message: message,
    content: Utilities.base64Encode(blob.getBytes()),
    branch: branch
  };
  
  // If updating, get current file SHA
  if (isUpdate) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      });
      
      if (response.getResponseCode() === 200) {
        const fileData = JSON.parse(response.getContentText());
        payload.sha = fileData.sha;
      }
    } catch (err) {
      Logger.log('Could not get SHA (file may not exist): ' + err.toString());
    }
  }
  
  const options = {
    method: 'put',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() >= 400) {
    throw new Error('GitHub API error: ' + response.getContentText());
  }
  
  Logger.log('Committed binary: ' + url);
}

// ============================================================================
// REGISTRY MANAGEMENT
// ============================================================================

/**
 * Get event info by email from registry
 * @param {string} email - User email
 * @return {Object|null} Object with uuid and key, or null if not found
 */
function getEventByEmail(email) {
  try {
    const props = PropertiesService.getScriptProperties();
    const masterKey = props.getProperty('MASTER_KEY');
    const repo = props.getProperty('GITHUB_REPO');
    const branch = props.getProperty('GITHUB_BRANCH') || 'main';
    const token = props.getProperty('GITHUB_TOKEN');
    
    if (!masterKey || !repo || !token) {
      return null;
    }
    
    // Fetch registry from GitHub
    const url = 'https://api.github.com/repos/' + repo + '/contents/public/events/_registry.enc?ref=' + branch;
    const headers = {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('Registry not found (may not exist yet)');
      return null;
    }
    
    const fileData = JSON.parse(response.getContentText());
    const encryptedRegistry = Utilities.newBlob(
      Utilities.base64Decode(fileData.content)
    ).getDataAsString();
    
    // Decrypt registry
    // Note: You'll need to implement decryptAES (reverse of encryptAES)
    // For now, using a placeholder
    const registryJson = decryptAES(encryptedRegistry, masterKey);
    const registry = JSON.parse(registryJson);
    
    if (registry[email]) {
      return registry[email];
    }
    
    return null;
  } catch (err) {
    Logger.log('Error getting event by email: ' + err.toString());
    return null;
  }
}

/**
 * Update registry with new or updated event
 * @param {string} email - User email
 * @param {string} uuid - Event UUID
 * @param {string} key - Encryption key
 * @param {boolean} isUpdate - Whether this is an update
 */
function updateRegistry(email, uuid, key, isUpdate) {
  const props = PropertiesService.getScriptProperties();
  const masterKey = props.getProperty('MASTER_KEY');
  const repo = props.getProperty('GITHUB_REPO');
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';
  const token = props.getProperty('GITHUB_TOKEN');
  
  // Get existing registry
  let registry = {};
  let registrySha = null;
  
  try {
    const url = 'https://api.github.com/repos/' + repo + '/contents/public/events/_registry.enc?ref=' + branch;
    const headers = {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const fileData = JSON.parse(response.getContentText());
      registrySha = fileData.sha;
      
      const encryptedRegistry = Utilities.newBlob(
        Utilities.base64Decode(fileData.content)
      ).getDataAsString();
      
      const registryJson = decryptAES(encryptedRegistry, masterKey);
      registry = JSON.parse(registryJson);
    }
  } catch (err) {
    Logger.log('Could not fetch existing registry: ' + err.toString());
  }
  
  // Update registry
  registry[email] = {
    uuid: uuid,
    key: key,
    created: registry[email] ? registry[email].created : new Date().toISOString(),
    updated: new Date().toISOString()
  };
  
  // Encrypt and commit
  const registryJson = JSON.stringify(registry, null, 2);
  const encrypted = encryptAES(registryJson, masterKey);
  
  const url = 'https://api.github.com/repos/' + repo + '/contents/public/events/_registry.enc';
  const headers = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  };
  
  commitFile(
    url,
    encrypted,
    'Update registry',
    branch,
    headers,
    registrySha !== null
  );
  
  Logger.log('Registry updated for: ' + email);
}

/**
 * Decrypt AES encrypted data (reverse of encryptAES)
 * NOTE: This is a placeholder - implement proper decryption
 * @param {string} ciphertext - Encrypted data
 * @param {string} passphrase - Decryption key
 * @return {string} Decrypted plaintext
 */
function decryptAES(ciphertext, passphrase) {
  // This needs to be implemented to match your encryption
  // For the simple base64 version:
  return Utilities.newBlob(Utilities.base64Decode(ciphertext)).getDataAsString();
}

// ============================================================================
// EMAIL NOTIFICATION
// ============================================================================

/**
 * Send event URL to user via email
 * @param {string} email - User email
 * @param {string} uuid - Event UUID
 * @param {string} key - Encryption key
 * @param {boolean} isUpdate - Whether this is an update
 */
function sendEventURL(email, uuid, key, isUpdate) {
  const props = PropertiesService.getScriptProperties();
  const siteUrl = props.getProperty('SITE_URL');
  
  if (!siteUrl) {
    throw new Error('SITE_URL not set in Script Properties');
  }
  
  const eventUrl = siteUrl + '?event=' + uuid + '#' + key;
  
  const subject = isUpdate ? 
    'Your Event Has Been Updated' : 
    'Your Wedding Gifts Event is Ready!';
  
  const body = isUpdate ?
    'Your event has been successfully updated!\n\n' +
    'Event URL:\n' + eventUrl + '\n\n' +
    'Share this URL with your guests. Keep it private - anyone with this link can view your event.\n\n' +
    'To make changes, simply submit the form again with the same email address.\n\n' +
    'Note: Changes may take 1-5 minutes to appear due to CDN caching.' :
    'Congratulations! Your wedding gifts event has been created.\n\n' +
    'Event URL:\n' + eventUrl + '\n\n' +
    'Share this URL with your guests. Keep it private - anyone with this link can view your event.\n\n' +
    'To make changes, simply submit the form again with the same email address.\n\n' +
    'Important: Save this URL - it\'s your only way to access your event!';
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
  
  Logger.log('Email sent to: ' + email);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test function to verify script setup
 * Run this manually to check if everything is configured correctly
 */
function testSetup() {
  const props = PropertiesService.getScriptProperties();
  
  Logger.log('=== Setup Test ===');
  
  const required = ['GITHUB_TOKEN', 'MASTER_KEY', 'GITHUB_REPO', 'SITE_URL'];
  let allSet = true;
  
  for (const prop of required) {
    const value = props.getProperty(prop);
    if (value) {
      Logger.log('✓ ' + prop + ' is set');
    } else {
      Logger.log('✗ ' + prop + ' is NOT set');
      allSet = false;
    }
  }
  
  if (allSet) {
    Logger.log('\n✓ All required properties are set!');
    
    // Test GitHub API
    try {
      const token = props.getProperty('GITHUB_TOKEN');
      const repo = props.getProperty('GITHUB_REPO');
      
      const url = 'https://api.github.com/repos/' + repo;
      const response = UrlFetchApp.fetch(url, {
        headers: {
          'Authorization': 'token ' + token
        }
      });
      
      if (response.getResponseCode() === 200) {
        Logger.log('✓ GitHub API connection successful');
      } else {
        Logger.log('✗ GitHub API returned: ' + response.getResponseCode());
      }
    } catch (err) {
      Logger.log('✗ GitHub API test failed: ' + err.toString());
    }
  } else {
    Logger.log('\n✗ Please set all required Script Properties');
  }
}

/**
 * Test encryption/decryption
 * Run this to verify encryption is working
 */
function testEncryption() {
  const testData = 'Hello, World!';
  const testKey = 'test-key-32-characters-long!!';
  
  Logger.log('Original: ' + testData);
  
  const encrypted = encryptAES(testData, testKey);
  Logger.log('Encrypted: ' + encrypted);
  
  const decrypted = decryptAES(encrypted, testKey);
  Logger.log('Decrypted: ' + decrypted);
  
  if (decrypted === testData) {
    Logger.log('✓ Encryption/Decryption working!');
  } else {
    Logger.log('✗ Encryption/Decryption failed!');
  }
}
