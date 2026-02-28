// メインの起動ファイル（処理の司令塔）
import { getJWT } from "../js/jwt.js";
import { fetchAndCheck } from "./fetch-tsv.js";
import { updateFiles } from "./update-files.js";
import { saveLog } from "./logger.js";

// 処理対象の3種類
const types = ["gatya", "sale", "item"];

async function main() {
  // 実行開始時刻を記録
  const startedAt = new Date().toISOString();
  console.log(`実行開始: ${startedAt}`);

  // ログをまとめる入れ物
  const logResults = [];

  try {
    // ステップ①: JWT取得
    console.log("JWT取得中...");
    const jwt = await getJWT();
    console.log("JWT取得成功");

    for (const name of types) {
      console.log(`\n--- ${name} の処理開始 ---`);

      // ステップ②: TSV取得と変更チェック
      const fetchResult = await fetchAndCheck(name, jwt);

      // ステップ③: 変更があればJSON更新
      let updateResult = null;
      if (fetchResult.changed) {
        updateResult = await updateFiles(name, fetchResult.text, fetchResult.hash);
      } else {
        console.log(`${name}: 変更なし、スキップ`);
      }

      // この種類のログをまとめる
      logResults.push({
        name,
        changed: fetchResult.changed,
        updated: updateResult?.success ?? null, // 変更なしの場合はnull
        error: fetchResult.error ?? updateResult?.error ?? null
      });
    }
  } catch (err) {
    // JWT取得など全体的なエラー
    console.error("致命的なエラー:", err.message);
    logResults.push({ name: "global", error: err.message });
  }

  // ステップ④: ログ保存(止めたいときは[//]でコメントアウト)
  //await saveLog({ startedAt, results: logResults });
  console.log("\nログ保存完了、処理終了");
}

main();
