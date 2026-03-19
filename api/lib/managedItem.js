// lib/managedItem.js
// Python managed_item.py の JS変換
import { getHexString, generateSignatureV1 } from './crypto.js';
import { v4 as uuidv4 } from 'uuid';

export const DetailType = { GET: 'get', USE: 'use' };
export const ManagedItemType = {
  CATFOOD: 'catfood',
  RARE_TICKET: 'rareTicket',
  PLATINUM_TICKET: 'platinumTicket',
  LEGEND_TICKET: 'legendTicket',
};

/**
 * ManagedItem.to_dict() の JS版
 */
export function managedItemToDict(item) {
  return {
    amount: item.amount,
    detailCode: item.detailCode || uuidv4(),
    detailCreatedAt: item.detailCreatedAt || Math.floor(Date.now() / 1000),
    detailType: item.detailType,
    managedItemType: item.managedItemType,
  };
}

/**
 * BackupMetaData.create_static() の JS版
 * @param {string} inquiryCode
 * @param {number} playTime
 * @param {number} userRank
 * @param {Array} managedItems
 * @param {string|null} saveKey - S3のkeyフィールド
 * @param {boolean} addManagedItems
 */
export function createBackupMetaData(
  inquiryCode,
  playTime,
  userRank,
  managedItems = [],
  saveKey = null,
  addManagedItems = true,
) {
  const managedItemDetails = addManagedItems
    ? managedItems
        .filter((item) => item.amount > 0)
        .map(managedItemToDict)
    : [];

  const managedItemsStr = JSON.stringify(managedItemDetails).replace(/ /g, '');

  const metadata = {
    managedItemDetails,
    nonce: getHexString(32),
    playTime,
    rank: userRank,
    receiptLogIds: [],
    signature_v1: generateSignatureV1(inquiryCode, managedItemsStr),
  };

  if (saveKey !== null && saveKey !== undefined) {
    metadata.saveKey = saveKey;
  }

  return JSON.stringify(metadata).replace(/ /g, '');
}
