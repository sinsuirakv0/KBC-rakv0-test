// api/proxy.js
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    console.log('proxy handler invoked', { method: req.method, body: req.body });

    const { transfer, pin, countryCode, version, nonce } = req.body || {};
    if (!transfer || !pin || !countryCode || !version) {
      return res.status(400).json({ error: 'missing params' });
    }

    const url = `https://nyanko-save.ponosgames.com/v2/transfers/${encodeURIComponent(transfer)}/reception`;
    const payload = {
      clientInfo: {
        client: { countryCode, version: Number(version) },
        device: { model: "SM-G955F" },
        os: { type: "android", version: "9" }
      },
      nonce: nonce || crypto.randomBytes(16).toString('hex'),
      pin: String(pin)
    };

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '<failed to read upstream body>');
      console.error('Upstream error', { status: upstream.status, body: text });
      return res.status(502).json({ error: 'upstream error', status: upstream.status, body: text });
    }

    // 転送するヘッダーを限定（機密ヘッダーは除外）
    const allowed = new Set(['content-type', 'nyanko-nonce', 'nyanko-timestamp']);
    upstream.headers.forEach((v, k) => {
      if (allowed.has(k.toLowerCase())) res.setHeader(k, v);
    });

    // ストリーミングで返す（大きなバイナリ対策）
    res.status(200);
    const reader = upstream.body.getReader();
    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          }).catch(err => {
            console.error('stream read error', err);
            controller.error(err);
          });
        }
        push();
      }
    });
    const response = new Response(stream);
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Length', Buffer.byteLength(Buffer.from(arrayBuffer)));
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Proxy handler error:', err);
    res.status(500).json({ error: 'proxy error', detail: String(err) });
  }
}
