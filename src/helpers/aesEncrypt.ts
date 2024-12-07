import { fileIV, fileKey } from '@config';
import CryptoJS from 'crypto-js';
import { readFileSync } from 'fs';

export const encryptPayload = (payload: string, pKey: string, pIv: string) => {
  const key = CryptoJS.SHA256(pKey).toString();
  const iv = CryptoJS.enc.Utf8.parse(pIv);

  const cipher = CryptoJS.AES.encrypt(payload, CryptoJS.enc.Hex.parse(key), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Iso10126,
  });

  return cipher.toString();
};

/**
 * @example
 * const result = encryptFile('example.png');
 * writeFileSync('encrypted.png', result);
 */
export const encryptFile = (filePath: string) => {
  const key = CryptoJS.enc.Hex.parse(fileKey.slice(0, 32));
  const iv = CryptoJS.enc.Hex.parse(fileIV.slice(0, 32));
  const data = readFileSync(filePath, 'binary');

  const cipher = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
  });

  return cipher.toString();
};

/**
 * @example
 * const result = decryptFile('encrypted.png');
 * writeFileSync('decrypted.png', result, 'binary');
 */
export const decryptFile = (filePath: string) => {
  const key = CryptoJS.enc.Hex.parse(fileKey.slice(0, 32));
  const iv = CryptoJS.enc.Hex.parse(fileIV.slice(0, 32));
  const data = readFileSync(filePath, 'utf-8');

  const cipher = CryptoJS.AES.decrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
  });

  return cipher.toString(CryptoJS.enc.Utf8);
};
