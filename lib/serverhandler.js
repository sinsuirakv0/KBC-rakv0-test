// lib/serverHandler.js
// Python server_handler.py の JS変換
import { getHexString } from './crypto.js';
import { getAccountHeaders, BASE_HEADERS } from './headers.js';
import { getClientInfo } from './clientInfo.js';
import { createBackupMetaData } from './managedItem.js';

const AUTH_URL = 'https://nyanko-auth.ponosgames.com';
const SAVE_URL = 'https://nyanko-save.ponosgames.com';
const BACKUPS_URL = 'https://nyanko-backups.ponosgames.com';
const AWS_URL = 'https://nyanko-service-data-prd.s3.amazonaws.com';

export class ServerHandler {
  /**
   * @param {Object} saveData パースされたセーブファイルのデータ
   * @param {string} saveData.inquiryCode
   * @param {number} saveData.energyPenaltyTimestamp
   * @param {string} saveData.passwordRefreshToken
   * @param {number} saveData.playTime
   * @param {number} saveData.userRank
   * @param {Buffer} saveData.rawBytes - セーブファイルの生バイト
   * @param {string} saveData.cc - 'jp' | 'en' | 'kr' | 'tw'
   * @param {number} saveData.gameVersion
   */
  constructor(saveData) {
    this.saveData = saveData;
    this._storedPassword = null;
    this._storedAuthToken = null;
  }

  // ─── 内部HTTPヘルパー ─────────────────────────────────────

  async _doRequest(url, dictData) {
    const data = JSON.stringify(dictData).replace(/ /g, '');
    const headers = getAccountHeaders(this.saveData.inquiryCode, data);
    try {
      const res = await fetch(url, { method: 'POST', headers, body: data });
      const json = await res.json();
      if (json.statusCode !== 1) return { payload: null, timestamp: null };
      return { payload: json.payload ?? {}, timestamp: json.timestamp ?? null };
    } catch {
      return { payload: null, timestamp: null };
    }
  }

  // ─── パスワード管理 ────────────────────────────────────────

  async _doPasswordRequest(url, dictData) {
    const { payload, timestamp } = await this._doRequest(url, dictData);
    if (!payload) return null;

    const password = payload.password;
    const passwordRefreshToken = payload.passwordRefreshToken;
    if (!password || !passwordRefreshToken) return null;

    this._storedPassword = password;
    this.saveData.passwordRefreshToken = passwordRefreshToken;

    if (payload.accountCode) {
      this.saveData.inquiryCode = payload.accountCode;
      this._storedAuthToken = null;
      if (timestamp !== null) {
        this.saveData.energyPenaltyTimestamp = Number(timestamp);
      }
    }
    return password;
  }

  /** /v1/user/password でトークンを使ってパスワードをリフレッシュ */
  async _refreshPassword() {
    return this._doPasswordRequest(`${AUTH_URL}/v1/user/password`, {
      accountCode: this.saveData.inquiryCode,
      passwordRefreshToken: this.saveData.passwordRefreshToken,
      nonce: getHexString(32),
    });
  }

  /** /v1/users で新規パスワードを取得 */
  async _getPasswordNew() {
    return this._doPasswordRequest(`${AUTH_URL}/v1/users`, {
      accountCode: this.saveData.inquiryCode,
      accountCreatedAt: Math.floor(this.saveData.energyPenaltyTimestamp),
      nonce: getHexString(32),
    });
  }

  /** /backups でアカウントを新規作成 */
  async _createNewAccount() {
    try {
      const res = await fetch(`${BACKUPS_URL}/?action=createAccount&referenceId=`);
      const data = await res.json();
      this.saveData.inquiryCode = data.accountId;
      this._storedAuthToken = null;
      this._storedPassword = null;
      this.saveData.passwordRefreshToken = '_'.repeat(40);
    } catch {
      // ignore
    }
  }

  /** パスワード取得（refresh → new → アカウント作成の順に試みる） */
  async _getPassword(tries = 0) {
    if (this._storedPassword) return this._storedPassword;

    const refreshed = await this._refreshPassword();
    if (refreshed) return refreshed;

    const fresh = await this._getPasswordNew();
    if (fresh) return fresh;

    if (tries >= 1) return null;
    await this._createNewAccount();
    return this._getPassword(tries + 1);
  }

