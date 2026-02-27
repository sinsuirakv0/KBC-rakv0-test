// GitHubへのJSON保存を担当するファイル
import { updateGitHubFile } from "../js/github.js";
import { parseGatya } from "../parsers/gatya.js";
import { parseSale } from "../parsers/sale.js";
import { parseItem } from "../parsers/item.js";

// 種類ごとにparserを対応させる
const parsers = {
  gatya: parseGatya,
  sale: parseSale,
  item: parseItem
};

export async function updateFiles(name, tsvText, hash) {
  try {
    // 対応するparserでTSVをJSONに変換
    console.log(`${name}: TSVをJSONに変換中...`);
    const parser = parsers[name];
    if (!parser) {
      throw new Error(`${name} に対応するparserが見つかりません`);
    }
    const json = parser(tsvText);
    console.log(`${name}: JSON変換成功`);

    // GitHubのdata/xxxxx.jsonを上書き保存
    console.log(`${name}: data/${name}.json を保存中...`);
    await updateGitHubFile({
      path: `data/${name}.json`,
      content: JSON.stringify(json, null, 2),
      message: `update ${name}.json`
    });
    console.log(`${name}: data/${name}.json 保存成功`);

    // GitHubのhashes/xxxxx.md5を新しいハッシュで上書き保存
    console.log(`${name}: hashes/${name}.md5 を保存中...`);
    await updateGitHubFile({
      path: `hashes/${name}.md5`,
      content: hash,
      message: `update ${name}.md5`
    });
    console.log(`${name}: hashes/${name}.md5 保存成功`);

    return {
      success: true,
      error: null
    };

  } catch (err) {
    console.error(`${name}: update-files エラー:`, err.message);
    return {
      success: false,
      error: err.message
    };
  }
}
