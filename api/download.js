import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { transferCode, pin } = req.body;
    if (!transferCode || !pin) {
      res.status(400).json({ error: 'missing params' });
      return;
    }

    const tmpDir = '/tmp';
    const metaPath = path.join(tmpDir, `${transferCode}.meta.json`);
    try {
      const metaRaw = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaRaw);
      if (meta.pin !== pin) {
        res.status(403).json({ error: 'invalid pin' });
        return;
      }
      const savedPath = meta.savedPath;
      const stream = await fs.readFile(savedPath);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${meta.filename}"`);
      res.status(200).send(stream);
    } catch (e) {
      res.status(404).json({ error: 'not found', detail: String(e) });
    }
  } catch (e) {
    res.status(500).json({ error: 'server error', detail: String(e) });
  }
}