  // ─── 認証トークン管理 ──────────────────────────────────────

  _validateAuthToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      );
      if (payload.exp < Math.floor(Date.now() / 1000)) return false;
      if (payload.accountCode !== this.saveData.inquiryCode) return false;
      return true;
    } catch {
      return false;
    }
  }

  async _getAuthTokenNew(password) {
    const body = getClientInfo(this.saveData.cc, this.saveData.gameVersion);
    body.password = password;
    body.accountCode = this.saveData.inquiryCode;

    const { payload } = await this._doRequest(`${AUTH_URL}/v1/tokens`, body);
    if (!payload?.token) return null;
    this._storedAuthToken = payload.token;
    return payload.token;
  }

  async _getAuthToken(tries = 1) {
    if (this._storedAuthToken && this._validateAuthToken(this._storedAuthToken)) {
      return this._storedAuthToken;
    }
    this._storedAuthToken = null;

    const password = await this._getPassword();
    if (!password) return null;

    if (this._storedAuthToken) return this._storedAuthToken;

    const token = await this._getAuthTokenNew(password);
    if (token) return token;

    if (tries > 0) return this._getAuthToken(tries - 1);
    return null;
  }

  // ─── セーブキー取得 ────────────────────────────────────────

  async _getSaveKey(authToken) {
    const nonce = getHexString(32);
    const url = `${SAVE_URL}/v2/save/key?nonce=${nonce}`;
    try {
      const res = await fetch(url, {
        headers: {
          ...BASE_HEADERS,
          'authorization': `Bearer ${authToken}`,
          'nyanko-timestamp': String(Math.floor(Date.now() / 1000)),
        },
      });
      const json = await res.json();
      if (json.statusCode !== 1) return null;
      return json.payload;
    } catch {
      return null;
    }
  }

  // ─── S3アップロード ───────────────────────────────────────

  async _uploadSaveData(saveKey) {
    const url = saveKey.url ?? `${AWS_URL}/`;
    const form = new FormData();

    for (const [key, value] of Object.entries(saveKey)) {
      if (key === 'url') continue;
      // text/plain フィールド（filenameなし）
      form.append(key, new Blob([String(value)], { type: 'text/plain' }));
    }
    // セーブファイル本体
    form.append(
      'file',
      new Blob([this.saveData.rawBytes], { type: 'application/octet-stream' }),
      'file.sav',
    );

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: BASE_HEADERS,
        body: form,
      });
      return res.status === 204;
    } catch {
      return false;
    }
  }

  // ─── メイン: トランスファーコード取得 ─────────────────────

  /**
   * get_codes() の JS版
   * @returns {{ transferCode: string, confirmationCode: string }}
   */
  async getCodes() {
    // 1. 認証トークン取得
    const authToken = await this._getAuthToken();
    if (!authToken) throw new Error('認証トークンの取得に失敗しました');

    // 2. セーブキー取得
    const saveKey = await this._getSaveKey(authToken);
    if (!saveKey) throw new Error('セーブキーの取得に失敗しました');

    // 3. S3へアップロード
    const uploaded = await this._uploadSaveData(saveKey);
    if (!uploaded) throw new Error('S3へのアップロードに失敗しました');

    // 4. バックアップメタデータ作成
    const metaData = createBackupMetaData(
      this.saveData.inquiryCode,
      this.saveData.playTime ?? 0,
      this.saveData.userRank ?? 0,
      [],        // managed items: ここでは空（将来拡張）
      saveKey.key,
    );

    // 5. /v2/transfers でトランスファーコード取得
    const url = `${SAVE_URL}/v2/transfers`;
    const headers = getAccountHeaders(this.saveData.inquiryCode, metaData);
    headers['authorization'] = `Bearer ${authToken}`;

    const res = await fetch(url, { method: 'POST', headers, body: metaData });
    const json = await res.json();

    if (json.statusCode !== 1) {
      throw new Error(`引き継ぎコード取得失敗: status ${json.statusCode}`);
    }

    const transferCode = json.payload?.transferCode;
    const confirmationCode = json.payload?.pin;

    if (!transferCode || !confirmationCode) {
      throw new Error('レスポンスにコードが含まれていません');
    }

    return { transferCode, confirmationCode };
  }
}
