// api/upload.js
// Vercel Serverless Function (Node.js runtime)
// POST /api/upload?cc=jp  Body: application/octet-stream (セーブファイルバイナリ)

import { parseSaveFile } from './lib/saveParser.js';
import { ServerHandler } from './lib/serverHandler.js';

/** Vercel: bodyParserを無効化してRaw bodyを受け取る */
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Raw bodyの読み取り
  let body;
  try {
    body = await readRawBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'ファイルの読み取りに失敗しました' });
  }

  if (!body || body.length === 0) {
    return res.status(400).json({ error: 'ファイルが空です' });
  }

  try {
    // 1. セーブファイルをパース
    const saveData = parseSaveFile(body);

    // 2. アップロードフロー実行
    const handler = new ServerHandler(saveData);
    const { transferCode, confirmationCode } = await handler.getCodes();

    return res.status(200).json({
      success: true,
      transferCode,
      confirmationCode,
      cc: saveData.cc,
      inquiryCode: saveData.inquiryCode,
    });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({
      success: false,
      error: e.message || '不明なエラーが発生しました',
    });
  }
}

/** リクエストボディを Buffer として読み取る */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
