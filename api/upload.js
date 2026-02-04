// api/upload.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import crypto from "crypto";

const FormData = require("form-data");
const Busboy = require("busboy");

// 環境変数（Vercel の Settings に設定）
const AUTH_URL = process.env.NYANKO_AUTH_URL || "https://nyanko-auth.ponosgames.com";
const SAVE_URL = process.env.NYANKO_SAVE_URL || "https://nyanko-save.ponosgames.com";
const AWS_URL = process.env.NYANKO_AWS_URL || "https://nyanko-service-data-prd.s3.amazonaws.com";

// ヘルパ: NyankoSignature.generate_signature_v1 の代替（仮実装）
// ここでは managed_items_str を HMAC-SHA256 で署名し base64 にする想定
function generateSignatureV1(inquiryCode, managedItemsStr) {
  // NOTE: 実際の鍵や処理が異なる可能性あり。必要に応じて調整してください。
  const key = Buffer.from(inquiryCode, "utf8");
  const h = crypto.createHmac("sha256", key);
  h.update(managedItemsStr);
  return h.digest("base64");
}

// AccountHeaders.get_headers_static の代替（nyanko-signature を生成）
// ここでは nyanko-signature を HMAC-SHA256(data) with inquiryCode と仮定
function generateNyankoSignature(iq, data) {
  const key = Buffer.from(iq, "utf8");
  const h = crypto.createHmac("sha256", key);
  h.update(data);
  return h.digest("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Busboy で multipart をパース（ファイルと任意のフィールドを受け取る）
  const busboy = new Busboy({ headers: req.headers });
  let fileBuffer = null;
  let fileName = null;
  const fields = {};

  await new Promise((resolve, reject) => {
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
        fileName = filename || "file.sav";
      });
    });
    busboy.on("field", (name, val) => {
      fields[name] = val;
    });
    busboy.on("finish", resolve);
    busboy.on("error", reject);
    req.pipe(busboy);
  });

  if (!fileBuffer) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    // --- 1) 認証トークン取得（簡易: 既存のパスワードを使う or 外部で取得済みを渡す）
    // ここではクライアントから password を受け取る想定（fields.password）
    // 実運用では安全なフロー（サーバ側で秘密管理）を使ってください。
    const inquiryCode = fields.inquiryCode || process.env.DEFAULT_INQUIRY_CODE;
    const password = fields.password || process.env.DEFAULT_PASSWORD;

    if (!inquiryCode || !password) {
      res.status(400).json({ error: "Missing inquiryCode or password" });
      return;
    }

    // 1a) get password/token flow: POST /v1/tokens with client info
    // Build client info payload similar to ClientInfo.get_client_info()
    const clientInfo = {
      clientInfo: {
        client: {
          countryCode: fields.countryCode || "JP",
          version: fields.gameVersion || "120200",
        },
        device: { model: "SM-G955F" },
        os: { type: "android", version: "9" },
      },
      nonce: crypto.randomBytes(16).toString("hex"),
      password: password,
      accountCode: inquiryCode,
    };

    // POST to /v1/tokens to get auth token
    const tokenResp = await fetch(`${AUTH_URL}/v1/tokens`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(clientInfo),
    });

    if (!tokenResp.ok) {
      res.status(502).json({ error: "Auth token request failed", status: tokenResp.status, text: await tokenResp.text() });
      return;
    }

    const tokenJson = await tokenResp.json();
    const authToken = tokenJson.payload?.token;
    if (!authToken) {
      res.status(502).json({ error: "Auth token missing in response", body: tokenJson });
      return;
    }

    // --- 2) save_key を取得
    const nonce = crypto.randomBytes(16).toString("hex");
    const saveKeyResp = await fetch(`${SAVE_URL}/v2/save/key?nonce=${nonce}`, {
      method: "GET",
      headers: {
        "accept-encoding": "gzip",
        "connection": "keep-alive",
        "authorization": `Bearer ${authToken}`,
        "nyanko-timestamp": `${Math.floor(Date.now() / 1000)}`,
        "user-agent": "Dalvik/2.1.0 (Linux; U; Android 9; SM-G955F Build/N2G48B)",
      },
    });

    if (!saveKeyResp.ok) {
      res.status(502).json({ error: "Failed to get save key", status: saveKeyResp.status, text: await saveKeyResp.text() });
      return;
    }
    const saveKeyJson = await saveKeyResp.json();
    const saveKey = saveKeyJson.payload;
    if (!saveKey) {
      res.status(502).json({ error: "save_key payload missing", body: saveKeyJson });
      return;
    }

    // --- 3) S3 にファイルをアップロード（form fields from saveKey）
    const form = new FormData();
    for (const [k, v] of Object.entries(saveKey)) {
      if (k === "url") continue;
      form.append(k, v);
    }
    form.append("file", fileBuffer, { filename: fileName, contentType: "application/octet-stream" });

    const uploadUrl = saveKey.url || `${AWS_URL}/`;
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: form.getHeaders ? form.getHeaders() : {},
      body: form,
      // no timeout
    });

    if (uploadResp.status !== 204) {
      res.status(502).json({ error: "S3 upload failed", status: uploadResp.status, text: await uploadResp.text() });
      return;
    }

    // --- 4) メタデータを自前で作成して署名
    const managedItems = []; // 空配列（BackupMetaData を使わない）
    const managedItemsStr = JSON.stringify(managedItems); // 最小化は replace で対応
    const managedItemsMin = managedItemsStr.replace(/\s+/g, "");

    const playTime = parseInt(fields.playTime || "0", 10);
    const rank = parseInt(fields.rank || "0", 10);

    const signature_v1 = generateSignatureV1(inquiryCode, managedItemsMin);

    const metaObj = {
      managedItemDetails: managedItems,
      nonce: crypto.randomBytes(16).toString("hex"),
      playTime: playTime,
      rank: rank,
      receiptLogIds: [],
      signature_v1: signature_v1,
    };
    if (saveKey.key) metaObj.saveKey = saveKey.key;

    const metaDataStr = JSON.stringify(metaObj).replace(/\s+/g, "");

    // --- 5) /v2/transfers に POST（AccountHeaders を自前で生成）
    const nyankoSignature = generateNyankoSignature(inquiryCode, metaDataStr);
    const headers = {
      "content-type": "application/json",
      "accept-encoding": "gzip",
      "connection": "keep-alive",
      "nyanko-signature": nyankoSignature,
      "nyanko-timestamp": `${Math.floor(Date.now() / 1000)}`,
      "nyanko-signature-version": "1",
      "nyanko-signature-algorithm": "HMACSHA256",
      "user-agent": "Dalvik/2.1.0 (Linux; U; Android 9; SM-G955F Build/N2G48B)",
      "authorization": `Bearer ${authToken}`,
    };

    const transfersResp = await fetch(`${SAVE_URL}/v2/transfers`, {
      method: "POST",
      headers,
      body: metaDataStr,
    });

    if (!transfersResp.ok) {
      res.status(502).json({ error: "Transfers request failed", status: transfersResp.status, text: await transfersResp.text() });
      return;
    }

    const transfersJson = await transfersResp.json();
    if (transfersJson.statusCode !== 1) {
      res.status(502).json({ error: "Transfers returned error", body: transfersJson });
      return;
    }

    const payload = transfersJson.payload || {};
    const transferCode = payload.transferCode;
    const pin = payload.pin;

    res.status(200).json({ transferCode, pin, raw: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", detail: String(err) });
  }
}
