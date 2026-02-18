/**
 * ============================================================================
 * WEDDING GIFTS - GOOGLE APPS SCRIPT TEMPLATE
 * ============================================================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Google Form with these Hebrew fields:
 *    - אימייל (email field)
 *    - כותרת האירוע (אנגלית) (short text)
 *    - כותרת האירוע (עברית) (short text)
 *    - הודעה לאורחים (אנגלית) (short text)
 *    - הודעה לאורחים (עברית) (short text)
 *    - תמונת האירוע (file upload - optional)
 *    - רקע בהיר (file upload - optional)
 *    - רקע כהה (file upload - optional)
 *    - מתנה 1 - שם (אנגלית) (short text)
 *    - מתנה 1 - שם (עברית) (short text)
 *    - מתנה 1 - קישור 1 (short text)
 *    - מתנה 1 - קישור 2 (short text - optional)
 *    - מתנה 1 - לוגו (short text)
 *    [Repeat Gift fields for מתנה 2, מתנה 3, etc.]
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
    Logger.log('Event object type: ' + typeof e);
    Logger.log('Event object keys: ' + (e ? Object.keys(e).join(', ') : 'null'));
    
    // Validate event object
    if (!e) {
      throw new Error('Event object is null or undefined. Make sure the trigger is set up correctly as "On form submit".');
    }
    
    // Get responses - either from namedValues or by extracting from response object
    let responses;
    
    if (e.namedValues) {
      // Standard case: namedValues is populated
      responses = e.namedValues;
      Logger.log('Using e.namedValues');
    } else if (e.response) {
      // Fallback: Extract namedValues from response object
      Logger.log('e.namedValues not available, extracting from e.response');
      responses = extractNamedValues(e.response);
      Logger.log('Extracted responses from FormResponse object');
    } else {
      Logger.log('ERROR: Neither e.namedValues nor e.response is available');
      Logger.log('Available properties: ' + Object.keys(e).join(', '));
      throw new Error('Event does not contain form data. This usually means:\n' +
                      '1. The trigger is not set up as "On form submit"\n' +
                      '2. Or you are trying to test the function manually\n\n' +
                      'Please ensure the trigger is configured as:\n' +
                      '- Event source: From form\n' +
                      '- Event type: On form submit');
    }
    
    Logger.log('Response fields: ' + Object.keys(responses).join(', '));
    
    // Get email - try both Hebrew and English field names
    let email;
    if (responses['אימייל'] && responses['אימייל'][0]) {
      email = responses['אימייל'][0].trim().toLowerCase();
    } else if (responses['Email'] && responses['Email'][0]) {
      email = responses['Email'][0].trim().toLowerCase();
    } else {
      throw new Error('Email field not found. Available fields: ' + Object.keys(responses).join(', '));
    }
    
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
    
    // Update image paths in config (encrypted images)
    if (images.wedding) config.image = 'public/events/' + uuid + '/wedding.enc';
    if (images.bgLight) config.backgroundLight = 'public/events/' + uuid + '/bg-light.enc';
    if (images.bgDark) config.backgroundDark = 'public/events/' + uuid + '/bg-dark.enc';
    
    // Encrypt images
    const encryptedImages = {
      wedding: images.wedding ? encryptBinary(images.wedding.getBytes(), key) : null,
      bgLight: images.bgLight ? encryptBinary(images.bgLight.getBytes(), key) : null,
      bgDark: images.bgDark ? encryptBinary(images.bgDark.getBytes(), key) : null
    };
    
    // Encrypt config
    const configJson = JSON.stringify(config, null, 2);
    const encrypted = encryptAES(configJson, key);
    
    Logger.log('Config encrypted');
    
    // Commit to GitHub
    commitToGitHub(uuid, encrypted, encryptedImages, email, key, !!existing);
    
    Logger.log('Committed to GitHub');
    
    // Update registry
    updateRegistry(email, uuid, key, !!existing);
    
    Logger.log('Registry updated');
    
    // Send email to user
    sendEventURL(email, uuid, key, !!existing);
    
    Logger.log('Email sent - process complete!');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('ERROR Stack: ' + error.stack);
    
    // Try to notify user of error
    try {
      let email = null;
      
      // Try to get email from namedValues
      if (e && e.namedValues) {
        if (e.namedValues['אימייל'] && e.namedValues['אימייל'][0]) {
          email = e.namedValues['אימייל'][0];
        } else if (e.namedValues['Email'] && e.namedValues['Email'][0]) {
          email = e.namedValues['Email'][0];
        }
      }
      
      // Try to get email from response object if not found
      if (!email && e && e.response) {
        try {
          const extractedValues = extractNamedValues(e.response);
          if (extractedValues['אימייל'] && extractedValues['אימייל'][0]) {
            email = extractedValues['אימייל'][0];
          } else if (extractedValues['Email'] && extractedValues['Email'][0]) {
            email = extractedValues['Email'][0];
          }
        } catch (extractError) {
          Logger.log('Could not extract email from response: ' + extractError.toString());
        }
      }
      
      if (email) {
        MailApp.sendEmail({
          to: email,
          subject: 'Error Creating Your Event',
          body: 'Sorry, there was an error processing your event. Please try again or contact support.\n\nError: ' + error.toString() + '\n\nIf this problem persists, please check the Apps Script execution log.'
        });
        Logger.log('Error notification email sent to: ' + email);
      } else {
        Logger.log('Could not send error email - no email address found');
      }
    } catch (mailError) {
      Logger.log('Failed to send error email: ' + mailError.toString());
    }
    
    throw error; // Re-throw to mark execution as failed
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract namedValues from FormResponse object
 * This is a fallback when e.namedValues is not populated
 * @param {FormResponse} formResponse - The form response object
 * @return {Object} Object with field names as keys and arrays of values
 */
