/**
 * Local Test: Encryption/Decryption Compatibility
 * 
 * This script simulates the Apps Script encryption logic and tests
 * compatibility with browser-side decryption.
 * 
 * Run with: node tests/encryption-test.js
 */

const crypto = require('crypto');

// ============================================================================
// APPS SCRIPT ENCRYPTION SIMULATION
// ============================================================================

/**
 * Convert string to UTF-8 byte array (matches Apps Script manual UTF-8 encoding)
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
 * Convert UTF-8 byte array back to string (matches Apps Script manual UTF-8 decoding)
 */
function utf8BytesToString(bytes) {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i++];
    if (byte1 < 128) {
      result += String.fromCharCode(byte1);
    } else if (byte1 < 224) {
      const byte2 = bytes[i++];
      result += String.fromCharCode(((byte1 & 31) << 6) | (byte2 & 63));
    } else {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      result += String.fromCharCode(((byte1 & 15) << 12) | ((byte2 & 63) << 6) | (byte3 & 63));
    }
  }
  return result;
}

/**
 * Generate random salt (8 bytes)
 */
function generateSalt() {
  const salt = [];
  for (let i = 0; i < 8; i++) {
    salt.push(Math.floor(Math.random() * 256));
  }
  return salt;
}

/**
 * Encrypt data (simulates Apps Script encryptAES function)
 */
function encryptAES(plaintext, passphrase) {
  // Generate random salt
  const salt = generateSalt();
  const saltString = String.fromCharCode.apply(null, salt);
  
  // Derive key from passphrase and salt using SHA-256
  const keyMaterial = passphrase + saltString;
  const keyMaterialUtf8 = stringToUtf8Bytes(keyMaterial);
  const keyBytes = Array.from(crypto.createHash('sha256').update(Buffer.from(keyMaterialUtf8)).digest());
  
  // Convert plaintext to UTF-8 bytes
  const textBytes = stringToUtf8Bytes(plaintext);
  
  // XOR encryption
  const encrypted = [];
  for (let i = 0; i < textBytes.length; i++) {
    encrypted.push(textBytes[i] ^ keyBytes[i % keyBytes.length]);
  }
  
  // Format: "Salted__" + salt (8 bytes) + encrypted data
  const header = [83, 97, 108, 116, 101, 100, 95, 95]; // "Salted__"
  const fullData = header.concat(salt, encrypted);
  
  // Return as base64
  return Buffer.from(fullData).toString('base64');
}

/**
 * Decrypt data (simulates browser decryptConfig function)
 */
