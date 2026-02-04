// api/proxy.js
import fetch from 'node-fetch'; // 環境により不要（Node 18+ や Vercel の fetch を使う場合は削除）
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { transfer, pin, countryCode, version, nonce } = req.body || {};

    if (!transfer || !pin || !countryCode || !version) {
      res.status(400).json({ error: 'missing params' });
      return;
    }

    const url = `https://nyanko-save.ponosgames.com/v2/transfers/${encodeURIComponent(transfer)}/reception`;

    const payload = {
      clientInfo: {
        client: { countryCode, version: Number(version) },
        device: { model: "SM-G955F" },
        os: { type: "android", version: "9" }
      },
      // Node での安全なランダム生成（16 バイト -> 32 hex）
      nonce: nonce || crypto.randomBytes(16).toString('hex'),
      pin: String(pin)
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // ステータスを透過
    res.status(r.status);

    // 必要なヘッダーだけ転送（機密ヘッダーは除外するか検討）
    const allowed = ['content-type', 'content-length', 'nyanko-nonce', 'nyanko-timestamp'];
    r.headers.forEach((v, k) => {
      if (allowed.includes(k.toLowerCase())) res.setHeader(k, v);
    });

    // ボディをバッファ化して返す
    const arrayBuf = await r.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'proxy error', detail: String(err) });
  }
}