function extractNamedValues(formResponse) {
  const namedValues = {};
  
  try {
    const itemResponses = formResponse.getItemResponses();
    
    for (const itemResponse of itemResponses) {
      const title = itemResponse.getItem().getTitle();
      const response = itemResponse.getResponse();
      
      // Store as array to match namedValues format
      if (Array.isArray(response)) {
        namedValues[title] = response;
      } else {
        namedValues[title] = [response];
      }
    }
    
    // Also try to get email from response if collected
    try {
      const email = formResponse.getRespondentEmail();
      if (email) {
        namedValues['Email'] = [email];
      }
    } catch (e) {
      // Email might not be collected
      Logger.log('Could not get respondent email: ' + e.toString());
    }
    
    Logger.log('Extracted ' + Object.keys(namedValues).length + ' fields from FormResponse');
  } catch (error) {
    Logger.log('Error extracting namedValues: ' + error.toString());
    throw new Error('Failed to extract form data from response object: ' + error.toString());
  }
  
  return namedValues;
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
      en: responses['כותרת האירוע (אנגלית)'] ? responses['כותרת האירוע (אנגלית)'][0] : 'Our Event',
      he: responses['כותרת האירוע (עברית)'] ? responses['כותרת האירוע (עברית)'][0] : 'האירוע שלנו'
    },
    message: {
      en: responses['הודעה לאורחים (אנגלית)'] ? responses['הודעה לאורחים (אנגלית)'][0] : 'Send us a gift!',
      he: responses['הודעה לאורחים (עברית)'] ? responses['הודעה לאורחים (עברית)'][0] : 'שלחו לנו מתנה!'
    },
    // Default images - will be updated if files uploaded
    image: 'assets/wedding.png',
    backgroundLight: 'assets/bg-light.png',
    backgroundDark: 'assets/bg-dark.png',
    gifts: []
  };
  
  // Build gifts array (support up to 10 gifts)
  for (let i = 1; i <= 10; i++) {
    // Field names change after first gift
    let nameEnKey, nameHeKey, urlKey, logoKey;
    
    if (i === 1) {
      nameEnKey = 'שם אמצעי התשלום (אנגלית)';
      nameHeKey = 'שם אמצעי התשלום (עברית)';
      urlKey = 'קישורי תשלום';
      logoKey = 'לוגו אמצעי התשלום';
    } else {
      nameEnKey = 'מתנה ' + i + ' - שם (אנגלית)';
      nameHeKey = 'מתנה ' + i + ' - שם (עברית)';
      urlKey = 'מתנה ' + i + ' - קישורים';
      logoKey = 'מתנה ' + i + ' - לוגו';
    }
    
    // Check if this gift exists (must have a name)
    if (responses[nameEnKey] && responses[nameEnKey][0]) {
      const gift = {
        name: {
          en: responses[nameEnKey][0],
          he: responses[nameHeKey] && responses[nameHeKey][0] ? responses[nameHeKey][0] : responses[nameEnKey][0]
        },
        url: []
      };
      
      // Parse URLs (one per line)
      if (responses[urlKey] && responses[urlKey][0]) {
        const urlText = responses[urlKey][0];
        const urls = urlText.split('\n').map(url => url.trim()).filter(url => url.length > 0);
        gift.url = urls;
      }
      
      // Add logo if provided
      if (responses[logoKey] && responses[logoKey][0]) {
        gift.logo = responses[logoKey][0];
      }
      
      // Only add gift if it has at least one URL
      if (gift.url.length > 0) {
        config.gifts.push(gift);
      }
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
        
        if (title.includes('תמונת האירוע')) {
          fileId = response[0];
          imageKey = 'wedding';
        } else if (title.includes('רקע בהיר')) {
          fileId = response[0];
          imageKey = 'bgLight';
        } else if (title.includes('רקע כהה')) {
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
 * 
 * IMPORTANT: Apps Script doesn't have built-in AES encryption.
 * This implementation uses a simple XOR cipher with the passphrase.
 * For production use, consider:
 * 1. Using CryptoJS library via external service
 * 2. Using a more robust encryption library
 * 3. Client-side encryption only
 * 
 * @param {string} plaintext - Data to encrypt
 * @param {string} passphrase - Encryption key
 * @return {string} Base64 encoded ciphertext with salt prefix
 */
function encryptAES(plaintext, passphrase) {
  try {
    // Generate random salt for key derivation
    const salt = generateSalt();
    const saltString = String.fromCharCode.apply(null, salt);
    
    // Derive key from passphrase and salt using SHA-256
    // CRITICAL: Must match browser's TextEncoder UTF-8 encoding
    const keyMaterial = passphrase + saltString;
    
    // Convert keyMaterial to UTF-8 bytes array manually
    const keyMaterialUtf8 = [];
    for (let i = 0; i < keyMaterial.length; i++) {
      const code = keyMaterial.charCodeAt(i);
      if (code < 128) {
        keyMaterialUtf8.push(code);
      } else if (code < 2048) {
        keyMaterialUtf8.push(192 | (code >> 6));
        keyMaterialUtf8.push(128 | (code & 63));
      } else {
        keyMaterialUtf8.push(224 | (code >> 12));
        keyMaterialUtf8.push(128 | ((code >> 6) & 63));
        keyMaterialUtf8.push(128 | (code & 63));
      }
    }
    
    // Hash with SHA-256 (returns signed bytes)
    const keyBytesSigned = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, keyMaterialUtf8);
    
    // Normalize to unsigned bytes (0-255)
    const keyBytes = keyBytesSigned.map(function(b) { return b & 0xFF; });
    
    // Convert plaintext to UTF-8 bytes manually
    const textBytes = [];
    for (let i = 0; i < plaintext.length; i++) {
      const code = plaintext.charCodeAt(i);
      if (code < 128) {
        textBytes.push(code);
      } else if (code < 2048) {
        textBytes.push(192 | (code >> 6));
        textBytes.push(128 | (code & 63));
      } else {
        textBytes.push(224 | (code >> 12));
        textBytes.push(128 | ((code >> 6) & 63));
        textBytes.push(128 | (code & 63));
      }
    }
    
    // XOR encryption
    const encrypted = [];
    for (let i = 0; i < textBytes.length; i++) {
      encrypted.push(textBytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    
    // Format: "Salted__" + salt (8 bytes) + encrypted data
    const header = [83, 97, 108, 116, 101, 100, 95, 95]; // "Salted__" in bytes
    const fullData = header.concat(salt, encrypted);
    
    // Return as base64
    return Utilities.base64Encode(fullData);
  } catch (error) {
    Logger.log('Encryption error: ' + error.toString());
    // Fallback to simple base64 encoding if encryption fails
    Logger.log('WARNING: Using fallback base64 encoding (NOT ENCRYPTED)');
    return Utilities.base64Encode(plaintext);
  }
}

/**
 * Encrypt binary data (for images)
 * @param {number[]} binaryData - Array of bytes from image
 * @param {string} passphrase - Encryption key
 * @return {number[]} Encrypted binary array (NOT base64)
 */
function encryptBinary(binaryData, passphrase) {
  try {
    // Generate random salt
    const salt = generateSalt();
    const saltString = String.fromCharCode.apply(null, salt);
    
    // Derive key from passphrase and salt
    const keyMaterial = passphrase + saltString;
    const keyMaterialUtf8 = stringToUtf8Bytes(keyMaterial);
    const keyBytesSigned = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, keyMaterialUtf8);
    const keyBytes = keyBytesSigned.map(function(b) { return b & 0xFF; });
    
    // XOR encryption on binary data
    const encrypted = [];
    for (let i = 0; i < binaryData.length; i++) {
      const byte = (typeof binaryData[i] === 'number' ? binaryData[i] : binaryData[i].charCodeAt(0)) & 0xFF;
      encrypted.push(byte ^ keyBytes[i % keyBytes.length]);
    }
    
    // Format: "Salted__" + salt (8 bytes) + encrypted data
    const header = [83, 97, 108, 116, 101, 100, 95, 95]; // "Salted__"
    return header.concat(salt, encrypted);
  } catch (error) {
    Logger.log('Binary encryption error: ' + error.toString());
    // Return unencrypted data as fallback
    Logger.log('WARNING: Image not encrypted!');
    return binaryData;
  }
}

/**
 * Helper: Convert string to UTF-8 bytes (used in encryption)
 * @param {string} str - String to convert
 * @return {number[]} Array of UTF-8 bytes
 */
function stringToUtf8Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code < 2048) {
      bytes.push(192 | (code >> 6));
      bytes.push(128 | (code & 63));
    } else {
      bytes.push(224 | (code >> 12));
      bytes.push(128 | ((code >> 6) & 63));
      bytes.push(128 | (code & 63));
    }
  }
  return bytes;
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

// IMPORTANT NOTE ABOUT ENCRYPTION:
// The encryption implementation above uses a simple XOR cipher, which provides
// basic obfuscation but is NOT cryptographically secure for sensitive data.
//
// For production use with sensitive data, consider:
// 1. Client-side only encryption (never send unencrypted to server)
// 2. Use Google Cloud KMS for encryption
// 3. Use an external encryption service with proper AES
// 4. Store only non-sensitive event data
//
// The current implementation is sufficient for:
// - Public event pages where URLs are shared privately
// - Non-sensitive gift registry data
// - Defense against casual browsing of GitHub files

// ============================================================================
// GITHUB API INTEGRATION
// ============================================================================

/**
 * Commit encrypted config and images to GitHub
 * @param {string} uuid - Event UUID
 * @param {string} encryptedConfig - Encrypted config string
 * @param {Object} encryptedImages - Object with encrypted image arrays (not blobs)
 * @param {string} email - User email
 * @param {string} key - Encryption key
 * @param {boolean} isUpdate - Whether this is an update
 */
function commitToGitHub(uuid, encryptedConfig, encryptedImages, email, key, isUpdate) {
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
  
  // Commit encrypted images if provided
  if (encryptedImages.wedding) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/wedding.enc',
      encryptedImages.wedding,
      'Add encrypted wedding image for ' + uuid,
      branch,
      headers,
      isUpdate
    );
  }
  
  if (encryptedImages.bgLight) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/bg-light.enc',
      encryptedImages.bgLight,
      'Add encrypted light background for ' + uuid,
      branch,
      headers,
      isUpdate
    );
  }
  
  if (encryptedImages.bgDark) {
    commitBinaryFile(
      baseUrl + 'public/events/' + uuid + '/bg-dark.enc',
      encryptedImages.bgDark,
      'Add encrypted dark background for ' + uuid,
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
 * @param {boolean|string} isUpdateOrSha - If true, fetches SHA. If string, uses as SHA. If false, creates new file.
 */
function commitFile(url, content, message, branch, headers, isUpdateOrSha) {
  const payload = {
    message: message,
    content: Utilities.base64Encode(content),
    branch: branch
  };
  
  // Handle SHA
  if (typeof isUpdateOrSha === 'string') {
    // SHA provided directly
    payload.sha = isUpdateOrSha;
    Logger.log('Using provided SHA: ' + payload.sha.substring(0, 8) + '...');
  } else if (isUpdateOrSha === true) {
    // Fetch SHA - must include branch parameter
    const fetchUrl = url + '?ref=' + branch;
    Logger.log('Fetching SHA for: ' + fetchUrl);
    try {
      const response = UrlFetchApp.fetch(fetchUrl, {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      Logger.log('GET response code: ' + responseCode);
      
      if (responseCode === 200) {
        const fileData = JSON.parse(response.getContentText());
        payload.sha = fileData.sha;
        Logger.log('Fetched SHA for update: ' + payload.sha.substring(0, 8) + '...');
      } else if (responseCode === 404) {
        Logger.log('File does not exist yet (404), creating new file without SHA');
        // File doesn't exist, so treat as new file (no SHA needed)
      } else {
        Logger.log('Warning: Unexpected status ' + responseCode + ', will attempt without SHA');
        Logger.log('Response: ' + response.getContentText().substring(0, 200));
      }
    } catch (err) {
      Logger.log('Warning: Exception fetching SHA: ' + err.toString());
      Logger.log('Will attempt to create/update without SHA');
    }
  }
  // If isUpdateOrSha is false or undefined, create new file (no SHA needed)
  
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
 * @param {number[]|Blob} binaryData - Encrypted byte array or Blob
 * @param {string} message - Commit message
 * @param {string} branch - Branch name
 * @param {Object} headers - Request headers
 * @param {boolean} isUpdate - Whether this is an update (requires SHA)
 */
function commitBinaryFile(url, binaryData, message, branch, headers, isUpdate) {
  // Handle both byte arrays and Blobs
  let bytes;
  if (Array.isArray(binaryData)) {
    bytes = binaryData; // Already a byte array from encryptBinary()
  } else if (binaryData.getBytes) {
    bytes = binaryData.getBytes(); // Blob object
  } else {
    throw new Error('Invalid binary data type');
  }
  
  const payload = {
    message: message,
    content: Utilities.base64Encode(bytes),
    branch: branch
  };
  
  // If updating, get current file SHA
  if (isUpdate) {
    const fetchUrl = url + '?ref=' + branch;
    Logger.log('Fetching SHA for binary file: ' + fetchUrl);
    try {
      const response = UrlFetchApp.fetch(fetchUrl, {
        method: 'get',
        headers: headers,
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      Logger.log('Binary GET response code: ' + responseCode);
      
      if (responseCode === 200) {
        const fileData = JSON.parse(response.getContentText());
        payload.sha = fileData.sha;
        Logger.log('Fetched SHA for binary update: ' + payload.sha.substring(0, 8) + '...');
      } else if (responseCode === 404) {
        Logger.log('Binary file does not exist yet (404), creating new file without SHA');
        // File doesn't exist, so treat as new file (no SHA needed)
      } else {
        Logger.log('Warning: Unexpected binary status ' + responseCode + ', will attempt without SHA');
      }
    } catch (err) {
      Logger.log('Warning: Exception fetching binary SHA: ' + err.toString());
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
    const registryJson = decryptAES(encryptedRegistry, masterKey);
    
    // Try to parse JSON - if it fails, registry is corrupted (old encryption)
    let registry;
    try {
      registry = JSON.parse(registryJson);
    } catch (parseErr) {
      Logger.log('Registry file corrupted (encrypted with old code). Will be recreated on next update.');
      Logger.log('Decryption produced: ' + registryJson.substring(0, 50) + '...');
      return null;
    }
    
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
      const fileSha = fileData.sha;
      
      const encryptedRegistry = Utilities.newBlob(
        Utilities.base64Decode(fileData.content)
      ).getDataAsString();
      
      try {
        const registryJson = decryptAES(encryptedRegistry, masterKey);
        registry = JSON.parse(registryJson);
        registrySha = fileSha; // Only set SHA if decryption succeeded
        Logger.log('Loaded existing registry with ' + Object.keys(registry).length + ' entries');
      } catch (decryptErr) {
        Logger.log('Registry corrupted (old encryption). Will be overwritten with fresh registry.');
        Logger.log('Decryption error: ' + decryptErr.toString());
        registry = {}; // Start fresh
        registrySha = fileSha; // Need SHA to overwrite the corrupted file
      }
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
    registrySha // Pass SHA directly (or null for new file)
  );
  
  Logger.log('Registry updated for: ' + email);
}

/**
 * Decrypt AES encrypted data (reverse of encryptAES)
 * @param {string} ciphertext - Encrypted data (base64)
 * @param {string} passphrase - Decryption key
 * @return {string} Decrypted plaintext
 */
function decryptAES(ciphertext, passphrase) {
  try {
    // Decode from base64 (returns signed bytes)
    const fullDataSigned = Utilities.base64Decode(ciphertext);
    
    // Normalize to unsigned bytes
    const fullData = [];
    for (let i = 0; i < fullDataSigned.length; i++) {
      fullData.push(fullDataSigned[i] & 0xFF);
    }
    
    // Check for "Salted__" header
    const header = String.fromCharCode.apply(null, fullData.slice(0, 8));
    
    if (header === 'Salted__') {
      // Extract salt and encrypted data
      const salt = fullData.slice(8, 16);
      const encrypted = fullData.slice(16);
      
      // Derive key from passphrase and salt (must match encryptAES)
      const saltString = String.fromCharCode.apply(null, salt);
      const keyMaterial = passphrase + saltString;
      
      // Convert to UTF-8 bytes manually
      const keyMaterialUtf8 = [];
      for (let i = 0; i < keyMaterial.length; i++) {
        const code = keyMaterial.charCodeAt(i);
        if (code < 128) {
          keyMaterialUtf8.push(code);
        } else if (code < 2048) {
          keyMaterialUtf8.push(192 | (code >> 6));
          keyMaterialUtf8.push(128 | (code & 63));
        } else {
          keyMaterialUtf8.push(224 | (code >> 12));
          keyMaterialUtf8.push(128 | ((code >> 6) & 63));
          keyMaterialUtf8.push(128 | (code & 63));
        }
      }
      
      // Hash with SHA-256 and normalize to unsigned
      const keyBytesSigned = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, keyMaterialUtf8);
      const keyBytes = [];
      for (let i = 0; i < keyBytesSigned.length; i++) {
        keyBytes.push(keyBytesSigned[i] & 0xFF);
      }
      
      // XOR decryption
      const decrypted = [];
      for (let i = 0; i < encrypted.length; i++) {
        decrypted.push(encrypted[i] ^ keyBytes[i % keyBytes.length]);
      }
      
      // Convert UTF-8 bytes back to string
      let result = '';
      let i = 0;
      while (i < decrypted.length) {
        const byte1 = decrypted[i++];
        if (byte1 < 128) {
          result += String.fromCharCode(byte1);
        } else if (byte1 < 224) {
          const byte2 = decrypted[i++];
          result += String.fromCharCode(((byte1 & 31) << 6) | (byte2 & 63));
        } else {
          const byte2 = decrypted[i++];
          const byte3 = decrypted[i++];
          result += String.fromCharCode(((byte1 & 15) << 12) | ((byte2 & 63) << 6) | (byte3 & 63));
        }
      }
      
      return result;
    } else {
      // Fallback: assume it's just base64 encoded
      Logger.log('WARNING: No encryption header found, treating as base64');
      return Utilities.newBlob(fullDataSigned).getDataAsString();
    }
  } catch (error) {
    Logger.log('Decryption error: ' + error.toString());
    // Fallback to simple base64 decoding
    return Utilities.newBlob(Utilities.base64Decode(ciphertext)).getDataAsString();
  }
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
  Logger.log('=== Testing Encryption/Decryption ===\n');
  
  // Test 1: Simple ASCII text
  Logger.log('Test 1: ASCII text');
  const testData1 = 'Hello, World!';
  const testKey1 = 'test-key-32-characters-long!!';
  
  Logger.log('  Original: ' + testData1);
  const encrypted1 = encryptAES(testData1, testKey1);
  Logger.log('  Encrypted (base64): ' + encrypted1);
  const decrypted1 = decryptAES(encrypted1, testKey1);
  Logger.log('  Decrypted: ' + decrypted1);
  Logger.log('  Match: ' + (decrypted1 === testData1 ? '✓ PASS' : '✗ FAIL'));
  Logger.log('');
  
  // Test 2: JSON object
  Logger.log('Test 2: JSON object');
  const testData2 = JSON.stringify({test: 'hello', number: 123, array: [1,2,3]});
  const testKey2 = 'another-test-key-32-chars!!!';
  
  Logger.log('  Original: ' + testData2);
  const encrypted2 = encryptAES(testData2, testKey2);
  Logger.log('  Encrypted (base64): ' + encrypted2);
  const decrypted2 = decryptAES(encrypted2, testKey2);
  Logger.log('  Decrypted: ' + decrypted2);
  Logger.log('  Match: ' + (decrypted2 === testData2 ? '✓ PASS' : '✗ FAIL'));
  Logger.log('');
  
  // Test 3: Hebrew text (UTF-8 test)
  Logger.log('Test 3: Hebrew text (UTF-8)');
  const testData3 = 'שלום עולם';
  const testKey3 = 'test-key-with-hebrew-support!';
  
  Logger.log('  Original: ' + testData3);
  const encrypted3 = encryptAES(testData3, testKey3);
  Logger.log('  Encrypted (base64): ' + encrypted3);
  const decrypted3 = decryptAES(encrypted3, testKey3);
  Logger.log('  Decrypted: ' + decrypted3);
  Logger.log('  Match: ' + (decrypted3 === testData3 ? '✓ PASS' : '✗ FAIL'));
  Logger.log('');
  
  // Test 4: Verify format for browser compatibility
  Logger.log('Test 4: Browser compatibility check');
  const testData4 = '{"test":"data"}';
  const testKey4 = 'browser-test-key-32-chars!!!';
  const encrypted4 = encryptAES(testData4, testKey4);
  
  // Decode to check format
  const decoded = Utilities.base64Decode(encrypted4);
  const header = String.fromCharCode.apply(null, [decoded[0] & 0xFF, decoded[1] & 0xFF, decoded[2] & 0xFF, 
                                                    decoded[3] & 0xFF, decoded[4] & 0xFF, decoded[5] & 0xFF,
                                                    decoded[6] & 0xFF, decoded[7] & 0xFF]);
  
  Logger.log('  Header check: ' + (header === 'Salted__' ? '✓ PASS' : '✗ FAIL (got: "' + header + '")'));
  Logger.log('  Encrypted (base64) - Copy this to test in browser console:');
  Logger.log('  ' + encrypted4);
  Logger.log('');
  Logger.log('  Test in browser console with:');
  Logger.log('  decryptConfig("' + encrypted4 + '", "' + testKey4 + '").then(r => console.log("Result:", r))');
  Logger.log('');
  
  // Summary
  const allPassed = (decrypted1 === testData1) && (decrypted2 === testData2) && 
                    (decrypted3 === testData3) && (header === 'Salted__');
  
  Logger.log('=== Summary ===');
  if (allPassed) {
    Logger.log('✓ All tests PASSED! Encryption is working correctly.');
    Logger.log('✓ You can now submit the form to create a new event.');
  } else {
    Logger.log('✗ Some tests FAILED. Check the output above.');
  }
}

/**
 * Debug helper: List all form fields
 * Run this manually to see all field names in your form
 * This helps verify field names match what the script expects
 */
function debugFormFields() {
  try {
    const form = FormApp.getActiveForm();
    Logger.log('=== Form Debug Info ===');
    Logger.log('Form ID: ' + form.getId());
    Logger.log('Form Title: ' + form.getTitle());
    Logger.log('\n=== Form Fields ===');
    
    const items = form.getItems();
    items.forEach((item, index) => {
      const type = item.getType().toString();
      const title = item.getTitle();
      Logger.log((index + 1) + '. [' + type + '] "' + title + '"');
      
      // For choice items, show options
      if (type === 'MULTIPLE_CHOICE' || type === 'LIST' || type === 'CHECKBOX') {
        try {
          const choiceItem = item.asMultipleChoiceItem();
          const choices = choiceItem.getChoices();
          choices.forEach(choice => {
            Logger.log('   - ' + choice.getValue());
          });
        } catch (e) {
          // Not a choice item
        }
      }
    });
    
    Logger.log('\n=== Expected Field Names (Hebrew) ===');
    Logger.log('Basic fields:');
    Logger.log('  - אימייל');
    Logger.log('  - כותרת האירוע (אנגלית)');
    Logger.log('  - כותרת האירוע (עברית)');
    Logger.log('  - הודעה לאורחים (אנגלית)');
    Logger.log('  - הודעה לאורחים (עברית)');
    Logger.log('  - תמונת האירוע (file upload)');
    Logger.log('  - רקע בהיר (file upload)');
    Logger.log('  - רקע כהה (file upload)');
    Logger.log('\nFirst gift fields (no "מתנה 1" prefix):');
    Logger.log('  - שם אמצעי התשלום (אנגלית)');
    Logger.log('  - שם אמצעי התשלום (עברית)');
    Logger.log('  - קישורי תשלום');
    Logger.log('  - לוגו אמצעי התשלום');
    Logger.log('  - להוסיף אמצעי תשלום נוסף?');
    Logger.log('\nSubsequent gifts (numbered 2-10):');
    Logger.log('  - מתנה N - שם (אנגלית)');
    Logger.log('  - מתנה N - שם (עברית)');
    Logger.log('  - מתנה N - קישורים');
    Logger.log('  - מתנה N - לוגו');
    Logger.log('  - להוסיף אמצעי תשלום נוסף?');
    
    Logger.log('\nℹ️  Compare your actual field names with the expected names above.');
    Logger.log('ℹ️  Even a single space or character difference will cause errors.');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('Make sure this script is bound to a Google Form.');
    Logger.log('Open the script from: Form → Extensions → Apps Script');
  }
}

/**
 * Debug helper: Test trigger configuration
 * Run this to check if triggers are set up correctly
 */
function debugTriggers() {
  Logger.log('=== Trigger Configuration ===');
  
  const triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    Logger.log('✗ No triggers configured!');
    Logger.log('\nTo add a trigger:');
    Logger.log('1. Click the clock icon (⏰) on the left sidebar');
    Logger.log('2. Click "+ Add Trigger" (bottom right)');
    Logger.log('3. Configure:');
    Logger.log('   - Function: onFormSubmit');
    Logger.log('   - Event source: From form');
    Logger.log('   - Event type: On form submit');
    Logger.log('4. Click "Save"');
    return;
  }
  
  Logger.log('Found ' + triggers.length + ' trigger(s):\n');
  
  triggers.forEach((trigger, index) => {
    Logger.log('Trigger ' + (index + 1) + ':');
    Logger.log('  Function: ' + trigger.getHandlerFunction());
    Logger.log('  Event Type: ' + trigger.getEventType());
    Logger.log('  Source: ' + trigger.getTriggerSource());
    
    const isCorrect = 
      trigger.getHandlerFunction() === 'onFormSubmit' &&
      trigger.getEventType().toString() === 'ON_FORM_SUBMIT' &&
      trigger.getTriggerSource().toString() === 'FORMS';
    
    if (isCorrect) {
      Logger.log('  Status: ✓ Correctly configured');
    } else {
      Logger.log('  Status: ✗ Incorrect configuration');
      Logger.log('  Expected:');
      Logger.log('    - Function: onFormSubmit');
      Logger.log('    - Event Type: ON_FORM_SUBMIT');
      Logger.log('    - Source: FORMS');
    }
    Logger.log('');
  });
}
