// lib/headers.js
// Python headers.py の JS変換
import { generateSignature } from './crypto.js'; // js/ 内で相対インポート // js/crypto.js

/**
 * AccountHeaders.get_headers_static() の JS版
 * 注意: 'accept-enconding' は原本のtypoをそのまま保持（サーバーが期待する）
 */
export function getAccountHeaders(inquiryCode, data) {
  return {
    'accept-enconding': 'gzip',
    'connection': 'keep-alive',
    'content-type': 'application/json',
    'nyanko-signature': generateSignature(inquiryCode, data),
    'nyanko-timestamp': String(Math.floor(Date.now() / 1000)),
    'nyanko-signature-version': '1',
    'nyanko-signature-algorithm': 'HMACSHA256',
    'user-agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-G955F Build/N2G48B)',
  };
}

/** S3アップロード等の汎用ヘッダー */
export const BASE_HEADERS = {
  'accept-encoding': 'gzip',
  'connection': 'keep-alive',
  'user-agent': 'Dalvik/2.1.0 (Linux; U; Android 9; SM-G955F Build/N2G48B)',
};
