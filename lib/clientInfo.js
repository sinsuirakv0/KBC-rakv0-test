// lib/clientInfo.js
// Python client_info.py の JS変換
import { getHexString } from './crypto.js';

/** CC → Ponosサーバーに送るcountryCode文字列 */
const CC_TO_CLIENT_CODE = {
  jp: 'ja',
  en: 'en',
  kr: 'ko',
  tw: 'zh',
};

/** CC → MD5ソルト用patching code */
export const CC_TO_PATCHING_CODE = {
  jp: 'jp',
  en: 'en',
  kr: 'kr',
  tw: 'tw',
};

export const ALL_COUNTRY_CODES = ['jp', 'en', 'kr', 'tw'];

/**
 * ClientInfo.get_client_info() の JS版
 * @param {string} cc - 'jp' | 'en' | 'kr' | 'tw'
 * @param {number} gameVersion - 整数形式のゲームバージョン (例: 130200)
 */
export function getClientInfo(cc, gameVersion) {
  return {
    clientInfo: {
      client: {
        countryCode: CC_TO_CLIENT_CODE[cc] ?? 'ja',
        version: gameVersion,
      },
      device: {
        model: 'SM-G955F',
      },
      os: {
        type: 'android',
        version: '9',
      },
    },
    nonce: getHexString(32),
  };
}
