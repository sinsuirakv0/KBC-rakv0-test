import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'parse error', detail: String(err) });
      return;
    }

    const file = files.file;
    if (!file) {
      res.status(400).json({ error: 'no file' });
      return;
    }

    try {
      const tmpDir = '/tmp';
      const dest = path.join(tmpDir, path.basename(file.originalFilename || 'upload.sav'));
      await fs.copyFile(file.filepath, dest);

      const transferCode = randomBytes(6).toString('hex');
      const pin = (Math.floor(Math.random() * 9000) + 1000).toString();

      const savedPath = path.join(tmpDir, `${transferCode}.sav`);
      await fs.copyFile(dest, savedPath);
      const meta = { pin, filename: path.basename(dest), savedPath };
      await fs.writeFile(path.join(tmpDir, `${transferCode}.meta.json`), JSON.stringify(meta));

      res.status(200).json({ transferCode, pin, message: 'mock upload ok' });
    } catch (e) {
      res.status(500).json({ error: 'save error', detail: String(e) });
    }
  });
}
