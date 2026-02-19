/**
 * Decryption Utility for Apps Script AES-256 Encrypted Data
 * Compatible with CryptoJS AES encryption from Apps Script
 * 
 * This matches the encryption format from scripts/templates/apps-script.js
 * Supports both new AES-256 format and legacy XOR format for backward compatibility
 */

/**
 * Decrypt data encrypted by Apps Script encryptAES function
 * @param {string} ciphertext - Base64 encoded encrypted data (OpenSSL format from CryptoJS)
 * @param {string} passphrase - Decryption key
 * @return {Promise<string>} Decrypted plaintext
 */
async function decryptConfig(ciphertext, passphrase) {
  try {
    console.log('Attempting AES-256 decryption...');
    console.log('Ciphertext length:', ciphertext.length);
    console.log('Passphrase length:', passphrase.length);
    
    // Try CryptoJS AES decryption first (new format)
    try {
      const decrypted = CryptoJS.AES.decrypt(ciphertext, passphrase);
      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (plaintext && plaintext.length > 0) {
        console.log('✓ Successfully decrypted with AES-256');
        console.log('Decrypted length:', plaintext.length);
        return plaintext;
      }
      
      // If empty string, fall through to legacy method
      console.warn('AES decryption returned empty string, trying legacy XOR...');
    } catch (aesError) {
      console.warn('AES decryption failed, trying legacy XOR:', aesError.message);
    }
    
    // Fallback: Try legacy XOR decryption (for old events)
    return await decryptConfigLegacyXOR(ciphertext, passphrase);
    
  } catch (error) {
    console.error('All decryption methods failed:', error);
    // Final fallback: try simple base64 decode
    try {
      const decoded = atob(ciphertext);
      console.warn('Using base64 decode fallback');
      return decoded;
    } catch (e) {
      throw new Error('Failed to decrypt config: ' + error.message);
    }
  }
}

/**
 * ============================================================================
 * LEGACY XOR DECRYPTION (for backward compatibility with old events)
 * ============================================================================
 */

/**
 * Convert string to byte array
 */
function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

/**
 * Convert byte array to string
 */
function bytesToString(bytes) {
  return String.fromCharCode.apply(null, bytes);
}

/**
 * SHA-256 hash function (uses Web Crypto API)
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return new Uint8Array(hashBuffer);
}

/**
 * Decrypt data using legacy XOR method (for old events)
 */
