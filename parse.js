// api/parse.js
// セーブファイルをパースしてデータを返すだけ（デバッグ用）
import { parseSaveFile } from './lib/saveParser.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let body;
  try {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  } catch {
    return res.status(400).json({ error: 'ファイルの読み取りに失敗' });
  }

  try {
    const d = parseSaveFile(body);
    return res.status(200).json({
      success: true,
      cc: d.cc,
      gameVersion: d.gameVersion,
      inquiryCode: d.inquiryCode,
      energyPenaltyTimestamp: d.energyPenaltyTimestamp,
      passwordRefreshToken: d.passwordRefreshToken
        ? d.passwordRefreshToken.slice(0, 8) + '...' : '(空)',
      playTime: d.playTime,
      catfood: d.catfood,
      rareTickets: d.rareTickets,
      platinumTickets: d.platinumTickets,
      legendTickets: d.legendTickets,
      fileSizeBytes: body.length,
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
