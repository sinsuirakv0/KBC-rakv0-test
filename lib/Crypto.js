// lib/crypto.js
// Python crypto.py の JS変換
import crypto from 'crypto';

/** ランダム16進数文字列 (Random.get_hex_string) */
export function getHexString(length) {
  const chars = '0123456789abcdef';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % 16];
  }
  return result;
}

/** ランダム数字文字列 (Random.get_digits_string) */
export function getDigitsString(length) {
  const chars = '0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % 10];
  }
  return result;
}

/**
 * NyankoSignature.generate_signature() の JS版
 * HMAC-SHA256: key = inquiryCode + randomHex64, data = requestBody
 * Returns: randomHex64 + hmacHex
 */
export function generateSignature(inquiryCode, data) {
  const randomData = getHexString(64);
  const key = Buffer.from(inquiryCode + randomData, 'utf-8');
  const sig = crypto.createHmac('sha256', key)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
  return randomData + sig;
}

/**
 * NyankoSignature.generate_signature_v1() の JS版
 * HMAC-SHA1: data を2倍にして、key = inquiryCode + randomHex40
 * BackupMetaData で使用
 */
export function generateSignatureV1(inquiryCode, data) {
  const doubledData = data + data;
  const randomData = getHexString(40);
  const key = Buffer.from(inquiryCode + randomData, 'utf-8');
  const sig = crypto.createHmac('sha1', key)
    .update(Buffer.from(doubledData, 'utf-8'))
    .digest('hex');
  return randomData + sig;
}

/**
 * セーブファイルのMD5ハッシュ検証 (SaveFile.get_new_hash)
 * salt = "battlecats" + patchingCode
 * hash = md5(salt + data[0..-33])
 */
export function computeSaveHash(patchingCode, saveBuffer) {
  const salt = Buffer.from(`battlecats${patchingCode}`, 'utf-8');
  const dataWithoutHash = saveBuffer.slice(0, saveBuffer.length - 32);
  return crypto.createHash('md5')
    .update(salt)
    .update(dataWithoutHash)
    .digest('hex');
}
