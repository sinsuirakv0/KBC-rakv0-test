// api/proxy.js
import fetch from 'node-fetch';

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
      nonce: nonce || (Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('')),
      pin: String(pin)
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // pass through status and headers (but avoid exposing sensitive headers if needed)
    res.status(r.status);
    r.headers.forEach((v, k) => {
      // allow CORS-safe headers to be forwarded
      res.setHeader(k, v);
    });

    // stream body
    const buffer = await r.arrayBuffer();
    const buf = Buffer.from(buffer);
    res.setHeader('Content-Length', buf.length);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'proxy error', detail: String(err) });
  }

  // 既存: setDebug(prev => prev + `\n\nRESPONSE BODY:\n${txt}`);

// 修正: 現在の debug テキストを取得して結合してから setDebug に渡す
const currentDebug = document.getElementById('debug').textContent || '';
setDebug(currentDebug + `\n\nRESPONSE BODY:\n${txt}`);

}