async function decryptConfigLegacyXOR(ciphertext, passphrase) {
  try {
    console.log('Attempting legacy XOR decryption...');
    
    // Decode from base64
    const binaryString = atob(ciphertext);
    const fullData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fullData[i] = binaryString.charCodeAt(i);
    }
    
    // Check for "Salted__" header
    const header = bytesToString(fullData.slice(0, 8));
    
    if (header === 'Salted__') {
      // Extract salt and encrypted data
      const salt = fullData.slice(8, 16);
      const encrypted = fullData.slice(16);
      
      // Derive key from passphrase and salt
      const saltString = bytesToString(salt);
      const keyMaterial = passphrase + saltString;
      const keyBytes = await sha256(keyMaterial);
      
      // XOR decryption
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }
      
      // Convert to string
      const result = new TextDecoder().decode(decrypted);
      console.log('✓ Successfully decrypted with legacy XOR');
      return result;
    } else {
      // No header - just base64 encoded
      console.warn('No encryption header, treating as plain base64');
      return new TextDecoder().decode(fullData);
    }
  } catch (error) {
    console.error('Legacy XOR decryption failed:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * END LEGACY SUPPORT
 * ============================================================================
 */


/**
 * Load and decrypt event config
 * @param {string} eventId - Event UUID
 * @param {string} key - Encryption key from URL hash
 * @param {string} repo - GitHub repo in format "username/repo"
 * @param {string} branch - Git branch name
 * @return {Promise<Object>} Decrypted config object
 */
async function loadEventConfig(eventId, key, repo, branch) {
  // Try jsDelivr CDN first (with purge for fresh data)
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/public/events/${eventId}/config.enc`;
  
  try {
    const response = await fetch(cdnUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const encryptedText = await response.text();
    const decryptedJson = await decryptConfig(encryptedText, key);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Failed to load from CDN:', error);
    
    // Fallback to GitHub raw
    const githubUrl = `https://raw.githubusercontent.com/${repo}/${branch}/public/events/${eventId}/config.enc`;
    const response = await fetch(githubUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load event config: ${response.statusText}`);
    }
    
    const encryptedText = await response.text();
    const decryptedJson = await decryptConfig(encryptedText, key);
    return JSON.parse(decryptedJson);
  }
}

/**
 * Decrypt binary data (for images)
 * @param {string} base64Data - Base64 encoded encrypted image (OpenSSL format)
 * @param {string} passphrase - Decryption key
 * @return {Promise<Blob>} Decrypted image blob
 */
async function decryptImage(base64Data, passphrase) {
  try {
    console.log('Decrypting image, data length:', base64Data.length);
    
    // Try AES decryption first (new format)
    try {
      // Decrypt the base64 data string
      const decrypted = CryptoJS.AES.decrypt(base64Data, passphrase);
      const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (decryptedBase64 && decryptedBase64.length > 0) {
        // Convert decrypted base64 back to binary
        const binaryString = atob(decryptedBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('✓ Image decrypted with AES-256');
        return new Blob([bytes]);
      }
      
      console.warn('AES image decryption returned empty, trying legacy XOR...');
    } catch (aesError) {
      console.warn('AES image decryption failed, trying legacy XOR:', aesError.message);
    }
    
    // Fallback: Legacy XOR decryption
    return await decryptImageLegacyXOR(base64Data, passphrase);
    
  } catch (error) {
    console.error('Image decryption error:', error);
    throw new Error('Failed to decrypt image: ' + error.message);
  }
}

/**
 * Legacy XOR image decryption (for old events)
 */
async function decryptImageLegacyXOR(base64Data, passphrase) {
  console.log('Using legacy XOR for image decryption');
  
  // Decode from base64
  const binaryString = atob(base64Data);
  const fullData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    fullData[i] = binaryString.charCodeAt(i);
  }
  
  // Check for "Salted__" header
  const header = bytesToString(fullData.slice(0, 8));
  
  if (header !== 'Salted__') {
    throw new Error('Invalid image encryption header');
  }
  
  // Extract salt and encrypted data
  const salt = fullData.slice(8, 16);
  const encrypted = fullData.slice(16);
  
  // Derive key from passphrase and salt
  const saltString = bytesToString(salt);
  const keyMaterial = passphrase + saltString;
  const keyBytes = await sha256(keyMaterial);
  
  // XOR decryption
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }
  
  console.log('✓ Image decrypted with legacy XOR');
  return new Blob([decrypted]);
}

/**
 * Load and decrypt image, return as object URL
 * @param {string} imagePath - Path to encrypted image (e.g., "public/events/uuid/wedding.enc")
 * @param {string} key - Decryption key
 * @param {string} repo - GitHub repo
 * @param {string} branch - Git branch
 * @return {Promise<string>} Object URL for decrypted image
 */
async function loadEncryptedImage(imagePath, key, repo, branch) {
  try {
    // Try CDN first
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${imagePath}`;
    
    let response;
    try {
      response = await fetch(cdnUrl);
      if (!response.ok) throw new Error('CDN fetch failed');
    } catch (cdnError) {
      // Fallback to GitHub raw
      const githubUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${imagePath}`;
      response = await fetch(githubUrl);
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.statusText}`);
    }
    
    const base64Data = await response.text();
    const imageBlob = await decryptImage(base64Data, key);
    
    // Create object URL
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error('Failed to load encrypted image:', imagePath, error);
    return null; // Return null if image can't be loaded
  }
}

