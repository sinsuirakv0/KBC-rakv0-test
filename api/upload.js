// api/upload.js
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { files } = await parseForm(req);

    // files.file の取り出しに頑健に対応
    let fileObj = files?.file;
    if (!fileObj) {
      // 可能性: フィールド名が違う、または multipart の構造が異なる
      // files の中身を返してデバッグしやすくする
      res.status(400).json({ error: 'no file field found', files });
      return;
    }

    // formidable は配列を返す場合がある
    if (Array.isArray(fileObj)) fileObj = fileObj[0];

    // いくつかのバージョンで使われるプロパティ名を順にチェック
    const srcPath = fileObj.filepath || fileObj.filePath || fileObj.path || fileObj.file?.path;

    if (!srcPath) {
      res.status(500).json({
        error: 'save error',
        detail: 'uploaded file path not found in formidable file object',
        fileObjKeys: Object.keys(fileObj || {}),
        fileObj
      });
      return;
    }

    const tmpDir = '/tmp';
    const originalName = fileObj.originalFilename || fileObj.name || 'upload.sav';
    const dest = path.join(tmpDir, path.basename(originalName));

    // コピー（または rename でも可）
    await fs.copyFile(srcPath, dest);

    // モック: transferCode と pin を生成して保存情報をメモリに保持する（簡易）
    const transferCode = randomBytes(6).toString('hex');
    const pin = (Math.floor(Math.random() * 9000) + 1000).toString();

    const savedPath = path.join(tmpDir, `${transferCode}.sav`);
    await fs.copyFile(dest, savedPath);
    const meta = { pin, filename: path.basename(dest), savedPath, createdAt: Date.now() };
    await fs.writeFile(path.join(tmpDir, `${transferCode}.meta.json`), JSON.stringify(meta));

    res.status(200).json({ transferCode, pin, message: 'mock upload ok' });
  } catch (e) {
    res.status(500).json({ error: 'save error', detail: String(e) });
  }
}
