// TSV取得と変更チェックを担当するファイル
import crypto from "crypto";
import { getGitHubFile } from "../js/github.js";

export async function fetchAndCheck(name, jwt) {
  try {
    // TSVをJWTつきURLから取得
    const url = `https://nyanko-events.ponosgames.com/battlecats_production/${name}.tsv?jwt=${jwt}`;
    console.log(`${name}: TSV取得中...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TSV取得失敗: HTTPステータス ${response.status}`);
    }

    const text = await response.text();
    console.log(`${name}: TSV取得成功`);

    // 取得したTSVのMD5ハッシュを計算（内容の指紋）
    const hash = crypto.createHash("md5").update(text).digest("hex");

    // GitHubに保存してある前回のハッシュを取得
    const prevHashFile = await getGitHubFile(`hashes/${name}.md5`);
    const prevHash = prevHashFile?.content?.trim();

    // 前回と今回のハッシュを比較
    const changed = hash !== prevHash;
    console.log(`${name}: 変更${changed ? "あり" : "なし"}`);

    return {
      changed,
      text,  // 変更ありの場合にupdate-files.jsで使う
      hash,  // 変更ありの場合にupdate-files.jsで使う
      error: null
    };

  } catch (err) {
    console.error(`${name}: fetch-tsv エラー:`, err.message);
    return {
      changed: false,
      text: null,
      hash: null,
      error: err.message
    };
  }
}
