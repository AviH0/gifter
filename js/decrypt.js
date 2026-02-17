/**
 * Simple XOR Decryption Utility
 * Compatible with Apps Script encryptAES function
 * 
 * This matches the encryption format from scripts/templates/apps-script.js
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
 * Decrypt data encrypted by Apps Script encryptAES function
 * @param {string} ciphertext - Base64 encoded encrypted data
 * @param {string} passphrase - Decryption key
 * @return {Promise<string>} Decrypted plaintext
 */
async function decryptConfig(ciphertext, passphrase) {
  try {
    console.log('Decrypting with passphrase length:', passphrase.length);
    console.log('Ciphertext length:', ciphertext.length);
    
    // Decode from base64
    const binaryString = atob(ciphertext);
    const fullData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      fullData[i] = binaryString.charCodeAt(i);
    }
    
    console.log('Decoded length:', fullData.length);
    
    // Check for "Salted__" header
    const header = bytesToString(fullData.slice(0, 8));
    console.log('Header:', JSON.stringify(header));
    
    if (header === 'Salted__') {
      // Extract salt and encrypted data
      const salt = fullData.slice(8, 16);
      const encrypted = fullData.slice(16);
      
      console.log('Salt bytes:', Array.from(salt).slice(0, 8));
      console.log('Encrypted data length:', encrypted.length);
      
      // Derive key from passphrase and salt (same as Apps Script)
      const saltString = bytesToString(salt);
      const keyMaterial = passphrase + saltString;
      const keyBytes = await sha256(keyMaterial);
      
      console.log('Key bytes (first 16):', Array.from(keyBytes).slice(0, 16));
      
      // XOR decryption
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }
      
      console.log('Decrypted first 20 bytes:', Array.from(decrypted).slice(0, 20));
      
      // Convert to string
      const result = new TextDecoder().decode(decrypted);
      console.log('Decrypted string starts with:', result.substring(0, 50));
      return result;
    } else {
      // Fallback: assume it's just base64 encoded
      console.warn('No encryption header found, treating as base64');
      return new TextDecoder().decode(fullData);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback: try simple base64 decode
    try {
      return atob(ciphertext);
    } catch (e) {
      throw new Error('Failed to decrypt config: ' + error.message);
    }
  }
}

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
 * @param {string} base64Data - Base64 encoded encrypted image
 * @param {string} passphrase - Decryption key
 * @return {Promise<Blob>} Decrypted image blob
 */
async function decryptImage(base64Data, passphrase) {
  try {
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
    
    // Return as Blob
    return new Blob([decrypted]);
  } catch (error) {
    console.error('Image decryption error:', error);
    throw new Error('Failed to decrypt image: ' + error.message);
  }
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

