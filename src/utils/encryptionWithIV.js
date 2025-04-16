import CryptoJS from "crypto-js";

// Parse base64 key
const rawKey = import.meta.env.VITE_APP_ENCRYPTION_KEY_NEW || "your-base64-key";
const SECRET_KEY = CryptoJS.enc.Base64.parse(rawKey);

export const encryptIdWithIv = (id) => {
  const iv = CryptoJS.lib.WordArray.random(16); // Generate secure random 16-byte IV

  const encrypted = CryptoJS.AES.encrypt(id.toString(), SECRET_KEY, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Combine IV + Ciphertext (both in hex)
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const cipherHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  return ivHex + cipherHex; // 32 chars IV + n chars ciphertext
};

export const decryptIdWithIv = (combinedHex) => {
  try {
    // Extract IV (first 32 hex chars = 16 bytes) and ciphertext
    const ivHex = combinedHex.substring(0, 32);
    const cipherHex = combinedHex.substring(32);

    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const cipherWordArray = CryptoJS.enc.Hex.parse(cipherHex);
    const cipherBase64 = CryptoJS.enc.Base64.stringify(cipherWordArray);

    const decrypted = CryptoJS.AES.decrypt(cipherBase64, SECRET_KEY, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) throw new Error("Invalid data");
    return plainText;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

export const decryptJsonPayload = (base64Payload) => {
  try {
    // Step 1: Base64 decode the JSON string
    const jsonString = atob(base64Payload); // browser-friendly
    const data = JSON.parse(jsonString);

    const iv = CryptoJS.enc.Base64.parse(data.iv);
    const ciphertext = CryptoJS.enc.Base64.parse(data.value);

    // Optional: MAC verification (for integrity)
    const combined = data.iv + data.value; // both are base64 strings
    const expectedMac = CryptoJS.HmacSHA256(combined, SECRET_KEY).toString();
    if (data.mac && expectedMac !== data.mac) {
      throw new Error("MAC check failed: data has been tampered with");
    }

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext,
      },
      SECRET_KEY,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) throw new Error("Invalid decryption result");

    return plainText;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

export const encryptJsonPayload = (plaintext) => {
  // 1. Generate random IV (16 bytes)
  const iv = CryptoJS.lib.WordArray.random(16);

  // 2. Encrypt the plaintext
  const encrypted = CryptoJS.AES.encrypt(plaintext, SECRET_KEY, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ciphertext = encrypted.ciphertext;
  const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
  const valueBase64 = CryptoJS.enc.Base64.stringify(ciphertext);

  // 3. Generate HMAC (MAC) using iv + value (as base64 strings)
  const macSource = ivBase64 + valueBase64;
  const mac = CryptoJS.HmacSHA256(macSource, SECRET_KEY).toString();

  // 4. Build final object
  const encryptedObject = {
    iv: ivBase64,
    value: valueBase64,
    mac,
    tag: "", // optional / unused in CBC
  };

  // 5. Convert to JSON and then base64
  const jsonString = JSON.stringify(encryptedObject);
  const base64Payload = btoa(jsonString); // browser safe

  return base64Payload;
};
