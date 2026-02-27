// 実行結果をdata/debug-log.jsonに保存するファイル
import { updateGitHubFile, getGitHubFile } from "../js/github.js";

// ログの最大保存件数
const MAX_LOGS = 50;

export async function saveLog({ startedAt, results }) {
  try {
    console.log("ログ保存中...");

    // 既存のログを取得
    const existing = await getGitHubFile("data/debug-log.json");
    let logs = [];

    if (existing?.content) {
      try {
        // 既存ログをJSONとして解析
        logs = JSON.parse(existing.content);
      } catch {
        // 壊れていた場合は空にリセット
        console.warn("既存ログの解析に失敗、リセットします");
        logs = [];
      }
    }

    // 新しいログを先頭に追加
    logs.unshift({
      startedAt, // 実行開始時刻
      results: results.map(r => ({
        name: r.name,
        changed: r.changed,   // TSVに変更があったか
        updated: r.updated,   // JSONの上書きが成功したか
        error: r.error        // エラーがあった場合その内容
      }))
    });

    // 最大件数を超えた古いログを削除
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }

    // data/debug-log.jsonとしてGitHubに保存
    await updateGitHubFile({
      path: "data/debug-log.json",
      content: JSON.stringify(logs, null, 2),
      message: `update debug-log.json (${startedAt})`
    });

    console.log("ログ保存成功");

  } catch (err) {
    // ログ保存に失敗しても処理全体は止めない
    console.error("ログ保存エラー:", err.message);
  }
}
