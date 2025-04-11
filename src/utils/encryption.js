import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_APP_ENCRYPTION_KEY || "your-secret-key";

export const encryptId = (id) => {
  const encrypted = CryptoJS.AES.encrypt(id.toString(), SECRET_KEY).toString();
  const urlSafe = encrypted.replace(/\//g, "_");
  return encodeURIComponent(urlSafe);
};

export const decryptId = (encryptedId) => {
  try {
    const decoded = decodeURIComponent(encryptedId);
    const encrypted = decoded.replace(/_/g, "/");
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error("Invalid ID");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
