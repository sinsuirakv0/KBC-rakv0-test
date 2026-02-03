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

// 置き換え用コード（transferCode を 9 桁の数字、pin を 4 桁にする）
import { randomInt } from 'crypto';

// ...（前略）...

// モック: transferCode と pin を生成して保存情報をメモリに保持する（簡易）
function make9DigitCode() {
  // 0 から 999,999,999 の範囲で乱数を作り、9 桁にゼロ埋め
  const n = randomInt(0, 1_000_000_000);
  return String(n).padStart(9, '0');
}

function make4DigitPin() {
  const n = randomInt(0, 10_000); // 0..9999
  return String(n).padStart(4, '0');
}

const transferCode = make9DigitCode(); // 例: "012345678"
const pin = make4DigitPin();           // 例: "8512"

// 保存先ファイル名は transferCode を使う（既存のロジックと整合）
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

}