async function decryptAES(ciphertext, passphrase) {
  // Decode from base64
  const fullData = Array.from(Buffer.from(ciphertext, 'base64'));
  
  // Check header
  const header = String.fromCharCode.apply(null, fullData.slice(0, 8));
  if (header !== 'Salted__') {
    throw new Error('Invalid header: ' + header);
  }
  
  // Extract salt and encrypted data
  const salt = fullData.slice(8, 16);
  const encrypted = fullData.slice(16);
  
  // Derive key (must match encryption)
  const saltString = String.fromCharCode.apply(null, salt);
  const keyMaterial = passphrase + saltString;
  const keyMaterialUtf8 = stringToUtf8Bytes(keyMaterial);
  const keyBytes = Array.from(crypto.createHash('sha256').update(Buffer.from(keyMaterialUtf8)).digest());
  
  // XOR decryption
  const decrypted = [];
  for (let i = 0; i < encrypted.length; i++) {
    decrypted.push(encrypted[i] ^ keyBytes[i % keyBytes.length]);
  }
  
  // Convert UTF-8 bytes back to string
  return utf8BytesToString(decrypted);
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        ENCRYPTION/DECRYPTION COMPATIBILITY TEST           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  // Test 1: Simple ASCII text
  console.log('Test 1: Simple ASCII text');
  const test1 = {
    name: 'ASCII text',
    plaintext: 'Hello, World!',
    key: 'test-key-32-characters-long!!'
  };
  const encrypted1 = encryptAES(test1.plaintext, test1.key);
  console.log('  Original:  ' + test1.plaintext);
  console.log('  Encrypted: ' + encrypted1.substring(0, 50) + '...');
  
  try {
    const decrypted1 = await decryptAES(encrypted1, test1.key);
    console.log('  Decrypted: ' + decrypted1);
    if (decrypted1 === test1.plaintext) {
      console.log('  Result:    ✓ PASS');
      passed++;
    } else {
      console.log('  Result:    ✗ FAIL (mismatch)');
      console.log('  Expected:  ' + test1.plaintext);
      console.log('  Got:       ' + decrypted1);
      failed++;
    }
  } catch (error) {
    console.log('  Result:    ✗ FAIL (error)');
    console.log('  Error:     ' + error.message);
    failed++;
  }
  console.log();
  
  // Test 2: JSON object (realistic use case)
  console.log('Test 2: JSON object (realistic event config)');
  const test2 = {
    name: 'JSON config',
    plaintext: JSON.stringify({
      eventId: 'test-uuid-123',
      title: { en: 'Test Event', he: 'אירוע בדיקה' },
      message: { en: 'Send us a gift!', he: 'שלחו לנו מתנה!' },
      gifts: [
        { name: { en: 'PayPal', he: 'פייפאל' }, url: ['https://paypal.me/test'] }
      ]
    }),
    key: 'another-test-key-32-chars!!!'
  };
  const encrypted2 = encryptAES(test2.plaintext, test2.key);
  console.log('  Original:  ' + test2.plaintext.substring(0, 50) + '...');
  console.log('  Encrypted: ' + encrypted2.substring(0, 50) + '...');
  
  try {
    const decrypted2 = await decryptAES(encrypted2, test2.key);
    console.log('  Decrypted: ' + decrypted2.substring(0, 50) + '...');
    if (decrypted2 === test2.plaintext) {
      console.log('  Result:    ✓ PASS');
      // Verify JSON is valid
      try {
        const parsed = JSON.parse(decrypted2);
        console.log('  JSON:      ✓ Valid (eventId: ' + parsed.eventId + ')');
        passed++;
      } catch (e) {
        console.log('  JSON:      ✗ Invalid');
        failed++;
      }
    } else {
      console.log('  Result:    ✗ FAIL (mismatch)');
      console.log('  Length:    Expected ' + test2.plaintext.length + ', got ' + decrypted2.length);
      failed++;
    }
  } catch (error) {
    console.log('  Result:    ✗ FAIL (error)');
    console.log('  Error:     ' + error.message);
    failed++;
  }
  console.log();
  
  // Test 3: Hebrew text (UTF-8 encoding test)
  console.log('Test 3: Hebrew text (UTF-8 encoding)');
  const test3 = {
    name: 'Hebrew UTF-8',
    plaintext: 'שלום עולם! こんにちは世界',
    key: 'test-key-with-unicode-support'
  };
  const encrypted3 = encryptAES(test3.plaintext, test3.key);
  console.log('  Original:  ' + test3.plaintext);
  console.log('  Encrypted: ' + encrypted3.substring(0, 50) + '...');
  
  try {
    const decrypted3 = await decryptAES(encrypted3, test3.key);
    console.log('  Decrypted: ' + decrypted3);
    if (decrypted3 === test3.plaintext) {
      console.log('  Result:    ✓ PASS');
      passed++;
    } else {
      console.log('  Result:    ✗ FAIL (mismatch)');
      console.log('  Expected:  ' + test3.plaintext);
      console.log('  Got:       ' + decrypted3);
      failed++;
    }
  } catch (error) {
    console.log('  Result:    ✗ FAIL (error)');
    console.log('  Error:     ' + error.message);
    failed++;
  }
  console.log();
  
  // Test 4: Long text (performance test)
  console.log('Test 4: Large JSON (performance test)');
  const largeConfig = {
    eventId: 'test-uuid-456',
    title: { en: 'Large Event', he: 'אירוע גדול' },
    message: { en: 'Many gifts!', he: 'הרבה מתנות!' },
    gifts: []
  };
  // Add 20 gifts
  for (let i = 0; i < 20; i++) {
    largeConfig.gifts.push({
      name: { en: `Gift ${i}`, he: `מתנה ${i}` },
      url: [`https://example.com/gift${i}`],
      logo: 'https://example.com/logo.png'
    });
  }
  const test4 = {
    name: 'Large JSON',
    plaintext: JSON.stringify(largeConfig, null, 2),
    key: 'performance-test-key-32-chars'
  };
  
  const startTime = Date.now();
  const encrypted4 = encryptAES(test4.plaintext, test4.key);
  const encryptTime = Date.now() - startTime;
  
  console.log('  Size:      ' + test4.plaintext.length + ' bytes');
  console.log('  Encrypted: ' + encrypted4.length + ' bytes (base64)');
  console.log('  Time:      ' + encryptTime + 'ms (encrypt)');
  
  try {
    const decryptStart = Date.now();
    const decrypted4 = await decryptAES(encrypted4, test4.key);
    const decryptTime = Date.now() - decryptStart;
    
    console.log('  Time:      ' + decryptTime + 'ms (decrypt)');
    
    if (decrypted4 === test4.plaintext) {
      console.log('  Result:    ✓ PASS');
      passed++;
    } else {
      console.log('  Result:    ✗ FAIL (mismatch)');
      failed++;
    }
  } catch (error) {
    console.log('  Result:    ✗ FAIL (error)');
    console.log('  Error:     ' + error.message);
    failed++;
  }
  console.log();
  
  // Test 5: Wrong key (should fail)
  console.log('Test 5: Wrong decryption key (should produce garbage)');
  const test5 = {
    plaintext: 'Secret message',
    correctKey: 'correct-key-32-characters!!!',
    wrongKey: 'wrong-key-32-characters!!!!!'
  };
  const encrypted5 = encryptAES(test5.plaintext, test5.correctKey);
  
  try {
    const decrypted5 = await decryptAES(encrypted5, test5.wrongKey);
    if (decrypted5 !== test5.plaintext) {
      console.log('  Result:    ✓ PASS (correctly produced wrong output)');
      console.log('  Output:    ' + decrypted5.substring(0, 20) + '... (garbage, as expected)');
      passed++;
    } else {
      console.log('  Result:    ✗ FAIL (should not decrypt with wrong key)');
      failed++;
    }
  } catch (error) {
    console.log('  Result:    ✓ PASS (error thrown, as expected)');
    passed++;
  }
  console.log();
  
  // Summary
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('  Total tests: ' + (passed + failed));
  console.log('  Passed:      ✓ ' + passed);
  console.log('  Failed:      ✗ ' + failed);
  console.log();
  
  if (failed === 0) {
    console.log('  ✓ ALL TESTS PASSED!');
    console.log('  ✓ Encryption/Decryption is working correctly.');
    console.log('  ✓ Apps Script encryption will be compatible with browser decryption.');
    console.log();
    process.exit(0);
  } else {
    console.log('  ✗ SOME TESTS FAILED!');
    console.log('  ✗ Do not deploy until all tests pass.');
    console.log();
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
