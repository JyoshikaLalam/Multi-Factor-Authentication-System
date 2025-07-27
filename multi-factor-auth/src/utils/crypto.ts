import CryptoJS from 'crypto-js';
import totp from 'totp-generator';
import base32Encode from 'base32-encode';

export const deriveKey = (password: string, salt: string): string => {
  const iterations = 100000;
  const keySize = 256;
  return CryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations,
  }).toString();
};

export const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const generateTOTPSecret = (): string => {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return base32Encode(array, 'RFC4648', { padding: false });
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  try {
    const currentToken = totp(secret);
    return token === currentToken;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};

export const generateChallenge = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
