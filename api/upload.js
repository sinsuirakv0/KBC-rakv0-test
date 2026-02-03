// api/upload.js
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { randomInt } from 'crypto';

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

function make9DigitCode() {
  const n = randomInt(0, 1_000_000_000);
  return String(n).padStart(9, '0');
}
function make4DigitPin() {
  const n = randomInt(0, 10_000);
  return String(n).padStart(4, '0');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { files } = await parseForm(req);

    // ファイルフィールドを探す（files.file を期待）
    let fileObj = files?.file;
    if (!fileObj) {
      // 可能性: フィールド名が違う、または multipart の構造が異なる
      // デバッグ用に files の中身を返す
      res.status(400).json({ error: 'no file field found', files });
      return;
    }

    if (Array.isArray(fileObj)) fileObj = fileObj[0];

    // formidable のバージョン差で使われるプロパティ名を順にチェック
    const srcPath =
      fileObj.filepath || fileObj.filePath || fileObj.path || fileObj.file?.path;

    if (!srcPath) {
      res.status(500).json({
        error: 'save error',
        detail: 'uploaded file path not found in formidable file object',
        fileObjKeys: Object.keys(fileObj || {}),
        fileObjSample: {
          originalFilename: fileObj.originalFilename || fileObj.name,
          size: fileObj.size || fileObj.length || null
        }
      });
      return;
    }

    const tmpDir = '/tmp';
    const originalName = fileObj.originalFilename || fileObj.name || 'upload.sav';
    const dest = path.join(tmpDir, path.basename(originalName));

    // コピー（srcPath -> dest）
    await fs.copyFile(srcPath, dest);

    // 9桁 transferCode と 4桁 pin を生成して保存
    const transferCode = make9DigitCode();
    const pin = make4DigitPin();

    const savedPath = path.join(tmpDir, `${transferCode}.sav`);
    await fs.copyFile(dest, savedPath);

    const meta = {
      pin,
      filename: path.basename(dest),
      savedPath,
      createdAt: Date.now()
    };
    await fs.writeFile(path.join(tmpDir, `${transferCode}.meta.json`), JSON.stringify(meta));

    res.status(200).json({ transferCode, pin, message: 'mock upload ok' });
  } catch (e) {
    // エラー詳細を返す（デバッグ用）。本番では詳細をマスクすること。
    res.status(500).json({ error: 'save error', detail: String(e) });
  }
}
